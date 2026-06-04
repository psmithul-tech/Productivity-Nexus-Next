const { config } = require("dotenv");
config({ path: ".env.local" });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const { rows } = await pool.query('SELECT user_id, timezone, quiet_hours_start, quiet_hours_end FROM settings');
  console.log(rows);
  
  process.exit(0);
}
main();
