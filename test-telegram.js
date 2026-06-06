import { db, settingsTable } from './lib/db.js';

async function run() {
  const settings = await db.select().from(settingsTable);
  console.log(settings);
  process.exit(0);
}
run();
