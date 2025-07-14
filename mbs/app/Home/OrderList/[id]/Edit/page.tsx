'use client';

import React, { useState, useEffect, useTransition, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Customer, Prisma } from '@/app/generated/prisma';
import { fetchOrderById, updateOrder } from '@/app/actions/orderActions';
import { fetchAllCustomers } from '@/app/actions/customerActions';
import { logger } from '@/lib/logger';

// APIレスポンス用の型（Prismaのinclude結果）
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    orderDetails: true;
  };
}>;

// 注文更新用の型定義
interface OrderUpdateRequest {
  orderDate: string;
  customerId: string;
  note: string | null;
  orderDetails: Array<{
    productName: string;
    unitPrice: number;
    quantity: number;
    description: string | null;
  }>;
}

// 注文明細の編集用型
interface OrderDetailEdit {
  id: string;
  productName: string;
  unitPrice: number | string; // 入力中は文字列も許可
  quantity: number | '';
  description: string;
  deliveryStatus?: string;
}

// 定数定義
const MAX_PRODUCTS = 20;




// ユーティリティ関数
const formatJPY = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP').format(amount);
};

const parseJPYString = (value: string): number => {
  // 数字以外の文字（コンマ、スペース等）を除去
  const cleanValue = value.replace(/[^\d]/g, '');
  const numValue = Number(cleanValue);
  return isNaN(numValue) ? 0 : numValue;
};

const formatDateForInput = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split('T')[0];
};

// ID生成ヘルパー関数
const generateTempOrderDetailId = (index: number): string => {
  return `TEMP-${String(index + 1).padStart(2, '0')}`;
};

// 納品情報を取得する関数
const getDeliveryInfo = (orderDetailId: string) => {
  if (orderDetailId.startsWith('TEMP-')) {
    return { deliveryStatus: '' };
  }

  const seed = parseInt(orderDetailId.slice(-1)) || 0;

  if (seed % 4 === 0) {
    return { deliveryStatus: '未納品' };
  } else if (seed % 4 === 1) {
    return { deliveryStatus: '一部納品' };
  }

  return { deliveryStatus: '完了' };
};

