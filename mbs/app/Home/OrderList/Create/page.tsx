'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

// 商品項目の型定義（OrderDetailに対応）
type OrderDetail = {
  id: string; // OXXXXXXX-XX形式
  orderId?: string; // 注文作成時は未定
  productName: string;
  unitPrice: number;
  quantity: number;
  description: string;
  updatedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
};

// 顧客データの型定義（ERダイアグラムに対応）
type Customer = {
  id: string; // C-XXXXX形式
  storeId: string;
  name: string;
  contactPerson: string;
  address: string;
  phone: string;
  deliveryCondition: string;
  note: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
};

// 注文データの型定義（ERダイアグラムに対応）
type Order = {
  id: string; // OXXXXXXX形式
  customerId: string;
  orderDate: string;
  note: string;
  status: '完了' | '未完了';
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
};

// 注文作成時のデータ型定義
type OrderCreateData = {
  orderDetails: OrderDetail[];
  orderDate: string;
  customerId: string;
  note: string;
};

// バリデーション結果の型定義
type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

// 定数定義
const MAX_PRODUCTS = 20;
const REQUIRED_FIELD_ERROR = '必須項目を入力してください';
const CONFIRMATION_MESSAGE = 'この商品を削除してもよろしいですか？';

// ERダイアグラムに対応したダミーの顧客データ
const DUMMY_CUSTOMERS: Customer[] = [
  { 
    id: 'C-00001', 
    storeId: 'store-001',
    name: '大阪情報専門学校',
    contactPerson: '田中太郎',
    address: '大阪府大阪市北区梅田1-1-1',
    phone: '06-1234-5678',
    deliveryCondition: '平日9:00-17:00',
    note: '教育機関',
    updatedAt: '2024-12-15T09:00:00Z',
    isDeleted: false
  },
  { 
    id: 'C-00002', 
    storeId: 'store-001',
    name: '森ノ宮病院',
    contactPerson: '佐藤花子',
    address: '大阪府大阪市中央区森ノ宮1-2-3',
    phone: '06-2345-6789',
    deliveryCondition: '24時間対応可',
    note: '医療機関',
    updatedAt: '2024-12-14T14:30:00Z',
    isDeleted: false
  },
  { 
    id: 'C-00003', 
    storeId: 'store-001',
    name: 'アイテックス株式会社',
    contactPerson: '鈴木一郎',
    address: '大阪府大阪市西区阿波座2-3-4',
    phone: '06-3456-7890',
    deliveryCondition: '平日10:00-18:00',
    note: 'IT企業',
    updatedAt: '2024-12-13T11:15:00Z',
    isDeleted: false
  },
  { 
    id: 'C-00004', 
    storeId: 'store-001',
    name: '株式会社システム開発',
    contactPerson: '高橋次郎',
    address: '大阪府大阪市淀川区新大阪3-4-5',
    phone: '06-4567-8901',
    deliveryCondition: '平日9:00-18:00',
    note: 'ソフトウェア開発',
    updatedAt: '2024-12-12T16:45:00Z',
    isDeleted: false
  },
  { 
    id: 'C-00005', 
    storeId: 'store-001',
    name: 'ヘアサロン ナニー',
    contactPerson: '山田美香',
    address: '大阪府大阪市浪速区難波4-5-6',
    phone: '06-5678-9012',
    deliveryCondition: '火曜定休 10:00-20:00',
    note: '美容サロン',
    updatedAt: '2024-12-11T13:20:00Z',
    isDeleted: false
  },
  { 
    id: 'C-00006', 
    storeId: 'store-001',
    name: '大阪デザイン専門学校',
    contactPerson: '伊藤俊介',
    address: '大阪府大阪市北区天神橋5-6-7',
    phone: '06-6789-0123',
    deliveryCondition: '平日9:00-17:00',
    note: 'デザイン教育機関',
    updatedAt: '2024-12-10T10:30:00Z',
    isDeleted: false
  },
  { 
    id: 'C-00007', 
    storeId: 'store-001',
    name: '関西電力株式会社',
    contactPerson: '渡辺健一',
    address: '大阪府大阪市北区中之島6-7-8',
    phone: '06-7890-1234',
    deliveryCondition: '平日8:30-17:30',
    note: '電力会社',
    updatedAt: '2024-12-09T15:10:00Z',
    isDeleted: false
  },
  { 
    id: 'C-00008', 
    storeId: 'store-001',
    name: '大阪メトロ株式会社',
    contactPerson: '小林雅子',
    address: '大阪府大阪市西区九条南7-8-9',
    phone: '06-8901-2345',
    deliveryCondition: '平日9:00-17:00',
    note: '交通機関',
    updatedAt: '2024-12-08T12:45:00Z',
    isDeleted: false
  }
];

