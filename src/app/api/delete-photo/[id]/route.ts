import { NextRequest, NextResponse } from 'next/server';
import { deleteProductPhoto } from '@/lib/gcs';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fotoId } = await params;

    // Get foto data from database
    const foto = await prisma.foto_produk.findUnique({
      where: { id_foto: BigInt(fotoId) },
    });

    if (!foto) {
      return NextResponse.json({ error: 'Foto tidak ditemukan' }, { status: 404 });
    }

    // Extract filename from URL
    const fileName = foto.url_foto.split('/').pop();
    if (fileName) {
      try {
        // Try to delete from Google Cloud Storage
        await deleteProductPhoto(fileName);
        console.log('File deleted from GCS successfully:', fileName);
      } catch (gcsError: unknown) {
        if (gcsError instanceof Error && gcsError.message === 'FILE_NOT_FOUND') {
          console.warn('File not found in GCS (might already be deleted):', fileName);
        } else {
          console.error('Unexpected GCS error:', gcsError);
        }
        // Continue with database deletion even if GCS delete fails
        // This handles cases where file was manually deleted or doesn't exist
      }
    }

    // Delete from database (always do this)
    await prisma.foto_produk.delete({
      where: { id_foto: BigInt(fotoId) },
    });

    return NextResponse.json({ message: 'Foto berhasil dihapus' });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus foto' },
      { status: 500 }
    );
  }
}