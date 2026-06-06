import { db, settingsTable } from "../lib/db";

async function run() {
  const settings = await db.select().from(settingsTable);
  console.log(JSON.stringify(settings, null, 2));
}

run().catch(console.error).finally(() => process.exit(0));
