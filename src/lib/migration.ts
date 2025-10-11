// Utility functions for image migration
import sharp from 'sharp';
import { uploadToGCS } from './gcs';
import { v4 as uuidv4 } from 'uuid';

export interface MigrationResult {
  success: boolean;
  originalUrl: string;
  newUrl?: string;
  fileName?: string;
  error?: string;
}

/**
 * Download image from external URL
 */
export async function downloadImageFromUrl(url: string): Promise<Buffer> {
  try {
    console.log('Downloading image from:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Downloaded data: ${buffer.length} bytes`);
    
    // Skip content-type validation, let Sharp determine if it's a valid image
    // Sharp will throw error if it's not a valid image format
    
    return buffer;
  } catch (error) {
    console.error('Error downloading image from URL:', url, error);
    throw error;
  }
}

/**
 * Process image with Sharp (resize and optimize)
 */
export async function processImage(buffer: Buffer): Promise<{ processedBuffer: Buffer; contentType: string }> {
  try {
    // Check if buffer contains image data by trying to read with Sharp
    const sharpInstance = sharp(buffer, { 
      failOnError: false,
      limitInputPixels: false 
    });
    
    const metadata = await sharpInstance.metadata();
    console.log('Image metadata:', {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels
    });
    
    // If no format detected, this is not a valid image
    if (!metadata.format) {
      throw new Error('Invalid image data - no format detected by Sharp');
    }
    
    // Process supported formats
    if (['jpeg', 'jpg', 'png', 'webp', 'gif', 'bmp', 'tiff'].includes(metadata.format)) {
      const processedBuffer = await sharpInstance
        .resize(1200, 1200, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();
        
      console.log(`Image processed: ${buffer.length} -> ${processedBuffer.length} bytes`);
      
      return {
        processedBuffer,
        contentType: 'image/jpeg'
      };
    } else {
      throw new Error(`Unsupported image format: ${metadata.format}`);
    }
  } catch (sharpError) {
    console.error('Sharp processing failed - not a valid image:', sharpError);
    throw new Error(`Invalid image data: ${sharpError instanceof Error ? sharpError.message : 'Unknown error'}`);
  }
}

/**
 * Migrate single image from external URL to GCS
 */
export async function migrateImageToGCS(
  originalUrl: string, 
  productId: string, 
  itemType: 'produk' | 'paket',
  urutan: number = 0
): Promise<MigrationResult> {
  try {
    // Validate URL
    if (!originalUrl || !originalUrl.startsWith('http')) {
      return {
        success: false,
        originalUrl,
        error: 'Invalid URL format'
      };
    }

    // Download image
    const imageBuffer = await downloadImageFromUrl(originalUrl);
    
    // Process image
    const { processedBuffer, contentType } = await processImage(imageBuffer);
    
    // Generate filename
    const fileExtension = contentType === 'image/jpeg' ? 'jpg' : 
                         contentType === 'image/png' ? 'png' : 
                         contentType === 'image/webp' ? 'webp' : 'jpg';
    
    const fileName = `${itemType}s/${productId}/migrated-${urutan}-${uuidv4()}.${fileExtension}`;
    
    // Upload to GCS
    const publicUrl = await uploadToGCS(processedBuffer, fileName, contentType);
    
    return {
      success: true,
      originalUrl,
      newUrl: publicUrl,
      fileName
    };
    
  } catch (error) {
    console.error('Migration failed for URL:', originalUrl, error);
    return {
      success: false,
      originalUrl,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate if URL is accessible
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const contentType = response.headers.get('content-type');
    return response.ok && !!(contentType && contentType.startsWith('image/'));
  } catch {
    return false;
  }
}

/**
 * Extract filename from URL
 */
export function getOriginalFileName(url: string): string {
  try {
    const urlParts = new URL(url);
    const pathParts = urlParts.pathname.split('/');
    return pathParts[pathParts.length - 1] || 'image';
  } catch {
    return 'image';
  }
}