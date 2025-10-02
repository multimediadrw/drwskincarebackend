import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get products
    const products = await prisma.produk.findMany({
      include: {
        produk_detail: true,
        foto_produk: true,
        produk_bahan_aktif: {
          include: {
            bahan_aktif: true
          }
        },
        produk_kategori: {
          include: {
            kategori: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Get paket_produk
    const paketProduk = await prisma.paket_produk.findMany({
      include: {
        paket_isi: {
          include: {
            produk: true
          }
        },
        paket_kategori: {
          include: {
            kategori: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Convert BigInt to string for JSON serialization - Products
    const serializedProducts = products.map((product: any) => ({
      ...product,
      type: 'produk', // Add type identifier
      id_produk: product.id_produk.toString(),
      foto_produk: product.foto_produk.map((foto: any) => ({
        ...foto,
        id_foto: foto.id_foto.toString(),
        produk_id: foto.produk_id.toString()
      })),
      produk_bahan_aktif: product.produk_bahan_aktif.map((pba: any) => ({
        ...pba,
        produk_id: pba.produk_id.toString()
      })),
      produk_detail: product.produk_detail ? {
        ...product.produk_detail,
        produk_id: product.produk_detail.produk_id.toString()
      } : null,
      // Include kategori data
      produk_kategori: product.produk_kategori ? product.produk_kategori.map((pk: any) => ({
        ...pk,
        produk_id: pk.produk_id.toString(),
        kategori_id: pk.kategori_id
      })) : []
    }));

    // Convert BigInt to string for JSON serialization - Paket Produk
    const serializedPaketProduk = paketProduk.map((paket: any) => ({
      ...paket,
      type: 'paket', // Add type identifier
      id_produk: paket.id_paket.toString(), // Use id_paket as id_produk for consistency
      nama_produk: paket.nama_paket, // Use nama_paket as nama_produk for consistency
      id_paket: paket.id_paket.toString(),
      paket_isi: paket.paket_isi.map((isi: any) => ({
        ...isi,
        paket_id: isi.paket_id.toString(),
        produk_id: isi.produk_id.toString(),
        produk: {
          ...isi.produk,
          id_produk: isi.produk.id_produk.toString()
        }
      })),
      // Add empty arrays for consistency with produk structure
      foto_produk: [],
      produk_bahan_aktif: [],
      produk_detail: null,
      produk_kategori: [],
      paket_kategori: paket.paket_kategori ? paket.paket_kategori.map((pk: any) => ({
        ...pk,
        paket_id: pk.paket_id.toString(),
        kategori_id: pk.kategori_id
      })) : []
    }));

    // Combine both products and paket_produk
    const allItems = [...serializedProducts, ...serializedPaketProduk];

    // Debug log to check kategori data
    console.log('Sample item with kategori:', JSON.stringify(allItems[0], null, 2));

    return NextResponse.json(allItems);
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
