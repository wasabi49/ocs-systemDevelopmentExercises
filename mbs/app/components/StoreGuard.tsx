'use client';

import { usePathname } from 'next/navigation';
import { useStore } from '@/app/contexts/StoreContext';
import { useStoreRedirect } from '@/app/hooks/useStoreRedirect';


const StoreGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedStore } = useStore();
  const pathname = usePathname();

  useStoreRedirect();

  const isStoreSelectionPage = pathname === '/stores' || pathname === '/';

  if (isStoreSelectionPage) {
    return <>{children}</>;
  }
  if (!selectedStore) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">店舗選択画面にリダイレクト中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default StoreGuard;
