import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const urutan = parseInt(formData.get('urutan') as string);
    const altText = formData.get('altText') as string;

    if (!file || !productId || !urutan) {
      return NextResponse.json(
        { error: 'File, productId, dan urutan harus diisi' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Process image with Sharp
    let processedBuffer: Buffer = buffer;
    let actualContentType = file.type;
    
    try {
      const sharpInstance = sharp(buffer, { 
        failOnError: false,
        limitInputPixels: false 
      });
      
      const metadata = await sharpInstance.metadata();
      console.log('Image metadata:', metadata);
      
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
      }
    } catch (sharpError) {
      console.warn('Sharp processing failed, using original image:', sharpError);
    }

    // For now, save to local filesystem as a temporary solution
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products', productId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate filename
    const fileExtension = actualContentType === 'image/jpeg' ? 'jpg' : 
                         actualContentType === 'image/png' ? 'png' : 
                         actualContentType === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `foto-${urutan}-${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file to local filesystem
    fs.writeFileSync(filePath, processedBuffer);

    // Create public URL (this will work for local development)
    const publicUrl = `/uploads/products/${productId}/${fileName}`;

    console.log('File saved locally:', publicUrl);

    // Save to database
    const fotoData = await prisma.foto_produk.create({
      data: {
        produk_id: BigInt(productId),
        url_foto: publicUrl,
        alt_text: altText,
        urutan: urutan,
      },
    });

    // Convert BigInt to string for JSON response
    const response = {
      ...fotoData,
      id_foto: fotoData.id_foto.toString(),
      produk_id: fotoData.produk_id.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Gagal mengupload foto' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}