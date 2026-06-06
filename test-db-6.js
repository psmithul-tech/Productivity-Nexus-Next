const dns = require('dns');
dns.setDefaultResultOrder('ipv6first');
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:CgkhCTlsxcbhpphG@db.dxikdtublzbzhpkzxkdk.supabase.co:5432/postgres?sslmode=require',
});
client.connect().then(()=>{ console.log('Connected IPv6!'); process.exit(0); }).catch(e=>{ console.error('IPv6 failed:', e.message); });
