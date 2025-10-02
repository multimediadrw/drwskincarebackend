'use client';

import { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, CellEditingStoppedEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface Kategori {
  id: number;
  nama_kategori: string;
  deskripsi?: string;
  created_at?: string;
  updated_at?: string;
}

// Action Cell Renderer untuk tombol hapus
const ActionCellRenderer = (props: any) => {
  const handleDelete = async () => {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${props.data.nama_kategori}"?`)) {
      try {
        const response = await fetch(`/api/kategoris/${props.data.id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          props.context.refreshData();
        } else {
          const error = await response.json();
          alert(`Error: ${error.error}`);
        }
      } catch (error) {
        console.error('Error deleting kategori:', error);
        alert('Gagal menghapus kategori');
      }
    }
  };

  return (
    <div className="flex gap-2 h-full items-center">
      <button
        onClick={handleDelete}
        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
      >
        Hapus
      </button>
    </div>
  );
};

export default function KategoriManager() {
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKategori, setNewKategori] = useState({ nama: '', deskripsi: '' });

  const columnDefs: ColDef[] = [
    {
      headerName: 'ID',
      field: 'id',
      width: 80,
      editable: false,
    },
    {
      headerName: 'Nama Kategori',
      field: 'nama_kategori',
      width: 200,
      editable: true,
    },
    {
      headerName: 'Deskripsi',
      field: 'deskripsi',
      width: 300,
      editable: true,
    },
    {
      headerName: 'Dibuat',
      field: 'created_at',
      width: 150,
      editable: false,
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString('id-ID');
        }
        return '';
      },
    },
    {
      headerName: 'Diupdate',
      field: 'updated_at',
      width: 150,
      editable: false,
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleDateString('id-ID');
        }
        return '';
      },
    },
    {
      headerName: 'Aksi',
      field: 'actions',
      width: 100,
      editable: false,
      cellRenderer: ActionCellRenderer,
    },
  ];

  const fetchKategoris = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/kategoris');
      if (response.ok) {
        const data = await response.json();
        setKategoris(data);
      } else {
        console.error('Failed to fetch kategoris');
      }
    } catch (error) {
      console.error('Error fetching kategoris:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKategori = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKategori.nama.trim()) {
      alert('Nama kategori harus diisi');
      return;
    }

    try {
      const response = await fetch('/api/kategoris', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama: newKategori.nama,
          deskripsi: newKategori.deskripsi
        }),
      });

      if (response.ok) {
        setNewKategori({ nama: '', deskripsi: '' });
        fetchKategoris();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error adding kategori:', error);
      alert('Gagal menambah kategori');
    }
  };

  const handleCellEditingStopped = async (event: CellEditingStoppedEvent) => {
    const { data, colDef, newValue, oldValue } = event;
    
    if (newValue === oldValue) return;

    try {
      const response = await fetch(`/api/kategoris/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [colDef.field!]: newValue,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        fetchKategoris(); // Refresh to revert changes
      }
    } catch (error) {
      console.error('Error updating kategori:', error);
      alert('Gagal mengupdate kategori');
      fetchKategoris(); // Refresh to revert changes
    }
  };

  useEffect(() => {
    fetchKategoris();
  }, []);

  const gridContext = {
    refreshData: fetchKategoris,
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Kelola Kategori</h1>
        <p className="text-gray-600 text-sm mt-1">
          Manajemen kategori produk dan paket DRW Skincare
        </p>
      </div>
      
      <div className="bg-white px-6 py-4 flex-shrink-0">
        {/* Form Tambah Kategori */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-3">Tambah Kategori Baru</h2>
          <form onSubmit={handleAddKategori} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Kategori *
              </label>
              <input
                type="text"
                value={newKategori.nama}
                onChange={(e) => setNewKategori({ ...newKategori, nama: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama kategori"
                required
              />
            </div>
            <div className="flex-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deskripsi
              </label>
              <input
                type="text"
                value={newKategori.deskripsi}
                onChange={(e) => setNewKategori({ ...newKategori, deskripsi: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deskripsi kategori (opsional)"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Tambah
            </button>
          </form>
        </div>
      </div>
      
      {/* Grid Kategori */}
      <div className="flex-1 bg-white flex flex-col">
        <div className="px-6 py-3 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Daftar Kategori</h2>
          <p className="text-sm text-gray-600 mt-1">
            Klik pada sel untuk mengedit. Total: {kategoris.length} kategori
          </p>
        </div>
        
        <div className="flex-1 p-4">
          <div className="ag-theme-alpine" style={{ height: 'calc(100vh - 280px)', width: '100%' }}>
            <AgGridReact
              rowData={kategoris}
              columnDefs={columnDefs}
              loading={loading}
              context={gridContext}
              onCellEditingStopped={handleCellEditingStopped}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
              }}
              onGridReady={(params: GridReadyEvent) => {
                params.api.sizeColumnsToFit();
              }}
              animateRows={true}
              pagination={true}
              paginationPageSize={25}
              paginationPageSizeSelector={[10, 25, 50, 100]}
              suppressRowClickSelection={true}
              enableCellTextSelection={true}
              paginationAutoPageSize={false}
              suppressPaginationPanel={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}