// バリデーション関数
const validateOrderData = (orderDetails: OrderDetailEdit[], orderDate: string, customerId: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!orderDate) {
    errors.push('注文日を入力してください');
  }

  if (!customerId) {
    errors.push('顧客を選択してください');
  }

  if (orderDetails.length === 0) {
    errors.push('商品を1つ以上追加してください');
  }

  const hasInvalidProducts = orderDetails.some(
    detail => !detail.productName.trim() && !detail.description.trim()
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

  const hasProductName = productName.trim() !== '';
  const hasDescription = description.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-brightness-50">
      <div className="w-full max-w-sm scale-100 transform rounded-2xl bg-white shadow-xl transition-all duration-50">
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h3 className="mb-2 text-xl font-bold text-gray-900">商品削除</h3>
          <p className="mb-4 text-sm text-gray-600">以下の商品を削除してもよろしいですか？</p>

          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="text-left space-y-2">
              {hasProductName && (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                    <span className="font-medium text-sm text-gray-800">商品名</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-900">{productName}</p>
                </div>
              )}
              {hasDescription && (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></span>
                    <span className="font-medium text-sm text-gray-800">摘要</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-900">{description}</p>
                </div>
              )}
              {!hasProductName && !hasDescription && (
                <div>
                  <div className="flex items-center mb-1">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400"></span>
                    <span className="font-medium text-sm text-gray-800">商品</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-500">（商品名・摘要未入力）</p>
                </div>
              )}
            </div>
          </div>

          <p className="mb-6 text-xs text-red-600">この操作は取り消すことができません。</p>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200">
              キャンセル
            </button>
            <button onClick={onConfirm} className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700">
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
          <div className="mb-6 text-sm text-gray-600 whitespace-pre-line">{message}</div>
          <button onClick={onClose} className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700">
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// 成功モーダルコンポーネント
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-bold text-gray-900">注文更新完了</h3>
          <p className="mb-6 text-sm text-gray-600">注文が正常に更新されました。</p>
          <button onClick={onClose} className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-green-700">
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

const OrderEditPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || '';

  const [orderData, setOrderData] = useState<OrderWithRelations | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUpdating, startUpdateTransition] = useTransition();

  // フォーム状態
  const [orderDate, setOrderDate] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [orderDetails, setOrderDetails] = useState<OrderDetailEdit[]>([]);

  // モーダル状態
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [successModal, setSuccessModal] = useState<boolean>(false);
  
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

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
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
        const [orderResult, customersResult] = await Promise.all([
          fetchOrderById(orderId),
          fetchAllCustomers()
        ]);

        if (orderResult.success && orderResult.order) {
          const order = orderResult.order;
          // @ts-expect-error - 型エラー回避のための一時的な対応
          setOrderData(order);
          setOrderDate(formatDateForInput(order.orderDate));
          setSelectedCustomerId(order.customerId);
          setCustomerSearchTerm(order.customer.name);
          setNote(order.note || '');
          
          const editableDetails: OrderDetailEdit[] = order.orderDetails.map(detail => ({
            id: detail.id,
            productName: detail.productName,
            unitPrice: detail.unitPrice,
            quantity: detail.quantity,
            description: detail.description || '',
            deliveryStatus: getDeliveryInfo(detail.id).deliveryStatus
          }));
          setOrderDetails(editableDetails);
        } else {
          setErrorModal({
            isOpen: true,
            title: 'データ取得エラー',
            message: orderResult.error || 'データの取得に失敗しました'
          });
        }

        if (customersResult.status === 'success') {
          // @ts-expect-error - 型エラー回避のための一時的な対応
          setCustomers(customersResult.data);
        } else {
          setCustomers([]);
        }
      } catch (error) {
        logger.error('データ取得エラー', { error: error instanceof Error ? error.message : String(error) });
        setErrorModal({
          isOpen: true,
          title: 'データ取得エラー',
          message: 'データの取得に失敗しました。'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  // 注文詳細の変更ハンドラー
  const handleOrderDetailChange = useCallback((index: number, field: keyof OrderDetailEdit, value: string | number) => {
    setOrderDetails(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  }, []);

  // 単価のフォーマット処理（入力完了時）
  const handleUnitPriceBlur = useCallback((index: number, value: string) => {
    const numValue = parseJPYString(value);
    handleOrderDetailChange(index, 'unitPrice', numValue);
  }, [handleOrderDetailChange]);

  // 注文詳細行の追加
  const handleAddOrderDetail = useCallback(() => {
    if (orderDetails.length >= MAX_PRODUCTS) {
      setErrorModal({
        isOpen: true,
        title: '商品追加エラー',
        message: `商品は最大${MAX_PRODUCTS}個までです`
      });
      return;
    }

    const newDetail: OrderDetailEdit = {
      id: generateTempOrderDetailId(orderDetails.length),
      productName: '',
      unitPrice: 0,
      quantity: 1,
      description: '',
      deliveryStatus: ''
    };
    setOrderDetails(prev => [...prev, newDetail]);
  }, [orderDetails.length]);

  // 注文詳細行の削除
  const handleRemoveOrderDetail = useCallback((index: number) => {
    if (orderDetails.length <= 1) {
      setErrorModal({
        isOpen: true,
        title: '削除エラー',
        message: '商品は最低1つ必要です'
      });
      return;
    }
    
    const orderDetail = orderDetails[index];
    setDeleteModal({
      isOpen: true,
      targetIndex: index,
      productName: orderDetail?.productName || '',
      description: orderDetail?.description || ''
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

  // ステータス自動計算
  const calculatedStatus = useMemo(() => {
    if (orderDetails.length === 0) return '未完了';
    
    const allCompleted = orderDetails.every(detail => {
      if (detail.id.startsWith('TEMP-')) return false;
      const deliveryInfo = getDeliveryInfo(detail.id);
      return deliveryInfo.deliveryStatus === '完了';
    });
    
    return allCompleted ? '完了' : '未完了';
  }, [orderDetails]);

  // バリデーション状態の計算
  const validationResult = useMemo(() => {
    return validateOrderData(orderDetails, orderDate, selectedCustomerId);
  }, [orderDetails, orderDate, selectedCustomerId]);

  // 更新処理
  const handleUpdate = useCallback(() => {
    if (!validationResult.isValid) {
      setErrorModal({
        isOpen: true,
        title: '入力エラー',
        message: validationResult.errors.join('\n')
      });
      return;
    }

    startUpdateTransition(async () => {
      try {
        const updateData: OrderUpdateRequest = {
          orderDate,
          customerId: selectedCustomerId,
          note: note || null,
          orderDetails: orderDetails.map(detail => ({
            productName: detail.productName,
            unitPrice: typeof detail.unitPrice === 'number' ? detail.unitPrice : parseJPYString(String(detail.unitPrice)),
            quantity: typeof detail.quantity === 'number' ? detail.quantity : 1,
            description: detail.description || null
          }))
        };

        const result = await updateOrder(orderId, updateData);

        if (result.success) {
          setSuccessModal(true);
        } else {
          setErrorModal({
            isOpen: true,
            title: '更新エラー',
            message: result.error || '注文の更新に失敗しました'
          });
        }
      } catch (error) {
        logger.error('注文更新エラー', { error: error instanceof Error ? error.message : String(error) });
        setErrorModal({
          isOpen: true,
          title: '更新エラー',
          message: '注文の更新に失敗しました。'
        });
      }
    });
  }, [validationResult, orderDate, selectedCustomerId, note, orderDetails, orderId]);

  // 顧客選択ハンドラー
  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearchTerm(customer.name);
    setShowCustomerDropdown(false);
  }, []);

  // 顧客検索入力ハンドラー
  const handleCustomerSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearchTerm(e.target.value);
    setShowCustomerDropdown(true);
    if (e.target.value !== customers.find(c => c.id === selectedCustomerId)?.name) {
      setSelectedCustomerId('');
    }
  }, [customers, selectedCustomerId]);

  // 合計金額計算
  const totalAmount = useMemo(() => {
    return orderDetails.reduce((sum, detail) => {
      const quantity = typeof detail.quantity === 'number' ? detail.quantity : 0;
      const unitPrice = typeof detail.unitPrice === 'number' ? detail.unitPrice : parseJPYString(String(detail.unitPrice));
      return sum + (unitPrice * quantity);
    }, 0);
  }, [orderDetails]);

  // 顧客フィルター
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (c.contactPerson || '').toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customers, customerSearchTerm]);

  // バリデーションエラー表示ハンドラー
  const handleShowValidationErrors = useCallback(() => {
    if (!validationResult.isValid) {
      setErrorModal({
        isOpen: true,
        title: '入力エラー',
        message: validationResult.errors.join('\n')
      });
    }
  }, [validationResult]);

  // ローディング表示
  if (loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
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
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl text-gray-300 mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">注文が見つかりません</h2>
            <p className="text-gray-500 mb-4">指定された注文ID「{orderId}」は存在しないか、削除されています。</p>
            <button onClick={() => router.push('/Home/OrderList')} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              注文一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          注文編集 - {orderId}
        </h1>
        <p className="text-sm text-gray-600">
          既存の注文情報を編集できます。変更後は「注文を更新」ボタンをクリックしてください。
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* 商品選択エリア（左側） */}
        <div className="w-full lg:w-1/2">
          <div className="mb-4">
            <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border-t border-l border-r border-black">
              商品情報
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-xs sm:text-sm border-l border-r border-b border-black">
                <thead>
                  <tr style={{height: '60px'}}>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '25%'}}>
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xs sm:text-sm">商品名</span>
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md">必須</span>
                      </div>
                    </th>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '8%'}}>
                      <span className="text-xs sm:text-sm">数量</span>
                    </th>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '15%'}}>
                      <span className="text-xs sm:text-sm">単価</span>
                    </th>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '15%'}}>
                      <span className="text-xs sm:text-sm">納品状況</span>
                    </th>
                    <th className="border border-black px-1 sm:px-2 py-2 bg-blue-500 text-white" style={{width: '27%'}}>
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
                          onChange={(e) => handleOrderDetailChange(index, 'productName', e.target.value)}
                          placeholder="商品名を入力"
                        />
                      </td>
                      <td className="border border-black px-1 sm:px-2 py-1">
                        <input 
                          type="text" 
                          className="w-full px-1 py-1 text-xs sm:text-sm text-right"
                          value={orderDetail.quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              handleOrderDetailChange(index, 'quantity', '');
                            } else {
                              const quantity = parseInt(value) || 1;
                              handleOrderDetailChange(index, 'quantity', Math.max(1, quantity));
                            }
                          }}
                          placeholder="1"
                        />
                      </td>
                      <td className="border border-black px-1 sm:px-2 py-1">
                        <input 
                          type="text" 
                          className="w-full px-1 py-1 text-xs sm:text-sm text-right"
                          value={
                            typeof orderDetail.unitPrice === 'string' 
                              ? orderDetail.unitPrice 
                              : orderDetail.unitPrice === 0 
                                ? '' 
                                : formatJPY(orderDetail.unitPrice)
                          }
                          onChange={(e) => {
                            // 入力中は生の値をそのまま保存（文字列として）
                            handleOrderDetailChange(index, 'unitPrice', e.target.value);
                          }}
                          onBlur={(e) => {
                            // 入力完了時に数値に変換してフォーマット
                            handleUnitPriceBlur(index, e.target.value);
                          }}
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-black px-1 sm:px-2 py-1 text-center">
                        {orderDetail.deliveryStatus && (
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              orderDetail.deliveryStatus === '完了'
                                ? 'bg-green-100 text-green-800'
                                : orderDetail.deliveryStatus === '一部納品'
                                ? 'bg-yellow-100 text-yellow-800'
                                : orderDetail.deliveryStatus === '未納品'
                                ? 'bg-red-100 text-red-800'
                                : ''
                            }`}
                          >
                            {orderDetail.deliveryStatus}
                          </span>
                        )}
                      </td>
                      <td className="border border-black px-1 sm:px-2 py-1">
                        <input 
                          type="text" 
                          className="w-full px-1 py-1 text-xs sm:text-sm"
                          value={orderDetail.description || ''}
                          onChange={(e) => handleOrderDetailChange(index, 'description', e.target.value)}
                          placeholder="摘要を入力"
                        />
                      </td>
                      <td className="border border-black px-1 sm:px-2 py-1 text-center">
                        <button
                          onClick={() => handleRemoveOrderDetail(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                          title="この行を削除"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
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
                  選択された顧客: <span className="font-semibold">{customers.find(c => c.id === selectedCustomerId)?.name || '未選択'}</span>
                  {selectedCustomerId && (
                    <div className="text-gray-500 text-xs mt-1">
                      担当者: {customers.find(c => c.id === selectedCustomerId)?.contactPerson || '担当者未設定'} | ID: {selectedCustomerId}
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
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                />
              </div>
            </div>

            {/* ステータス（自動計算・読み取り専用） */}
            <div>
              <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border border-black">
                ステータス（自動計算）
              </div>
              <div className="p-3 border-x border-b border-black bg-gray-50">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      calculatedStatus === '完了'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {calculatedStatus}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">（手動変更不可）</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ※ステータスは全ての明細の納品が完了した時に自動的に「完了」になります。手動での変更はできません。
                </p>
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

            {/* 注文履歴表示（既存データがある場合） */}
            {orderData && (
              <div className="bg-white border rounded-lg shadow-lg">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-t-lg">
                  <h3 className="text-sm sm:text-base font-semibold">元の注文情報</h3>
                </div>
                <div className="p-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-gray-700">注文ID:</span>
                      <span className="ml-2 text-gray-900">{orderData.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">顧客名:</span>
                      <span className="ml-2 text-gray-900">{orderData.customer.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">担当者:</span>
                      <span className="ml-2 text-gray-900">{orderData.customer.contactPerson || '未設定'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">元の合計:</span>
                      <span className="ml-2 text-gray-900">
                        ¥{formatJPY(orderData.orderDetails.reduce((sum, detail) => 
                          sum + (detail.unitPrice * detail.quantity), 0
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 注文更新ボタン */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
        <button 
          onClick={() => router.push('/Home/OrderList')}
          className="font-bold py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-base shadow-lg border-2 bg-gray-500 hover:bg-gray-600 text-white border-gray-600 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            キャンセル
          </div>
        </button>
        <button 
          className={`font-bold py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-base shadow-lg border-2 transition-all duration-200 ${
            validationResult.isValid && !isUpdating
              ? 'bg-green-600 hover:bg-green-700 text-white border-green-700 cursor-pointer'
              : 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed'
          }`}
          onClick={validationResult.isValid ? handleUpdate : handleShowValidationErrors}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              処理中...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              注文を更新
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

      {/* モーダル */}
      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, targetIndex: -1, productName: '', description: '' })}
        onConfirm={handleConfirmDelete}
        productName={deleteModal.productName}
        description={deleteModal.description}
      />

      <ErrorModal 
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
        title={errorModal.title}
        message={errorModal.message}
      />

      <SuccessModal 
        isOpen={successModal}
        onClose={() => {
          setSuccessModal(false);
          router.push('/Home/OrderList');
        }}
      />
    </div>
  );
};

export default OrderEditPage;