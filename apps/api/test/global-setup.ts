import { execSync } from 'child_process';

export default async function globalSetup() {
  // Regenerate Prisma Client from the SQLite test schema so it accepts file: URLs
  process.env.DATABASE_URL = 'file:./test.db';
  execSync('npx prisma generate --schema=prisma/schema.test.prisma', {
    cwd: __dirname + '/..',
    stdio: 'inherit',
  });
}
