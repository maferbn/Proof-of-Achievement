import { PrismaClient } from '@prisma/client';
import { validationService, Evidence, ValidationRuleConfig } from '../src/services/validation.service';

const prisma = new PrismaClient();

// Helper to create unique addresses per test
let counter = 0;
function uniqueAddress(): string {
  counter++;
  return `0x${counter.toString().padStart(40, '0')}`;
}

/** Helper to create a badge definition with its mandatory validation rule. */
async function createBadgeDefinition(
  adminId: string,
  groupId: string,
  name: string,
  evidenceType: string,
  rules: ValidationRuleConfig
) {
  const badgeDef = await prisma.badgeDefinition.create({
    data: { adminId, groupId, name },
  });

  await prisma.validationRule.create({
    data: {
      badgeDefinitionId: badgeDef.id,
      evidenceType,
      rules: JSON.stringify(rules),
    },
  });

  return badgeDef;
}

describe('ValidationService', () => {
  beforeEach(async () => {
    // Clean tables in dependency order (respecting foreign keys)
    await prisma.badgeAward.deleteMany();
    await prisma.validationRule.deleteMany();
    await prisma.badgeDefinition.deleteMany();
    await prisma.member.deleteMany();
    await prisma.relayerWallet.deleteMany();
    await prisma.group.deleteMany();
    await prisma.admin.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('validateAchievement', () => {
    it('should validate when evidence matches dynamic field schema', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(
        admin.id,
        group.id,
        'Curso Blockchain',
        'Certificado de curso',
        {
          fields: [
            { name: 'courseId', label: 'ID del curso', type: 'text', required: true },
            { name: 'score', label: 'Calificación', type: 'number', required: true, constraints: { min: 90 } },
            { name: 'completionDate', label: 'Fecha', type: 'date', required: true, constraints: { past: true } },
          ],
        }
      );

      const evidence: Evidence = {
        type: 'Certificado de curso',
        data: {
          courseId: 'web3-101',
          score: 95,
          completionDate: '2024-01-15T00:00:00Z',
        },
      };

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        evidence
      );

      expect(result.valid).toBe(true);
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should reject when required field is missing', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(
        admin.id,
        group.id,
        'Examen Final',
        'Examen aprobado',
        {
          fields: [
            { name: 'examId', label: 'ID del examen', type: 'text', required: true },
            { name: 'score', label: 'Nota', type: 'number', required: true, constraints: { min: 60 } },
          ],
        }
      );

      const evidence: Evidence = {
        type: 'Examen aprobado',
        data: { score: 80 },
      };

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        evidence
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Missing required field');
    });

    it('should reject when numeric constraint min is not satisfied', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(
        admin.id,
        group.id,
        'Partida ganada',
        'Victoria en videojuego',
        {
          fields: [
            { name: 'matchId', label: 'ID de partida', type: 'text', required: true },
            { name: 'score', label: 'Puntuación', type: 'number', required: true, constraints: { min: 500 } },
          ],
        }
      );

      const evidence: Evidence = {
        type: 'Victoria en videojuego',
        data: { matchId: 'match-123', score: 300 },
      };

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        evidence
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('does not satisfy its constraints');
    });

    it('should reject when date constraint past is not satisfied', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(
        admin.id,
        group.id,
        'Sesion de gimnasio',
        'Completar sesion',
        {
          fields: [
            { name: 'date', label: 'Fecha', type: 'date', required: true, constraints: { past: true } },
          ],
        }
      );

      const evidence: Evidence = {
        type: 'Completar sesion',
        data: { date: '2030-01-01T00:00:00Z' },
      };

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        evidence
      );

      expect(result.valid).toBe(false);
    });

    it('should reject when field type is incorrect', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(
        admin.id,
        group.id,
        'Examen',
        'Examen aprobado',
        {
          fields: [
            { name: 'score', label: 'Nota', type: 'number', required: true },
          ],
        }
      );

      const evidence: Evidence = {
        type: 'Examen aprobado',
        data: { score: 'no-es-numero' },
      };

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        evidence
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('must be of type number');
    });

    it('should reject when evidence type label does not match rule label', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(
        admin.id,
        group.id,
        'Curso',
        'Certificado de curso',
        {
          fields: [{ name: 'courseId', label: 'ID', type: 'text', required: true }],
        }
      );

      const evidence: Evidence = {
        type: 'Otro tipo',
        data: { courseId: 'x' },
      };

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        evidence
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Evidence type mismatch');
    });

    it('should allow optional fields to be absent', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(
        admin.id,
        group.id,
        'Logro opcional',
        'Contribucion',
        {
          fields: [
            { name: 'contributionId', label: 'ID', type: 'text', required: true },
            { name: 'note', label: 'Nota', type: 'text', required: false },
          ],
        }
      );

      const evidence: Evidence = {
        type: 'Contribucion',
        data: { contributionId: 'pr-123' },
      };

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        evidence
      );

      expect(result.valid).toBe(true);
    });

    it('should reject when evidence is missing', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(
        admin.id,
        group.id,
        'Test',
        'Evidencia',
        {
          fields: [{ name: 'x', label: 'X', type: 'text', required: true }],
        }
      );

      const result = await validationService.validateAchievement(member.id, badgeDef.id);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Evidence is required for this badge');
    });

    it('should reject when badge has no validation rule', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await prisma.badgeDefinition.create({
        data: { adminId: admin.id, groupId: group.id, name: 'Legacy Badge' },
      });

      const evidence: Evidence = {
        type: 'Evidencia',
        data: { x: 'y' },
      };

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        evidence
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Validation rule not configured for this badge');
    });

    it('should reject when member already has the badge', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(
        admin.id,
        group.id,
        'Test',
        'Evidencia',
        {
          fields: [{ name: 'x', label: 'X', type: 'text', required: true }],
        }
      );

      await prisma.badgeAward.create({
        data: {
          badgeDefinitionId: badgeDef.id,
          memberId: member.id,
          status: 'confirmed',
        },
      });

      const evidence: Evidence = {
        type: 'Evidencia',
        data: { x: 'y' },
      };

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        evidence
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Member already has this badge');
    });
  });

  describe('validateRuleConfig', () => {
    it('should accept a valid rule config', () => {
      const error = validationService.validateRuleConfig({
        fields: [{ name: 'score', label: 'Nota', type: 'number', required: true }],
      });
      expect(error).toBeUndefined();
    });

    it('should reject empty fields array', () => {
      const error = validationService.validateRuleConfig({ fields: [] });
      expect(error).toBe('"rules.fields" must contain at least one field');
    });

    it('should reject missing field name', () => {
      const error = validationService.validateRuleConfig({
        fields: [{ label: 'X', type: 'text', required: true } as any],
      });
      expect(error).toContain('"name"');
    });

    it('should reject unsupported field type', () => {
      const error = validationService.validateRuleConfig({
        fields: [{ name: 'x', label: 'X', type: 'unsupported', required: true } as any],
      });
      expect(error).toContain('unsupported type');
    });

    it('should reject duplicate field names', () => {
      const error = validationService.validateRuleConfig({
        fields: [
          { name: 'x', label: 'X', type: 'text', required: true },
          { name: 'x', label: 'X2', type: 'text', required: true },
        ],
      });
      expect(error).toContain('Duplicate field name');
    });
  });

  describe('validateMultipleAchievements', () => {
    it('should validate multiple badges at once', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badge1 = await createBadgeDefinition(
        admin.id,
        group.id,
        'Badge 1',
        'Tipo A',
        { fields: [{ name: 'a', label: 'A', type: 'text', required: true }] }
      );

      const badge2 = await createBadgeDefinition(
        admin.id,
        group.id,
        'Badge 2',
        'Tipo B',
        { fields: [{ name: 'b', label: 'B', type: 'number', required: true }] }
      );

      const results = await validationService.validateMultipleAchievements(
        member.id,
        [badge1.id, badge2.id],
        {
          [badge1.id]: { type: 'Tipo A', data: { a: 'ok' } },
          [badge2.id]: { type: 'Tipo B', data: { b: 10 } },
        }
      );

      expect(results[badge1.id].valid).toBe(true);
      expect(results[badge2.id].valid).toBe(true);
    });
  });
});
