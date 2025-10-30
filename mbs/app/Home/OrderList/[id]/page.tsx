'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { OrderDetail, Prisma } from '@/app/generated/prisma';
import { fetchOrderWithDeliveryAllocations, deleteOrder } from '@/app/actions/orderActions';
import { generateOrderPDF } from '@/app/components/OrderPDF';
import { logger } from '@/lib/logger';

// APIレスポンス用の型（Prismaのinclude結果）
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    orderDetails: true;
  };
}>;

// 表示用の拡張型
interface OrderDetailWithDelivery extends OrderDetail {
  deliveryAllocations?: {
    deliveryDetailId: string;
    deliveryDate: string;
    allocatedQuantity: number;
    deliveryId: string;
  }[];
  totalDelivered?: number;
  deliveryStatus?: string;
}



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
  return dateObj.toISOString().split('T')[0];
};

// 削除確認モーダルコンポーネント
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderData: OrderWithRelations | null;
  isDeleting: boolean;
}) => {
  if (!isOpen || !orderData) return null;

  const totalAmount = orderData.orderDetails.reduce(
    (sum, detail) => sum + detail.unitPrice * detail.quantity,
    0,
  );
  const productCount = orderData.orderDetails.length;

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

          <h3 className="mb-2 text-xl font-bold text-gray-900">注文削除</h3>

          <p className="mb-4 text-sm text-gray-600">以下の注文を削除してもよろしいですか？</p>

          {/* 削除対象注文の情報表示 */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="space-y-3 text-left">
              <div>
                <div className="mb-1 flex items-center">
                  <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-medium text-gray-800">注文ID</span>
                </div>
                <p className="ml-4 font-mono text-sm font-semibold text-gray-900">{orderData.id}</p>
              </div>

              <div>
                <div className="mb-1 flex items-center">
                  <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-gray-800">顧客名</span>
                </div>
                <p className="ml-4 text-sm font-semibold text-gray-900">
                  {orderData.customer.name}
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center">
                  <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></span>
                  <span className="text-sm font-medium text-gray-800">注文日</span>
                </div>
                <p className="ml-4 text-sm font-semibold text-gray-900">
                  {formatDate(orderData.orderDate)}
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
              className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700 disabled:opacity-50"
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

// エラーモーダルコンポーネント
const ErrorModal = ({
  isOpen,
  onClose,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-brightness-50">
      <div className="w-full max-w-sm scale-100 transform rounded-2xl bg-white shadow-xl transition-all duration-50">
        <div className="p-6 text-center">
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
          <div className="mb-6 text-sm text-gray-600 whitespace-pre-line">{message}</div>

          <button
            onClick={onClose}
            className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || '';

  const [orderData, setOrderData] = useState<OrderWithRelations | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isDeleting, startDeleteTransition] = useTransition();
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // 注文データを取得
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!orderId) {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: '注文IDが指定されていません。'
        });
        setLoading(false);
        return;
      }

      try {
        const result = await fetchOrderWithDeliveryAllocations(orderId);

        if (result.success && result.order) {
          // @ts-expect-error - 型エラー回避のための一時的な対応
          setOrderData(result.order);
        } else {
          setErrorModal({
            isOpen: true,
            title: 'データ取得エラー',
            message: result.error || 'データの取得に失敗しました'
          });
        }
      } catch (error) {
        logger.error('注文データ取得エラー', { error: error instanceof Error ? error.message : String(error) });
        setErrorModal({
          isOpen: true,
          title: 'データ取得エラー',
          message: 'データの取得に失敗しました。'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [orderId]);

  // 注文詳細を表示用データに変換（納品状況の詳細計算）
  const displayOrderDetails: OrderDetailWithDelivery[] = orderData?.orderDetails.map(detail => {
    // fetchOrderWithDeliveryAllocationsから取得したデータをそのまま使用
    const detailWithDelivery = detail as OrderDetailWithDelivery;
    return {
      ...detail,
      deliveryAllocations: detailWithDelivery.deliveryAllocations || [],
      totalDelivered: detailWithDelivery.totalDelivered || 0,
      deliveryStatus: detailWithDelivery.deliveryStatus || '未納品'
    };
  }) || [];

  // 空行の追加は行わず、実際のデータのみ表示
  const paddedOrderDetails = displayOrderDetails;

  // 合計金額計算
  const totalAmount = orderData?.orderDetails.reduce(
    (sum, detail) => sum + detail.unitPrice * detail.quantity,
    0,
  ) || 0;

  // ハンドラー関数
  const handleEdit = () => {
    router.push(`/Home/OrderList/${orderId}/Edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    startDeleteTransition(async () => {
      try {
        const result = await deleteOrder(orderId);

        if (result.success) {
          setShowDeleteModal(false);
          setErrorModal({
            isOpen: true,
            title: '削除完了',
            message: result.message || '注文を正常に削除しました。'
          });
          
          // 少し待ってから一覧画面に戻る
          setTimeout(() => {
            router.push('/Home/OrderList');
          }, 1500);
        } else {
          setErrorModal({
            isOpen: true,
            title: '削除エラー',
            message: result.error || '注文の削除に失敗しました'
          });
        }
      } catch (error) {
        logger.error('注文削除エラー', { error: error instanceof Error ? error.message : String(error) });
        setErrorModal({
          isOpen: true,
          title: '削除エラー',
          message: '注文の削除に失敗しました。'
        });
      }
    });
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handlePdfExport = async () => {
    if (!orderData) {
      setErrorModal({
        isOpen: true,
        title: 'PDF出力エラー',
        message: '注文データが読み込まれていません。'
      });
      return;
    }

    try {
      await generateOrderPDF(orderData);
    } catch (error) {
      logger.error('PDF生成エラー', { error: error instanceof Error ? error.message : String(error) });
      setErrorModal({
        isOpen: true,
        title: 'PDF出力エラー',
        message: 'PDFの生成に失敗しました。'
      });
    }
  };

  // 行の展開/折りたたみハンドラー
  const toggleRowExpansion = (orderDetailId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderDetailId)) {
      newExpanded.delete(orderDetailId);
    } else {
      newExpanded.add(orderDetailId);
    }
    setExpandedRows(newExpanded);
  };

  const handleCloseErrorModal = () => {
    setErrorModal({
      isOpen: false,
      title: '',
      message: ''
    });
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <span className="text-lg text-gray-600">読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  // データが見つからない場合
  if (!orderData) {
    return (
      <div className="container mx-auto max-w-7xl px-2 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl text-gray-300 mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">注文が見つかりません</h2>
            <p className="text-gray-500 mb-4">指定された注文ID「{orderId}」は存在しないか、削除されています。</p>
            <button
              onClick={() => router.push('/Home/OrderList')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              注文一覧に戻る
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
              注文明細 - {orderData.id}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              注文日: {formatDate(orderData.orderDate)} | 状態:
              <span
                className={`ml-1 rounded-full px-2 py-1 text-xs font-semibold ${
                  orderData.status === '完了'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {orderData.status}
              </span>
            </p>
          </div>
          <div>
            <button
              onClick={handleEdit}
              className="rounded-lg border border-yellow-600 bg-yellow-400 px-4 py-2 text-sm font-bold text-black shadow-sm transition-colors hover:bg-yellow-500 sm:text-base"
              disabled={showDeleteModal}
            >
              編集
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          {/* 注文明細テーブル（左側・メイン） */}
          <div className="w-full xl:w-2/3">
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="bg-blue-500 p-3 text-white">
                <h2 className="text-base font-semibold sm:text-lg">注文明細一覧</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-center text-xs sm:text-sm">
                  <thead className="bg-blue-300">
                    <tr>
                      <th className="w-[15%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        注文明細ID
                      </th>
                      <th className="w-[25%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        商品名
                      </th>
                      <th className="w-[12%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        単価
                      </th>
                      <th className="w-[8%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        数量
                      </th>
                      <th className="w-[15%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        納品状況
                      </th>
                      <th className="w-[25%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        摘要
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paddedOrderDetails.map((item, index) => (
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
                            {item.quantity > 0 ? item.quantity.toLocaleString() : ''}
                          </td>
                          <td className="border border-gray-400 px-2 py-1 text-center sm:px-3 sm:py-2">
                            {item.productName && (
                              <div className="flex items-center justify-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    item.deliveryStatus === '完了'
                                      ? 'bg-green-100 text-green-800'
                                      : item.deliveryStatus === '一部納品'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : item.deliveryStatus === '未納品'
                                          ? 'bg-red-100 text-red-800'
                                          : ''
                                  }`}
                                >
                                  {item.deliveryStatus}
                                </span>
                                {/* 商品がある場合は常に詳細を表示可能 */}
                                <button
                                  onClick={() => toggleRowExpansion(item.id)}
                                  className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                  title={
                                    expandedRows.has(item.id) ? '詳細を閉じる' : '詳細を表示'
                                  }
                                >
                                  {expandedRows.has(item.id) ? '▲' : '▼'}
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="truncate border border-gray-400 px-2 py-1 text-left sm:px-3 sm:py-2">
                            {item.description}
                          </td>
                        </tr>

                        {/* 展開時の詳細情報 */}
                        {expandedRows.has(item.id) && item.productName && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="border border-gray-400 px-4 py-3">
                              <div className="text-sm">
                                <div className="mb-2 font-medium text-gray-700">
                                  納品明細 ({item.totalDelivered || 0}/{item.quantity} 個)
                                </div>
                                {item.deliveryStatus === '完了' ? (
                                  <div className="rounded bg-white px-3 py-2 text-xs">
                                    <div className="flex items-center justify-between">
                                      <div className="flex gap-4">
                                        <span className="font-mono text-green-600">
                                          {item.id}
                                        </span>
                                        <span className="text-gray-600">
                                          {formatDate(orderData?.orderDate || new Date())}
                                        </span>
                                        <span className="font-medium text-green-600">
                                          {item.quantity}個 完納
                                        </span>
                                      </div>
                                      <span className="text-green-600 font-semibold">
                                        ✓ 納品完了
                                      </span>
                                    </div>
                                  </div>
                                ) : item.deliveryAllocations && item.deliveryAllocations.length > 0 ? (
                                  <div className="space-y-1">
                                    {item.deliveryAllocations.map((allocation, allocIndex) => (
                                      <div
                                        key={allocIndex}
                                        className="flex items-center justify-between rounded bg-white px-3 py-2 text-xs"
                                      >
                                        <div className="flex gap-4">
                                          <span className="font-mono text-blue-600">
                                            {allocation.deliveryDetailId}
                                          </span>
                                          <span className="text-gray-600">
                                            {allocation.deliveryDate}
                                          </span>
                                          <span className="font-medium">
                                            {allocation.allocatedQuantity}個
                                          </span>
                                        </div>
                                        <span className="text-gray-500">
                                          納品ID: {allocation.deliveryId}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="rounded bg-white px-3 py-2 text-xs text-gray-500">
                                    まだ納品されていません
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
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

          {/* 注文情報と顧客情報（右側） */}
          <div className="flex w-full flex-col gap-6 xl:w-1/3">
            {/* 注文情報 */}
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="bg-slate-700 p-3 text-white">
                <h2 className="text-base font-semibold sm:text-lg">注文情報</h2>
              </div>
              <div className="text-xs sm:text-sm">
                <div className="divide-y divide-gray-200">
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">注文ID</div>
                    <div className="w-3/5 p-3 font-mono break-all">{orderData.id}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">注文日</div>
                    <div className="w-3/5 p-3">{formatDate(orderData.orderDate)}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">状態</div>
                    <div className="w-3/5 p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          orderData.status === '完了'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {orderData.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">備考</div>
                    <div className="w-3/5 p-3 break-all">{orderData.note || '（なし）'}</div>
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
                    <div className="w-3/5 p-3 font-mono break-all">{orderData.customer.id}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">名義</div>
                    <div className="w-3/5 p-3 font-semibold break-all">
                      {orderData.customer.name}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">担当者</div>
                    <div className="w-3/5 p-3 break-all">{orderData.customer.contactPerson}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">電話番号</div>
                    <div className="w-3/5 p-3">{orderData.customer.phone}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">配達条件</div>
                    <div className="w-3/5 p-3 break-all">
                      {orderData.customer.deliveryCondition}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">住所</div>
                    <div className="w-3/5 p-3 break-all">{orderData.customer.address}</div>
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
        orderData={orderData}
        isDeleting={isDeleting}
      />

      {/* エラーモーダル */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={handleCloseErrorModal}
        title={errorModal.title}
        message={errorModal.message}
      />
    </>
  );
};

export default OrderDetailPage;