// ユーティリティ関数
const formatJPY = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP').format(amount);
};

const parseJPYString = (value: string): number => {
  const numValue = Number(value.replace(/,/g, ''));
  return isNaN(numValue) ? 0 : numValue;
};

const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const formatDateFromInput = (inputDate: string): string => {
  const date = new Date(inputDate);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
};

// バリデーション関数
const validateOrderData = (orderData: OrderCreateData): ValidationResult => {
  const errors: string[] = [];

  if (orderData.orderDetails.length === 0) {
    errors.push('商品を1つ以上追加してください');
  }

  if (!orderData.orderDate.trim()) {
    errors.push('注文日を入力してください');
  }

  if (!orderData.customerId.trim()) {
    errors.push('顧客を選択してください');
  }

  // 商品の必須項目チェック
  const hasInvalidProducts = orderData.orderDetails.some(
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

// 商品テーブル行コンポーネント（削除ボタンなし）
const ProductRow = ({ 
  orderDetail, 
  index, 
  onEdit
}: {
  orderDetail: OrderDetail;
  index: number;
  onEdit: (index: number, field: keyof OrderDetail, value: string | number) => void;
}) => {
  const handlePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseJPYString(e.target.value);
    onEdit(index, 'unitPrice', numValue);
  }, [index, onEdit]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = parseInt(e.target.value) || 1;
    onEdit(index, 'quantity', Math.max(1, quantity));
  }, [index, onEdit]);

  return (
    <tr className={index % 2 === 0 ? "bg-blue-100" : "bg-white"} style={{height: '42px'}}>
      <td className="border border-black px-2 py-1">
        <input 
          type="text" 
          className="w-full px-1 py-1 text-xs sm:text-sm"
          value={orderDetail.productName}
          onChange={(e) => onEdit(index, 'productName', e.target.value)}
          placeholder="商品名を入力"
        />
      </td>
      <td className="border border-black px-2 py-1">
        <input 
          type="number" 
          className="w-full px-1 py-1 text-xs sm:text-sm text-right"
          value={orderDetail.quantity}
          min="1"
          onChange={handleQuantityChange}
        />
      </td>
      <td className="border border-black px-2 py-1">
        <input 
          type="text" 
          className="w-full px-1 py-1 text-xs sm:text-sm text-right"
          value={orderDetail.unitPrice === 0 ? '' : formatJPY(orderDetail.unitPrice)}
          onChange={handlePriceChange}
          placeholder="0"
        />
      </td>
      <td className="border border-black px-2 py-1">
        <input 
          type="text" 
          className="w-full px-1 py-1 text-xs sm:text-sm"
          value={orderDetail.description}
          onChange={(e) => onEdit(index, 'description', e.target.value)}
          placeholder="摘要を入力"
        />
      </td>
    </tr>
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
              {customer.contactPerson} | {customer.phone}
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
const generateOrderDetailId = (orderId: string, index: number): string => {
  return `${orderId}-${String(index + 1).padStart(2, '0')}`;
};

const generateTempOrderDetailId = (index: number): string => {
  return `TEMP-${String(index + 1).padStart(2, '0')}`;
};

// メインコンポーネント
export default function OrderCreatePage() {
  const router = useRouter();
  
  // 状態管理
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([
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
      quantity: 1, 
      unitPrice: 2400, 
      description: '9784813299035' 
    }
  ]);
  const [orderDate, setOrderDate] = useState<string>('2024/12/15');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // 顧客検索フィルター（メモ化）
  const filteredCustomers = useMemo(() => {
    if (customerSearchTerm.trim() === '') {
      return DUMMY_CUSTOMERS;
    }
    return DUMMY_CUSTOMERS.filter(c => 
      c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(customerSearchTerm.toLowerCase())
    );
  }, [customerSearchTerm]);
  
  // 商品追加ハンドラー
  const handleAddOrderDetail = useCallback(() => {
    if (orderDetails.length >= MAX_PRODUCTS) {
      alert(`商品は最大${MAX_PRODUCTS}個までです`);
      return;
    }
    
    const newOrderDetail: OrderDetail = {
      id: generateTempOrderDetailId(orderDetails.length),
      productName: '',
      quantity: 1,
      unitPrice: 0,
      description: ''
    };
    setOrderDetails(prev => [...prev, newOrderDetail]);
  }, [orderDetails.length]);

  // 商品編集ハンドラー
  const handleEditOrderDetail = useCallback((index: number, field: keyof OrderDetail, value: string | number) => {
    setOrderDetails(prev => {
      const updatedDetails = [...prev];
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value
      };
      return updatedDetails;
    });
  }, []);

  // 商品削除ハンドラー
  const handleDeleteOrderDetail = useCallback((index: number) => {
    if (window.confirm(CONFIRMATION_MESSAGE)) {
      setOrderDetails(prev => prev.filter((_, i) => i !== index));
    }
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

  // 注文追加ハンドラー
  const handleAddOrder = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const orderData: OrderCreateData = {
        orderDetails,
        orderDate,
        customerId: selectedCustomer?.id || '',
        note
      };
      
      const validation = validateOrderData(orderData);
      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }
      
      // 実際のAPI呼び出しをここで行う
      console.log('注文データ:', orderData);
      console.log('選択された顧客:', selectedCustomer);
      
      // 成功時の処理
      alert('注文を追加しました');
      router.push('/Home/OrderList');
      
    } catch (error) {
      console.error('注文追加エラー:', error);
      alert('注文の追加に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  }, [orderDetails, orderDate, selectedCustomer, note, router, isSubmitting]);

  // 合計金額の計算（メモ化）
  const totalAmount = useMemo(() => {
    return orderDetails.reduce((sum, detail) => sum + (detail.unitPrice * detail.quantity), 0);
  }, [orderDetails]);

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* 商品選択エリア（左側） */}
        <div className="w-full lg:w-1/2">
          <div className="mb-4">
            <div className="flex">
              <div className="flex-1">
                <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border-t border-l border-r border-black">
                  商品情報
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px] border-collapse text-xs sm:text-sm border-l border-r border-b border-black">
                    <thead>
                      <tr style={{height: '41px'}}>
                        <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[30%]">
                          <div className="flex items-center justify-center gap-2">
                            商品名
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-md">必須</span>
                          </div>
                        </th>
                        <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[15%]">数量</th>
                        <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[20%]">単価</th>
                        <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[35%]">
                          <div className="flex items-center justify-center gap-2">
                            摘要
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-md">必須</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.map((orderDetail, index) => (
                        <ProductRow
                          key={orderDetail.id}
                          orderDetail={orderDetail}
                          index={index}
                          onEdit={handleEditOrderDetail}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* 削除ボタンエリア（テーブル右横） */}
              <div className="flex flex-col w-16 ml-2">
                {/* ヘッダーのスペーサー */}
                <div style={{height: '74px'}}></div>
                {orderDetails.map((orderDetail, index) => (
                  <div 
                    key={orderDetail.id} 
                    className="flex items-center justify-center"
                    style={{height: '42px'}}
                  >
                    <button 
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded transition-colors duration-200"
                      onClick={() => handleDeleteOrderDetail(index)}
                      title="商品を削除"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 追加ボタン */}
            <div className="mt-2">
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded text-xs sm:text-sm disabled:opacity-50"
                onClick={handleAddOrderDetail}
                disabled={orderDetails.length >= MAX_PRODUCTS}
              >
                追加
              </button>
            </div>
            
            {/* 合計金額表示 */}
            <div className="mt-2 text-right font-semibold text-sm">
              合計金額: ¥{formatJPY(totalAmount)}
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
                <div className="flex items-center mb-2">
                  <label className="text-xs sm:text-sm flex items-center mr-2 gap-2">
                    顧客
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-md">必須</span>
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
                      担当者: {selectedCustomer.contactPerson} | ID: {selectedCustomer.id}
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
                  className="w-full px-2 py-2 rounded text-xs sm:text-sm min-h-[120px] border border-black"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="備考を入力してください"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 追加ボタン */}
      <div className="flex justify-center mt-6">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleAddOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? '処理中...' : '追加'}
        </button>
      </div>
    </div>
  );
}