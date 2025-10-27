import { testGCSConnection } from './src/lib/gcs.ts';

async function testConnection() {
  console.log('Testing GCS connection...');
  console.log('Environment variables:');
  console.log('GOOGLE_CLOUD_PROJECT_ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
  console.log('GOOGLE_CLOUD_STORAGE_BUCKET:', process.env.GOOGLE_CLOUD_STORAGE_BUCKET);
  console.log('GOOGLE_CLOUD_CLIENT_EMAIL:', process.env.GOOGLE_CLOUD_CLIENT_EMAIL);
  console.log('GOOGLE_CLOUD_PRIVATE_KEY exists:', !!process.env.GOOGLE_CLOUD_PRIVATE_KEY);
  console.log('GOOGLE_CLOUD_PRIVATE_KEY length:', process.env.GOOGLE_CLOUD_PRIVATE_KEY?.length);

  const result = await testGCSConnection();
  console.log('Test results:', JSON.stringify(result, null, 2));
}

testConnection().catch(console.error);