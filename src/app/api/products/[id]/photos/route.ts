import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get product with photos
    const product = await prisma.produk.findUnique({
      where: { id_produk: BigInt(id) },
      include: {
        foto_produk: {
          orderBy: { urutan: 'asc' },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      );
    }

    // Convert BigInt to string for JSON response
    const response = {
      ...product,
      id_produk: product.id_produk.toString(),
      foto_produk: product.foto_produk.map(foto => ({
        ...foto,
        id_foto: foto.id_foto.toString(),
        produk_id: foto.produk_id.toString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting product photos:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data produk' },
      { status: 500 }
    );
  }
}