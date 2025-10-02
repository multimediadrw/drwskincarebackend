'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent, GridReadyEvent } from 'ag-grid-community';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

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

interface FotoProduk {
  id_foto: string;
  url_foto: string;
  alt_text?: string | null;
  urutan: number;
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
  foto_produk: FotoProduk[];
}

// Custom cell renderers
const BahanAktifRenderer = (params: any) => {
  const bahanAktif = params.value || [];
  if (bahanAktif.length === 0) return '-';
  
  return (
    <div className="flex flex-wrap gap-1 py-1">
      {bahanAktif.map((item: ProdukBahanAktif, idx: number) => (
        <span
          key={idx}
          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
        >
          {item.bahan_aktif.nama_bahan}
        </span>
      ))}
    </div>
  );
};

const FotoRenderer = (params: any) => {
  const fotoUrl = params.value;
  if (!fotoUrl) return '-';
  
  return (
    <img 
      src={fotoUrl} 
      alt="Product"
      className="h-12 w-12 object-cover rounded"
      style={{ margin: '4px auto' }}
    />
  );
};

const FotoCountRenderer = (params: any) => {
  const count = params.value || 0;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      {count} foto
    </span>
  );
};

const PriceRenderer = (params: any) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(params.value || 0);
};

const DateRenderer = (params: any) => {
  if (!params.value) return '-';
  return new Date(params.value).toLocaleDateString('id-ID');
};

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const handleCellClick = (productId: string, field: string, value: string, title: string) => {
    setEditModal({
      isOpen: true,
      productId,
      field,
      value: value || '',
      title
    });
  };

  const handleModalSave = async () => {
    try {
      const updateData: any = {
        id_produk: editModal.productId
      };

      // Determine if it's a detail field or main product field
      if (['kegunaan', 'komposisi', 'cara_pakai', 'netto', 'no_bpom'].includes(editModal.field)) {
        updateData[editModal.field] = editModal.value;
      } else {
        updateData[editModal.field] = editModal.value;
      }

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        await fetchProducts();
        setEditModal({ isOpen: false, productId: '', field: '', value: '', title: '' });
      } else {
        console.error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleModalClose = () => {
    setEditModal({ isOpen: false, productId: '', field: '', value: '', title: '' });
  };

  const handleResize = (columnKey: string, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.max(80, newWidth) // Minimum width of 80px
    }));
  };

  const startResize = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnKey);
    
    const startX = e.clientX;
    const startWidth = columnWidths[columnKey];

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      handleResize(columnKey, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingColumn(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const truncateText = (text: string | null | undefined, maxLength: number = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
        Tabel Produk DRW Skincare
      </h1>
      
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari produk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Menampilkan {filteredProducts.length} dari {products.length} produk
        </p>
      </div>
      
      {/* Scrollable Table Container */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
          <table ref={tableRef} className="bg-white" style={{ tableLayout: 'fixed', minWidth: '100%' }}>
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('nama_produk')}
                  style={{ width: columnWidths.nama_produk }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Nama Produk
                      {getSortIcon('nama_produk')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'nama_produk')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('bpom')}
                  style={{ width: columnWidths.bpom }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      BPOM
                      {getSortIcon('bpom')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'bpom')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('slug')}
                  style={{ width: columnWidths.slug }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Slug
                      {getSortIcon('slug')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'slug')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('deskripsi_singkat')}
                  style={{ width: columnWidths.deskripsi_singkat }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Deskripsi
                      {getSortIcon('deskripsi_singkat')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'deskripsi_singkat')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative border-r border-gray-200"
                  style={{ width: columnWidths.foto_utama }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Foto Utama
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'foto_utama')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('harga_director')}
                  style={{ width: columnWidths.harga_director }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Harga Director
                      {getSortIcon('harga_director')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'harga_director')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('harga_manager')}
                  style={{ width: columnWidths.harga_manager }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Harga Manager
                      {getSortIcon('harga_manager')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'harga_manager')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('harga_supervisor')}
                  style={{ width: columnWidths.harga_supervisor }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Harga Supervisor
                      {getSortIcon('harga_supervisor')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'harga_supervisor')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('harga_consultant')}
                  style={{ width: columnWidths.harga_consultant }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Harga Consultant
                      {getSortIcon('harga_consultant')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'harga_consultant')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('harga_umum')}
                  style={{ width: columnWidths.harga_umum }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Harga Umum
                      {getSortIcon('harga_umum')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'harga_umum')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('kegunaan')}
                  style={{ width: columnWidths.kegunaan }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Kegunaan
                      {getSortIcon('kegunaan')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'kegunaan')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('komposisi')}
                  style={{ width: columnWidths.komposisi }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Komposisi
                      {getSortIcon('komposisi')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'komposisi')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('cara_pakai')}
                  style={{ width: columnWidths.cara_pakai }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Cara Pakai
                      {getSortIcon('cara_pakai')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'cara_pakai')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('netto')}
                  style={{ width: columnWidths.netto }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Netto
                      {getSortIcon('netto')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'netto')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('no_bpom')}
                  style={{ width: columnWidths.no_bpom }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      No. BPOM Detail
                      {getSortIcon('no_bpom')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'no_bpom')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative border-r border-gray-200"
                  style={{ width: columnWidths.bahan_aktif }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Bahan Aktif
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'bahan_aktif')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative border-r border-gray-200"
                  style={{ width: columnWidths.foto_count }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Jumlah Foto
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'foto_count')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('created_at')}
                  style={{ width: columnWidths.created_at }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Dibuat
                      {getSortIcon('created_at')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'created_at')}
                    />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none relative border-r border-gray-200"
                  onClick={() => handleSort('updated_at')}
                  style={{ width: columnWidths.updated_at }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      Diperbarui
                      {getSortIcon('updated_at')}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100"
                      onMouseDown={(e) => startResize(e, 'updated_at')}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product, index) => (
                <tr key={product.id_produk} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border-r border-gray-200"
                    style={{ width: columnWidths.nama_produk }}
                    onClick={() => handleCellClick(product.id_produk, 'nama_produk', product.nama_produk, 'Nama Produk')}
                  >
                    <div className="font-medium truncate" title={product.nama_produk}>
                      {product.nama_produk}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border-r border-gray-200"
                    style={{ width: columnWidths.bpom }}
                    onClick={() => handleCellClick(product.id_produk, 'bpom', product.bpom || '', 'BPOM')}
                  >
                    <div className="truncate" title={product.bpom || '-'}>
                      {product.bpom || '-'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border-r border-gray-200"
                    style={{ width: columnWidths.slug }}
                    onClick={() => handleCellClick(product.id_produk, 'slug', product.slug || '', 'Slug')}
                  >
                    <div className="truncate" title={product.slug || '-'}>
                      {product.slug || '-'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border-r border-gray-200"
                    style={{ width: columnWidths.deskripsi_singkat }}
                    onClick={() => handleCellClick(product.id_produk, 'deskripsi_singkat', product.deskripsi_singkat || '', 'Deskripsi Singkat')}
                  >
                    <div className="truncate" title={product.deskripsi_singkat || '-'}>
                      {product.deskripsi_singkat || '-'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.foto_utama }}
                  >
                    {product.foto_utama ? (
                      <img 
                        src={product.foto_utama} 
                        alt={product.nama_produk}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : '-'}
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.harga_director }}
                  >
                    <div className="truncate" title={formatPrice(product.harga_director)}>
                      {formatPrice(product.harga_director)}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.harga_manager }}
                  >
                    <div className="truncate" title={formatPrice(product.harga_manager)}>
                      {formatPrice(product.harga_manager)}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.harga_supervisor }}
                  >
                    <div className="truncate" title={formatPrice(product.harga_supervisor)}>
                      {formatPrice(product.harga_supervisor)}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.harga_consultant }}
                  >
                    <div className="truncate" title={formatPrice(product.harga_consultant)}>
                      {formatPrice(product.harga_consultant)}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.harga_umum }}
                  >
                    <div className="truncate" title={formatPrice(product.harga_umum)}>
                      {formatPrice(product.harga_umum)}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border-r border-gray-200"
                    style={{ width: columnWidths.kegunaan }}
                    onClick={() => handleCellClick(product.id_produk, 'kegunaan', product.produk_detail?.kegunaan || '', 'Kegunaan')}
                  >
                    <div className="truncate" title={product.produk_detail?.kegunaan || '-'}>
                      {product.produk_detail?.kegunaan || '-'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border-r border-gray-200"
                    style={{ width: columnWidths.komposisi }}
                    onClick={() => handleCellClick(product.id_produk, 'komposisi', product.produk_detail?.komposisi || '', 'Komposisi')}
                  >
                    <div className="truncate" title={product.produk_detail?.komposisi || '-'}>
                      {product.produk_detail?.komposisi || '-'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border-r border-gray-200"
                    style={{ width: columnWidths.cara_pakai }}
                    onClick={() => handleCellClick(product.id_produk, 'cara_pakai', product.produk_detail?.cara_pakai || '', 'Cara Pakai')}
                  >
                    <div className="truncate" title={product.produk_detail?.cara_pakai || '-'}>
                      {product.produk_detail?.cara_pakai || '-'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border-r border-gray-200"
                    style={{ width: columnWidths.netto }}
                    onClick={() => handleCellClick(product.id_produk, 'netto', product.produk_detail?.netto || '', 'Netto')}
                  >
                    <div className="truncate" title={product.produk_detail?.netto || '-'}>
                      {product.produk_detail?.netto || '-'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 border-r border-gray-200"
                    style={{ width: columnWidths.no_bpom }}
                    onClick={() => handleCellClick(product.id_produk, 'no_bpom', product.produk_detail?.no_bpom || '', 'No. BPOM Detail')}
                  >
                    <div className="truncate" title={product.produk_detail?.no_bpom || '-'}>
                      {product.produk_detail?.no_bpom || '-'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.bahan_aktif }}
                  >
                    <div className="truncate">
                      {product.produk_bahan_aktif.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.produk_bahan_aktif.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {item.bahan_aktif.nama_bahan}
                            </span>
                          ))}
                        </div>
                      ) : '-'}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.foto_count }}
                  >
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {product.foto_produk?.length || 0} foto
                    </span>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.created_at }}
                  >
                    <div className="truncate" title={formatDate(product.created_at)}>
                      {formatDate(product.created_at)}
                    </div>
                  </td>
                  <td 
                    className="px-6 py-4 text-sm text-gray-900 border-r border-gray-200"
                    style={{ width: columnWidths.updated_at }}
                  >
                    <div className="truncate" title={formatDate(product.updated_at)}>
                      {formatDate(product.updated_at)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {products.length === 0 ? 'Tidak ada produk yang ditemukan' : 'Tidak ada hasil pencarian'}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit {editModal.title}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {editModal.title}
              </label>
              {['kegunaan', 'komposisi', 'cara_pakai'].includes(editModal.field) ? (
                <textarea
                  value={editModal.value}
                  onChange={(e) => setEditModal(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  placeholder={`Masukkan ${editModal.title.toLowerCase()}...`}
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={editModal.value}
                  onChange={(e) => setEditModal(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Masukkan ${editModal.title.toLowerCase()}...`}
                  autoFocus
                />
              )}
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleModalSave}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
