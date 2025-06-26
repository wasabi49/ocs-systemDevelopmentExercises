'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  fetchDeliveryForEdit,
  fetchUndeliveredOrderDetails,
  updateDeliveryAllocations,
} from '@/app/actions/deliveryActions';

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
      const allocations = Object.entries(selections)
        .filter(([, quantity]) => quantity > 0)
        .map(([orderDetailId, allocatedQuantity]) => {
          const detail = orderDetails.find((d) => d.orderDetailId === orderDetailId);
          return {
            orderDetailId,
            allocatedQuantity,
            unitPrice: detail!.unitPrice,
            productName: detail!.productName,
          };
        });

      await onSave(allocations);
      onClose();
    } catch (error) {
      console.error('保存エラー:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 選択数量の合計を計算
  const totalSelectedQuantity = Object.values(selections).reduce((sum, qty) => sum + qty, 0);
  const totalSelectedAmount = Object.entries(selections).reduce((sum, [orderDetailId, qty]) => {
    const detail = orderDetails.find((d) => d.orderDetailId === orderDetailId);
    return sum + (detail ? detail.unitPrice * qty : 0);
  }, 0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-lg bg-white p-4 shadow-lg"
        style={{
          maxHeight: '80vh',
          minWidth: 320,
          width: '95vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-3xl font-bold text-red-600 hover:text-red-800 focus:outline-none"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
        <h2 className="mb-4 text-lg font-bold">未納品商品リスト（注文別）</h2>
        <div className="mb-4 text-sm text-gray-600">
          ※同じ商品でも異なる注文の場合は別行で表示されます
          <br />
          ※完全に納品済みの注文明細は表示されません
        </div>

        {/* 選択状況の表示 */}
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <div className="text-sm font-medium text-blue-800">
            選択状況: {totalSelectedQuantity}個 / 合計金額: ¥{totalSelectedAmount.toLocaleString()}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            <table className="w-full border-collapse text-center text-xs sm:text-sm">
              <thead className="sticky top-0 z-10 bg-blue-300">
                <tr style={{ height: '44px' }}>
                  <th className="border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">
                    注文ID
                  </th>
                  <th className="border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">
                    注文日
                  </th>
                  <th className="border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">
                    商品名
                  </th>
                  <th className="border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">
                    単価
                  </th>
                  <th className="border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">
                    注文数量
                  </th>
                  <th className="border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">
                    既納品数量
                  </th>
                  <th className="border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">
                    残り数量
                  </th>
                  <th className="border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">
                    今回納品数量
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.map((detail) => {
                  // 残り数量 + 現在の割り当て分が選択可能な上限
                  const maxSelectable = detail.remainingQuantity + detail.currentAllocation;

                  return (
                    <tr
                      key={detail.orderDetailId}
                      className="h-10 transition-colors hover:bg-blue-100 sm:h-12"
                    >
                      <td className="border border-gray-400 px-1 py-1 text-center font-mono text-xs sm:px-2 sm:py-2">
                        {detail.orderId}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-center text-xs sm:px-2 sm:py-2">
                        {new Date(detail.orderDate).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-left sm:px-2 sm:py-2">
                        {detail.productName}
                        {detail.description && (
                          <div className="mt-1 text-xs text-gray-500">{detail.description}</div>
                        )}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-right sm:px-2 sm:py-2">
                        ¥{detail.unitPrice.toLocaleString()}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-center sm:px-2 sm:py-2">
                        {detail.totalQuantity}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-center sm:px-2 sm:py-2">
                        {detail.allocatedInOtherDeliveries}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 text-center font-semibold text-green-600 sm:px-2 sm:py-2">
                        {detail.remainingQuantity}
                      </td>
                      <td className="border border-gray-400 px-1 py-1 sm:px-2 sm:py-2">
                        <input
                          type="number"
                          min="0"
                          max={maxSelectable}
                          value={selections[detail.orderDetailId] || 0}
                          onChange={(e) =>
                            handleQuantityChange(detail.orderDetailId, parseInt(e.target.value) || 0)
                          }
                          className="w-16 rounded border border-gray-300 px-1 py-1 text-center text-xs sm:w-20"
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
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            disabled={isSaving}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSaving ? '保存中...' : '納品更新'}
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
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');
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
      } catch (error) {
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
    } catch (error) {
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
      } catch (error) {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: '納品の更新中にエラーが発生しました',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [deliveryId]
  );

  // 成功モーダルを閉じる際の処理
  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    router.push('/Home/DeliveryList');
  }, [router]);

  if (isLoading && !delivery) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600">納品データを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen py-12 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-red-600">納品データが見つかりません</div>
          <button
            onClick={() => router.push('/Home/DeliveryList')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            納品一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 flex items-center justify-center bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">納品編集 - {delivery.id}</h1>

          {/* 顧客情報 */}
          <div className="mb-6">
            <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base">
              顧客情報
            </div>
            <div className="p-3 border-x border-b border-gray-300">
              <div className="text-sm text-gray-600 mb-2">
                <div className="font-semibold text-gray-900">{delivery.customer.name}</div>
                <div className="text-xs mt-1">
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
            <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base">
              納品日
            </div>
            <div className="p-3 border-x border-b border-gray-300">
              <input
                type="date"
                className="w-full px-2 py-2 rounded text-xs sm:text-sm border"
                value={formatDateForInput(delivery.deliveryDate)}
                readOnly
              />
            </div>
          </div>

          {/* 現在の納品内容 */}
          <div className="mb-6">
            <div className="bg-green-500 text-white p-2 font-semibold text-sm sm:text-base">
              現在の納品内容
            </div>
            <div className="p-3 border-x border-b border-gray-300">
              {delivery.deliveryDetails.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-xs font-semibold text-gray-700 pb-2 border-b">
                    <div>商品名</div>
                    <div className="text-right">単価</div>
                    <div className="text-center">数量</div>
                    <div className="text-right">小計</div>
                  </div>
                  {delivery.deliveryDetails.map((detail) => (
                    <div key={detail.id} className="grid grid-cols-4 gap-2 text-xs">
                      <div>{detail.productName}</div>
                      <div className="text-right">¥{detail.unitPrice.toLocaleString()}</div>
                      <div className="text-center">{detail.quantity}</div>
                      <div className="text-right">
                        ¥{(detail.unitPrice * detail.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-4 gap-2 text-sm font-semibold">
                      <div className="col-span-2">合計</div>
                      <div className="text-center">{delivery.totalQuantity}個</div>
                      <div className="text-right">¥{delivery.totalAmount.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleFetchUndeliveredDetails}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                      disabled={isLoading || isSaving}
                    >
                      納品内容を変更
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm text-gray-600 mb-3">現在納品商品はありません</div>
                  <button
                    onClick={handleFetchUndeliveredDetails}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
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
            <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base">備考</div>
            <div className="p-3 border-x border-b border-gray-300">
              <div className="text-sm text-gray-600">
                {delivery.note || '備考はありません'}
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/Home/DeliveryList')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
    </div>
  );
}
