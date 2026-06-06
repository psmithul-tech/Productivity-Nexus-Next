const { Client } = require('pg');
const client = new Client({
  host: '2406:da18:1f7e:b101:f596:2c29:1cca:b9cf',
  port: 5432,
  user: 'postgres',
  password: 'CgkhCTlsxcbhpphG',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async ()=>{ 
  const res = await client.query('SELECT 1 as "connected"');
  console.log('Query result IP6-2:', res.rows[0]);
  process.exit(0); 
}).catch(e=>{ console.error('Query failed IP6-2:', e.message); });
