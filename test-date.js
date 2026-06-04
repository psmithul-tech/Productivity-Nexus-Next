const { fromZonedTime } = require("date-fns-tz");
const str = "2026-06-04T12:00:00";
const due = fromZonedTime(str, "Asia/Kolkata");
console.log(due.toISOString());

const { config } = require("dotenv");
config({ path: ".env.local" });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const { rows } = await pool.query("SELECT id, title, due_date FROM tasks WHERE title ILIKE '%mails%'");
  console.log(rows);
  process.exit(0);
}
main();
