import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { nama, deskripsi } = await request.json();
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID kategori tidak valid' },
        { status: 400 }
      );
    }

    const updateData: { nama_kategori?: string; deskripsi?: string | null } = {};
    if (nama !== undefined) updateData.nama_kategori = nama.trim();
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi?.trim() || null;

    const kategori = await prisma.kategori.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(kategori);
  } catch (error: unknown) {
    console.error('Error updating kategori:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan' },
        { status: 404 }
      );
    }
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Nama kategori sudah ada' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Gagal mengupdate kategori' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID kategori tidak valid' },
        { status: 400 }
      );
    }

    // Check if kategori is being used by products or packages
    const [produkCount, paketCount] = await Promise.all([
      prisma.produk_kategori.count({
        where: { kategori_id: id }
      }),
      prisma.paket_kategori.count({
        where: { kategori_id: id }
      })
    ]);

    if (produkCount > 0 || paketCount > 0) {
      return NextResponse.json(
        { error: `Kategori tidak dapat dihapus karena masih digunakan oleh ${produkCount} produk dan ${paketCount} paket` },
        { status: 409 }
      );
    }

    await prisma.kategori.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Kategori berhasil dihapus' });
  } catch (error: unknown) {
    console.error('Error deleting kategori:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Kategori tidak ditemukan' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Gagal menghapus kategori' },
      { status: 500 }
    );
  }
}