import { Pool } from "pg";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.replace("6543", "5432"),
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "media_ratings" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "media_id" text NOT NULL,
        "media_title" text,
        "rating" integer NOT NULL,
        "is_liked" boolean DEFAULT false NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("Created media_ratings");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "search_activity" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "search_query" text,
        "clicked_media_id" text,
        "clicked_media_title" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
    console.log("Created search_activity");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_profiles" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "age" integer,
        "country" text,
        "favorite_genres" text[],
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
      );
    `);
    console.log("Created user_profiles");

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
