const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  return client.query('UPDATE settings SET hourly_updates_enabled = true, ping_frequency = 60;');
}).then(() => {
  console.log("Settings fixed!");
  client.end();
}).catch(console.error);
