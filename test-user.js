const { config } = require("dotenv");
config({ path: ".env.local" });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const { rows } = await pool.query("SELECT id, user_id, telegram_chat_id, timezone FROM settings");
  console.log(rows);
  process.exit(0);
}
main();
