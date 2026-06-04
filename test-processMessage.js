const { db, settingsTable } = require("./lib/db");
const { eq } = require("drizzle-orm");

async function run() {
  const userId = '5f378b20-67b2-4a15-83f8-5a89351bf1e8';
  const [settings] = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId));
  const userTz = settings?.timezone || "UTC";
  
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    timeZone: userTz, weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    timeZone: userTz, hour: "2-digit", minute: "2-digit", hour12: true,
  });
  
  console.log(`userTz: ${userTz}, timeStr: ${timeStr}, dateStr: ${dateStr}`);
  process.exit(0);
}
run();
