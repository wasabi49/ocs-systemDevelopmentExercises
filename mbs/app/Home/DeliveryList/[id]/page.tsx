'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Delivery, DeliveryDetail, Customer } from '@/app/generated/prisma';
import { fetchDeliveryById, deleteDeliveryById } from '@/app/actions/deliveryActions';

// APIレスポンス用の型（Prismaのinclude結果）
type DeliveryWithRelations = Delivery & {
  customer: Customer;
  deliveryDetails: DeliveryDetail[];
};

// 日本円のフォーマット関数
const formatJPY = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
};

// 日付フォーマット関数
const formatDate = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD形式
};

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = (params?.id as string) || '';

  const [deliveryData, setDeliveryData] = useState<DeliveryWithRelations | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 納品詳細データを取得する関数
  const fetchDeliveryDetail = useCallback(async (): Promise<void> => {
    if (!deliveryId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await fetchDeliveryById(deliveryId);

      if (result.success && result.delivery) {
        // 日付データをDateオブジェクトに変換
        const deliveryWithDates = {
          ...result.delivery,
          deliveryDate: new Date(result.delivery.deliveryDate),
          updatedAt: new Date(result.delivery.updatedAt),
          deletedAt: result.delivery.deletedAt ? new Date(result.delivery.deletedAt) : null,
          customer: {
            ...result.delivery.customer,
            updatedAt: new Date(result.delivery.customer.updatedAt),
            deletedAt: result.delivery.customer.deletedAt
              ? new Date(result.delivery.customer.deletedAt)
              : null,
          },
          deliveryDetails: result.delivery.deliveryDetails.map((detail) => ({
            ...detail,
            updatedAt: new Date(detail.updatedAt),
            deletedAt: detail.deletedAt ? new Date(detail.deletedAt) : null,
          })),
        };
        setDeliveryData(deliveryWithDates);
      } else {
        setError(result.error || '納品データの取得に失敗しました');
      }
    } catch (err) {
      console.error('納品データの取得に失敗しました:', err);
      setError('納品データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchDeliveryDetail();
  }, [fetchDeliveryDetail]);

  // ローディング状態
  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-600">納品データを読み込み中...</div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-red-600">エラー: {error}</div>
        </div>
      </div>
    );
  }

  // データが見つからない場合
  if (!deliveryData) {
    return (
      <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-600">納品データが見つかりません</div>
        </div>
      </div>
    );
  }

  // 合計金額計算
  const totalAmount = deliveryData.deliveryDetails.reduce(
    (sum, detail) => sum + detail.unitPrice * detail.quantity,
    0,
  );

  return (
    <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
      {/* ヘッダー */}
      <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-bold text-gray-800 sm:text-xl lg:text-2xl">
            納品明細 - {deliveryData.id}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            納品日: {formatDate(deliveryData.deliveryDate)} | 合計: {formatJPY(totalAmount)}
          </p>
        </div>
        <div>
          <button
            onClick={() => router.push(`/Home/DeliveryList/${deliveryId}/Edit`)}
            className="rounded-lg border border-yellow-600 bg-yellow-400 px-4 py-2 text-sm font-bold text-black shadow-sm transition-colors hover:bg-yellow-500 sm:text-base"
          >
            編集
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row">
        {/* 納品明細テーブル（左側・メイン） */}
        <div className="w-full xl:w-2/3">
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="bg-blue-500 p-3 text-white">
              <h2 className="text-base font-semibold sm:text-lg">納品明細一覧</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-center text-xs sm:text-sm">
                <thead className="bg-blue-300">
                  <tr>
                    <th className="w-[15%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                      納品明細ID
                    </th>
                    <th className="w-[35%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                      商品名
                    </th>
                    <th className="w-[25%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                      単価
                    </th>
                    <th className="w-[25%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                      数量
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryData.deliveryDetails.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`${
                        index % 2 === 0 ? 'bg-blue-50' : 'bg-white'
                      } h-10 transition-colors hover:bg-blue-100 sm:h-12`}
                    >
                      <td className="truncate border border-gray-400 px-2 py-1 font-mono text-xs sm:px-3 sm:py-2">
                        {item.id}
                      </td>
                      <td className="truncate border border-gray-400 px-2 py-1 text-left sm:px-3 sm:py-2">
                        {item.productName}
                      </td>
                      <td className="border border-gray-400 px-2 py-1 text-right font-medium sm:px-3 sm:py-2">
                        {formatJPY(item.unitPrice)}
                      </td>
                      <td className="border border-gray-400 px-2 py-1 text-right font-medium sm:px-3 sm:py-2">
                        {item.quantity.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 合計金額表示 */}
            <div className="border-t bg-gray-50 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 sm:text-base">合計金額:</span>
                <span className="text-lg font-bold text-blue-600 sm:text-xl">
                  {formatJPY(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 納品情報と顧客情報（右側） */}
        <div className="flex w-full flex-col gap-6 xl:w-1/3">
          {/* 納品情報 */}
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="bg-slate-700 p-3 text-white">
              <h2 className="text-base font-semibold sm:text-lg">納品情報</h2>
            </div>
            <div className="text-xs sm:text-sm">
              <div className="divide-y divide-gray-200">
                <div className="flex">
                  <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">納品ID</div>
                  <div className="w-3/5 p-3 font-mono break-all">{deliveryData.id}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">納品日</div>
                  <div className="w-3/5 p-3">{formatDate(deliveryData.deliveryDate)}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">合計金額</div>
                  <div className="w-3/5 p-3 text-left font-mono break-all">
                    {formatJPY(totalAmount)}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">備考</div>
                  <div className="w-3/5 p-3 break-all">{deliveryData.note || '（なし）'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 顧客情報 */}
          <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
            <div className="bg-slate-700 p-3 text-white">
              <h2 className="text-base font-semibold sm:text-lg">顧客情報</h2>
            </div>
            <div className="text-xs sm:text-sm">
              <div className="divide-y divide-gray-200">
                <div className="flex">
                  <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">顧客ID</div>
                  <div className="w-3/5 p-3 font-mono break-all">{deliveryData.customer.id}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">名義</div>
                  <div className="w-3/5 p-3 font-mono break-all">{deliveryData.customer.name}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">担当者</div>
                  <div className="w-3/5 p-3 break-all">
                    {deliveryData.customer.contactPerson || 'N/A'}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">電話番号</div>
                  <div className="w-3/5 p-3">{deliveryData.customer.phone || 'N/A'}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">住所</div>
                  <div className="w-3/5 p-3 break-all">
                    {deliveryData.customer.address || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="mt-8 flex flex-row items-center justify-center gap-3 sm:justify-between sm:gap-4">
        <button
          onClick={async () => {
            if (confirm('この納品を削除してもよろしいですか？')) {
              const result = await deleteDeliveryById(deliveryId);
              if (result.success) {
                router.push('/Home/DeliveryList');
              } else {
                alert(`削除に失敗しました: ${result.error}`);
              }
            }
          }}
          className="w-32 rounded-lg border border-red-700 bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 sm:w-auto sm:px-6 sm:text-base"
        >
          削除
        </button>
        <button
          onClick={() => alert('PDFを出力しています（デモのため実際の出力は行われていません）')}
          className="w-32 rounded-lg border border-blue-700 bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto sm:px-6 sm:text-base"
        >
          PDF出力
        </button>
      </div>
    </div>
  );
}
