const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixDb() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected to DB");
    
    // Check if column exists
    const res = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='settings' and column_name='telegram_username';
    `);
    
    if (res.rows.length === 0) {
      console.log("Adding telegram_username column to settings table...");
      await client.query(`ALTER TABLE "settings" ADD COLUMN "telegram_username" text;`);
      console.log("Successfully added column.");
    } else {
      console.log("Column already exists.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

fixDb();
