'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Tooltip } from 'react-tooltip';
import {
  fetchDeliveryForEdit,
  fetchUndeliveredOrderDetails,
  updateDeliveryAllocations,
} from '@/app/actions/deliveryActions';
import { useSimpleSearch } from '@/app/hooks/useGenericSearch';
import { SortConfig, SortIcon, sortItems } from '@/app/utils/sortUtils';
import { Loading } from '@/app/components/Loading';
import { logger } from '@/lib/logger';

// 未納品注文明細の型定義
type UndeliveredOrderDetail = {
  orderDetailId: string;
  orderId: string;
  productName: string;
  unitPrice: number;
  totalQuantity: number;
  allocatedInOtherDeliveries: number;
  currentAllocation: number;
  remainingQuantity: number;
  description: string | null;
  orderDate: string;
};

// 割り当て更新用の型定義
type AllocationUpdate = {
  orderDetailId: string;
  allocatedQuantity: number;
  unitPrice: number;
  productName: string;
};

// 納品データの型定義
type DeliveryData = {
  id: string;
  customerId: string;
  deliveryDate: string;
  totalAmount: number | null;
  totalQuantity: number | null;
  note?: string | null;
  customer: {
    id: string;
    name: string;
    contactPerson?: string | null;
    address?: string | null;
    phone?: string | null;
    deliveryCondition?: string | null;
    note?: string | null;
  };
  deliveryDetails: Array<{
    id: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    allocations: Array<{
      orderDetailId: string;
      allocatedQuantity: number;
      orderDetail: {
        id: string;
        orderId: string;
        productName: string;
        unitPrice: number;
        quantity: number;
        description?: string;
        orderDate: string;
      };
    }>;
  }>;
};

