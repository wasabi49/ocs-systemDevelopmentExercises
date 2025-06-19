'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Customer } from '@/app/generated/prisma';

// 注文作成時のデータ型定義（Prismaの型をベースに）
type OrderCreateData = {
  orderDetails: {
    productName: string;
    unitPrice: number;
    quantity: number;
    description: string | null;
  }[];
  orderDate: Date;
  customerId: string;
  note: string | null;
};

// バリデーション結果の型定義
type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

// 注文明細の作成時用型（一時的なIDを含む）
type OrderDetailCreate = {
  id: string; // 一時的なID（TEMP-XX形式）
  productName: string;
  unitPrice: number;
  quantity: number | '';
  description: string; // nullを許可しない
};

// 定数定義
const MAX_PRODUCTS = 20;

// 顧客データ取得関数
const fetchCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await fetch('/api/customers');
    const result = await response.json();
    if (result.success) {
      return result.customers;
    }
    return [];
  } catch (error) {
    console.error('顧客データ取得エラー:', error);
    return [];
  }
};

// ユーティリティ関数
const formatJPY = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP').format(amount);
};

const parseJPYString = (value: string): number => {
  const numValue = Number(value.replace(/,/g, ''));
  return isNaN(numValue) ? 0 : numValue;
};

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatDateFromInput = (inputDate: string): Date => {
  return new Date(inputDate);
};

