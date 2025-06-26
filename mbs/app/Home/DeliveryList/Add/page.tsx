'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/app/generated/prisma';
import {
  fetchUndeliveredOrderDetailsForCreate,
  createDelivery,
} from '@/app/actions/deliveryActions';
import { fetchAllCustomers } from '@/app/actions/customerActions';

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

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatDateFromInput = (inputDate: string): Date => {
  return new Date(inputDate);
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
          <h3 className="mb-2 text-xl font-bold text-green-800">納品作成完了</h3>
          <p className="mb-6 text-sm text-gray-600">納品が正常に作成されました</p>
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

// 顧客ドロップダウンコンポーネント
const CustomerDropdown = ({
  customers,
  onSelect,
  onClose,
}: {
  customers: Customer[];
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.customer-dropdown')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div className="customer-dropdown absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
      {customers.length > 0 ? (
        customers.map((customer) => (
          <div
            key={customer.id}
            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs sm:text-sm border-b last:border-b-0"
            onClick={() => onSelect(customer)}
          >
            <div className="font-semibold">{customer.name}</div>
            <div className="text-gray-500 text-xs">
              {customer.contactPerson || '担当者未設定'} | {customer.phone}
            </div>
          </div>
        ))
      ) : (
        <div className="px-3 py-2 text-gray-500 text-xs sm:text-sm">顧客が見つかりません</div>
      )}
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
        initialSelections[detail.orderDetailId] = 0;
      });
      setSelections(initialSelections);
    }
  }, [isOpen, orderDetails]);

  const handleQuantityChange = (orderDetailId: string, quantity: number) => {
    setSelections((prev) => ({
      ...prev,
      [orderDetailId]: Math.max(0, quantity),
    }));
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
                {orderDetails.map((detail) => (
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
                        max={detail.remainingQuantity}
                        value={selections[detail.orderDetailId] || 0}
                        onChange={(e) =>
                          handleQuantityChange(detail.orderDetailId, parseInt(e.target.value) || 0)
                        }
                        className="w-16 rounded border border-gray-300 px-1 py-1 text-center text-xs sm:w-20"
                      />
                    </td>
                  </tr>
                ))}
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
            disabled={isSaving || totalSelectedQuantity === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSaving ? '保存中...' : '納品作成'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DeliveryAddPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());
  const [note, setNote] = useState('');
  const [orderDetails, setOrderDetails] = useState<UndeliveredOrderDetail[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: '',
    message: '',
  });

  // 顧客データの取得
  useEffect(() => {
    const fetchCustomersData = async () => {
      try {
        const result = await fetchAllCustomers();
        if (result.status === 'success') {
          setCustomers(result.data);
        } else {
          setErrorModal({
            isOpen: true,
            title: 'エラー',
            message: result.error || '顧客データの取得に失敗しました',
          });
        }
      } catch (error) {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: '顧客データの取得中にエラーが発生しました',
        });
      }
    };

    fetchCustomersData();
  }, []);

  // 顧客検索でフィルタリング
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customers, customerSearchTerm]);

  // 顧客選択ハンドラー
  const handleSelectCustomer = useCallback(async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
    setShowCustomerDropdown(false);

    // 選択された顧客の未納品注文明細を取得
    try {
      setIsLoading(true);
      const result = await fetchUndeliveredOrderDetailsForCreate(customer.id);
      if (result.success) {
        setOrderDetails(result.orderDetails || []);
      } else {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: result.error || '未納品注文明細の取得に失敗しました',
        });
        setOrderDetails([]);
      }
    } catch (error) {
      setErrorModal({
        isOpen: true,
        title: 'エラー',
        message: '未納品注文明細の取得中にエラーが発生しました',
      });
      setOrderDetails([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 顧客検索入力ハンドラー
  const handleCustomerSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomerSearchTerm(e.target.value);
      setShowCustomerDropdown(true);
      // 検索文字列が変更されたら選択をクリア
      if (selectedCustomer && e.target.value !== selectedCustomer.name) {
        setSelectedCustomer(null);
        setOrderDetails([]);
      }
    },
    [selectedCustomer]
  );

  // 納品保存ハンドラー
  const handleSaveDelivery = useCallback(
    async (allocations: AllocationUpdate[]) => {
      if (!selectedCustomer) {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: '顧客を選択してください',
        });
        return;
      }

      if (allocations.length === 0) {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: '納品する商品を選択してください',
        });
        return;
      }

      try {
        setIsLoading(true);
        const result = await createDelivery(
          {
            customerId: selectedCustomer.id,
            deliveryDate,
            note: note.trim() || undefined,
          },
          allocations
        );

        if (result.success) {
          setShowSuccessModal(true);
        } else {
          setErrorModal({
            isOpen: true,
            title: 'エラー',
            message: result.error || '納品の作成に失敗しました',
          });
        }
      } catch (error) {
        setErrorModal({
          isOpen: true,
          title: 'エラー',
          message: '納品の作成中にエラーが発生しました',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [selectedCustomer, deliveryDate, note]
  );

  // 成功モーダルを閉じる際の処理
  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    router.push('/Home/DeliveryList');
  }, [router]);

  return (
    <div className="min-h-screen py-12 flex items-center justify-center bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">新規納品作成</h1>

          {/* 顧客情報 */}
          <div className="mb-6">
            <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base">
              顧客情報
            </div>
            <div className="p-3 border-x border-b border-gray-300">
              <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                <label className="text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap">
                  顧客
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md">必須</span>
                </label>
                <div className="flex-1 relative">
                  <div className="flex items-center">
                    <div className="absolute left-2 text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-8 pr-2 py-2 rounded text-xs sm:text-sm border"
                      value={customerSearchTerm}
                      onChange={handleCustomerSearchChange}
                      onClick={() => setShowCustomerDropdown(true)}
                      placeholder="顧客名を検索"
                    />
                  </div>

                  {showCustomerDropdown && (
                    <CustomerDropdown
                      customers={filteredCustomers}
                      onSelect={handleSelectCustomer}
                      onClose={() => setShowCustomerDropdown(false)}
                    />
                  )}
                </div>
              </div>

              <div className="text-gray-600 text-xs mt-1">
                選択された顧客:{' '}
                <span className="font-semibold">{selectedCustomer?.name || '未選択'}</span>
                {selectedCustomer && (
                  <div className="text-gray-500 text-xs mt-1">
                    担当者: {selectedCustomer.contactPerson || '担当者未設定'} | ID:{' '}
                    {selectedCustomer.id}
                  </div>
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
                value={formatDateForInput(deliveryDate)}
                onChange={(e) => setDeliveryDate(formatDateFromInput(e.target.value))}
              />
            </div>
          </div>

          {/* 備考 */}
          <div className="mb-6">
            <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base">備考</div>
            <div className="p-3 border-x border-b border-gray-300">
              <textarea
                className="w-full px-2 py-2 rounded text-xs sm:text-sm border"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="備考があれば入力してください"
              />
            </div>
          </div>

          {/* 未納品商品情報表示 */}
          {selectedCustomer && (
            <div className="mb-6">
              <div className="bg-green-500 text-white p-2 font-semibold text-sm sm:text-base">
                未納品商品情報
              </div>
              <div className="p-3 border-x border-b border-gray-300">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="text-sm text-gray-600">未納品注文明細を取得中...</div>
                  </div>
                ) : orderDetails.length > 0 ? (
                  <div>
                    <div className="text-sm text-gray-600 mb-3">
                      この顧客には {orderDetails.length} 件の未納品商品があります
                    </div>
                    <button
                      onClick={() => setShowProductModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                      disabled={isLoading}
                    >
                      納品商品を選択
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    この顧客には現在未納品の商品はありません
                  </div>
                )}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push('/Home/DeliveryList')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>

      {/* 未納品商品選択モーダル */}
      <UndeliveredProductsModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        orderDetails={orderDetails}
        onSave={handleSaveDelivery}
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
