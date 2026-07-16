import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  validatedAt?: Date;
}

export interface Evidence {
  type: string;
  data: Record<string, any>;
  signature?: string;
}

/** Supported evidence types. */
export const EVIDENCE_TYPES = [
  'course_completion',
  'game_win',
  'exam_pass',
  'contribution',
  'generic',
] as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

/** Shape of a ValidationRule as stored in the database. */
export interface ValidationRule {
  id: string;
  badgeDefinitionId: string;
  evidenceType: string;
  rules: any;
  externalVerifierUrl?: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateValidationRuleInput {
  evidenceType: EvidenceType;
  rules: Record<string, any>;
  externalVerifierUrl?: string;
}

export interface UpdateValidationRuleInput {
  evidenceType?: EvidenceType;
  rules?: Record<string, any>;
  externalVerifierUrl?: string | null;
  enabled?: boolean;
}

/**
 * Simulated Oracle Service
 *
 * Validates off-chain evidence before a badge can be awarded.
 * The backend acts as the trusted validator: it checks group membership,
 * badge uniqueness, and the provided evidence against the validation rules
 * defined when the badge was created and stored in the database.
 *
 * This is a pragmatic academic prototype approach: no on-chain ECDSA
 * verification is required; the trust boundary is the backend itself.
 */
export class ValidationService {
  readonly EVIDENCE_TYPES = EVIDENCE_TYPES;

  /**
   * Validates whether a member is eligible to receive a specific badge.
   * Every badge definition must have a ValidationRule, and evidence is always
   * required for validation. The evidence is checked against the rule stored in
   * the database, not against hardcoded values.
   *
   * @param memberId - ID of the member receiving the badge
   * @param badgeDefinitionId - ID of the badge definition
   * @param evidence - Off-chain evidence supporting the achievement (required)
   * @returns ValidationResult indicating success or failure with a reason
   */
  async validateAchievement(
    memberId: string,
    badgeDefinitionId: string,
    evidence?: Evidence
  ): Promise<ValidationResult> {
    // 1. Verify member exists
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return { valid: false, reason: 'Member not found' };
    }

    // 2. Verify badge definition exists and load its validation rule
    const badgeDef = await prisma.badgeDefinition.findUnique({
      where: { id: badgeDefinitionId },
      include: { validationRule: true },
    });

    if (!badgeDef) {
      return { valid: false, reason: 'Badge definition not found' };
    }

    // 3. Verify member belongs to the badge's group
    if (member.groupId !== badgeDef.groupId) {
      return {
        valid: false,
        reason: 'Member does not belong to badge group',
      };
    }

    // 4. Verify member hasn't already received this badge
    const existingAward = await prisma.badgeAward.findUnique({
      where: {
        memberId_badgeDefinitionId: {
          memberId,
          badgeDefinitionId,
        },
      },
    });

    const isReassignable =
      existingAward &&
      (existingAward.status === 'revoked' || existingAward.status === 'failed');

    if (existingAward && !isReassignable) {
      return {
        valid: false,
        reason: 'Member already has this badge',
      };
    }

    // 5. Evidence is mandatory for every badge definition
    if (!evidence) {
      return {
        valid: false,
        reason: 'Evidence is required for this badge',
      };
    }

    // 6. The badge must have a validation rule configured
    const rule = badgeDef.validationRule;
    if (!rule) {
      return {
        valid: false,
        reason: 'Validation rule not configured for this badge',
      };
    }

    if (!rule.enabled) {
      return {
        valid: false,
        reason: 'Validation rule is disabled for this badge',
      };
    }

    // 7. Evidence type must match the rule
    if (evidence.type !== rule.evidenceType) {
      return {
        valid: false,
        reason: `Evidence type mismatch: expected ${rule.evidenceType}, received ${evidence.type}`,
      };
    }

    // 8. Validate evidence against the rule
    const evidenceValid = await this.verifyEvidence(evidence, rule);
    if (!evidenceValid) {
      return {
        valid: false,
        reason: 'Invalid or insufficient evidence',
      };
    }

    return { valid: true, validatedAt: new Date() };
  }

