const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.dxikdtublzbzhpkzxkdk:CgkhCTlsxcbhpphG@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(async ()=>{ 
  const res = await client.query('SELECT 1 as "connected"');
  console.log('Query result:', res.rows[0]);
  process.exit(0); 
}).catch(e=>{ console.error('Query failed:', e.message); });
