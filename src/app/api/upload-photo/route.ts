import { NextRequest, NextResponse } from 'next/server';
import { uploadToGCS } from '@/lib/gcs';
import prisma from '@/lib/prisma';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const itemType = formData.get('itemType') as string || 'produk'; // 'produk' or 'paket'
    const urutan = parseInt(formData.get('urutan') as string) || 1;
    const altText = formData.get('altText') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // For now, skip Sharp processing due to OpenSSL issues
    // TODO: Fix Sharp configuration for production
    let processedBuffer: Buffer = buffer;
    let actualContentType = file.type;
    
    // Optional: Try Sharp processing with extensive error handling
    try {
      const sharpInstance = sharp(buffer, { 
        failOnError: false,
        limitInputPixels: false 
      });
      
      // Get image metadata first
      const metadata = await sharpInstance.metadata();
      console.log('Image metadata:', metadata);
      
      // Only process if it's a supported format
      if (metadata.format && ['jpeg', 'jpg', 'png', 'webp'].includes(metadata.format)) {
        processedBuffer = await sharpInstance
          .resize(800, 800, { 
            fit: 'inside', 
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toBuffer();
        actualContentType = 'image/jpeg';
        console.log('Sharp processing successful');
      } else {
        console.log('Unsupported format, using original image');
      }
    } catch (sharpError) {
      console.warn('Sharp processing failed, using original image:', sharpError);
      // Use original buffer and content type
    }

    // Generate unique filename with proper extension
    const fileExtension = actualContentType === 'image/jpeg' ? 'jpg' : 
                         actualContentType === 'image/png' ? 'png' : 
                         actualContentType === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `products/${productId}/foto-${urutan}-${uuidv4()}.${fileExtension}`;

    // Upload to Google Cloud Storage
    const publicUrl = await uploadToGCS(processedBuffer, fileName, actualContentType);

    // Save to database - determine if it's produk or paket
    const createData: { url_foto: string; alt_text?: string; urutan?: number; paket_id?: bigint; produk_id?: bigint } = {
      url_foto: publicUrl,
      alt_text: altText,
      urutan: urutan,
    };

    if (itemType === 'paket') {
      createData.paket_id = BigInt(productId);
    } else {
      createData.produk_id = BigInt(productId);
    }

    const fotoData = await prisma.foto_produk.create({
      data: createData,
    });

    // Convert BigInt to string for JSON response
    const response = {
      ...fotoData,
      id_foto: fotoData.id_foto.toString(),
      produk_id: fotoData.produk_id ? fotoData.produk_id.toString() : null,
      paket_id: fotoData.paket_id ? fotoData.paket_id.toString() : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}