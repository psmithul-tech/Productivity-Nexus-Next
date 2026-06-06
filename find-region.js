const { Client } = require('pg');

const regions = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ap-east-1', 'ap-south-1', 'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
  'ap-southeast-1', 'ap-southeast-2', 'ca-central-1',
  'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1', 'eu-south-1',
  'sa-east-1'
];

async function testRegion(region) {
  const client = new Client({
    connectionString: `postgresql://postgres.dxikdtublzbzhpkzxkdk:CgkhCTlsxcbhpphG@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log(`✅ Success with region: ${region}`);
    process.exit(0);
  } catch(e) {
    if (!e.message.includes('not found')) {
      console.log(`⚠️ ${region} failed with different error: ${e.message}`);
    }
  } finally {
    await client.end().catch(()=>{});
  }
}

async function main() {
  for (const region of regions) {
    await testRegion(region);
  }
  console.log('❌ All regions failed.');
}

main();
