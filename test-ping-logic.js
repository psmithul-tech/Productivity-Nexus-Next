const { config } = require("dotenv");
config({ path: ".env.local" });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const { rows } = await pool.query('SELECT user_id, timezone FROM settings WHERE telegram_chat_id IS NOT NULL');
  
  const now = new Date();
  console.log("Current UTC Now:", now.toISOString());

  for (const config of rows) {
    const userTz = config.timezone || "UTC";
    const userNow = new Date(now.toLocaleString("en-US", { timeZone: userTz }));
    const currentHour = userNow.getHours();
    const currentMinute = userNow.getMinutes();
    
    console.log(`User ${config.user_id}: TZ=${userTz}, userNow=${userNow.toISOString()}, currentMinute=${currentMinute}, condition=${currentMinute === 0 || currentMinute === 30}`);
  }
  process.exit(0);
}
main();
