const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  await client.connect();

  console.log("Creating watch_progress table...");
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS "watch_progress" (
      "id" SERIAL PRIMARY KEY,
      "user_id" text NOT NULL,
      "anime_id" text NOT NULL,
      "anime_title" text,
      "episode" text NOT NULL,
      "position" integer DEFAULT 0,
      "duration" integer DEFAULT 0,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  console.log("Table created.");
  await client.end();
}

run().catch(console.error);
