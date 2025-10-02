import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const kategoris = await (prisma as any).kategori.findMany({
      orderBy: {
        nama_kategori: 'asc'
      }
    });

    return NextResponse.json(kategoris);
  } catch (error) {
    console.error('Error fetching kategoris:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data kategori' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nama, deskripsi } = await request.json();

    if (!nama || !nama.trim()) {
      return NextResponse.json(
        { error: 'Nama kategori harus diisi' },
        { status: 400 }
      );
    }

    const kategori = await (prisma as any).kategori.create({
      data: {
        nama_kategori: nama.trim(),
        deskripsi: deskripsi?.trim() || null
      }
    });

    return NextResponse.json(kategori);
  } catch (error: any) {
    console.error('Error creating kategori:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Nama kategori sudah ada' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Gagal menambah kategori' },
      { status: 500 }
    );
  }
}