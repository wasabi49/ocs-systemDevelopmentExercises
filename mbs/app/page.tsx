'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/app/contexts/StoreContext';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();
  const { selectedStore } = useStore();

  // useEffectを使ってリダイレクト処理を実行
  useEffect(() => {
    if (selectedStore) {
      router.push('/Home');
    } else {
      router.push('/stores');
    }
  }, [selectedStore, router]);

  // リダイレクト中の表示
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </div>
  );
}
