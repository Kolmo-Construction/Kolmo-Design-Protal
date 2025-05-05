// apply-custom-migration.js
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Need to set WebSocket constructor for Neon serverless driver
neonConfig.webSocketConstructor = ws;

// Execute the SQL using Node-Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Execute each statement in its own transaction
async function executeStatement(statement, index, total) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log(`Executing statement ${index}/${total}...`);
    await client.query(statement);
    await client.query('COMMIT');
    console.log(`Statement ${index} completed successfully`);
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.log(`Statement ${index} failed: ${err.message}`);
    return false;
  } finally {
    client.release();
  }
}

async function applyMigration() {
  try {
    // First check if uuid-ossp extension is available
    const uuidClient = await pool.connect();
    try {
      await uuidClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('uuid-ossp extension enabled');
    } catch (err) {
      console.error('Error enabling uuid-ossp extension:', err.message);
    } finally {
      uuidClient.release();
    }

    // Try creating the enums
    await executeStatement(`DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_type') THEN
    CREATE TYPE "public"."feedback_type" AS ENUM('edit', 'approve', 'reject');
  END IF;
END
$$;`, 1, 8);

    await executeStatement(`DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE "public"."project_status" AS ENUM('draft', 'finalized', 'archived');
  END IF;
END
$$;`, 2, 8);

    // Create tables one by one
    await executeStatement(`CREATE TABLE IF NOT EXISTS "project_versions" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
      "project_id" integer NOT NULL,
      "version_number" integer NOT NULL,
      "notes" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`, 3, 8);

    await executeStatement(`CREATE TABLE IF NOT EXISTS "rag_tasks" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
      "project_version_id" uuid NOT NULL,
      "task_name" text NOT NULL,
      "trade" text NOT NULL,
      "phase" text NOT NULL,
      "description" text NOT NULL,
      "duration_days" numeric(5, 2) NOT NULL,
      "required_materials" jsonb,
      "required_inspections" jsonb,
      "notes" text,
      "is_generated" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`, 4, 8);

    await executeStatement(`CREATE TABLE IF NOT EXISTS "rag_task_dependencies" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
      "task_id" uuid NOT NULL,
      "depends_on_task_id" uuid NOT NULL
    );`, 5, 8);

    await executeStatement(`CREATE TABLE IF NOT EXISTS "task_chunks" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
      "task_text" text NOT NULL,
      "trade" text NOT NULL,
      "phase" text NOT NULL,
      "project_type" text NOT NULL,
      "embedding" text,
      "metadata" jsonb,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`, 6, 8);

    await executeStatement(`CREATE TABLE IF NOT EXISTS "generation_prompts" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
      "project_version_id" uuid NOT NULL,
      "input_text" text NOT NULL,
      "raw_prompt" text NOT NULL,
      "used_embedding_ids" jsonb,
      "llm_output" jsonb,
      "model_used" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`, 7, 8);

    await executeStatement(`CREATE TABLE IF NOT EXISTS "task_feedback" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
      "task_id" uuid NOT NULL,
      "user_id" integer NOT NULL,
      "feedback_type" "feedback_type" NOT NULL,
      "old_value" jsonb,
      "new_value" jsonb,
      "comment" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    );`, 8, 8);

    // Now create foreign key constraints if tables exist
    console.log('Attempting to create foreign key constraints...');
    
    // Attempt to add each foreign key constraint in a separate transaction
    const constraints = [
      {
        name: 'project_versions_project_id_fk',
        sql: `ALTER TABLE "project_versions" 
              ADD CONSTRAINT "project_versions_project_id_projects_id_fk" 
              FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") 
              ON DELETE cascade ON UPDATE no action;`
      },
      {
        name: 'rag_tasks_project_version_id_fk',
        sql: `ALTER TABLE "rag_tasks" 
              ADD CONSTRAINT "rag_tasks_project_version_id_project_versions_id_fk" 
              FOREIGN KEY ("project_version_id") REFERENCES "public"."project_versions"("id") 
              ON DELETE cascade ON UPDATE no action;`
      },
      {
        name: 'generation_prompts_project_version_id_fk',
        sql: `ALTER TABLE "generation_prompts" 
              ADD CONSTRAINT "generation_prompts_project_version_id_project_versions_id_fk" 
              FOREIGN KEY ("project_version_id") REFERENCES "public"."project_versions"("id") 
              ON DELETE cascade ON UPDATE no action;`
      },
      {
        name: 'rag_task_dependencies_task_id_fk',
        sql: `ALTER TABLE "rag_task_dependencies" 
              ADD CONSTRAINT "rag_task_dependencies_task_id_rag_tasks_id_fk" 
              FOREIGN KEY ("task_id") REFERENCES "public"."rag_tasks"("id") 
              ON DELETE cascade ON UPDATE no action;`
      },
      {
        name: 'rag_task_dependencies_depends_on_task_id_fk',
        sql: `ALTER TABLE "rag_task_dependencies" 
              ADD CONSTRAINT "rag_task_dependencies_depends_on_task_id_rag_tasks_id_fk" 
              FOREIGN KEY ("depends_on_task_id") REFERENCES "public"."rag_tasks"("id") 
              ON DELETE cascade ON UPDATE no action;`
      },
      {
        name: 'task_feedback_task_id_fk',
        sql: `ALTER TABLE "task_feedback" 
              ADD CONSTRAINT "task_feedback_task_id_rag_tasks_id_fk" 
              FOREIGN KEY ("task_id") REFERENCES "public"."rag_tasks"("id") 
              ON DELETE cascade ON UPDATE no action;`
      },
      {
        name: 'task_feedback_user_id_fk',
        sql: `ALTER TABLE "task_feedback" 
              ADD CONSTRAINT "task_feedback_user_id_users_id_fk" 
              FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") 
              ON DELETE cascade ON UPDATE no action;`
      }
    ];

    // Create each constraint in its own transaction
    for (let i = 0; i < constraints.length; i++) {
      const constraint = constraints[i];
      
      // First check if constraint already exists
      const constraintClient = await pool.connect();
      try {
        const result = await constraintClient.query(`
          SELECT 1 FROM pg_constraint 
          WHERE conname = $1
        `, [constraint.name]);
        
        if (result.rowCount > 0) {
          console.log(`Constraint ${constraint.name} already exists, skipping...`);
        } else {
          console.log(`Adding constraint ${constraint.name}...`);
          await executeStatement(constraint.sql, `FK ${i+1}/${constraints.length}`, constraints.length);
        }
      } catch (err) {
        console.error(`Error checking constraint ${constraint.name}:`, err.message);
      } finally {
        constraintClient.release();
      }
    }

    // Finally make sure tasks has a published_at column
    const tasksClient = await pool.connect();
    try {
      const result = await tasksClient.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'published_at'
      `);
      
      if (result.rowCount === 0) {
        console.log('Adding published_at column to tasks table...');
        await executeStatement(`ALTER TABLE "tasks" ADD COLUMN "published_at" timestamp;`, 'Final', 'Final');
      } else {
        console.log('published_at column already exists in tasks table');
      }
    } catch (err) {
      console.error('Error checking for published_at column:', err.message);
    } finally {
      tasksClient.release();
    }

    console.log('Migration completed');
  } catch (error) {
    console.error('Error in migration process:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

console.log('Applying customized RAG system migration...');
applyMigration();