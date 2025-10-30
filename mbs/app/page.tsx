'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/app/contexts/StoreContext';
import { useEffect } from 'react';
import { Loading } from '@/app/components/Loading';

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
      <Loading variant="spinner" size="md" text="読み込み中..." />
    </div>
  );
}