// バリデーション関数
const validateOrderData = (orderData: OrderCreateData): ValidationResult => {
  const errors: string[] = [];

  if (orderData.orderDetails.length === 0) {
    errors.push('商品を1つ以上追加してください');
  }

  if (!orderData.orderDate) {
    errors.push('注文日を入力してください');
  }

  if (!orderData.customerId.trim()) {
    errors.push('顧客を選択してください');
  }

  // 商品の必須項目チェック
  const hasInvalidProducts = orderData.orderDetails.some(
    detail => !detail.productName.trim() && !(detail.description || '').trim()
  );

  if (hasInvalidProducts) {
    errors.push('各商品の商品名または摘要を入力してください');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// 削除確認モーダルコンポーネント
const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productName,
  description
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  description: string;
}) => {
  if (!isOpen) return null;

  // 表示する情報を決定
  const hasProductName = productName.trim() !== '';
  const hasDescription = description.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-brightness-50">
      <div className="w-full max-w-sm scale-100 transform rounded-2xl bg-white shadow-xl transition-all duration-50">
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

          <h3 className="mb-2 text-xl font-bold text-gray-900">商品削除</h3>

          <p className="mb-4 text-sm text-gray-600">以下の商品を削除してもよろしいですか？</p>

          {/* 削除対象商品の表示 */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="text-left space-y-2">
              {hasProductName && (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                    <span className="font-medium text-sm text-gray-800">商品名</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-900">
                    {productName}
                  </p>
                </div>
              )}
              {hasDescription && (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></span>
                    <span className="font-medium text-sm text-gray-800">摘要</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-900">
                    {description}
                  </p>
                </div>
              )}
              {!hasProductName && !hasDescription && (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400"></span>
                    <span className="font-medium text-sm text-gray-800">商品</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-500">
                    （商品名・摘要未入力）
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="mb-6 text-xs text-red-600">
            この操作は取り消すことができません。
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700"
            >
              削除
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
  message
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
          {/* エラーアイコン */}
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

// 成功ポップアップコンポーネント
const SuccessModal = ({ 
  isOpen, 
  onClose 
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-brightness-50">
      <div className="w-full max-w-sm scale-100 transform rounded-2xl bg-white shadow-xl transition-all duration-50">
        <div className="p-6 text-center">
          {/* 成功アイコン */}
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

          <h3 className="mb-2 text-xl font-bold text-gray-900">注文追加完了</h3>
          <p className="mb-6 text-sm text-gray-600">注文が正常に追加されました。</p>

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

// 顧客検索ドロップダウンコンポーネント
const CustomerDropdown = ({ 
  customers, 
  onSelect, 
  onClose 
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

// ID生成ヘルパー関数
const generateTempOrderDetailId = (index: number): string => {
  return `TEMP-${String(index + 1).padStart(2, '0')}`;
};

// メインコンポーネント
export default function OrderCreatePage() {
  const router = useRouter();

  // 状態管理
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetailCreate[]>([
    { 
      id: generateTempOrderDetailId(0), 
      productName: 'IT情報コンサルメント', 
      quantity: 2, 
      unitPrice: 3500, 
      description: '' 
    },
    { 
      id: generateTempOrderDetailId(1), 
      productName: '', 
      quantity: '', 
      unitPrice: 2400, 
      description: '9784813299035' 
    }
  ]);
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);

  // 削除モーダル関連の状態
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    targetIndex: number;
    productName: string;
    description: string;
  }>({
    isOpen: false,
    targetIndex: -1,
    productName: '',
    description: ''
  });

  // エラーモーダル関連の状態
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  // 顧客データを取得するuseEffect
  useEffect(() => {
    const loadCustomers = async () => {
      const customerData = await fetchCustomers();
      setCustomers(customerData);
    };
    loadCustomers();
  }, []);

  // 顧客検索フィルター（実際のデータを使用）
  const filteredCustomers = useMemo(() => {
    if (customerSearchTerm.trim() === '') {
      return customers;
    }
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (c.contactPerson || '').toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customerSearchTerm, customers]);

  // バリデーション状態の計算（メモ化）
  const validationResult = useMemo(() => {
    const orderDetailsForValidation = orderDetails.map(detail => ({
      productName: detail.productName,
      unitPrice: detail.unitPrice,
      quantity: typeof detail.quantity === 'number' ? detail.quantity : 1,
      description: detail.description || null
    }));

    const orderData: OrderCreateData = {
      orderDetails: orderDetailsForValidation,
      orderDate,
      customerId: selectedCustomer?.id || '',
      note: note || null
    };

    return validateOrderData(orderData);
  }, [orderDetails, orderDate, selectedCustomer, note]);

  // 商品追加ハンドラー
  const handleAddOrderDetail = useCallback(() => {
    if (orderDetails.length >= MAX_PRODUCTS) {
      setErrorModal({
        isOpen: true,
        title: '商品追加エラー',
        message: `商品は最大${MAX_PRODUCTS}個までです`
      });
      return;
    }

    const newOrderDetail: OrderDetailCreate = {
      id: generateTempOrderDetailId(orderDetails.length),
      productName: '',
      quantity: '',
      unitPrice: 0,
      description: ''
    };
    setOrderDetails(prev => [...prev, newOrderDetail]);
  }, [orderDetails.length]);

  // 商品編集ハンドラー
  const handleEditOrderDetail = useCallback((index: number, field: keyof OrderDetailCreate, value: string | number) => {
    setOrderDetails(prev => {
      const updatedDetails = [...prev];
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value
      };
      return updatedDetails;
    });
  }, []);

  // 商品削除ハンドラー（モーダル表示）
  const handleDeleteOrderDetail = useCallback((index: number) => {
    if (orderDetails.length <= 1) {
      setErrorModal({
        isOpen: true,
        title: '削除エラー',
        message: '商品は最低1つ必要です'
      });
      return;
    }

    const orderDetail = orderDetails[index];
    const productName = orderDetail?.productName || '';
    const description = orderDetail?.description || '';

    setDeleteModal({
      isOpen: true,
      targetIndex: index,
      productName: productName,
      description: description
    });
  }, [orderDetails]);

  // 削除確定ハンドラー
  const handleConfirmDelete = useCallback(() => {
    const { targetIndex } = deleteModal;
    if (targetIndex >= 0) {
      setOrderDetails(prev => prev.filter((_, i) => i !== targetIndex));
    }
    setDeleteModal({
      isOpen: false,
      targetIndex: -1,
      productName: '',
      description: ''
    });
  }, [deleteModal]);

  // 削除キャンセルハンドラー
  const handleCancelDelete = useCallback(() => {
    setDeleteModal({
      isOpen: false,
      targetIndex: -1,
      productName: '',
      description: ''
    });
  }, []);

  // エラーモーダルを閉じるハンドラー
  const handleCloseErrorModal = useCallback(() => {
    setErrorModal({
      isOpen: false,
      title: '',
      message: ''
    });
  }, []);

  // 顧客選択ハンドラー
  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchTerm(customer.name);
    setShowCustomerDropdown(false);
  }, []);

  // 顧客検索入力ハンドラー
  const handleCustomerSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearchTerm(e.target.value);
    setShowCustomerDropdown(true);
    // 検索文字列が変更されたら選択をクリア
    if (selectedCustomer && e.target.value !== selectedCustomer.name) {
      setSelectedCustomer(null);
    }
  }, [selectedCustomer]);

  // 注文追加ハンドラー（実際のAPI呼び出し版）
  const handleAddOrder = useCallback(async () => {
    if (isSubmitting || !validationResult.isValid) return;

    setIsSubmitting(true);

    try {
      // OrderDetailCreateからAPIの型に変換
      const orderDetailsForCreate = orderDetails.map(detail => ({
        productName: detail.productName,
        unitPrice: detail.unitPrice, // Float型として送信
        quantity: typeof detail.quantity === 'number' ? detail.quantity : 1,
        description: detail.description || null
      }));

      // API呼び出し用のデータ作成
      const apiData = {
        orderDetails: orderDetailsForCreate,
        orderDate: orderDate.toISOString(), // Dateオブジェクトを文字列に変換
        customerId: selectedCustomer?.id || '',
        note: note || null
      };

      console.log('送信する注文データ:', apiData);

      // 実際のAPI呼び出し
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'APIエラーが発生しました');
      }

      if (result.success) {
        console.log('注文が正常に作成されました:', result.data);
        
        // 成功時は入力フォームをリセット
        setOrderDetails([
          { 
            id: generateTempOrderDetailId(0), 
            productName: '', 
            quantity: '', 
            unitPrice: 0, 
            description: '' 
          }
        ]);
        setSelectedCustomer(null);
        setCustomerSearchTerm('');
        setNote('');
        setOrderDate(new Date());
        
        // 成功モーダルを表示
        setShowSuccessModal(true);
      } else {
        // APIからのエラーメッセージを表示
        setErrorModal({
          isOpen: true,
          title: '注文追加エラー',
          message: result.error || '注文の追加に失敗しました。'
        });
      }

    } catch (error) {
      // ネットワークエラーや予期しないエラーの処理
      console.error('注文作成中にエラーが発生:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : '注文の追加に失敗しました。もう一度お試しください。';
      
      setErrorModal({
        isOpen: true,
        title: '注文追加エラー',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [orderDetails, orderDate, selectedCustomer, note, isSubmitting, validationResult.isValid]);

  // 成功モーダルを閉じる際の処理
  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    router.push('/Home/OrderList');
  }, [router]);

  // 無効な理由を表示するハンドラー
  const handleShowValidationErrors = useCallback(() => {
    if (!validationResult.isValid) {
      setErrorModal({
        isOpen: true,
        title: '入力エラー',
        message: validationResult.errors.join('\n')
      });
    }
  }, [validationResult]);

  // 合計金額の計算（メモ化）
  const totalAmount = useMemo(() => {
    return orderDetails.reduce((sum, detail) => {
      const quantity = typeof detail.quantity === 'number' ? detail.quantity : 0;
      return sum + (detail.unitPrice * quantity);
    }, 0);
  }, [orderDetails]);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* 商品選択エリア（左側） */}
        <div className="w-full lg:w-1/2">
          <div className="mb-4">
            <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border-t border-l border-r border-black">
              商品情報
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-xs sm:text-sm border-l border-r border-b border-black">
                <thead>
                  <tr style={{height: '60px'}}>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '35%'}}>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs sm:text-sm">商品名</span>
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md">必須</span>
                      </div>
                    </th>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '12%'}}>
                      <span className="text-xs sm:text-sm">数量</span>
                    </th>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '18%'}}>
                      <span className="text-xs sm:text-sm">単価</span>
                    </th>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '25%'}}>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs sm:text-sm">摘要</span>
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md">必須</span>
                      </div>
                    </th>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '10%'}}>
                      <span className="text-xs sm:text-sm">削除</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.map((orderDetail, index) => (
                    <tr key={orderDetail.id} className={index % 2 === 0 ? "bg-blue-100" : "bg-white"} style={{height: '42px'}}>
                      <td className="border border-black px-1 sm:px-2 py-1">
                        <input 
                          type="text" 
                          className="w-full px-1 py-1 text-xs sm:text-sm"
                          value={orderDetail.productName}
                          onChange={(e) => handleEditOrderDetail(index, 'productName', e.target.value)}
                          placeholder="商品名を入力"
                        />
                      </td>
                      <td className="border border-black px-1 sm:px-2 py-1">
                        <input 
                          type="number" 
                          className="w-full px-1 py-1 text-xs sm:text-sm text-right"
                          value={orderDetail.quantity}
                          min="1"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              handleEditOrderDetail(index, 'quantity', '');
                            } else {
                              const quantity = parseInt(value) || 1;
                              handleEditOrderDetail(index, 'quantity', Math.max(1, quantity));
                            }
                          }}
                          placeholder=""
                        />
                      </td>
                      <td className="border border-black px-1 sm:px-2 py-1">
                        <input 
                          type="text" 
                          className="w-full px-1 py-1 text-xs sm:text-sm text-right"
                          value={orderDetail.unitPrice === 0 ? '' : formatJPY(orderDetail.unitPrice)}
                          onChange={(e) => {
                            const numValue = parseJPYString(e.target.value);
                            handleEditOrderDetail(index, 'unitPrice', numValue);
                          }}
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-black px-1 sm:px-2 py-1">
                        <input 
                          type="text" 
                          className="w-full px-1 py-1 text-xs sm:text-sm"
                          value={orderDetail.description || ''}
                          onChange={(e) => handleEditOrderDetail(index, 'description', e.target.value)}
                          placeholder="摘要を入力"
                        />
                      </td>
                      <td className="border border-black px-1 sm:px-2 py-1 text-center">
                        <button
                          onClick={() => handleDeleteOrderDetail(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                          title="この行を削除"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 追加ボタン */}
            <div className="mt-2">
              <button 
                className="bg-blue-400 hover:bg-blue-500 text-white font-medium py-1 px-3 rounded text-xs border border-blue-500"
                onClick={handleAddOrderDetail}
                disabled={orderDetails.length >= MAX_PRODUCTS}
              >
                + 行を追加
              </button>
            </div>

            {/* 合計金額表示 */}
            <div className="mt-2 font-semibold text-sm">
              <div className="text-right">
                合計金額: ¥{totalAmount.toLocaleString()}
              </div>
            </div>

            {/* 注意書き */}
            <div className="mt-2 text-red-500 text-xs">
              商品名または摘要欄の項目は必須です
              <br />
              商品は最大{MAX_PRODUCTS}個までです
            </div>
          </div>
        </div>

        {/* 注文情報エリア（右側） */}
        <div className="w-full lg:w-1/2">
          <div className="flex flex-col gap-4">
            {/* 顧客情報 */}
            <div>
              <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border border-black">
                顧客情報
              </div>
              <div className="p-3 border-x border-b border-black">
                <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                  <label className="text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap">
                    顧客
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md">必須</span>
                  </label>
                  <div className="flex-1 relative">
                    <div className="flex items-center">
                      <div className="absolute left-2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                  選択された顧客: <span className="font-semibold">{selectedCustomer?.name || '未選択'}</span>
                  {selectedCustomer && (
                    <div className="text-gray-500 text-xs mt-1">
                      担当者: {selectedCustomer.contactPerson || '担当者未設定'} | ID: {selectedCustomer.id}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 注文日 */}
            <div>
              <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border border-black">
                注文日
              </div>
              <div className="p-3 border-x border-b border-black">
                <input 
                  type="date" 
                  className="w-full px-2 py-2 rounded text-xs sm:text-sm border border-black"
                  value={formatDateForInput(orderDate)}
                  onChange={(e) => setOrderDate(formatDateFromInput(e.target.value))}
                />
              </div>
            </div>

            {/* 備考欄 */}
            <div>
              <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border border-black">
                備考
              </div>
              <div className="p-3 border-x border-b border-black">
                <textarea 
                  className="w-full px-2 py-2 rounded text-xs sm:text-sm min-h-[100px] sm:min-h-[120px] border border-black"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="備考を入力してください"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 注文追加ボタン */}
      <div className="flex justify-center mt-6">
        <button 
          className={`font-bold py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-base shadow-lg border-2 transition-all duration-200 ${
            validationResult.isValid && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 cursor-pointer'
              : 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed'
          }`}
          onClick={validationResult.isValid ? handleAddOrder : handleShowValidationErrors}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              処理中...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              注文を追加
            </div>
          )}
        </button>
      </div>

      {/* バリデーションエラー表示（モバイル用） */}
      {!validationResult.isValid && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700 text-xs sm:text-sm font-semibold mb-2">以下の項目を確認してください：</div>
          <ul className="text-red-600 text-xs space-y-1">
            {validationResult.errors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 成功ポップアップ */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
      />

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        productName={deleteModal.productName}
        description={deleteModal.description}
      />

      {/* エラーモーダル */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={handleCloseErrorModal}
        title={errorModal.title}
        message={errorModal.message}
      />
    </div>
  );
}