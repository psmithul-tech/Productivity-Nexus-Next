require('dotenv').config({ path: '.env.local' });
const { drizzle } = require("drizzle-orm/node-postgres");
const { Client } = require("pg");

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const db = drizzle(client);
  const res = await client.query("SELECT id, user_id, telegram_chat_id FROM settings WHERE telegram_chat_id IS NOT NULL");
  console.log(res.rows);
  await client.end();
}
run();
