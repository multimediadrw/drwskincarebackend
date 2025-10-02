import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { produk_id, kategori_id } = await request.json();

    if (!produk_id || !kategori_id) {
      return NextResponse.json(
        { error: 'produk_id dan kategori_id harus diisi' },
        { status: 400 }
      );
    }

    const produkKategori = await (prisma as any).produk_kategori.create({
      data: {
        produk_id: BigInt(produk_id),
        kategori_id: parseInt(kategori_id)
      }
    });

    return NextResponse.json({
      ...produkKategori,
      produk_id: produkKategori.produk_id.toString()
    });
  } catch (error: any) {
    console.error('Error creating produk kategori:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Kategori sudah ditambahkan ke produk ini' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Gagal menambah kategori' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { produk_id, kategori_id } = await request.json();

    if (!produk_id || !kategori_id) {
      return NextResponse.json(
        { error: 'produk_id dan kategori_id harus diisi' },
        { status: 400 }
      );
    }

    await (prisma as any).produk_kategori.delete({
      where: {
        produk_id_kategori_id: {
          produk_id: BigInt(produk_id),
          kategori_id: parseInt(kategori_id)
        }
      }
    });

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting produk kategori:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus kategori' },
      { status: 500 }
    );
  }
}