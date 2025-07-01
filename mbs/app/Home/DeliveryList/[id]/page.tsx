'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchDeliveryById, deleteDelivery } from '@/app/actions/deliveryActions';
import { generateDeliveryPDF } from '@/app/components/DeliveryPDF';

// レスポンス型定義
interface DeliveryDetail {
  id: string;
  deliveryId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

interface Customer {
  id: string;
  storeId: string;
  name: string;
  contactPerson?: string;
  address?: string;
  phone?: string;
  deliveryCondition?: string;
  note?: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

interface DeliveryData {
  id: string;
  customerId: string;
  deliveryDate: string;
  totalAmount?: number;
  totalQuantity?: number;
  note?: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  customer: Customer;
  deliveryDetails: DeliveryDetail[];
}

// 日本円のフォーマット関数（省略なし）
const formatJPY = (amount: number): string => {
  return `¥${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// 日付フォーマット関数
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 削除確認モーダルコンポーネント
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  deliveryData,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deliveryData: DeliveryData | null;
  isDeleting: boolean;
}) => {
  if (!isOpen || !deliveryData) return null;

  const totalAmount = deliveryData.deliveryDetails.reduce(
    (sum, detail) => sum + detail.unitPrice * detail.quantity,
    0,
  );
  const productCount = deliveryData.deliveryDetails.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-brightness-50">
      <div className="w-full max-w-md scale-100 transform rounded-2xl bg-white shadow-xl transition-all duration-50">
        <div className="p-6 text-center">
          {/* 警告アイコン */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <h3 className="mb-2 text-xl font-bold text-gray-900">納品削除</h3>

          <p className="mb-4 text-sm text-gray-600">以下の納品を削除してもよろしいですか？</p>

          {/* 削除対象納品の情報表示 */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="space-y-3 text-left">
              <div>
                <div className="mb-1 flex items-center">
                  <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-medium text-gray-800">納品ID</span>
                </div>
                <p className="ml-4 font-mono text-sm font-semibold text-gray-900">
                  {deliveryData.id}
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center">
                  <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-gray-800">顧客名</span>
                </div>
                <p className="ml-4 text-sm font-semibold text-gray-900">
                  {deliveryData.customer.name}
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center">
                  <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></span>
                  <span className="text-sm font-medium text-gray-800">納品日</span>
                </div>
                <p className="ml-4 text-sm font-semibold text-gray-900">
                  {formatDate(deliveryData.deliveryDate)}
                </p>
              </div>

              <div className="flex justify-between">
                <div className="w-1/2 pr-2">
                  <div className="mb-1 flex items-center">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></span>
                    <span className="text-sm font-medium text-gray-800">商品数</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-900">{productCount}点</p>
                </div>

                <div className="w-1/2 pl-2">
                  <div className="mb-1 flex items-center">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500"></span>
                    <span className="text-sm font-medium text-gray-800">合計金額</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-900">
                    {formatJPY(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mb-6 text-xs text-red-600">この操作は取り消すことができません。</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              disabled={isDeleting}
            >
              キャンセル
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  削除中...
                </div>
              ) : (
                '削除'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DeliveryDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const deliveryId = (params?.id as string) || '';

  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // 納品詳細データを取得する関数
  const fetchDeliveryDetail = useCallback(async (): Promise<void> => {
    if (!deliveryId) {
      setError('納品IDが指定されていません');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await fetchDeliveryById(deliveryId);

      if (!result.success || !result.delivery) {
        setError(result.error || '納品データの取得に失敗しました');
        return;
      }

      setDeliveryData(result.delivery as DeliveryData);
    } catch (err) {
      console.error('納品データの取得エラー:', err);
      setError('納品データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [deliveryId]);

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchDeliveryDetail();
  }, [fetchDeliveryDetail]);

  // 表示用データの準備（空行を含めて10行にする）
  const displayDeliveryDetails = React.useMemo(() => {
    const details = deliveryData?.deliveryDetails || [];
    const displayDetails = [...details];

    // 空行を追加（合計10行になるよう調整）
    while (displayDetails.length < 10) {
      displayDetails.push({
        id: '',
        deliveryId: '',
        productName: '',
        unitPrice: 0,
        quantity: 0,
        updatedAt: '',
        isDeleted: false,
        deletedAt: null,
      });
    }

    return displayDetails;
  }, [deliveryData]);

  // 合計金額計算
  const totalAmount = React.useMemo(() => {
    return deliveryData?.deliveryDetails
      ? deliveryData.deliveryDetails.reduce(
          (sum, detail) => sum + detail.unitPrice * detail.quantity,
          0,
        )
      : 0;
  }, [deliveryData]);

  // ハンドラー関数
  const handleEdit = () => {
    router.push(`/Home/DeliveryList/${deliveryId}/Edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deliveryId) return;

