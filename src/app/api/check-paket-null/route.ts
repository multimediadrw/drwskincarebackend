import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Find paket photos with NULL paket_id but paket URL structure
    const nullPaketPhotos = await prisma.foto_produk.findMany({
      where: {
        AND: [
          { urutan: 0 },
          { url_foto: { contains: '/pakets/' } },
          { paket_id: null }
        ]
      },
      take: 20
    });

    // Find all paket photos to understand the pattern
    const allPaketPhotos = await prisma.foto_produk.findMany({
      where: {
        AND: [
          { urutan: 0 },
          { url_foto: { contains: '/pakets/' } }
        ]
      },
      take: 10
    });

    return NextResponse.json({
      issueFound: nullPaketPhotos.length > 0,
      nullPaketPhotosCount: nullPaketPhotos.length,
      nullPaketPhotos: nullPaketPhotos.map(photo => ({
        id_foto: photo.id_foto.toString(),
        produk_id: photo.produk_id?.toString(),
        paket_id: photo.paket_id?.toString(),
        url_foto: photo.url_foto,
        alt_text: photo.alt_text
      })),
      allPaketPhotos: allPaketPhotos.map(photo => ({
        id_foto: photo.id_foto.toString(),
        produk_id: photo.produk_id?.toString(),
        paket_id: photo.paket_id?.toString(),
        url_foto: photo.url_foto,
        alt_text: photo.alt_text
      }))
    });

  } catch (error) {
    console.error('Check paket NULL error:', error);
    return NextResponse.json(
      { error: 'Failed to check paket NULL issue' },
      { status: 500 }
    );
  }
}