const formatDateForInput = (date: string): string => {
  return new Date(date).toISOString().split('T')[0];
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
          <div className="mb-6 text-sm whitespace-pre-line text-gray-600">{message}</div>
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

// 成功ポップアップコンポーネント
const SuccessModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-brightness-50">
      <div className="w-full max-w-sm scale-100 transform rounded-2xl bg-white shadow-xl transition-all duration-50">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-green-800">更新完了</h3>
          <p className="mb-6 text-sm text-gray-600">納品が正常に更新されました</p>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-green-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// 未納品商品選択モーダルコンポーネント
const UndeliveredProductsModal = ({
  isOpen,
  onClose,
  orderDetails,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: UndeliveredOrderDetail[];
  onSave: (allocations: AllocationUpdate[]) => Promise<void>;
}) => {
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<UndeliveredOrderDetail> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // モーダルが開かれた時に初期化
  useEffect(() => {
    if (isOpen) {
      const initialSelections: Record<string, number> = {};
      orderDetails.forEach((detail) => {
        initialSelections[detail.orderDetailId] = detail.currentAllocation;
      });
      setSelections(initialSelections);
    }
  }, [isOpen, orderDetails]);

  const handleQuantityChange = (orderDetailId: string, quantity: number) => {
    const detail = orderDetails.find((d) => d.orderDetailId === orderDetailId);
    if (detail) {
      // 残り数量 + 現在の割り当て分が選択可能な上限
      const maxSelectable = detail.remainingQuantity + detail.currentAllocation;
      setSelections((prev) => ({
        ...prev,
        [orderDetailId]: Math.max(0, Math.min(quantity, maxSelectable)),
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 変更された項目のみを抽出（0に変更された項目も含む）
      const allocations: AllocationUpdate[] = [];

      Object.entries(selections).forEach(([orderDetailId, quantity]) => {
        const detail = orderDetails.find((d) => d.orderDetailId === orderDetailId);
        if (detail && detail.currentAllocation !== quantity) {
          // 現在の割り当て量と異なる場合のみ追加
          allocations.push({
            orderDetailId,
            allocatedQuantity: quantity,
            unitPrice: detail.unitPrice,
            productName: detail.productName,
          });
        }
      });

      // 変更がある場合のみAPIを呼び出す
      if (allocations.length > 0) {
        logger.info('変更された項目のみ送信', { allocations });
        await onSave(allocations);
      } else {
        logger.info('変更がないため、APIコールをスキップ');
      }
      onClose();
    } catch (error) {
      logger.error('保存エラー', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 商品名で絞り込み（汎用検索フックを使用）
  const filteredOrderDetails = useSimpleSearch(orderDetails, searchTerm, 'productName');

  // ソート処理のハンドラー
  const handleSort = (field: keyof UndeliveredOrderDetail) => {
    sortItems(filteredOrderDetails, field, sortConfig, setSortConfig);
  };

  // ソート済みのデータを取得
  const sortedOrderDetails = sortConfig 
    ? [...filteredOrderDetails].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // 日付フィールドの場合は特別な処理
        if (sortConfig.key === 'orderDate') {
          const aDate = new Date(aValue as string);
          const bDate = new Date(bValue as string);
          return sortConfig.direction === 'asc'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }

        // 数値の場合は数値として比較
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // 文字列として比較
        const aStr = String(aValue || '');
        const bStr = String(bValue || '');

        if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredOrderDetails;

  // 選択数量の合計を計算
  const totalSelectedQuantity = Object.values(selections).reduce((sum, qty) => sum + qty, 0);
  const totalSelectedAmount = Object.entries(selections).reduce((sum, [orderDetailId, qty]) => {
    const detail = orderDetails.find((d) => d.orderDetailId === orderDetailId);
    return sum + (detail ? detail.unitPrice * qty : 0);
  }, 0);

  // 変更があるかどうかを判定
  const hasChanges = Object.entries(selections).some(([orderDetailId, quantity]) => {
    const detail = orderDetails.find((d) => d.orderDetailId === orderDetailId);
    return detail && detail.currentAllocation !== quantity;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-4xl flex-col rounded-lg bg-white shadow-lg sm:max-w-5xl"
        style={{
          height: '85vh',
          minWidth: 320,
          width: '98vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 z-20 text-3xl font-bold text-red-600 hover:text-red-800 focus:outline-none"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>

        {/* ヘッダー部分 */}
        <div className="flex-shrink-0 border-b border-gray-200 p-2 sm:p-4">
          <h2 className="text-base font-bold sm:text-lg">未納品商品リスト（注文別）</h2>
          <div className="mt-2 text-xs text-gray-600 sm:text-sm">
            ※同じ商品でも異なる注文の場合は別行で表示されます
            <br />
            ※完全に納品済みの注文明細は表示されません
          </div>

          {/* 商品名検索 */}
          <div className="mt-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="商品名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 選択状況の表示 */}
          <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-2 sm:p-3">
            <div className="text-xs font-medium text-blue-800 sm:text-sm">
              選択状況: {totalSelectedQuantity}個 / 合計金額: ¥
              {totalSelectedAmount.toLocaleString()}
              {hasChanges && <span className="ml-2 text-orange-600">（変更あり）</span>}
            </div>
            {searchTerm && (
              <div className="mt-1 text-xs text-blue-600">
                検索結果: {filteredOrderDetails.length}件 / 全{orderDetails.length}件
              </div>
            )}
          </div>
        </div>

        {/* テーブル部分 */}
        <div className="min-h-0 flex-1 p-2 sm:p-4">
          <div className="h-full overflow-auto rounded border border-gray-300">
            <table className="w-full border-collapse text-center text-xs sm:text-sm">
              <thead className="sticky top-0 z-10 bg-blue-300">
                <tr style={{ height: '36px' }}>
                  <th 
                    className="w-[12%] min-w-[90px] border border-gray-400 px-1 py-1 text-xs font-semibold sm:px-2 sm:py-2 sm:text-sm cursor-pointer hover:bg-blue-400"
                    onClick={() => handleSort('orderId')}
                  >
                    <div className="flex items-center justify-center">
                      注文ID
                      <SortIcon field="orderId" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th 
                    className="w-[10%] min-w-[80px] border border-gray-400 px-1 py-1 text-xs font-semibold sm:px-2 sm:py-2 sm:text-sm cursor-pointer hover:bg-blue-400"
                    onClick={() => handleSort('orderDate')}
                  >
                    <div className="flex items-center justify-center">
                      注文日
                      <SortIcon field="orderDate" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th className="w-[25%] min-w-[150px] border border-gray-400 px-1 py-1 text-xs font-semibold sm:px-2 sm:py-2 sm:text-sm">
                    商品名
                  </th>
                  <th 
                    className="w-[10%] min-w-[70px] border border-gray-400 px-1 py-1 text-xs font-semibold sm:px-2 sm:py-2 sm:text-sm cursor-pointer hover:bg-blue-400"
                    onClick={() => handleSort('unitPrice')}
                  >
                    <div className="flex items-center justify-center">
                      単価
                      <SortIcon field="unitPrice" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th 
                    className="w-[10%] min-w-[60px] border border-gray-400 px-1 py-1 text-xs font-semibold sm:px-2 sm:py-2 sm:text-sm cursor-pointer hover:bg-blue-400"
                    onClick={() => handleSort('totalQuantity')}
                  >
                    <div className="flex items-center justify-center">
                      注文数量
                      <SortIcon field="totalQuantity" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th 
                    className="w-[11%] min-w-[80px] border border-gray-400 px-1 py-1 text-xs font-semibold sm:px-2 sm:py-2 sm:text-sm cursor-pointer hover:bg-blue-400"
                    onClick={() => handleSort('allocatedInOtherDeliveries')}
                  >
                    <div className="flex items-center justify-center">
                      既納品数量
                      <SortIcon field="allocatedInOtherDeliveries" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th 
                    className="w-[10%] min-w-[60px] border border-gray-400 px-1 py-1 text-xs font-semibold sm:px-2 sm:py-2 sm:text-sm cursor-pointer hover:bg-blue-400"
                    onClick={() => handleSort('remainingQuantity')}
                  >
                    <div className="flex items-center justify-center">
                      残り数量
                      <SortIcon field="remainingQuantity" sortConfig={sortConfig} />
                    </div>
                  </th>
                  <th className="w-[12%] min-w-[90px] border border-gray-400 px-1 py-1 text-xs font-semibold sm:px-2 sm:py-2 sm:text-sm">
                    今回納品数量
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedOrderDetails.map((detail) => {
                  // 残り数量 + 現在の割り当て分が選択可能な上限
                  const maxSelectable = detail.remainingQuantity + detail.currentAllocation;
                  const isSelected = (selections[detail.orderDetailId] || 0) > 0;

                  return (
                    <tr
                      key={detail.orderDetailId}
                      className={`h-10 transition-colors sm:h-12 ${
                        isSelected 
                          ? 'bg-green-100 border-l-4 border-l-green-500 shadow-sm' 
                          : 'hover:bg-blue-50'
                      }`}
                    >
                      <td className="border border-gray-400 px-1 py-1 text-center font-mono text-xs sm:px-2 sm:py-2 sm:text-sm">
                        {detail.orderId}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-center text-xs sm:px-2 sm:py-2 sm:text-sm">
                        {new Date(detail.orderDate).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </td>
                      <td className="max-w-0 border border-gray-400 px-1 py-1 text-left sm:px-2 sm:py-2">
                        <div
                          data-tooltip-id="product-tooltip"
                          data-tooltip-content={detail.productName}
                          className="cursor-help overflow-hidden text-xs text-ellipsis whitespace-nowrap sm:text-sm"
                        >
                          {detail.productName}
                        </div>
                        {detail.description && (
                          <div className="mt-1 hidden text-xs text-gray-500 sm:block">
                            <div
                              data-tooltip-id="description-tooltip"
                              data-tooltip-content={detail.description}
                              className="cursor-help overflow-hidden text-ellipsis whitespace-nowrap"
                            >
                              {detail.description}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-right text-xs sm:px-2 sm:py-2 sm:text-sm">
                        ¥{detail.unitPrice.toLocaleString()}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-center text-xs sm:px-2 sm:py-2 sm:text-sm">
                        {detail.totalQuantity}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-center text-xs sm:px-2 sm:py-2 sm:text-sm">
                        {detail.allocatedInOtherDeliveries}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-center text-xs font-semibold text-green-600 sm:px-2 sm:py-2 sm:text-sm">
                        {detail.remainingQuantity}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-center sm:px-2 sm:py-2">
                        <input
                          type="number"
                          min="0"
                          max={maxSelectable}
                          value={selections[detail.orderDetailId] || 0}
                          onChange={(e) =>
                            handleQuantityChange(
                              detail.orderDetailId,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-12 rounded border border-gray-300 px-1 py-1 text-center text-xs sm:w-16 sm:px-2 sm:text-sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* フッターボタン */}
        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-gray-200 p-2 sm:gap-3 sm:p-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 sm:px-4 sm:text-sm"
            disabled={isSaving}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges || totalSelectedQuantity === 0}
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:bg-gray-400 sm:px-4 sm:text-sm"
          >
            {isSaving ? (
              <Loading variant="button" size="sm" text="保存中..." />
            ) : totalSelectedQuantity === 0 ? (
              '商品を選択してください'
            ) : hasChanges ? (
              '納品更新'
            ) : (
              '変更なし'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DeliveryEditPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params.id as string;

  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [, setDeliveryDate] = useState<Date>(new Date());
  const [, setNote] = useState('');
  const [orderDetails, setOrderDetails] = useState<UndeliveredOrderDetail[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: '',
    message: '',
  });

  // 納品データの取得
  useEffect(() => {
    const fetchDeliveryData = async () => {
      try {
        setIsLoading(true);
        const result = await fetchDeliveryForEdit(deliveryId);
        if (result.success && result.delivery) {
          setDelivery(result.delivery as unknown as DeliveryData);
          setDeliveryDate(new Date(result.delivery.deliveryDate));
          setNote(result.delivery.note || '');
        } else {
          setErrorModal({
            isOpen: true,
            title: 'エラー',
            message: result.error || '納品データの取得に失敗しました',
          });
        }
      } catch {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: '納品データの取得中にエラーが発生しました',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (deliveryId) {
      fetchDeliveryData();
    }
  }, [deliveryId]);

  // 未納品注文明細の取得
  const handleFetchUndeliveredDetails = useCallback(async () => {
    if (!delivery) return;

    try {
      setIsLoading(true);
      const result = await fetchUndeliveredOrderDetails(delivery.customerId, deliveryId);
      if (result.success) {
        setOrderDetails((result.orderDetails || []).filter(Boolean) as UndeliveredOrderDetail[]);
        setShowProductModal(true);
      } else {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: result.error || '未納品注文明細の取得に失敗しました',
        });
      }
    } catch {
      setErrorModal({
        isOpen: true,
        title: 'エラー',
        message: '未納品注文明細の取得中にエラーが発生しました',
      });
    } finally {
      setIsLoading(false);
    }
  }, [delivery, deliveryId]);

  // 納品割り当ての更新
  const handleUpdateAllocations = useCallback(
    async (allocations: AllocationUpdate[]) => {
      try {
        setIsSaving(true);
        const result = await updateDeliveryAllocations(deliveryId, allocations);
        if (result.success) {
          setShowSuccessModal(true);
          // 納品データを再取得
          const updatedResult = await fetchDeliveryForEdit(deliveryId);
          if (updatedResult.success && updatedResult.delivery) {
            setDelivery(updatedResult.delivery as unknown as DeliveryData);
          }
        } else {
          setErrorModal({
            isOpen: true,
            title: 'エラー',
            message: result.error || '納品の更新に失敗しました',
          });
        }
      } catch {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: '納品の更新中にエラーが発生しました',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [deliveryId],
  );

  // 成功モーダルを閉じる際の処理
  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    router.push('/Home/DeliveryList');
  }, [router]);

  if (isLoading && !delivery) {
    return (
      <Loading variant="spinner" size="md" text="納品データを読み込み中..." fullScreen />
    );
  }

  if (!delivery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
        <div className="text-center">
          <div className="text-lg text-red-600">納品データが見つかりません</div>
          <button
            onClick={() => router.push('/Home/DeliveryList')}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            納品一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12">
      <div className="container mx-auto max-w-2xl px-2 py-4 sm:px-4 sm:py-6">
        <div className="rounded-lg bg-white p-6 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">納品編集 - {delivery.id}</h1>

          {/* 顧客情報 */}
          <div className="mb-6">
            <div className="bg-blue-500 p-2 text-sm font-semibold text-white sm:text-base">
              顧客情報
            </div>
            <div className="border-x border-b border-gray-300 p-3">
              <div className="mb-2 text-sm text-gray-600">
                <div className="font-semibold text-gray-900">{delivery.customer.name}</div>
                <div className="mt-1 text-xs">
                  担当者: {delivery.customer.contactPerson || '担当者未設定'} | ID:{' '}
                  {delivery.customer.id}
                </div>
                {delivery.customer.phone && (
                  <div className="text-xs">電話: {delivery.customer.phone}</div>
                )}
                {delivery.customer.address && (
                  <div className="text-xs">住所: {delivery.customer.address}</div>
                )}
              </div>
            </div>
          </div>

          {/* 納品日 */}
          <div className="mb-6">
            <div className="bg-blue-500 p-2 text-sm font-semibold text-white sm:text-base">
              納品日
            </div>
            <div className="border-x border-b border-gray-300 p-3">
              <input
                type="date"
                className="w-full rounded border px-2 py-2 text-xs sm:text-sm"
                value={formatDateForInput(delivery.deliveryDate)}
                readOnly
              />
            </div>
          </div>

          {/* 現在の納品内容 */}
          <div className="mb-6">
            <div className="bg-green-500 p-2 text-sm font-semibold text-white sm:text-base">
              現在の納品内容
            </div>
            <div className="border-x border-b border-gray-300 p-3">
              {delivery.deliveryDetails.length > 0 ? (
                <div className="space-y-2">
                  {/* ヘッダー行 - レスポンシブ対応 */}
                  <div
                    className="grid gap-2 border-b pb-2 text-xs font-semibold text-gray-700"
                    style={{ gridTemplateColumns: '3fr 0.8fr 0.6fr 1.2fr' }}
                  >
                    <div>商品名</div>
                    <div className="text-right">単価</div>
                    <div className="text-right">数量</div>
                    <div className="text-right">小計</div>
                  </div>
                  {/* 商品明細行 - モバイル版で商品名を広く、小計も十分な幅を確保 */}
                  {delivery.deliveryDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="grid gap-2 text-xs"
                      style={{ gridTemplateColumns: '3fr 0.8fr 0.6fr 1.2fr' }}
                    >
                      <div className="overflow-hidden">
                        <div
                          data-tooltip-id="product-tooltip"
                          data-tooltip-content={detail.productName}
                          className="cursor-help overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          {detail.productName}
                        </div>
                      </div>
                      <div className="text-right">¥{detail.unitPrice.toLocaleString()}</div>
                      <div className="text-right">{detail.quantity}</div>
                      <div className="text-right whitespace-nowrap">
                        ¥{(detail.unitPrice * detail.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {/* 合計行 */}
                  <div className="border-t pt-2">
                    <div
                      className="grid gap-2 text-sm font-semibold"
                      style={{ gridTemplateColumns: '3fr 0.8fr 0.6fr 1.2fr' }}
                    >
                      <div className="col-span-2">合計</div>
                      <div className="text-right">{delivery.totalQuantity}個</div>
                      <div className="text-right whitespace-nowrap">
                        ¥{(delivery.totalAmount || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleFetchUndeliveredDetails}
                      className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                      disabled={isLoading || isSaving}
                    >
                      納品内容を変更
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-3 text-sm text-gray-600">現在納品商品はありません</div>
                  <button
                    onClick={handleFetchUndeliveredDetails}
                    className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                    disabled={isLoading || isSaving}
                  >
                    納品商品を追加
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 備考 */}
          <div className="mb-6">
            <div className="bg-blue-500 p-2 text-sm font-semibold text-white sm:text-base">
              備考
            </div>
            <div className="border-x border-b border-gray-300 p-3">
              <div className="text-sm text-gray-600">{delivery.note || '備考はありません'}</div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/Home/DeliveryList')}
              className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
              disabled={isLoading || isSaving}
            >
              戻る
            </button>
          </div>
        </div>
      </div>

      {/* 未納品商品選択モーダル */}
      <UndeliveredProductsModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        orderDetails={orderDetails}
        onSave={handleUpdateAllocations}
      />

      {/* 成功ポップアップ */}
      <SuccessModal isOpen={showSuccessModal} onClose={handleCloseSuccessModal} />

      {/* エラーモーダル */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
      />

      {/* React Tooltip */}
      <Tooltip
        id="product-tooltip"
        place="top"
        className="z-50 max-w-xs"
        style={{
          backgroundColor: '#1f2937',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          wordWrap: 'break-word',
        }}
      />
      <Tooltip
        id="description-tooltip"
        place="top"
        className="z-50 max-w-xs"
        style={{
          backgroundColor: '#1f2937',
          color: '#ffffff',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '14px',
          wordWrap: 'break-word',
        }}
      />
    </div>
  );
}
