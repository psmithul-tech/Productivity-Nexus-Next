const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;`);
    await pool.query(`ALTER TABLE settings ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1;`);
    console.log("Successfully added xp and level columns.");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
main();
