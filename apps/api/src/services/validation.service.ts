import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  validatedAt?: Date;
}

export interface Evidence {
  /** Free-form label chosen by the organization (e.g. "Certificado de curso"). */
  type: string;
  data: Record<string, any>;
  signature?: string;
}

/** Supported field types for dynamic evidence schemas. */
export type FieldType = 'text' | 'number' | 'date' | 'boolean' | 'file';

/** Constraints applied to a field value depending on its type. */
export interface FieldConstraint {
  /** Number: inclusive minimum. */
  min?: number;
  /** Number: inclusive maximum. */
  max?: number;
  /** Date: must be in the past. */
  past?: boolean;
  /** Date: must be in the future. */
  future?: boolean;
  /** Text: regex pattern the value must match. */
  pattern?: string;
}

/** A field that makes up a dynamic evidence schema. */
export interface FieldDefinition {
  /** Machine name used as key in `Evidence.data`. */
  name: string;
  /** Human-readable label shown in forms. */
  label: string;
  type: FieldType;
  required: boolean;
  constraints?: FieldConstraint;
}

/** Dynamic validation rule: a list of fields with optional constraints. */
export interface ValidationRuleConfig {
  fields: FieldDefinition[];
}

/** Shape of a ValidationRule as stored in the database. */
export interface ValidationRule {
  id: string;
  badgeDefinitionId: string;
  /** Free-form label (e.g. "Aprobar examen", "Ganar partida"). */
  evidenceType: string;
  rules: any;
  externalVerifierUrl?: string | null;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateValidationRuleInput {
  evidenceType: string;
  rules: ValidationRuleConfig;
  externalVerifierUrl?: string;
}

export interface UpdateValidationRuleInput {
  evidenceType?: string;
  rules?: ValidationRuleConfig;
  externalVerifierUrl?: string | null;
  enabled?: boolean;
}

/**
 * Simulated Oracle Service
 *
 * Validates off-chain evidence before a badge can be awarded.
 * The backend acts as the trusted validator: it checks group membership,
 * badge uniqueness, and the provided evidence against the dynamic validation
 * schema defined by the organization when the badge was created.
 *
 * This is a pragmatic academic prototype approach: no on-chain ECDSA
 * verification is required; the trust boundary is the backend itself.
 */
export class ValidationService {
  readonly SUPPORTED_FIELD_TYPES: FieldType[] = ['text', 'number', 'date', 'boolean', 'file'];

  /**
   * Validates whether a member is eligible to receive a specific badge.
   * Every badge definition must have a ValidationRule, and evidence is always
   * required for validation. The evidence is checked against the dynamic field
   * schema stored in the database.
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

    // 7. Evidence type label must match the rule label
    if (evidence.type !== rule.evidenceType) {
      return {
        valid: false,
        reason: `Evidence type mismatch: expected ${rule.evidenceType}, received ${evidence.type}`,
      };
    }

    // 8. Validate evidence data against the dynamic field schema
    const validation = this.validateEvidenceData(evidence, rule);
    if (!validation.valid) {
      return validation;
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
  parseRules(rule: ValidationRule): ValidationRuleConfig {
    if (typeof rule.rules === 'string') {
      try {
        return JSON.parse(rule.rules) as ValidationRuleConfig;
      } catch {
        return { fields: [] };
      }
    }
    const config = rule.rules || { fields: [] };
    return Array.isArray(config.fields) ? config : { fields: [] };
  }

  /**
   * Validates evidence.data against the dynamic field schema defined in the rule.
   * Returns detailed reasons when a field fails.
   */
  validateEvidenceData(evidence: Evidence, rule: ValidationRule): ValidationResult {
    const config = this.parseRules(rule);

    if (!Array.isArray(config.fields) || config.fields.length === 0) {
      return { valid: true };
    }

    for (const field of config.fields) {
      if (!this.isValidFieldDefinition(field)) {
        return {
          valid: false,
          reason: `Invalid validation rule: field "${field?.name ?? 'unknown'}" has unsupported type`,
        };
      }

      const value = evidence.data?.[field.name];
      const isPresent = value !== undefined && value !== null && value !== '';

      if (field.required && !isPresent) {
        return {
          valid: false,
          reason: `Missing required field: ${field.label || field.name}`,
        };
      }

      if (!isPresent) {
        continue;
      }

      if (!this.isValidFieldType(value, field.type)) {
        return {
          valid: false,
          reason: `Field "${field.label || field.name}" must be of type ${field.type}`,
        };
      }

      if (field.constraints && !this.satisfiesConstraints(value, field)) {
        return {
          valid: false,
          reason: `Field "${field.label || field.name}" does not satisfy its constraints`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Returns true if the field definition has a supported type.
   */
  isValidFieldDefinition(field: FieldDefinition): boolean {
    return (
      !!field &&
      typeof field.name === 'string' &&
      field.name.length > 0 &&
      typeof field.label === 'string' &&
      field.label.length > 0 &&
      this.SUPPORTED_FIELD_TYPES.includes(field.type)
    );
  }

  /**
   * Returns true if the value matches the expected runtime type.
   */
  private isValidFieldType(value: any, type: FieldType): boolean {
    switch (type) {
      case 'text':
      case 'file':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'date':
        return typeof value === 'string' && !isNaN(Date.parse(value));
      case 'boolean':
        return typeof value === 'boolean';
      default:
        return false;
    }
  }

  /**
   * Returns true if the value satisfies the field's constraints.
   */
  private satisfiesConstraints(value: any, field: FieldDefinition): boolean {
    if (!field.constraints) {
      return true;
    }

    const { constraints, type } = field;

    if (type === 'number') {
      const num = Number(value);
      if (constraints.min !== undefined && num < constraints.min) {
        return false;
      }
      if (constraints.max !== undefined && num > constraints.max) {
        return false;
      }
    }

    if (type === 'date') {
      const date = new Date(value);
      const now = new Date();
      if (constraints.past && date.getTime() >= now.getTime()) {
        return false;
      }
      if (constraints.future && date.getTime() <= now.getTime()) {
        return false;
      }
    }

    if (type === 'text' && constraints.pattern) {
      try {
        const regex = new RegExp(constraints.pattern);
        if (!regex.test(String(value))) {
          return false;
        }
      } catch {
        // Invalid regex in rule: skip pattern validation
      }
    }

    return true;
  }

  /**
   * Validates the shape of a ValidationRuleConfig. Returns a reason string if
   * invalid, or undefined if valid.
   */
  validateRuleConfig(config: ValidationRuleConfig): string | undefined {
    if (!config || !Array.isArray(config.fields)) {
      return '"rules.fields" must be an array';
    }

    if (config.fields.length === 0) {
      return '"rules.fields" must contain at least one field';
    }

    const names = new Set<string>();
    for (const field of config.fields) {
      if (!field || typeof field !== 'object') {
        return 'Each field must be an object';
      }

      if (!field.name || typeof field.name !== 'string') {
        return 'Each field must have a "name" string';
      }

      if (!field.label || typeof field.label !== 'string') {
        return 'Each field must have a "label" string';
      }

      if (!this.SUPPORTED_FIELD_TYPES.includes(field.type)) {
        return `Field "${field.name}" has unsupported type "${field.type}"`;
      }

      if (names.has(field.name)) {
        return `Duplicate field name: ${field.name}`;
      }
      names.add(field.name);

      if (field.constraints && typeof field.constraints !== 'object') {
        return `Field "${field.name}" constraints must be an object`;
      }
    }

    return undefined;
  }
}

export const validationService = new ValidationService();
