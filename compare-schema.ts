
import { db, pool } from './server/db';

// This script will compare your schema definitions with the actual database structure
async function compareSchema() {
  try {
    console.log('Fetching tables from database...');
    // Get all tables in the database
    const tableQuery = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const dbTables = tableQuery.rows.map(row => row.table_name);
    
    console.log('Database Tables:', dbTables);
    
    // Get all columns for each table
    for (const tableName of dbTables) {
      const columnQuery = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
      `, [tableName]);
      
      console.log(`\nTable: ${tableName}`);
      console.log('Columns:');
      columnQuery.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}${col.column_default ? `, DEFAULT: ${col.column_default}` : ''})`);
      });
    }
    
    // Get primary keys
    console.log('\nPrimary Keys:');
    const pkQuery = await pool.query(`
      SELECT tc.table_name, kc.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kc 
        ON kc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
    `);
    
    pkQuery.rows.forEach(pk => {
      console.log(`  - Table: ${pk.table_name}, PK: ${pk.column_name}`);
    });
    
    // Get foreign keys
    console.log('\nForeign Keys:');
    const fkQuery = await pool.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name as foreign_table_name,
        ccu.column_name as foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);
    
    fkQuery.rows.forEach(fk => {
      console.log(`  - Table: ${fk.table_name}, Column: ${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    console.log('\nNow compare this with your schema definition in shared/schema.ts');
    
  } catch (error) {
    console.error('Error comparing schema:', error);
  } finally {
    await pool.end();
  }
}

// This function will only be executed if you run this script directly
if (require.main === module) {
  compareSchema();
}

export { compareSchema };
