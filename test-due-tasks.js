const { config } = require("dotenv");
config({ path: ".env.local" });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const now = new Date();
  
  const startOfMinute = new Date(now);
  startOfMinute.setSeconds(0, 0);
  const endOfMinute = new Date(now);
  endOfMinute.setSeconds(59, 999);
  
  console.log("Start:", startOfMinute.toISOString());
  console.log("End:", endOfMinute.toISOString());

  const { rows } = await pool.query(
    `SELECT id, title, due_date FROM tasks WHERE status = 'active' AND due_date >= $1::timestamp AND due_date <= $2::timestamp`,
    [startOfMinute.toISOString(), endOfMinute.toISOString()]
  );
  
  console.log("Tasks found:", rows);
  process.exit(0);
}
main();
