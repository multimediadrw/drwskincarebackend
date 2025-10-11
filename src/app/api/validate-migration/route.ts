import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Count migration results
    const totalMigrated = await prisma.foto_produk.count({
      where: { urutan: 0 }
    });

    const produkCount = await prisma.foto_produk.count({
      where: { 
        AND: [
          { urutan: 0 },
          { produk_id: { not: null } }
        ]
      }
    });

    const paketCount = await prisma.foto_produk.count({
      where: { 
        AND: [
          { urutan: 0 },
          { paket_id: { not: null } }
        ]
      }
    });

    // Get sample produk photos with proper relations
    const produkPhotos = await prisma.foto_produk.findMany({
      where: {
        AND: [
          { urutan: 0 },
          { produk_id: { not: null } }
        ]
      },
      include: {
        produk: {
          select: {
            id_produk: true,
            nama_produk: true
          }
        }
      },
      take: 5
    });

    // Get sample paket photos with proper relations  
    const paketPhotos = await prisma.foto_produk.findMany({
      where: {
        AND: [
          { urutan: 0 },
          { paket_id: { not: null } }
        ]
      },
      include: {
        paket_produk: {
          select: {
            id_paket: true,
            nama_paket: true
          }
        }
      },
      take: 5
    });

    // Convert BigInt to string for JSON response
    const formatProdukPhotos = produkPhotos.map(photo => ({
      ...photo,
      id_foto: photo.id_foto.toString(),
      produk_id: photo.produk_id?.toString(),
      paket_id: photo.paket_id?.toString(),
      produk: photo.produk ? {
        ...photo.produk,
        id_produk: photo.produk.id_produk.toString()
      } : null
    }));

    const formatPaketPhotos = paketPhotos.map(photo => ({
      ...photo,
      id_foto: photo.id_foto.toString(),
      produk_id: photo.produk_id?.toString(), 
      paket_id: photo.paket_id?.toString(),
      paket_produk: photo.paket_produk ? {
        ...photo.paket_produk,
        id_paket: photo.paket_produk.id_paket.toString()
      } : null
    }));

    return NextResponse.json({
      migrationStats: {
        totalMigratedPhotos: totalMigrated,
        produkPhotosCount: produkCount,
        paketPhotosCount: paketCount
      },
      sampleProdukPhotos: formatProdukPhotos,
      samplePaketPhotos: formatPaketPhotos,
      validation: {
        produkRelationsWork: produkPhotos.every(p => p.produk !== null),
        paketRelationsWork: paketPhotos.every(p => p.paket_produk !== null),
        allPhotosHaveCorrectUrutan: [...produkPhotos, ...paketPhotos].every(p => p.urutan === 0)
      }
    });

  } catch (error) {
    console.error('Migration validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate migration results' },
      { status: 500 }
    );
  }
}