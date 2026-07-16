import { PrismaClient } from '@prisma/client';
import { validationService, Evidence } from '../src/services/validation.service';

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
  rule?: { evidenceType: string; rules: Record<string, any> }
) {
  const badgeDef = await prisma.badgeDefinition.create({
    data: { adminId, groupId, name },
  });

  await prisma.validationRule.create({
    data: {
      badgeDefinitionId: badgeDef.id,
      evidenceType: rule?.evidenceType ?? 'generic',
      rules: JSON.stringify(rule?.rules ?? { requireData: true }),
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
    it('should validate when member belongs to group and evidence matches rule', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Test Badge', {
        evidenceType: 'generic',
        rules: { requireData: true },
      });

      const result = await validationService.validateAchievement(member.id, badgeDef.id, {
        type: 'generic',
        data: { proof: 'some data' },
      });

      expect(result.valid).toBe(true);
      expect(result.validatedAt).toBeInstanceOf(Date);
    });

    it('should reject when member does not exist', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Test Badge');

      const result = await validationService.validateAchievement(
        'non-existent-member-id',
        badgeDef.id,
        { type: 'generic', data: { proof: 'x' } }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Member not found');
    });

    it('should reject when badge definition does not exist', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const result = await validationService.validateAchievement(
        member.id,
        'non-existent-badge-id',
        { type: 'generic', data: { proof: 'x' } }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Badge definition not found');
    });

    it('should reject when member does not belong to badge group', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const groupA = await prisma.group.create({
        data: { adminId: admin.id, name: 'Group A' },
      });

      const groupB = await prisma.group.create({
        data: { adminId: admin.id, name: 'Group B' },
      });

      const member = await prisma.member.create({
        data: { groupId: groupA.id, walletAddress: uniqueAddress() },
      });

      const badgeDef = await createBadgeDefinition(admin.id, groupB.id, 'Badge in Group B');

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        { type: 'generic', data: { proof: 'x' } }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Member does not belong to badge group');
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

      const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Test Badge');

      await prisma.badgeAward.create({
        data: {
          badgeDefinitionId: badgeDef.id,
          memberId: member.id,
          status: 'confirmed',
        },
      });

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        { type: 'generic', data: { proof: 'x' } }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Member already has this badge');
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

      const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Test Badge');

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

      // Create badge without validation rule to simulate legacy/inconsistent state
      const badgeDef = await prisma.badgeDefinition.create({
        data: { adminId: admin.id, groupId: group.id, name: 'Legacy Badge' },
      });

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id,
        { type: 'generic', data: { proof: 'x' } }
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Validation rule not configured for this badge');
    });

    describe('evidence validation from database rules', () => {
      let admin: any;
      let group: any;
      let member: any;

      beforeEach(async () => {
        admin = await prisma.admin.create({
          data: { walletAddress: uniqueAddress() },
        });

        group = await prisma.group.create({
          data: { adminId: admin.id, name: 'Test Group' },
        });

        member = await prisma.member.create({
          data: { groupId: group.id, walletAddress: uniqueAddress() },
        });
      });

      it('should validate course completion evidence against stored rule', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Course Badge', {
          evidenceType: 'course_completion',
          rules: { requirePastDate: true },
        });

        const evidence: Evidence = {
          type: 'course_completion',
          data: {
            courseId: 'web3-101',
            completionDate: '2024-01-15T00:00:00Z',
            certificateHash: '0xabc123',
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(true);
      });

      it('should reject course completion with missing fields', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Course Badge', {
          evidenceType: 'course_completion',
          rules: { requirePastDate: true },
        });

        const evidence: Evidence = {
          type: 'course_completion',
          data: {
            completionDate: '2024-01-15T00:00:00Z',
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid or insufficient evidence');
      });

      it('should reject course completion with future date', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Course Badge', {
          evidenceType: 'course_completion',
          rules: { requirePastDate: true },
        });

        const evidence: Evidence = {
          type: 'course_completion',
          data: {
            courseId: 'web3-101',
            completionDate: '2030-01-15T00:00:00Z',
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid or insufficient evidence');
      });

      it('should validate game win evidence against stored minScore', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Game Badge', {
          evidenceType: 'game_win',
          rules: { minScore: 50, requireMatchId: true },
        });

        const evidence: Evidence = {
          type: 'game_win',
          data: {
            gameId: 'game-001',
            matchId: 'match-123',
            score: 100,
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(true);
      });

      it('should reject game win with insufficient score', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Game Badge', {
          evidenceType: 'game_win',
          rules: { minScore: 50, requireMatchId: true },
        });

        const evidence: Evidence = {
          type: 'game_win',
          data: {
            gameId: 'game-001',
            matchId: 'match-123',
            score: 30,
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid or insufficient evidence');
      });

      it('should validate exam pass evidence against stored minPassingScore', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Exam Badge', {
          evidenceType: 'exam_pass',
          rules: { minPassingScore: 70 },
        });

        const evidence: Evidence = {
          type: 'exam_pass',
          data: {
            examId: 'final-exam',
            score: 85,
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(true);
      });

      it('should reject exam pass with failing score against stored rule', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Exam Badge', {
          evidenceType: 'exam_pass',
          rules: { minPassingScore: 70 },
        });

        const evidence: Evidence = {
          type: 'exam_pass',
          data: {
            examId: 'final-exam',
            score: 65,
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid or insufficient evidence');
      });

      it('should use dynamic threshold from the rule (not hardcoded 70)', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Strict Exam', {
          evidenceType: 'exam_pass',
          rules: { minPassingScore: 90 },
        });

        const evidence: Evidence = {
          type: 'exam_pass',
          data: {
            examId: 'strict-exam',
            score: 85,
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid or insufficient evidence');
      });

      it('should validate exam pass with score above dynamic threshold', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Strict Exam', {
          evidenceType: 'exam_pass',
          rules: { minPassingScore: 90 },
        });

        const evidence: Evidence = {
          type: 'exam_pass',
          data: {
            examId: 'strict-exam',
            score: 95,
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(true);
      });

      it('should reject exam pass with missing score', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Exam Badge', {
          evidenceType: 'exam_pass',
          rules: { minPassingScore: 70 },
        });

        const evidence: Evidence = {
          type: 'exam_pass',
          data: {
            examId: 'final-exam',
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid or insufficient evidence');
      });

      it('should validate contribution evidence against stored rule', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Contribution Badge', {
          evidenceType: 'contribution',
          rules: { requiredFields: ['contributionType', 'contributionId'] },
        });

        const evidence: Evidence = {
          type: 'contribution',
          data: {
            contributionType: 'pull_request',
            contributionId: 'pr-456',
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(true);
      });

      it('should reject contribution evidence with missing fields', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Contribution Badge', {
          evidenceType: 'contribution',
          rules: { requiredFields: ['contributionType', 'contributionId'] },
        });

        const evidence: Evidence = {
          type: 'contribution',
          data: {
            contributionType: 'pull_request',
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid or insufficient evidence');
      });

      it('should reject evidence type mismatch', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Exam Badge', {
          evidenceType: 'exam_pass',
          rules: { minPassingScore: 70 },
        });

        const evidence: Evidence = {
          type: 'game_win',
          data: { gameId: 'game-001', matchId: 'match-123', score: 100 },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toContain('Evidence type mismatch');
      });

      it('should reject generic evidence with empty data', async () => {
        const badgeDef = await createBadgeDefinition(admin.id, group.id, 'Generic Badge', {
          evidenceType: 'generic',
          rules: { requireData: true },
        });

        const evidence: Evidence = {
          type: 'generic',
          data: {},
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(false);
        expect(result.reason).toBe('Invalid or insufficient evidence');
      });
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

      const badge1 = await createBadgeDefinition(admin.id, group.id, 'Badge 1', {
        evidenceType: 'generic',
        rules: { requireData: true },
      });
      const badge2 = await createBadgeDefinition(admin.id, group.id, 'Badge 2', {
        evidenceType: 'generic',
        rules: { requireData: true },
      });

      const results = await validationService.validateMultipleAchievements(
        member.id,
        [badge1.id, badge2.id],
        {
          [badge1.id]: { type: 'generic', data: { proof: 'x' } },
          [badge2.id]: { type: 'generic', data: { proof: 'y' } },
        }
      );

      expect(Object.keys(results)).toHaveLength(2);
      expect(results[badge1.id].valid).toBe(true);
      expect(results[badge2.id].valid).toBe(true);
    });

    it('should return mixed results for valid and invalid badges', async () => {
      const admin = await prisma.admin.create({
        data: { walletAddress: uniqueAddress() },
      });

      const group = await prisma.group.create({
        data: { adminId: admin.id, name: 'Test Group' },
      });

      const otherGroup = await prisma.group.create({
        data: { adminId: admin.id, name: 'Other Group' },
      });

      const member = await prisma.member.create({
        data: { groupId: group.id, walletAddress: uniqueAddress() },
      });

      const validBadge = await createBadgeDefinition(admin.id, group.id, 'Valid Badge', {
        evidenceType: 'generic',
        rules: { requireData: true },
      });

      const invalidBadge = await createBadgeDefinition(admin.id, otherGroup.id, 'Invalid Badge', {
        evidenceType: 'generic',
        rules: { requireData: true },
      });

      const results = await validationService.validateMultipleAchievements(
        member.id,
        [validBadge.id, invalidBadge.id],
        {
          [validBadge.id]: { type: 'generic', data: { proof: 'x' } },
          [invalidBadge.id]: { type: 'generic', data: { proof: 'y' } },
        }
      );

      expect(results[validBadge.id].valid).toBe(true);
      expect(results[invalidBadge.id].valid).toBe(false);
      expect(results[invalidBadge.id].reason).toBe('Member does not belong to badge group');
    });
  });
});
