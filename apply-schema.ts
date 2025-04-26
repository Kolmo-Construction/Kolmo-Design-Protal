// Direct schema push script
import { db } from './server/db';
import * as schema from './shared/schema';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';

async function main() {
  console.log('Starting schema migration');
  
  try {
    // Apply schema changes
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('Schema pushed successfully');
  } catch (error) {
    console.error('Error pushing schema:', error);
  } finally {
    process.exit(0);
  }
}

main();