    try {
      setIsDeleting(true);
      const result = await deleteDelivery(deliveryId);

      if (result.success) {
        setShowDeleteModal(false);
        // 成功メッセージを表示
        alert('納品を削除しました');
        // 納品一覧に戻る
        router.push('/Home/DeliveryList');
      } else {
        // エラーメッセージを表示
        alert(`削除に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      alert('削除中にエラーが発生しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handlePdfExport = async () => {
    if (!deliveryData) return;
    
    try {
      await generateDeliveryPDF(deliveryData);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成中にエラーが発生しました');
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-gray-600">データを読み込んでいます...</p>
          </div>
        </div>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/Home/DeliveryList')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              納品一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // データが見つからない場合
  if (!deliveryData) {
    return (
      <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="mb-4 text-gray-600">納品データが見つかりませんでした</p>
            <button
              onClick={() => router.push('/Home/DeliveryList')}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              納品一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`container mx-auto max-w-7xl px-2 py-4 transition-all sm:px-4 sm:py-6 lg:px-6`}
      >
        {/* ヘッダー */}
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800 sm:text-xl lg:text-2xl">
              納品明細 - {deliveryData.id}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              納品日: {formatDate(deliveryData.deliveryDate)}
            </p>
          </div>
          <div>
            <button
              onClick={handleEdit}
              className="rounded-lg border border-yellow-600 bg-yellow-400 px-4 py-2 text-sm font-bold text-black shadow-sm transition-colors hover:bg-yellow-500 sm:text-base"
              disabled={showDeleteModal || isDeleting}
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
                      <th className="w-[60%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        商品名
                      </th>
                      <th className="w-[15%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        単価
                      </th>
                      <th className="w-[10%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        数量
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayDeliveryDetails.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr
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
                            {item.unitPrice > 0 ? formatJPY(item.unitPrice) : ''}
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-right font-medium sm:px-3 sm:py-2">
                            {item.quantity > 0 ? item.quantity.toString() : ''}
                          </td>
                        </tr>
                      </React.Fragment>
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
                    <div className="w-3/5 p-3 font-mono break-all">
                      {deliveryData.customer.name}
                    </div>
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
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">配達条件</div>
                    <div className="w-3/5 p-3 break-all">
                      {deliveryData.customer.deliveryCondition || 'N/A'}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">住所</div>
                    <div className="w-3/5 p-3 break-all">
                      {deliveryData.customer.address || 'N/A'}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">備考</div>
                    <div className="w-3/5 p-3 break-all">
                      {deliveryData.customer.note || '（なし）'}
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
            onClick={handleDelete}
            className="w-32 rounded-lg border border-red-700 bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 sm:w-auto sm:px-6 sm:text-base"
            disabled={showDeleteModal || isDeleting}
          >
            削除
          </button>
          <button
            onClick={handlePdfExport}
            className="w-32 rounded-lg border border-blue-700 bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto sm:px-6 sm:text-base"
            disabled={isDeleting}
          >
            PDF出力
          </button>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        deliveryData={deliveryData}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default DeliveryDetailPage;
