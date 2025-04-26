// Direct schema push script
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Starting direct schema push');
  
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set, ensure the database is provisioned");
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  try {
    // Drop all tables in the schema if they exist
    console.log('Pushing schema to database...');
    
    // Use SQL to push the schema directly
    const pushResult = await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        magic_link_token VARCHAR(255),
        magic_link_expiry TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL,
        project_manager_id INTEGER REFERENCES users(id),
        start_date TIMESTAMP,
        estimated_completion_date TIMESTAMP,
        actual_completion_date TIMESTAMP,
        total_budget DECIMAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS client_projects (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES users(id),
        project_id INTEGER REFERENCES projects(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(client_id, project_id)
      );
      
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        file_url VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        uploaded_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        amount DECIMAL NOT NULL,
        status VARCHAR(50) NOT NULL,
        due_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id),
        amount DECIMAL NOT NULL,
        payment_date TIMESTAMP NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        sender_id INTEGER REFERENCES users(id),
        recipient_id INTEGER REFERENCES users(id),
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS progress_updates (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS update_media (
        id SERIAL PRIMARY KEY,
        update_id INTEGER REFERENCES progress_updates(id),
        media_url VARCHAR(255) NOT NULL,
        media_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS milestones (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS selections (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        options TEXT[] NOT NULL,
        selected_option VARCHAR(255),
        deadline TIMESTAMP,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Schema push completed successfully');
  } catch (error) {
    console.error('Error pushing schema:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();