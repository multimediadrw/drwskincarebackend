import ProductManagerAG from '@/components/ProductManagerAG';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kelola Produk DRW - Dashboard',
  description: 'Dashboard pengelolaan produk dan paket DRW Skincare',
};

export default function Home() {
  return (
    <div className="fixed inset-0 pt-16"> {/* pt-16 for nav height */}
      <ProductManagerAG />
    </div>
  );
}
