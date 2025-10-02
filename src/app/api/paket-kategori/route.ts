import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { paket_id, kategori_id } = await request.json();

    if (!paket_id || !kategori_id) {
      return NextResponse.json(
        { error: 'paket_id dan kategori_id harus diisi' },
        { status: 400 }
      );
    }

    const paketKategori = await (prisma as any).paket_kategori.create({
      data: {
        paket_id: BigInt(paket_id),
        kategori_id: parseInt(kategori_id)
      }
    });

    return NextResponse.json({
      ...paketKategori,
      paket_id: paketKategori.paket_id.toString()
    });
  } catch (error: any) {
    console.error('Error creating paket kategori:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Kategori sudah ditambahkan ke paket ini' },
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
    const { paket_id, kategori_id } = await request.json();

    if (!paket_id || !kategori_id) {
      return NextResponse.json(
        { error: 'paket_id dan kategori_id harus diisi' },
        { status: 400 }
      );
    }

    await (prisma as any).paket_kategori.delete({
      where: {
        paket_id_kategori_id: {
          paket_id: BigInt(paket_id),
          kategori_id: parseInt(kategori_id)
        }
      }
    });

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting paket kategori:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus kategori' },
      { status: 500 }
    );
  }
}