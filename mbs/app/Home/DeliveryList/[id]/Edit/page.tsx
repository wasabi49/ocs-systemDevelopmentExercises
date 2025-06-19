'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { Customer } from '@/app/generated/prisma';

// 納品作成時のデータ型定義（Prismaの型をベースに）
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

// 納品明細の作成時用型（一時的なIDを含む）
type OrderDetailCreate = {
  id: string; // 一時的なID（TEMP-XX形式）
  productName: string;
  unitPrice: number;
  quantity: number | '';
  description: string; // nullを許可しない
};

// ダミーの顧客データ（Prismaの型に準拠）
const DUMMY_CUSTOMERS: Customer[] = [
  { 
    id: 'C-00001', 
    storeId: 'store-001',
    name: '大阪情報専門学校',
    contactPerson: '山田太郎',
    address: '大阪府大阪市北区',
    phone: '06-1234-5678',
    deliveryCondition: '通常2-3営業日以内',
    note: '学校関連の納品は事前に連絡が必要',
    updatedAt: new Date('2025-01-01'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00002', 
    storeId: 'store-001',
    name: '株式会社スマートソリューションズ',
    contactPerson: '佐藤次郎',
    address: '大阪府大阪市中央区',
    phone: '06-2345-6789',
    deliveryCondition: '当日納品対応可',
    note: '重要顧客、優先対応',
    updatedAt: new Date('2025-01-02'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00003', 
    storeId: 'store-001',
    name: '株式会社SCC',
    contactPerson: '田中三郎',
    address: '大阪府吹田市',
    phone: '06-3456-7890',
    deliveryCondition: '午前中指定',
    note: '大口顧客',
    updatedAt: new Date('2025-01-03'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00004', 
    storeId: 'store-001',
    name: '株式会社くら寿司',
    contactPerson: '鈴木四郎',
    address: '大阪府堺市',
    phone: '072-456-7890',
    deliveryCondition: '食品関連は温度管理必須',
    note: '衛生管理に特に注意',
    updatedAt: new Date('2025-01-04'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00005', 
    storeId: 'store-001',
    name: '株式会社大阪テクノロジー',
    contactPerson: '伊藤五郎',
    address: '大阪府東大阪市',
    phone: '06-5678-9012',
    deliveryCondition: '平日10:00-18:00',
    note: 'IT関連機器専門',
    updatedAt: new Date('2025-01-05'),
    isDeleted: false,
    deletedAt: null
  }
];

// 顧客ごとの商品リスト（例）
const customerProductsMap: Record<string, { id: string; name: string; quantity: number }[]> = {
  'C-00001': [
    { id: 'P-001', name: 'ノートパソコン', quantity: 12 },
    { id: 'P-002', name: 'デスクトップPC', quantity: 8 },
    { id: 'P-003', name: 'プリンター', quantity: 3 },
  ],
  'C-00002': [
    { id: 'P-004', name: 'モニター', quantity: 25 },
    { id: 'P-005', name: 'キーボード', quantity: 5 },
    { id: 'P-006', name: 'マウス', quantity: 3 },
  ],
  'C-00003': [
    { id: 'P-007', name: 'USBメモリ', quantity: 2 },
    { id: 'P-008', name: '外付けハードディスク', quantity: 15 },
  ],
  'C-00004': [
    { id: 'P-009', name: 'POSレジ', quantity: 4 },
    { id: 'P-010', name: 'タブレット', quantity: 7 },
  ],
  'C-00005': [
    { id: 'P-011', name: 'サーバー', quantity: 1 },
    { id: 'P-012', name: 'ネットワーク機器', quantity: 10 },
  ],
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
    errors.push('納品日を入力してください');
  }

  if (!orderData.customerId.trim()) {
    errors.push('顧客を選択してください');
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  description: string;
}) => {
  if (!isOpen) return null;
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

// 商品リストポップアップコンポーネント
const ProductListModal = ({ isOpen, onClose, products, router}: { isOpen: boolean; onClose: () => void; products: { id: string; name: string; quantity: number }[]; router: ReturnType<typeof useRouter>; pathname: string }) => {
  const [checked, setChecked] = useState<(boolean | number)[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setChecked(Array(15).fill(false));
    setAdded(false); // モーダルを開くたびにリセット
  }, [isOpen, products]);

  // 追加完了後に1秒後リロード
  useEffect(() => {
    if (added) {
      const timer = setTimeout(() => {
        router.replace('/Home/DeliveryList');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [added, router]);

  if (!isOpen) return null;
  // 15行分の配列を作成
  const displayedProducts = [...products];
  while (displayedProducts.length < 15) {
    displayedProducts.push({ id: '', name: '', quantity: 0 });
  }
  const isAnyChecked = checked.some((v, idx) => displayedProducts[idx].id && v);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4 relative"
        style={{
          maxHeight: '80vh',
          minWidth: 320,
          width: '90vw',
          maxWidth: '600px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          className="absolute top-2 right-2 text-red-600 hover:text-red-800 text-3xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
        <h2 className="text-lg font-bold mb-4">商品リスト</h2>
        <div className="overflow-x-auto">
          <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            <table className="w-full min-w-[350px] border-collapse text-center text-xs sm:text-sm">
              <thead className="bg-blue-300 sticky top-0 z-10">
                <tr style={{height: '44px'}}>
                  <th className="w-[12%] border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">選択</th>
                  <th className="w-[18%] border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">注文ID</th>
                  <th className="w-[50%] border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">商品名</th>
                  <th className="w-[20%] border border-gray-400 px-1 py-1 font-semibold sm:px-2 sm:py-2">数量</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((p, idx) => (
                  <tr
                    key={idx}
                    className={`${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} h-10 transition-colors hover:bg-blue-100 sm:h-12`}
                  >
                    <td className="border border-gray-400 px-1 py-1 text-center">
                      {p.id && (
                        <input
                          type="checkbox"
                          checked={typeof checked[idx] === 'boolean' ? checked[idx] : (typeof checked[idx] === 'number' && checked[idx] > 0)}
                          onChange={e => {
                            const arr = [...checked];
                            if (e.target.checked) {
                              arr[idx] = typeof arr[idx] === 'number' && arr[idx] > 0 ? arr[idx] : 1;
                            } else {
                              arr[idx] = '';
                            }
                            setChecked(arr);
                          }}
                        />
                      )}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-center font-mono text-xs sm:px-2 sm:py-2">{p.id}</td>
                    <td className="border border-gray-400 px-1 py-1 text-left sm:px-2 sm:py-2">
                      {p.id ? (
                        <input
                          type="text"
                          className="w-full border rounded px-1 py-0.5 text-xs sm:text-sm"
                          value={p.name}
                          onChange={e => {
                            displayedProducts[idx].name = e.target.value;
                            // checkedやproductsの状態も更新したい場合は、props経由でコールバックを受け取る形に拡張可能
                            // 今回はローカルなdisplayedProductsのみ反映
                            setChecked(arr => [...arr]); // 再描画用
                          }}
                        />
                      ) : ''}
                    </td>
                    <td className="border border-gray-400 px-1 py-1 text-center font-medium sm:px-2 sm:py-2">
                      {p.id ? (
                        <select
                          className="border rounded px-1 py-0.5 text-xs sm:text-sm"
                          style={{ minWidth: "60px" }}
                          value={checked[idx] && typeof checked[idx] === 'number' ? checked[idx] : ''}
                          onChange={e => {
                            const value = Number(e.target.value);
                            const arr = [...checked];
                            arr[idx] = value;
                            setChecked(arr);
                          }}
                        >
                          <option value="" >0</option>
                          {Array.from({ length: p.quantity }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      ) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* 追加ボタンと追加完了メッセージ */}
        <div className="flex flex-col items-center mt-4 gap-2">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow border border-blue-700 text-sm disabled:bg-gray-300 disabled:text-gray-500 disabled:border-gray-300 disabled:cursor-not-allowed"
            type="button"
            disabled={!isAnyChecked}
            onClick={() => setAdded(true)}
          >
            追加
          </button>
          {added && (
            <div className="text-green-600 font-bold text-sm mt-2">追加完了</div>
          )}
        </div>
      </div>
    </div>
  );
};

// メインコンポーネント
export default function OrderCreatePage() {
  const router = useRouter();
  const pathname = usePathname();

  // 商品リストポップアップ用の状態
  const [showProductListModal, setShowProductListModal] = useState(false);
  
  // 状態管理
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
  const [] = useState<boolean>(false);
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
  
  // 顧客検索フィルター（メモ化）
  const filteredCustomers = useMemo(() => {
    if (customerSearchTerm.trim() === '') {
      return DUMMY_CUSTOMERS;
    }
    return DUMMY_CUSTOMERS.filter(c => 
      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      (c.contactPerson || '').toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customerSearchTerm]);

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

  // 成功モーダルを閉じる際の処理
  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    router.push('/Home/OrderList');
  }, [router]);

  // 選択中の顧客に応じた商品リストを取得
  const customerProducts = useMemo(() => {
    if (selectedCustomer && customerProductsMap[selectedCustomer.id]) {
      return customerProductsMap[selectedCustomer.id];
    }
    return [];
  }, [selectedCustomer]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 max-w-xl">
        <div className="flex flex-col gap-4">
          {/* 注文情報エリア（中央寄せ） */}
          <div className="w-full">
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
              
              {/* 納品日 */}
              <div>
                <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border border-black">
                  納品日
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
          
          {/* 商品リストへボタンと注意文言 */}
          <div className="flex justify-center items-center mt-2 gap-2">
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
            <button
              className="font-bold py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-base shadow-lg border-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white border-blue-700 cursor-pointer disabled:bg-gray-400 disabled:text-gray-600 disabled:border-gray-500 disabled:cursor-not-allowed"
              onClick={() => setShowProductListModal(true)}
              type="button"
              disabled={!selectedCustomer}
            >
              商品リストへ
            </button>
          </div>
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
          
          {/* 商品リストポップアップ */}
          <ProductListModal isOpen={showProductListModal} onClose={() => setShowProductListModal(false)} products={customerProducts} router={router} pathname={pathname} />
        </div>
      </div>
    </div>
  );
}