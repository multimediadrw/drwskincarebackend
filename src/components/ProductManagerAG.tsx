'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

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

interface PaketIsi {
  paket_id: string;
  produk_id: string;
  jumlah: number;
  produk: {
    id_produk: string;
    nama_produk: string;
  };
}

interface Kategori {
  id: number;
  nama_kategori: string;
  deskripsi?: string;
}

interface ProdukKategori {
  produk_id: string;
  kategori_id: number;
  kategori: Kategori;
}

interface PaketKategori {
  paket_id: string;
  kategori_id: number;
  kategori: Kategori;
}

interface Product {
  id_produk: string;
  nama_produk: string;
  type?: 'produk' | 'paket';
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
  paket_isi?: PaketIsi[];
  produk_kategori?: ProdukKategori[];
  paket_kategori?: PaketKategori[];
  // Transformed fields for AG Grid
  kegunaan?: string;
  komposisi?: string;
  cara_pakai?: string;
  netto?: string;
  no_bpom_detail?: string;
  bahan_aktif?: ProdukBahanAktif[];
  foto_count?: number;
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

const FotoCountRenderer = (params: any) => {
  const count = params.value || 0;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      {count} foto
    </span>
  );
};

const FotoUploadRenderer = (params: any) => {
  const productId = params.data.id_produk;
  const itemType = params.data.type;
  const urutan = params.colDef.field === 'foto1' ? 1 : params.colDef.field === 'foto2' ? 2 : 3;
  const existingPhoto = params.data.foto_produk?.find((foto: any) => foto.urutan === urutan);

  // Only allow photo upload for products, not packages
  if (itemType === 'paket') {
    return (
      <div className="w-12 h-12 mx-auto flex items-center justify-center text-gray-400 text-xs">
        N/A
      </div>
    );
  }
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    // Upload foto
    const formData = new FormData();
    formData.append('file', file);
    formData.append('productId', productId);
    formData.append('urutan', urutan.toString());
    formData.append('altText', `Foto ${urutan}`);

    try {
      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Refresh data
        window.location.reload();
      } else {
        alert('Gagal mengupload foto');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Gagal mengupload foto');
    }

    // Reset input
    event.target.value = '';
  };

  const handleDeletePhoto = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!existingPhoto) return;
    
    if (!confirm(`Yakin ingin menghapus foto ${urutan}?`)) return;

    try {
      const response = await fetch(`/api/delete-photo/${existingPhoto.id_foto}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh data
        window.location.reload();
      } else {
        alert('Gagal menghapus foto');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Gagal menghapus foto');
    }
  };

  return (
    <div className="relative w-12 h-12 mx-auto group">
      {existingPhoto ? (
        <>
          <img
            src={existingPhoto.url_foto}
            alt={`Foto ${urutan}`}
            className="w-12 h-12 object-cover rounded border"
          />
          {/* Delete button - tampil saat hover */}
          <button
            onClick={handleDeletePhoto}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
            title="Hapus foto"
          >
            ×
          </button>
        </>
      ) : (
        <>
          <div className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-400 cursor-pointer bg-gray-50 hover:bg-blue-50">
            <span className="text-gray-400 text-xl font-bold">+</span>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title={`Upload Foto ${urutan}`}
          />
        </>
      )}
    </div>
  );
};

const DateRenderer = (params: any) => {
  if (!params.value) return '-';
  return new Date(params.value).toLocaleDateString('id-ID');
};



export default function ProductManagerAG() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        // Transform data for AG Grid
        const transformedData = data.map((item: any) => ({
          ...item,
          kegunaan: item.produk_detail?.kegunaan || '',
          komposisi: item.produk_detail?.komposisi || '',
          cara_pakai: item.produk_detail?.cara_pakai || '',
          netto: item.produk_detail?.netto || '',
          no_bpom_detail: item.produk_detail?.no_bpom || '',
          bahan_aktif: item.produk_bahan_aktif || [],
          paket_isi: item.paket_isi || [],
          produk_kategori: item.produk_kategori || [],
          paket_kategori: item.paket_kategori || [],
          foto_count: item.foto_produk?.length || 0,
        }));
        setProducts(transformedData);
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

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCellValueChanged = useCallback(async (event: CellValueChangedEvent) => {
    const { data, colDef, newValue } = event;
    const field = colDef.field;
    
    if (!field) return;

    try {
      const updateData: any = {
        id_produk: data.id_produk
      };

      // Map AG Grid fields back to API fields
      if (['kegunaan', 'komposisi', 'cara_pakai', 'netto'].includes(field)) {
        updateData[field] = newValue;
      } else if (field === 'no_bpom_detail') {
        updateData.no_bpom = newValue;
      } else {
        updateData[field] = newValue;
      }

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        console.error('Failed to update product');
        // Revert the change
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error updating product:', error);
      // Revert the change
      await fetchProducts();
    }
  }, []);

  const handleAddKategori = async (itemId: string, itemType: 'produk' | 'paket') => {
    try {
      // First, get available categories
      const kategorisResponse = await fetch('/api/kategoris');
      if (!kategorisResponse.ok) {
        alert('Gagal mengambil data kategori');
        return;
      }
      
      const kategoris = await kategorisResponse.json();
      
      // Show selection dialog (simple prompt for now, can be improved with modal)
      const kategoriNames = kategoris.map((k: any) => `${k.id}: ${k.nama_kategori}`).join('\n');
      const selectedId = prompt(`Pilih kategori (masukkan ID):\n${kategoriNames}`);
      
      if (!selectedId) return;
      
      // Add category
      const endpoint = itemType === 'produk' 
        ? '/api/produk-kategori' 
        : '/api/paket-kategori';
        
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [itemType === 'produk' ? 'produk_id' : 'paket_id']: itemId,
          kategori_id: parseInt(selectedId)
        }),
      });

      if (response.ok) {
        // Refresh data
        await fetchProducts();
      } else {
        alert('Gagal menambah kategori');
      }
    } catch (error) {
      console.error('Error adding kategori:', error);
      alert('Gagal menambah kategori');
    }
  };

  const handleRemoveKategori = async (itemId: string, kategoriId: number, itemType: 'produk' | 'paket') => {
    if (!confirm('Yakin ingin hapus kategori ini?')) return;

    try {
      const endpoint = itemType === 'produk' 
        ? '/api/produk-kategori' 
        : '/api/paket-kategori';
        
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [itemType === 'produk' ? 'produk_id' : 'paket_id']: itemId,
          kategori_id: kategoriId
        }),
      });

      if (response.ok) {
        // Refresh data
        await fetchProducts();
      } else {
        alert('Gagal menghapus kategori');
      }
    } catch (error) {
      console.error('Error removing kategori:', error);
      alert('Gagal menghapus kategori');
    }
  };

  const columnDefs: ColDef[] = useMemo(() => [
    {
      field: 'type',
      headerName: 'Tipe',
      width: 80,
      pinned: 'left',
      editable: false,
      cellRenderer: (params: any) => {
        const type = params.value;
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            type === 'produk' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {type === 'produk' ? 'Produk' : 'Paket'}
          </span>
        );
      }
    },
    {
      field: 'nama_produk',
      headerName: 'Nama Produk/Paket',
      editable: true,
      width: 200,
      pinned: 'left',
      cellStyle: { fontWeight: 'bold' }
    },
    {
      field: 'bpom',
      headerName: 'BPOM',
      editable: true,
      width: 120
    },
    {
      field: 'slug',
      headerName: 'Slug',
      editable: true,
      width: 150
    },
    {
      field: 'deskripsi_singkat',
      headerName: 'Deskripsi',
      editable: true,
      width: 250,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true
    },
    {
      field: 'kegunaan',
      headerName: 'Kegunaan',
      editable: true,
      width: 200,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true
    },
    {
      field: 'komposisi',
      headerName: 'Komposisi',
      editable: true,
      width: 200,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true
    },
    {
      field: 'cara_pakai',
      headerName: 'Cara Pakai',
      editable: true,
      width: 200,
      cellEditor: 'agLargeTextCellEditor',
      cellEditorPopup: true
    },
    {
      field: 'netto',
      headerName: 'Netto',
      editable: true,
      width: 100
    },
    {
      field: 'no_bpom_detail',
      headerName: 'No. BPOM Detail',
      editable: true,
      width: 150
    },
    {
      field: 'bahan_aktif',
      headerName: 'Bahan Aktif',
      width: 200,
      cellRenderer: BahanAktifRenderer,
      editable: false
    },
    {
      field: 'paket_isi',
      headerName: 'Isi Paket',
      width: 250,
      cellRenderer: (params: any) => {
        const paketIsi = params.value;
        if (!paketIsi || paketIsi.length === 0) return '-';
        
        return (
          <div className="flex flex-wrap gap-1 py-1">
            {paketIsi.map((isi: any, idx: number) => (
              <span
                key={idx}
                className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
              >
                {isi.jumlah}x {isi.produk.nama_produk}
              </span>
            ))}
          </div>
        );
      },
      editable: false
    },
    {
      field: 'kategori',
      headerName: 'Kategori',
      width: 250,
      cellRenderer: (params: any) => {
        const item = params.data;
        const kategoriData = item.type === 'produk' 
          ? item.produk_kategori 
          : item.paket_kategori;
        
        return (
          <div className="flex flex-wrap gap-1 py-1 items-center">
            {kategoriData && kategoriData.length > 0 && kategoriData.map((kat: any, idx: number) => (
              <span
                key={idx}
                className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full relative group"
              >
                {kat.kategori.nama_kategori}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveKategori(item.id_produk, kat.kategori.id, item.type);
                  }}
                  className="ml-1 text-orange-600 hover:text-orange-800 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Hapus kategori"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddKategori(item.id_produk, item.type);
              }}
              className="inline-flex items-center justify-center w-6 h-6 bg-orange-200 text-orange-600 rounded-full hover:bg-orange-300 transition-colors text-xs font-bold"
              title="Tambah kategori"
            >
              +
            </button>
          </div>
        );
      },
      editable: false
    },
    {
      field: 'foto1',
      headerName: 'F1',
      width: 80,
      cellRenderer: FotoUploadRenderer,
      editable: false,
      sortable: false,
      filter: false
    },
    {
      field: 'foto2',
      headerName: 'F2',
      width: 80,
      cellRenderer: FotoUploadRenderer,
      editable: false,
      sortable: false,
      filter: false
    },
    {
      field: 'foto3',
      headerName: 'F3',
      width: 80,
      cellRenderer: FotoUploadRenderer,
      editable: false,
      sortable: false,
      filter: false
    },
    {
      field: 'created_at',
      headerName: 'Dibuat',
      width: 120,
      cellRenderer: DateRenderer,
      editable: false
    },
    {
      field: 'updated_at',
      headerName: 'Diperbarui',
      width: 120,
      cellRenderer: DateRenderer,
      editable: false
    }
  ], []);

  const defaultColDef: ColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
    minWidth: 80
  }), []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Memuat data produk...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">
          Kelola Produk DRW
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Manajemen produk individual dan paket produk DRW Skincare
        </p>
      </div>
      
      <div className="flex-1 bg-white p-4">
        <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 200px)', width: '100%' }}>
          <AgGridReact
            theme="legacy"
            rowData={products}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onCellValueChanged={handleCellValueChanged}
            suppressMovableColumns={false}
            animateRows={true}
            rowSelection="multiple"
            pagination={true}
            paginationPageSize={25}
            paginationPageSizeSelector={[10, 25, 50, 100]}
            suppressRowClickSelection={true}
            enableCellTextSelection={true}
            ensureDomOrder={true}
            maintainColumnOrder={true}
            tooltipShowDelay={1000}
            paginationAutoPageSize={false}
            suppressPaginationPanel={false}
            loadingOverlayComponent={() => <div>Memuat data...</div>}
            noRowsOverlayComponent={() => <div>Tidak ada data produk</div>}
          />
        </div>
      </div>
    </div>
  );
}