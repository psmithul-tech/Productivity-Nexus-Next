require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { formatInTimeZone, fromZonedTime } = require("date-fns-tz");

const url = process.env.DATABASE_URL.replace('?sslmode=require', '');
const pool = new Pool({ 
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});

const timezone = "Asia/Kolkata";
const dateStr = "2026-06-06";

const startOfDay = fromZonedTime(`${dateStr}T00:00:00`, timezone);
const endOfDay = fromZonedTime(`${dateStr}T23:59:59.999`, timezone);

console.log("Start:", startOfDay.toISOString());
console.log("End:", endOfDay.toISOString());

pool.query(`
  SELECT * FROM meal_logs 
  WHERE user_id = $1 
  AND logged_at >= $2 
  AND logged_at < $3
`, ['117585a4-8857-472e-80b4-4492557df869', startOfDay, endOfDay], (err, res) => {
  if (err) console.error(err);
  else console.log("MATCHES:", res.rows);
  pool.end();
});
