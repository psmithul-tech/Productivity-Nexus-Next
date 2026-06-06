const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const sql = fs.readFileSync('drizzle/0002_chubby_vengeance.sql', 'utf8');
  await client.query(sql);
  await client.end();
  console.log('Migration completed successfully.');
}

run().catch(console.error);
