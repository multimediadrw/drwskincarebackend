import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateImageUrl } from '@/lib/migration';

export async function GET() {
  try {
    // Get a few sample records to show for testing
    const sampleProducts = await prisma.produk.findMany({
      where: {
        AND: [
          { foto_utama: { not: null } },
          { foto_utama: { not: '' } },
        ]
      },
      select: {
        id_produk: true,
        nama_produk: true,
        foto_utama: true,
        foto_produk: {
          where: { urutan: 0 },
          select: {
            id_foto: true,
            url_foto: true,
            created_at: true
          }
        }
      },
      take: 5,
      orderBy: { created_at: 'desc' }
    });

    const samplePakets = await prisma.paket_produk.findMany({
      where: {
        AND: [
          { foto_utama: { not: null } },
          { foto_utama: { not: '' } },
        ]
      },
      select: {
        id_paket: true,
        nama_paket: true,
        foto_utama: true,
        foto_produk: {
          where: { urutan: 0 },
          select: {
            id_foto: true,
            url_foto: true,
            created_at: true
          }
        }
      },
      take: 5,
      orderBy: { created_at: 'desc' }
    });

    // Convert BigInt to string for JSON
    const formattedProducts = sampleProducts.map(p => ({
      ...p,
      id_produk: p.id_produk.toString(),
      foto_produk: p.foto_produk.map(fp => ({
        ...fp,
        id_foto: fp.id_foto.toString()
      }))
    }));

    const formattedPakets = samplePakets.map(p => ({
      ...p,
      id_paket: p.id_paket.toString(),
      foto_produk: p.foto_produk.map(fp => ({
        ...fp,
        id_foto: fp.id_foto.toString()
      }))
    }));

    return NextResponse.json({
      sampleProducts: formattedProducts,
      samplePakets: formattedPakets,
      message: 'Use POST to /api/migrate-foto-utama with { "itemType": "produk"|"paket"|"all", "limit": 10, "dryRun": true }'
    });

  } catch (error) {
    console.error('Test migration API error:', error);
    return NextResponse.json(
      { error: 'Failed to get test data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('Testing URL validation for:', url);

    const isValid = await validateImageUrl(url);
    
    return NextResponse.json({
      url,
      isValid,
      message: isValid ? 'URL is accessible and is an image' : 'URL is not accessible or not an image'
    });

  } catch (error) {
    console.error('URL validation error:', error);
    return NextResponse.json(
      { 
        error: 'URL validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}