const { config } = require("dotenv");
config({ path: ".env.local" });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  await pool.query('ALTER TABLE settings ADD COLUMN IF NOT EXISTS ping_frequency INTEGER NOT NULL DEFAULT 30');
  console.log("Migration done");
  process.exit(0);
}
main();