  /**
   * Validates multiple achievements for a single member in one call.
   *
   * @param memberId - ID of the member
   * @param badgeDefinitionIds - Array of badge definition IDs to validate
   * @param evidenceMap - Required map of badgeDefinitionId -> evidence
   * @returns Map of badgeDefinitionId -> ValidationResult
   */
  async validateMultipleAchievements(
    memberId: string,
    badgeDefinitionIds: string[],
    evidenceMap?: Record<string, Evidence>
  ): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};

    for (const badgeDefId of badgeDefinitionIds) {
      const evidence = evidenceMap?.[badgeDefId];
      results[badgeDefId] = await this.validateAchievement(
        memberId,
        badgeDefId,
        evidence
      );
    }

    return results;
  }

  /**
   * Parses a ValidationRule.rules value. SQLite stores it as a JSON string,
   * PostgreSQL stores it as a parsed Json object, so we normalize at runtime.
   */
  private parseRules(rule: ValidationRule): Record<string, any> {
    if (typeof rule.rules === 'string') {
      try {
        return JSON.parse(rule.rules);
      } catch {
        return {};
      }
    }
    return rule.rules || {};
  }

  /**
   * Validates evidence against the rule stored in the database.
   */
  private async verifyEvidence(
    evidence: Evidence,
    rule: ValidationRule
  ): Promise<boolean> {
    const rules = this.parseRules(rule);

    switch (evidence.type) {
      case 'course_completion':
        return this.verifyCourseCompletion(evidence.data, rules);

      case 'game_win':
        return this.verifyGameWin(evidence.data, rules);

      case 'exam_pass':
        return this.verifyExamPass(evidence.data, rules);

      case 'contribution':
        return this.verifyContribution(evidence.data, rules);

      default:
        return this.verifyGenericEvidence(evidence.data, rules);
    }
  }

  /**
   * Verifies course completion evidence.
   * Expected data: { courseId, completionDate }
   * Rule fields: { requirePastDate?: boolean }
   */
  private async verifyCourseCompletion(
    data: Record<string, any>,
    rules: Record<string, any>
  ): Promise<boolean> {
    if (!data.courseId || !data.completionDate) {
      return false;
    }

    const completionDate = new Date(data.completionDate);
    if (isNaN(completionDate.getTime())) {
      return false;
    }

    const requirePastDate = rules.requirePastDate !== false; // default true
    if (requirePastDate && completionDate > new Date()) {
      return false;
    }

    // Future integration point: verify certificateHash against a course registry,
    // call an LMS API, or check a digital signature.
    return true;
  }

  /**
   * Verifies game win evidence.
   * Expected data: { gameId, matchId, score? }
   * Rule fields: { minScore?: number, requireMatchId?: boolean }
   */
  private async verifyGameWin(
    data: Record<string, any>,
    rules: Record<string, any>
  ): Promise<boolean> {
    if (!data.gameId) {
      return false;
    }

    const requireMatchId = rules.requireMatchId !== false; // default true
    if (requireMatchId && !data.matchId) {
      return false;
    }

    if (rules.minScore !== undefined && data.score !== undefined) {
      if (Number(data.score) < Number(rules.minScore)) {
        return false;
      }
    }

    // Future integration point: verify match hash against game server API.
    return true;
  }

  /**
   * Verifies exam pass evidence.
   * Expected data: { examId, score }
   * Rule fields: { minPassingScore: number, maxAttempts?: number }
   */
  private async verifyExamPass(
    data: Record<string, any>,
    rules: Record<string, any>
  ): Promise<boolean> {
    if (data.examId === undefined || data.score === undefined) {
      return false;
    }

    const minPassingScore =
      rules.minPassingScore !== undefined ? Number(rules.minPassingScore) : 70;

    if (Number(data.score) < minPassingScore) {
      return false;
    }

    return true;
  }

  /**
   * Verifies contribution evidence.
   * Expected data: { contributionType, contributionId }
   * Rule fields: { requiredFields?: string[] }
   */
  private async verifyContribution(
    data: Record<string, any>,
    rules: Record<string, any>
  ): Promise<boolean> {
    const requiredFields = Array.isArray(rules.requiredFields)
      ? rules.requiredFields
      : ['contributionType', 'contributionId'];

    for (const field of requiredFields) {
      if (!data[field]) {
        return false;
      }
    }

    // Future integration point: verify PR merge, issue closure, etc.
    return true;
  }

  /**
   * Generic fallback verifier.
   * Rule fields: { requireData?: boolean }
   */
  private async verifyGenericEvidence(
    data: Record<string, any>,
    rules: Record<string, any>
  ): Promise<boolean> {
    const requireData = rules.requireData !== false; // default true
    if (requireData && Object.keys(data).length === 0) {
      return false;
    }
    return true;
  }

  /**
   * Helper: returns true if the string is a valid evidence type.
   */
  isValidEvidenceType(type: string): type is EvidenceType {
    return EVIDENCE_TYPES.includes(type as EvidenceType);
  }
}

export const validationService = new ValidationService();
