import { NextResponse } from 'next/server';
import { testGCSConnection } from '@/lib/gcs';

export async function GET() {
  try {
    console.log('Testing GCS connection via API...');
    const isConnected = await testGCSConnection();
    
    return NextResponse.json({
      success: isConnected,
      message: isConnected ? 'GCS connection successful' : 'GCS connection failed',
      environment: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        clientEmail: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
        privateKeyExists: !!process.env.GOOGLE_CLOUD_PRIVATE_KEY,
      }
    });
  } catch (error) {
    console.error('GCS test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}