const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.dxikdtublzbzhpkzxkdk:CgkhCTlsxcbhpphG@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async ()=>{ 
  const res = await client.query('SELECT 1 as "connected"');
  console.log('Query result SE-1:', res.rows[0]);
  process.exit(0); 
}).catch(e=>{ console.error('Query failed SE-1:', e.message); });
