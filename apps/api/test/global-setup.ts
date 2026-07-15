import fs from 'fs';
import path from 'path';

export default async function globalSetup() {
  // Ensure test client has been generated (run `npm run db:generate:test` once)
  const testClientDir = path.join(__dirname, '..', 'prisma', 'test-client');
  if (!fs.existsSync(testClientDir)) {
    throw new Error(
      'Test Prisma client not found. Run `npm run db:generate:test` in apps/api first.'
    );
  }
}
