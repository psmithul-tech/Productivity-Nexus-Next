import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";
if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Using dummy connection string for build phase.");
}

let pool: pg.Pool;
try {
  const u = new URL(connectionString);
  const isSupabase =
    u.hostname.endsWith(".supabase.com") ||
    u.hostname.endsWith(".supabase.co");

  if (isSupabase) {
    pool = new Pool({
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : 5432,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, "") || "postgres",
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  } else {
    pool = new Pool({ connectionString, max: 5 });
  }
} catch {
  pool = new Pool({ connectionString, max: 5 });
}

export { pool };
export const db = drizzle(pool, { schema });
export * from "./schema";
