import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log("Adding columns to tasks table...");
    await client.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS shared_with text[],
      ADD COLUMN IF NOT EXISTS assigned_to text;
    `);

    console.log("Creating habits table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        frequency TEXT NOT NULL DEFAULT 'daily',
        color TEXT NOT NULL DEFAULT 'primary',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Creating habit_logs table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log("Migration completed successfully!");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration failed:", e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
