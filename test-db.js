const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:CgkhCTlsxcbhpphG@db.dxikdtublzbzhpkzxkdk.supabase.co:5432/postgres?sslmode=require',
});
client.connect().then(()=>{ console.log('Connected!'); process.exit(0); }).catch(e=>{ console.error('Default failed:', e.message); });
