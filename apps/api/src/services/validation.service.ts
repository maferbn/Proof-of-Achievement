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

/**
 * Simulated Oracle Service
 *
 * Validates off-chain evidence before a badge can be awarded.
 * The backend acts as the trusted validator: it checks group membership,
 * badge uniqueness, and the provided evidence according to the badge type.
 *
 * This is a pragmatic academic prototype approach: no on-chain ECDSA
 * verification is required; the trust boundary is the backend itself.
 */
export class ValidationService {
  /**
   * Validates whether a member is eligible to receive a specific badge.
   *
   * @param memberId - ID of the member receiving the badge
   * @param badgeDefinitionId - ID of the badge definition
   * @param evidence - Optional off-chain evidence supporting the achievement
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

    // 2. Verify badge definition exists
    const badgeDef = await prisma.badgeDefinition.findUnique({
      where: { id: badgeDefinitionId },
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

    if (existingAward) {
      return {
        valid: false,
        reason: 'Member already has this badge',
      };
    }

    // 5. Validate evidence if provided
    if (evidence) {
      const evidenceValid = await this.verifyEvidence(evidence);
      if (!evidenceValid) {
        return {
          valid: false,
          reason: 'Invalid or insufficient evidence',
        };
      }
    }

    return { valid: true, validatedAt: new Date() };
  }

  /**
   * Validates multiple achievements for a single member in one call.
   *
   * @param memberId - ID of the member
   * @param badgeDefinitionIds - Array of badge definition IDs to validate
   * @param evidenceMap - Optional map of badgeDefinitionId -> evidence
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
   * Routes evidence to the appropriate verifier based on its type.
   */
  private async verifyEvidence(evidence: Evidence): Promise<boolean> {
    switch (evidence.type) {
      case 'course_completion':
        return this.verifyCourseCompletion(evidence.data);

      case 'game_win':
        return this.verifyGameWin(evidence.data);

      case 'exam_pass':
        return this.verifyExamPass(evidence.data);

      case 'contribution':
        return this.verifyContribution(evidence.data);

      default:
        return this.verifyGenericEvidence(evidence.data);
    }
  }

  /**
   * Verifies course completion evidence.
   * Expected data: { courseId, completionDate }
   */
  private async verifyCourseCompletion(
    data: Record<string, any>
  ): Promise<boolean> {
    if (!data.courseId || !data.completionDate) {
      return false;
    }

    const completionDate = new Date(data.completionDate);
    if (isNaN(completionDate.getTime()) || completionDate > new Date()) {
      return false;
    }

    // Future integration point: verify certificateHash against a course registry,
    // call an LMS API, or check a digital signature.
    return true;
  }

  /**
   * Verifies game win evidence.
   * Expected data: { gameId, matchId, score?, minScore? }
   */
  private async verifyGameWin(data: Record<string, any>): Promise<boolean> {
    if (!data.gameId || !data.matchId) {
      return false;
    }

    if (data.score !== undefined && data.minScore !== undefined) {
      if (Number(data.score) < Number(data.minScore)) {
        return false;
      }
    }

    // Future integration point: verify match hash against game server API.
    return true;
  }

  /**
   * Verifies exam pass evidence.
   * Expected data: { examId, score, minPassingScore? }
   */
  private async verifyExamPass(data: Record<string, any>): Promise<boolean> {
    if (data.examId === undefined || data.score === undefined) {
      return false;
    }

    const minPassingScore =
      data.minPassingScore !== undefined ? Number(data.minPassingScore) : 70;

    if (Number(data.score) < minPassingScore) {
      return false;
    }

    return true;
  }

  /**
   * Verifies contribution evidence.
   * Expected data: { contributionType, contributionId }
   */
  private async verifyContribution(
    data: Record<string, any>
  ): Promise<boolean> {
    if (!data.contributionType || !data.contributionId) {
      return false;
    }

    // Future integration point: verify PR merge, issue closure, etc.
    return true;
  }

  /**
   * Generic fallback verifier for unknown evidence types.
   */
  private async verifyGenericEvidence(data: Record<string, any>): Promise<boolean> {
    return Object.keys(data).length > 0;
  }
}

export const validationService = new ValidationService();
