'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id_produk: string;
  nama_produk: string;
  foto_produk: FotoProduct[];
}

interface FotoProduct {
  id_foto: string;
  url_foto: string;
  alt_text?: string | null;
  urutan: number;
}

interface UploadSlot {
  urutan: number;
  file?: File;
  preview?: string;
  uploaded?: FotoProduct;
  uploading?: boolean;
}

export default function UploadPhotos({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState<string>('');
  const [uploadSlots, setUploadSlots] = useState<UploadSlot[]>([
    { urutan: 1 },
    { urutan: 2 },
    { urutan: 3 },
    { urutan: 4 },
  ]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    params.then(({ id }) => {
      setProductId(id);
      fetchProduct(id);
    });
  }, [params]);

  const fetchProduct = async (id: string) => {
    try {
      const response = await fetch(`/api/products/${id}/photos`);
      if (!response.ok) throw new Error('Failed to fetch product');
      
      const data = await response.json();
      setProduct(data);
      
      // Initialize upload slots with existing photos
      const newSlots = [1, 2, 3, 4].map(urutan => {
        const existingPhoto = data.foto_produk.find((foto: FotoProduct) => foto.urutan === urutan);
        return {
          urutan,
          uploaded: existingPhoto,
        };
      });
      setUploadSlots(newSlots);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar yang diperbolehkan');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    const preview = URL.createObjectURL(file);
    
    setUploadSlots(prev => prev.map((slot, i) => 
      i === index 
        ? { ...slot, file, preview, uploaded: undefined }
        : slot
    ));
  };

  const handleUpload = async (index: number) => {
    const slot = uploadSlots[index];
    if (!slot.file) return;

    setUploadSlots(prev => prev.map((s, i) => 
      i === index ? { ...s, uploading: true } : s
    ));

    try {
      const formData = new FormData();
      formData.append('file', slot.file);
      formData.append('productId', productId);
      formData.append('urutan', slot.urutan.toString());
      formData.append('altText', `${product?.nama_produk} - Foto ${slot.urutan}`);

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const uploadedPhoto = await response.json();
      
      setUploadSlots(prev => prev.map((s, i) => 
        i === index 
          ? { 
              ...s, 
              uploaded: uploadedPhoto, 
              file: undefined, 
              preview: undefined, 
              uploading: false 
            }
          : s
      ));

      // Cleanup preview URL
      if (slot.preview) {
        URL.revokeObjectURL(slot.preview);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Gagal mengupload foto');
      
      setUploadSlots(prev => prev.map((s, i) => 
        i === index ? { ...s, uploading: false } : s
      ));
    }
  };

  const handleDelete = async (index: number) => {
    const slot = uploadSlots[index];
    if (!slot.uploaded) return;

    if (!confirm('Yakin ingin hapus foto ini?')) return;

    try {
      const response = await fetch(`/api/delete-photo/${slot.uploaded.id_foto}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');
      
      setUploadSlots(prev => prev.map((s, i) => 
        i === index ? { urutan: s.urutan } : s
      ));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Gagal menghapus foto');
    }
  };

  const handleUploadAll = async () => {
    const slotsWithFiles = uploadSlots
      .map((slot, index) => ({ slot, index }))
      .filter(({ slot }) => slot.file && !slot.uploaded);

    for (const { index } of slotsWithFiles) {
      await handleUpload(index);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">Produk tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Foto Produk
          </h1>
          <p className="text-gray-600 text-lg">
            {product.nama_produk}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Upload 4 foto produk dengan kualitas terbaik. Ukuran maksimal 5MB per foto.
          </p>
        </div>

        {/* Upload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {uploadSlots.map((slot, index) => (
            <div key={slot.urutan} className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-gray-700">Foto {slot.urutan}</h3>
              </div>
              
              {/* Image Display Area */}
              <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                {slot.uploaded && (
                  <img
                    src={slot.uploaded.url_foto}
                    alt={slot.uploaded.alt_text || `Foto ${slot.urutan}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {slot.preview && !slot.uploaded && (
                  <img
                    src={slot.preview}
                    alt={`Preview ${slot.urutan}`}
                    className="w-full h-full object-cover"
                  />
                )}
                {!slot.uploaded && !slot.preview && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-sm text-gray-500">Pilih foto</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {!slot.uploaded && !slot.file && (
                  <button
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Pilih Foto
                  </button>
                )}
                
                {slot.file && !slot.uploaded && (
                  <div className="space-y-2">
                    <button
                      onClick={() => handleUpload(index)}
                      disabled={slot.uploading}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {slot.uploading ? 'Mengupload...' : 'Upload'}
                    </button>
                    <button
                      onClick={() => {
                        if (slot.preview) URL.revokeObjectURL(slot.preview);
                        setUploadSlots(prev => prev.map((s, i) => 
                          i === index ? { urutan: s.urutan } : s
                        ));
                      }}
                      className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Batal
                    </button>
                  </div>
                )}
                
                {slot.uploaded && (
                  <div className="space-y-2">
                    <button
                      onClick={() => fileInputRefs.current[index]?.click()}
                      className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Ganti Foto
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={el => { fileInputRefs.current[index] = el; }}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(index, file);
                  e.target.value = '';
                }}
              />
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleUploadAll}
            disabled={!uploadSlots.some(slot => slot.file && !slot.uploaded)}
            className="bg-green-600 text-white px-8 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Upload Semua Foto
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="bg-gray-600 text-white px-8 py-3 rounded-md hover:bg-gray-700 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}