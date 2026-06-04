const { config } = require("dotenv");
config({ path: ".env.local" });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const { rows } = await pool.query('SELECT user_id, timezone FROM settings WHERE telegram_chat_id IS NOT NULL');
  console.log(rows);
  process.exit(0);
}
main();
