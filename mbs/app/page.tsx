'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/app/contexts/StoreContext';

export default function HomePage() {
  const router = useRouter();
  const { selectedStore } = useStore();

  useEffect(() => {
    // 店舗が選択されている場合はホーム画面へ、そうでなければ店舗選択画面へ
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
