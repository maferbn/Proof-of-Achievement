import { PrismaClient } from '@prisma/client';
import { validationService, Evidence } from '../src/services/validation.service';

const prisma = new PrismaClient();

// Helper to create unique addresses per test
let counter = 0;
function uniqueAddress(): string {
  counter++;
  return `0x${counter.toString().padStart(40, '0')}`;
}

describe('ValidationService', () => {
  beforeEach(async () => {
    // Clean tables in dependency order (respecting foreign keys)
    await prisma.badgeAward.deleteMany();
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
    it('should validate when member belongs to group and badge is available', async () => {
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
        data: { adminId: admin.id, groupId: group.id, name: 'Test Badge' },
      });

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id
      );

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

      const badgeDef = await prisma.badgeDefinition.create({
        data: { adminId: admin.id, groupId: group.id, name: 'Test Badge' },
      });

      const result = await validationService.validateAchievement(
        'non-existent-member-id',
        badgeDef.id
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
        'non-existent-badge-id'
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

      const badgeDef = await prisma.badgeDefinition.create({
        data: { adminId: admin.id, groupId: groupB.id, name: 'Badge in Group B' },
      });

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id
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

      const badgeDef = await prisma.badgeDefinition.create({
        data: { adminId: admin.id, groupId: group.id, name: 'Test Badge' },
      });

      await prisma.badgeAward.create({
        data: {
          badgeDefinitionId: badgeDef.id,
          memberId: member.id,
          status: 'confirmed',
        },
      });

      const result = await validationService.validateAchievement(
        member.id,
        badgeDef.id
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Member already has this badge');
    });

    describe('evidence validation', () => {
      let admin: any;
      let group: any;
      let member: any;
      let badgeDef: any;

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

        badgeDef = await prisma.badgeDefinition.create({
          data: { adminId: admin.id, groupId: group.id, name: 'Test Badge' },
        });
      });

      it('should validate course completion evidence', async () => {
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
        const evidence: Evidence = {
          type: 'course_completion',
          data: {
            completionDate: '2024-01-15T00:00:00Z',
            // missing courseId
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

      it('should validate game win evidence', async () => {
        const evidence: Evidence = {
          type: 'game_win',
          data: {
            gameId: 'game-001',
            matchId: 'match-123',
            score: 100,
            minScore: 50,
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
        const evidence: Evidence = {
          type: 'game_win',
          data: {
            gameId: 'game-001',
            matchId: 'match-123',
            score: 30,
            minScore: 50,
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

      it('should validate exam pass evidence', async () => {
        const evidence: Evidence = {
          type: 'exam_pass',
          data: {
            examId: 'final-exam',
            score: 85,
            minPassingScore: 70,
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(true);
      });

      it('should reject exam pass with failing score', async () => {
        const evidence: Evidence = {
          type: 'exam_pass',
          data: {
            examId: 'final-exam',
            score: 65,
            minPassingScore: 70,
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

      it('should reject exam pass with missing score', async () => {
        const evidence: Evidence = {
          type: 'exam_pass',
          data: {
            examId: 'final-exam',
            // missing score
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

      it('should validate contribution evidence', async () => {
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
        const evidence: Evidence = {
          type: 'contribution',
          data: {
            contributionType: 'pull_request',
            // missing contributionId
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

      it('should accept unknown evidence type if data is non-empty', async () => {
        const evidence: Evidence = {
          type: 'custom_evidence',
          data: {
            proof: 'some proof data',
          },
        };

        const result = await validationService.validateAchievement(
          member.id,
          badgeDef.id,
          evidence
        );

        expect(result.valid).toBe(true);
      });

      it('should reject unknown evidence type if data is empty', async () => {
        const evidence: Evidence = {
          type: 'custom_evidence',
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

      const badge1 = await prisma.badgeDefinition.create({
        data: { adminId: admin.id, groupId: group.id, name: 'Badge 1' },
      });

      const badge2 = await prisma.badgeDefinition.create({
        data: { adminId: admin.id, groupId: group.id, name: 'Badge 2' },
      });

      const results = await validationService.validateMultipleAchievements(
        member.id,
        [badge1.id, badge2.id]
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

      const validBadge = await prisma.badgeDefinition.create({
        data: { adminId: admin.id, groupId: group.id, name: 'Valid Badge' },
      });

      const invalidBadge = await prisma.badgeDefinition.create({
        data: { adminId: admin.id, groupId: otherGroup.id, name: 'Invalid Badge' },
      });

      const results = await validationService.validateMultipleAchievements(
        member.id,
        [validBadge.id, invalidBadge.id]
      );

      expect(results[validBadge.id].valid).toBe(true);
      expect(results[invalidBadge.id].valid).toBe(false);
      expect(results[invalidBadge.id].reason).toBe('Member does not belong to badge group');
    });
  });
});
