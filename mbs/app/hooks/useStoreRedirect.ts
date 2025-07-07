'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/app/contexts/StoreContext';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * 店舗が選択されていない場合に店舗選択ページにリダイレクトするカスタムフック
 */
export const useStoreRedirect = () => {
  const { selectedStore } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  const isStoreSelectionPage = pathname === '/stores' || pathname === '/';

  useEffect(() => {
    if (!selectedStore && !isStoreSelectionPage) {
      logger.info('店舗が選択されていません。店舗選択ページにリダイレクトします。');
      router.push('/stores');
    }
  }, [selectedStore, isStoreSelectionPage, router]);

  return {
    selectedStore,
    isStoreSelected: !!selectedStore,
  };
};
