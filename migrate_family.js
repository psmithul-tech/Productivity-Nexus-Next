const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const u = new URL(process.env.DATABASE_URL);
const pool = new Pool({
  host: u.hostname,
  port: u.port ? parseInt(u.port, 10) : 5432,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, ""),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "families" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "creator_id" text NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS "family_members" (
        "id" serial PRIMARY KEY NOT NULL,
        "family_id" integer NOT NULL,
        "user_id" text NOT NULL,
        "role" text DEFAULT 'member' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );

      DO $$ BEGIN
        ALTER TABLE "family_members" ADD CONSTRAINT "family_members_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE cascade ON UPDATE no action;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("Migration successful");
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
