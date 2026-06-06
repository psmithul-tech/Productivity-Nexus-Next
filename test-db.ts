import { db, settingsTable } from "./lib/db";
async function main() {
  const res = await db.select().from(settingsTable);
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
main();
