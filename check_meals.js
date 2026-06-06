require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const url = process.env.DATABASE_URL.replace('?sslmode=require', '');
const pool = new Pool({ 
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT * FROM meal_logs ORDER BY id DESC LIMIT 5', (err, res) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(res.rows, null, 2));
  pool.end();
});
