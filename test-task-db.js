const { config } = require("dotenv");
config({ path: ".env.local" });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const { rows } = await pool.query("SELECT id, title, due_date FROM tasks WHERE title ILIKE '%stitch%'");
  console.log(rows);
  process.exit(0);
}
main();
