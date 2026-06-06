const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.dxikdtublzbzhpkzxkdk:CgkhCTlsxcbhpphG@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});
client.connect().then(()=>{ console.log('Connected to Mumbai Port 5432!'); process.exit(0); }).catch(e=>{ console.error('Mumbai 5432 failed:', e.message); });
