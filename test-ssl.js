const pg = require('pg');
const { Pool } = pg;

const connectionString = "postgresql://postgres.dxikdtublzbzhpkzxkdk:CgkhCTlsxcbhpphG@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function test() {
  const u = new URL(connectionString);
  const pool = new Pool({
    host: u.hostname,
    port: parseInt(u.port, 10),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
    ssl: { rejectUnauthorized: false },
    max: 1
  });
  
  try {
    const res = await pool.query("SELECT 1");
    console.log("Success with parsing");
  } catch (err) {
    console.error("Error with parsing:", err);
  }
  await pool.end();
}
test();
