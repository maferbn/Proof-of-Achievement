/**
 * Migration script: converts legacy ValidationRule.rules format to the new
 * dynamic field schema.
 *
 * Legacy format (hardcoded per evidence type):
 *   { evidenceType: 'exam_pass', rules: { minPassingScore: 70 } }
 *
 * New format (dynamic fields):
 *   { evidenceType: 'exam_pass', rules: { fields: [
 *     { name: 'examId', label: 'ID del examen', type: 'text', required: true },
 *     { name: 'score', label: 'Calificación', type: 'number', required: true, constraints: { min: 70 } }
 *   ]}}
 *
 * Usage:
 *   npx ts-node scripts/migrateValidationRules.ts
 */

import { PrismaClient } from '@prisma/client';
import type { ValidationRuleConfig, FieldDefinition } from '../src/services/validation.service';

const prisma = new PrismaClient();

function isNewFormat(rules: any): boolean {
  return rules && Array.isArray(rules.fields);
}

function migrateRules(evidenceType: string, rules: any): ValidationRuleConfig {
  if (isNewFormat(rules)) {
    return rules as ValidationRuleConfig;
  }

  const fields: FieldDefinition[] = [];

  switch (evidenceType) {
    case 'course_completion':
      fields.push({
        name: 'courseId',
        label: 'ID del curso',
        type: 'text',
        required: true,
      });
      fields.push({
        name: 'completionDate',
        label: 'Fecha de finalización',
        type: 'date',
        required: true,
        constraints: { past: rules?.requirePastDate !== false },
      });
      break;

    case 'exam_pass':
      fields.push({
        name: 'examId',
        label: 'ID del examen',
        type: 'text',
        required: true,
      });
      fields.push({
        name: 'score',
        label: 'Calificación',
        type: 'number',
        required: true,
        constraints:
          rules?.minPassingScore !== undefined
            ? { min: Number(rules.minPassingScore) }
            : undefined,
      });
      break;

    case 'game_win':
      fields.push({
        name: 'gameId',
        label: 'ID del juego',
        type: 'text',
        required: true,
      });
      if (rules?.requireMatchId !== false) {
        fields.push({
          name: 'matchId',
          label: 'ID de partida',
          type: 'text',
          required: true,
        });
      }
      fields.push({
        name: 'score',
        label: 'Puntuación',
        type: 'number',
        required: false,
        constraints:
          rules?.minScore !== undefined ? { min: Number(rules.minScore) } : undefined,
      });
      break;

    case 'contribution':
      fields.push({
        name: 'contributionType',
        label: 'Tipo de contribución',
        type: 'text',
        required: true,
      });
      fields.push({
        name: 'contributionId',
        label: 'ID de contribución',
        type: 'text',
        required: true,
      });
      break;

    case 'generic':
    default:
      fields.push({
        name: 'data',
        label: 'Evidencia',
        type: 'text',
        required: rules?.requireData !== false,
      });
      break;
  }

  return { fields };
}

async function main() {
  const rules = await prisma.validationRule.findMany();
  console.log(`Found ${rules.length} validation rules to migrate`);

  let migrated = 0;
  let skipped = 0;

  for (const rule of rules) {
    const parsedRules = typeof rule.rules === 'string' ? JSON.parse(rule.rules) : rule.rules;

    if (isNewFormat(parsedRules)) {
      skipped++;
      continue;
    }

    const newRules = migrateRules(rule.evidenceType, parsedRules || {});

    await prisma.validationRule.update({
      where: { id: rule.id },
      data: { rules: newRules as any },
    });

    migrated++;
    console.log(`Migrated rule ${rule.id} (${rule.evidenceType})`);
  }

  console.log(`Done. Migrated: ${migrated}, skipped (already new format): ${skipped}`);
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
