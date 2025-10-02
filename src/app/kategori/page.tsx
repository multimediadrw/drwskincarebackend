import KategoriManager from '@/components/KategoriManager';

export default function KategoriPage() {
  return (
    <div className="fixed inset-0 pt-16"> {/* pt-16 for nav height */}
      <KategoriManager />
    </div>
  );
}

export const metadata = {
  title: 'Kelola Kategori - DRW Skincare',
  description: 'Kelola kategori produk dan paket DRW Skincare',
};