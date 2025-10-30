'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store as MapPin, Loader2, Building2, CheckCircle, ArrowRight } from 'lucide-react';
import { useStore, Store } from '@/app/contexts/StoreContext'; // Storeインターフェースをcontextからインポート
import { getAllStores } from '@/app/actions/storeActions';
import { Loading, LoadingWithIcon } from '@/app/components/Loading';
import { logger } from '@/lib/logger';

interface StoreSelectionProps {
  initialStores?: Store[];
  initialError?: string;
}

const StoreSelection: React.FC<StoreSelectionProps> = ({
  initialStores = [],
  initialError = '',
}) => {
  const router = useRouter();
  const { setSelectedStore, setStores, isLoading, setIsLoading } = useStore();
  const [storeList, setStoreList] = useState<Store[]>(initialStores);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [error, setError] = useState<string>(initialError);

  // 店舗データを取得
  useEffect(() => {
    // 初期データがある場合はそれを使用
    if (initialStores.length > 0) {
      setStoreList(initialStores);
      setStores(initialStores);
      setIsLoading(false);
      return;
    }

    // 初期データがない場合のみAPIから取得
    const fetchStores = async () => {
      try {
        setIsLoading(true);
        setError('');

        const stores = await getAllStores();
        setStoreList(stores);
        setStores(stores);
      } catch (err) {
        logger.error('店舗データの取得に失敗', { error: err instanceof Error ? err.message : String(err) });
        setError('店舗データの取得に失敗しました。再度お試しください。');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, [initialStores, setStores, setIsLoading]);

  // 店舗選択ハンドラー
  const handleStoreSelect = (store: Store) => {
    logger.info('店舗選択', { store }); 
    setSelectedStoreId(store.id);
    setSelectedStore(store); 

    logger.info('Cookie保存完了、画面遷移開始'); 

    // 少し遅延をかけてから画面遷移（選択アニメーションを見せるため）
    setTimeout(() => {
      router.push('/Home');
    }, 600);
  };

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          </div>
          <LoadingWithIcon icon={false} size="lg" text="店舗情報を読み込み中" />
          <p className="text-gray-600">しばらくお待ちください...</p>
          <div className="mt-4">
            <Loading variant="dots" size="md" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-white">
        <div className="mx-4 max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50">
            <svg
              className="h-8 w-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-3 text-xl font-semibold text-gray-800">エラーが発生しました</h2>
          <p className="mb-6 leading-relaxed text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-md transition-colors duration-200 hover:bg-blue-700 hover:shadow-lg"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-144 bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
                <Building2 className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900">MBS</h1>
            <p className="mb-2 text-lg font-medium text-gray-700">受注管理システム</p>
            <p className="text-gray-600">ご利用になる店舗を選択してください</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-4">
        {storeList.length === 0 ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="mb-2 text-lg font-semibold text-gray-800">店舗データがありません</h2>
            <p className="text-gray-600">システム管理者にお問い合わせください。</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {storeList.map((store, index) => (
              <div
                key={store.id}
                className={`group relative transform cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  selectedStoreId === store.id ? 'shadow-lg ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleStoreSelect(store)}
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 100}ms both`,
                }}
              >
                {/* Selection indicator */}
                {selectedStoreId === store.id && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-green-500 shadow-lg">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                )}

                <div className="p-6 text-center">
                  {/* Store icon */}
                  <div
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 ${
                      selectedStoreId === store.id
                        ? 'bg-green-500 shadow-lg'
                        : 'bg-blue-600 shadow-md group-hover:bg-blue-700'
                    }`}
                  >
                    <MapPin className="h-7 w-7 text-white" />
                  </div>

                  {/* Store name */}
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-700">
                    {store.name}
                  </h3>

                  {/* Description */}
                  <p className="mb-4 text-sm leading-relaxed text-gray-600">
                    こちらの店舗を選択して
                    <br />
                    受注管理システムを開始
                  </p>

                  {/* Action button */}
                  <div
                    className={`inline-flex items-center rounded-xl px-6 py-3 font-medium transition-all duration-200 ${
                      selectedStoreId === store.id
                        ? 'bg-green-500 text-white shadow-md'
                        : 'border border-gray-200 bg-gray-100 text-gray-700 group-hover:bg-blue-50 group-hover:text-blue-700'
                    }`}
                  >
                    {selectedStoreId === store.id ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        選択済み
                      </>
                    ) : (
                      <>
                        選択する
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="mb-1 text-sm text-gray-700">
            店舗を選択すると、その店舗専用の管理画面に移動します
          </p>
          <p className="text-xs text-gray-500">
            システムに関するご質問は、システム管理者までお問い合わせください
          </p>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default StoreSelection;
