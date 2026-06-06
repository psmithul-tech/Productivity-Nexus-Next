const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:CgkhCTlsxcbhpphG@[2406:da18:1f7e:b101:f596:2c29:1cca:b9cf]:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async ()=>{ 
  const res = await client.query('SELECT 1 as "connected"');
  console.log('Query result IP6:', res.rows[0]);
  process.exit(0); 
}).catch(e=>{ console.error('Query failed IP6:', e.message); });
