const { config } = require("dotenv");
config({ path: ".env.local" });

const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const { rows } = await pool.query('SELECT user_id, telegram_chat_id, telegram_bot_token FROM settings WHERE telegram_chat_id IS NOT NULL');
  console.log(rows);
  
  for (const row of rows) {
    if (row.telegram_chat_id && row.telegram_bot_token) {
        const res = await fetch(`https://api.telegram.org/bot${row.telegram_bot_token}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: row.telegram_chat_id,
              text: "Test message from Restia debugger",
              parse_mode: "Markdown",
            }),
        });
        const data = await res.json();
        console.log(`Response for ${row.user_id}:`, data);
    }
  }
  process.exit(0);
}
main();
