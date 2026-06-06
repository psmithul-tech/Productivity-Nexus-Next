require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const url = process.env.DATABASE_URL.replace('?sslmode=require', '');
const pool = new Pool({ 
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT id, email FROM users', (err, res) => {
  if (err) console.error(err);
  else console.log("USERS:", res.rows);
  pool.query('SELECT id, user_id, telegram_chat_id FROM settings', (err2, res2) => {
      if (err2) console.error(err2);
      else console.log("SETTINGS:", res2.rows);
      pool.end();
  });
});
