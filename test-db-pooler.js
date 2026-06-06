const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.dxikdtublzbzhpkzxkdk:CgkhCTlsxcbhpphG@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require',
});
client.connect().then(()=>{ console.log('Connected to Mumbai!'); process.exit(0); }).catch(e=>{ console.error('Mumbai failed:', e.message); });
