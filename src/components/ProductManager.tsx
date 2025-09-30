'use client';

import { useState, useEffect } from 'react';

interface BahanAktif {
  id: number;
  nama_bahan: string;
}

interface ProdukBahanAktif {
  bahan_aktif: BahanAktif;
}

interface ProdukDetail {
  kegunaan?: string | null;
  komposisi?: string | null;
  cara_pakai?: string | null;
  netto?: string | null;
  no_bpom?: string | null;
}

interface Product {
  id_produk: string;
  nama_produk: string;
  bpom?: string | null;
  harga_director: number;
  harga_manager: number;
  harga_supervisor: number;
  harga_consultant: number;
  harga_umum: number;
  foto_utama?: string | null;
  deskripsi_singkat?: string | null;
  slug?: string | null;
  created_at: string;
  updated_at: string;
  produk_detail?: ProdukDetail | null;
  produk_bahan_aktif: ProdukBahanAktif[];
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Product & ProdukDetail>>({});

  useEffect(() => {
    fetchProducts();
  }, []);  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
        // Check if data is an array before mapping
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Data is not an array:', data);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product.id_produk);
    setEditData({
      ...product,
      ...product.produk_detail
    });
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_produk: editingProduct,
          ...editData
        }),
      });

      if (response.ok) {
        await fetchProducts();
        setEditingProduct(null);
        setEditData({});
      } else {
        console.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleCancel = () => {
    setEditingProduct(null);
    setEditData({});
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const isFieldEmpty = (value: string | null | undefined) => {
    return !value || value.trim() === '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Memuat data produk...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        Manajemen Produk DRW Skincare
      </h1>
      
      <div className="grid gap-6">
        {products.map((product) => (
          <div key={product.id_produk} className="bg-white rounded-lg shadow-lg p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{product.nama_produk}</h2>
                <p className="text-sm text-gray-600">ID: {product.id_produk}</p>
                {product.bpom && (
                  <p className="text-sm text-gray-600">BPOM: {product.bpom}</p>
                )}
              </div>
              
              {editingProduct === product.id_produk ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEdit(product)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                >
                  Edit
                </button>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi Singkat {isFieldEmpty(product.deskripsi_singkat) && <span className="text-red-500">*</span>}
                </label>
                {editingProduct === product.id_produk ? (
                  <textarea
                    value={editData.deskripsi_singkat || ''}
                    onChange={(e) => setEditData({...editData, deskripsi_singkat: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                ) : (
                  <p className={`p-2 border rounded ${isFieldEmpty(product.deskripsi_singkat) ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                    {product.deskripsi_singkat || 'Belum diisi'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug {isFieldEmpty(product.slug) && <span className="text-red-500">*</span>}
                </label>
                {editingProduct === product.id_produk ? (
                  <input
                    type="text"
                    value={editData.slug || ''}
                    onChange={(e) => setEditData({...editData, slug: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className={`p-2 border rounded ${isFieldEmpty(product.slug) ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                    {product.slug || 'Belum diisi'}
                  </p>
                )}
              </div>
            </div>

            {/* Product Details */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Detail Produk</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kegunaan {isFieldEmpty(product.produk_detail?.kegunaan) && <span className="text-red-500">*</span>}
                  </label>
                  {editingProduct === product.id_produk ? (
                    <textarea
                      value={editData.kegunaan || ''}
                      onChange={(e) => setEditData({...editData, kegunaan: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  ) : (
                    <p className={`p-2 border rounded ${isFieldEmpty(product.produk_detail?.kegunaan) ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                      {product.produk_detail?.kegunaan || 'Belum diisi'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Komposisi {isFieldEmpty(product.produk_detail?.komposisi) && <span className="text-red-500">*</span>}
                  </label>
                  {editingProduct === product.id_produk ? (
                    <textarea
                      value={editData.komposisi || ''}
                      onChange={(e) => setEditData({...editData, komposisi: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  ) : (
                    <p className={`p-2 border rounded ${isFieldEmpty(product.produk_detail?.komposisi) ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                      {product.produk_detail?.komposisi || 'Belum diisi'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cara Pakai {isFieldEmpty(product.produk_detail?.cara_pakai) && <span className="text-red-500">*</span>}
                  </label>
                  {editingProduct === product.id_produk ? (
                    <textarea
                      value={editData.cara_pakai || ''}
                      onChange={(e) => setEditData({...editData, cara_pakai: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  ) : (
                    <p className={`p-2 border rounded ${isFieldEmpty(product.produk_detail?.cara_pakai) ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                      {product.produk_detail?.cara_pakai || 'Belum diisi'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Netto {isFieldEmpty(product.produk_detail?.netto) && <span className="text-red-500">*</span>}
                  </label>
                  {editingProduct === product.id_produk ? (
                    <input
                      type="text"
                      value={editData.netto || ''}
                      onChange={(e) => setEditData({...editData, netto: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className={`p-2 border rounded ${isFieldEmpty(product.produk_detail?.netto) ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                      {product.produk_detail?.netto || 'Belum diisi'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. BPOM {isFieldEmpty(product.produk_detail?.no_bpom) && <span className="text-red-500">*</span>}
                  </label>
                  {editingProduct === product.id_produk ? (
                    <input
                      type="text"
                      value={editData.no_bpom || ''}
                      onChange={(e) => setEditData({...editData, no_bpom: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className={`p-2 border rounded ${isFieldEmpty(product.produk_detail?.no_bpom) ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                      {product.produk_detail?.no_bpom || 'Belum diisi'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Price Information */}
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Informasi Harga</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">Director</p>
                  <p>{formatPrice(product.harga_director)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">Manager</p>
                  <p>{formatPrice(product.harga_manager)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">Supervisor</p>
                  <p>{formatPrice(product.harga_supervisor)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">Consultant</p>
                  <p>{formatPrice(product.harga_consultant)}</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="font-medium">Umum</p>
                  <p>{formatPrice(product.harga_umum)}</p>
                </div>
              </div>
            </div>

            {/* Active Ingredients */}
            {product.produk_bahan_aktif && product.produk_bahan_aktif.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Bahan Aktif</h3>
                <div className="flex flex-wrap gap-2">
                  {product.produk_bahan_aktif.map((item, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      {item.bahan_aktif.nama_bahan}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
