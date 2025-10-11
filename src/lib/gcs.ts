import { Storage } from '@google-cloud/storage';

// Lazy initialization variables
let storage: Storage | null = null;
let bucket: any = null; // TODO: Import proper Bucket type from @google-cloud/storage

// Lazy initialization function
function initializeGCS() {
  if (storage && bucket) {
    return { storage, bucket };
  }

  // Check if required environment variables are available
  if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_STORAGE_BUCKET) {
    console.warn('Google Cloud Storage environment variables not available, skipping initialization');
    return { storage: null, bucket: null };
  }

  try {
    console.log('Initializing Google Cloud Storage...');
    console.log('Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    console.log('Bucket Name:', process.env.GOOGLE_CLOUD_STORAGE_BUCKET);

    // Use environment variables directly (skip key file)
    console.log('Using environment variables for GCS authentication');
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });

    bucket = storage.bucket(process.env.GOOGLE_CLOUD_STORAGE_BUCKET!);
    console.log('Google Cloud Storage initialized successfully');
    
    return { storage, bucket };
  } catch (initError) {
    console.error('Failed to initialize Google Cloud Storage:', initError);
    return { storage: null, bucket: null };
  }
}

// Export functions that handle lazy initialization
export function getStorage() {
  const { storage } = initializeGCS();
  return storage;
}

export function getBucket() {
  const { bucket } = initializeGCS();
  return bucket;
}

// Test function to verify GCS connection
export async function testGCSConnection(): Promise<{ canAuthenticate: boolean; canListBuckets: boolean; availableBuckets: string[]; targetBucketExists: boolean; errors: string[] }> {
  const result = {
    canAuthenticate: false,
    canListBuckets: false,
    availableBuckets: [] as string[],
    targetBucketExists: false,
    errors: [] as string[],
  };

  try {
    console.log('Step 1: Testing basic authentication...');
    
    const storage = getStorage();
    const bucket = getBucket();
    
    if (!storage || !bucket) {
      result.errors.push('Google Cloud Storage not initialized - missing environment variables');
      return result;
    }
    
    // Test basic authentication by getting project info
    try {
      const [buckets] = await storage.getBuckets({ maxResults: 10 });
      result.canAuthenticate = true;
      result.canListBuckets = true;
      result.availableBuckets = buckets.map(b => b.name);
      console.log('✅ Authentication successful');
      console.log('Available buckets:', result.availableBuckets);
    } catch (authError) {
      console.error('❌ Authentication failed:', authError);
      result.errors.push(`Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown error'}`);
      return result;
    }

    console.log('Step 2: Testing target bucket access...');
    try {
      const [exists] = await bucket.exists();
      result.targetBucketExists = exists;
      console.log('✅ Target bucket exists:', exists);
      
      if (exists) {
        // Test bucket permissions
        try {
          const [metadata] = await bucket.getMetadata();
          console.log('✅ Can read bucket metadata');
          console.log('Bucket location:', metadata.location);
          console.log('Bucket storage class:', metadata.storageClass);
        } catch (metadataError) {
          console.warn('⚠️ Cannot read bucket metadata:', metadataError);
          result.errors.push(`Cannot read bucket metadata: ${metadataError instanceof Error ? metadataError.message : 'Unknown error'}`);
        }
      }
    } catch (bucketError) {
      console.error('❌ Bucket access failed:', bucketError);
      result.errors.push(`Bucket access failed: ${bucketError instanceof Error ? bucketError.message : 'Unknown error'}`);
    }
    
    return result;
  } catch (error) {
    console.error('GCS connection test failed:', error);
    result.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

export interface UploadResult {
  fileName: string;
  publicUrl: string;
}

export async function uploadProductPhoto(
  file: Buffer,
  originalName: string,
  productId: string,
  urutan: number
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `produk-${productId}-foto-${urutan}-${timestamp}.${extension}`;
    
    // Create file reference
    const fileUpload = bucket.file(fileName);
    
    // Upload file
    await fileUpload.save(file, {
      metadata: {
        contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
        cacheControl: 'public, max-age=31536000', // 1 year
      },
      public: true, // Make file publicly accessible
    });
    
    // Make file public
    await fileUpload.makePublic();
    
    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${fileName}`;
    
    return {
      fileName,
      publicUrl,
    };
  } catch (error) {
    console.error('Error uploading file to GCS:', error);
    throw new Error('Failed to upload file to Google Cloud Storage');
  }
}

export async function deleteProductPhoto(fileName: string): Promise<void> {
  try {
    console.log('Attempting to delete file from GCS:', fileName);
    
    const bucket = getBucket();
    if (!bucket) {
      throw new Error('Google Cloud Storage not initialized - missing environment variables');
    }
    
    await bucket.file(fileName).delete();
    console.log('File deleted successfully from GCS:', fileName);
  } catch (error: unknown) {
    console.error('Error deleting file from GCS:', error);
    
    // If file doesn't exist (404), don't throw error
    if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
      console.warn('File not found in GCS (404):', fileName);
      throw new Error('FILE_NOT_FOUND');
    }
    
    throw new Error('Failed to delete file from Google Cloud Storage');
  }
}

export function extractFileNameFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// Legacy functions for backward compatibility
export const uploadToGCS = async (
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> => {
  try {
    console.log(`Uploading file: ${fileName}, size: ${file.length} bytes, type: ${contentType}`);
    console.log('GCS Bucket:', process.env.GOOGLE_CLOUD_STORAGE_BUCKET);
    console.log('GCS Project ID:', process.env.GOOGLE_CLOUD_PROJECT_ID);
    
    const bucket = getBucket();
    if (!bucket) {
      throw new Error('Google Cloud Storage not initialized - missing environment variables');
    }
    
    // Test bucket access first
    try {
      const [exists] = await bucket.exists();
      console.log('Bucket exists:', exists);
      if (!exists) {
        throw new Error('Bucket does not exist or is not accessible');
      }
    } catch (bucketError) {
      console.error('Bucket access error:', bucketError);
      throw new Error('Cannot access Google Cloud Storage bucket');
    }
    
    const fileUpload = bucket.file(fileName);
    
    // Upload without legacy ACL (for uniform bucket-level access)
    console.log('Attempting file upload with uniform bucket access...');
    
    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType,
        cacheControl: 'public, max-age=31536000',
      },
      validation: false,
      // Remove public: true to avoid legacy ACL issues
    });

    // Upload using stream instead of save method
    await new Promise<void>((resolve, reject) => {
      stream.on('error', (error: Error) => {
        console.error('Stream upload error:', error);
        reject(error);
      });
      
      stream.on('finish', () => {
        console.log('Stream upload finished');
        resolve();
      });
      
      stream.end(file);
    });

    // For uniform bucket-level access, we don't need to make individual files public
    // The bucket should be configured for public access at the bucket level
    console.log('File uploaded successfully with uniform bucket access');

    const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_STORAGE_BUCKET}/${fileName}`;
    console.log(`Upload successful: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error('GCS Upload error details:', {
      error: error,
      fileName,
      contentType,
      fileSize: file.length,
      bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload file to Google Cloud Storage: ${errorMessage}`);
  }
};

export const deleteFromGCS = async (fileName: string): Promise<void> => {
  try {
    const bucket = getBucket();
    if (!bucket) {
      throw new Error('Google Cloud Storage not initialized - missing environment variables');
    }
    
    await bucket.file(fileName).delete();
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete file from Google Cloud Storage');
  }
};