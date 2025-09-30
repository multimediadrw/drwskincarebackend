import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.produk.findMany({
      include: {
        produk_detail: true,
        foto_produk: true,
        produk_bahan_aktif: {
          include: {
            bahan_aktif: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }    });

    // Convert BigInt to string for JSON serialization
    const serializedProducts = products.map(product => ({
      ...product,
      id_produk: product.id_produk.toString(),
      foto_produk: product.foto_produk.map(foto => ({
        ...foto,
        id_foto: foto.id_foto.toString(),
        produk_id: foto.produk_id.toString()
      })),
      produk_bahan_aktif: product.produk_bahan_aktif.map(pba => ({
        ...pba,
        produk_id: pba.produk_id.toString()
      })),
      produk_detail: product.produk_detail ? {
        ...product.produk_detail,
        produk_id: product.produk_detail.produk_id.toString()
      } : null
    }));

    return NextResponse.json(serializedProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const requestData = await request.json();
    const { id_produk, kegunaan, komposisi, cara_pakai, netto, no_bpom, ...updateData } = requestData;
    
    // Only include valid product fields
    const validProductFields = {
      nama_produk: updateData.nama_produk,
      bpom: updateData.bpom,
      harga_director: updateData.harga_director,
      harga_manager: updateData.harga_manager,
      harga_supervisor: updateData.harga_supervisor,
      harga_consultant: updateData.harga_consultant,
      harga_umum: updateData.harga_umum,
      foto_utama: updateData.foto_utama,
      deskripsi_singkat: updateData.deskripsi_singkat,
      slug: updateData.slug,
      updated_at: new Date()
    };    // Remove undefined fields
    const cleanProductData: Record<string, unknown> = {};
    Object.entries(validProductFields).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanProductData[key] = value;
      }
    });

    // Update main product data
    await prisma.produk.update({
      where: { id_produk: BigInt(id_produk) },
      data: cleanProductData
    });    // Update or create product detail if detail fields are provided
    if (kegunaan !== undefined || komposisi !== undefined || cara_pakai !== undefined || netto !== undefined || no_bpom !== undefined) {
      const detailData = {
        kegunaan: kegunaan || null,
        komposisi: komposisi || null,
        cara_pakai: cara_pakai || null,
        netto: netto || null,
        no_bpom: no_bpom || null
      };

      await prisma.produk_detail.upsert({
        where: { produk_id: BigInt(id_produk) },
        create: {
          produk_id: BigInt(id_produk),
          ...detailData
        },
        update: detailData
      });
    }

    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
