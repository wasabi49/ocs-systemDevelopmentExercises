'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { Customer } from '@/app/generated/prisma';

// 注文更新時のデータ型定義
type OrderUpdateData = {
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

// 注文明細の編集用型
type OrderDetailEdit = {
  id: string; // 既存IDまたは一時的なID（TEMP-XX形式）
  productName: string;
  unitPrice: number;
  quantity: number;
  description: string;
  deliveryStatus?: string; // 既存商品の場合のみ
};

// 定数定義
const MAX_PRODUCTS = 20;

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
  },
  { 
    id: 'C-00006', 
    storeId: 'store-001',
    name: '関西医科大学',
    contactPerson: '高橋六郎',
    address: '大阪府枚方市',
    phone: '072-678-9012',
    deliveryCondition: '医療機器は慎重配送',
    note: '医療関連機関',
    updatedAt: new Date('2025-01-06'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00007', 
    storeId: 'store-001',
    name: 'グローバル貿易株式会社',
    contactPerson: '中村七海',
    address: '大阪府豊中市',
    phone: '06-7890-1234',
    deliveryCondition: '国際便対応可',
    note: '輸出入関連',
    updatedAt: new Date('2025-01-07'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00008', 
    storeId: 'store-001',
    name: '大阪市立図書館',
    contactPerson: '小林八雲',
    address: '大阪府大阪市西区',
    phone: '06-8901-2345',
    deliveryCondition: '図書館開館時間内',
    note: '公共機関',
    updatedAt: new Date('2025-01-08'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00009', 
    storeId: 'store-001',
    name: '近畿大学',
    contactPerson: '松本九十',
    address: '大阪府東大阪市',
    phone: '06-9012-3456',
    deliveryCondition: '大学構内配送可',
    note: '教育機関',
    updatedAt: new Date('2025-01-09'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00010', 
    storeId: 'store-001',
    name: '株式会社関西出版',
    contactPerson: '渡辺十郎',
    address: '大阪府大阪市中央区',
    phone: '06-0123-4567',
    deliveryCondition: '出版関連は梱包厳重',
    note: '出版業界',
    updatedAt: new Date('2025-01-10'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00011', 
    storeId: 'store-001',
    name: 'さくら幼稚園',
    contactPerson: '斎藤春子',
    address: '大阪府吹田市',
    phone: '06-1234-6789',
    deliveryCondition: '子供の安全を最優先',
    note: '教育機関',
    updatedAt: new Date('2025-01-11'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00012', 
    storeId: 'store-001',
    name: '大阪府立高校',
    contactPerson: '加藤夏子',
    address: '大阪府大阪市天王寺区',
    phone: '06-2345-7890',
    deliveryCondition: '学校行事期間を避ける',
    note: '公立学校',
    updatedAt: new Date('2025-01-12'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00013', 
    storeId: 'store-001',
    name: '株式会社大阪エンジニアリング',
    contactPerson: '山本秋雄',
    address: '大阪府堺市北区',
    phone: '072-3456-7890',
    deliveryCondition: '精密機器は振動注意',
    note: '製造業',
    updatedAt: new Date('2025-01-13'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00014', 
    storeId: 'store-001',
    name: '関西料理学校',
    contactPerson: '木村冬彦',
    address: '大阪府大阪市浪速区',
    phone: '06-4567-8901',
    deliveryCondition: '食品関連機材は清潔配送',
    note: '専門学校',
    updatedAt: new Date('2025-01-14'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00015', 
    storeId: 'store-001',
    name: '大阪アート美術館',
    contactPerson: '井上春夫',
    address: '大阪府大阪市北区',
    phone: '06-5678-9012',
    deliveryCondition: '美術品は温湿度管理必須',
    note: '文化施設',
    updatedAt: new Date('2025-01-15'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00016', 
    storeId: 'store-001',
    name: '関西経済研究所',
    contactPerson: '佐々木夏子',
    address: '大阪府大阪市中央区',
    phone: '06-6789-0123',
    deliveryCondition: '機密文書取扱注意',
    note: '研究機関',
    updatedAt: new Date('2025-01-16'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00017', 
    storeId: 'store-001',
    name: '大阪音楽院',
    contactPerson: '山下秋男',
    address: '大阪府豊中市',
    phone: '06-7890-1234',
    deliveryCondition: '楽器は衝撃厳禁',
    note: '音楽教育機関',
    updatedAt: new Date('2025-01-17'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00018', 
    storeId: 'store-001',
    name: '関西健康センター',
    contactPerson: '中島冬美',
    address: '大阪府東大阪市',
    phone: '06-8901-2345',
    deliveryCondition: '医療機器は滅菌済み配送',
    note: '医療関連',
    updatedAt: new Date('2025-01-18'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00019', 
    storeId: 'store-001',
    name: '大阪ITスクール',
    contactPerson: '田村春樹',
    address: '大阪府大阪市西区',
    phone: '06-9012-3456',
    deliveryCondition: 'IT機器は静電気対策必須',
    note: 'IT教育機関',
    updatedAt: new Date('2025-01-19'),
    isDeleted: false,
    deletedAt: null
  },
  { 
    id: 'C-00020', 
    storeId: 'store-001',
    name: '関西メディカルセンター',
    contactPerson: '小川夏菜',
    address: '大阪府枚方市',
    phone: '072-0123-4567',
    deliveryCondition: '24時間緊急対応可',
    note: '医療機関',
    updatedAt: new Date('2025-01-20'),
    isDeleted: false,
    deletedAt: null
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

const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatDateFromInput = (inputDate: string): Date => {
  return new Date(inputDate);
};

// バリデーション関数
const validateOrderData = (orderData: OrderUpdateData): ValidationResult => {
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

// 商品テーブル行コンポーネント
const ProductRow = ({ 
  orderDetail, 
  index, 
  onEdit
}: {
  orderDetail: OrderDetailEdit;
  index: number;
  onEdit: (index: number, field: keyof OrderDetailEdit, value: string | number) => void;
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
      <td className="border border-black px-2 py-1 text-center">
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
      <td className="border border-black px-2 py-1">
        <input 
          type="text" 
          className="w-full px-1 py-1 text-xs sm:text-sm"
          value={orderDetail.description || ''}
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

// 納品情報を取得する関数
const getDeliveryInfo = (orderDetailId: string, orderQuantity: number) => {
  // 一時的なIDの場合は納品情報なし
  if (orderDetailId.startsWith('TEMP-')) {
    return { deliveryStatus: '' };
  }

  const seed = parseInt(orderDetailId.slice(-1)) || 0;
  const deliveryCount = Math.floor(seed / 2) + 1;
  const allocations = [];
  let totalDelivered = 0;

  const maxDeliverable = orderQuantity;

  for (let i = 0; i < deliveryCount && totalDelivered < maxDeliverable; i++) {
    const deliveryDate = new Date(2025, 0, 1 + i * 7);
    const remaining = maxDeliverable - totalDelivered;
    let allocatedQuantity;
    
    if (i === deliveryCount - 1) {
      allocatedQuantity = remaining;
    } else {
      const ratio = 0.3 + (seed % 4) * 0.1;
      allocatedQuantity = Math.min(Math.ceil(maxDeliverable * ratio), remaining);
    }

    if (allocatedQuantity > 0) {
      const deliveryId = `D${String(seed + i + 1).padStart(6, '0')}`;
      const deliveryDetailId = `${deliveryId}-${String(i + 1).padStart(2, '0')}`;
      
      allocations.push({
        deliveryDetailId,
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        allocatedQuantity,
        deliveryId
      });
      totalDelivered += allocatedQuantity;
    }
  }

  let status = '未納品';
  if (totalDelivered >= orderQuantity) {
    status = '完了';
  } else if (totalDelivered > 0) {
    status = '一部納品';
  }

  if (seed % 4 === 0) {
    return { deliveryStatus: '未納品' };
  } else if (seed % 4 === 1) {
    return { deliveryStatus: '一部納品' };
  }

  return { deliveryStatus: status };
};

// メインコンポーネント
export default function OrderEditPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = (params?.id as string) || '';
  
  // 状態管理
  const [orderDetails, setOrderDetails] = useState<OrderDetailEdit[]>([]);
  const [orderDate, setOrderDate] = useState<Date>(new Date());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
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

  // 既存注文データの読み込み
  const loadOrderData = useCallback(async () => {
    try {
      // 注文明細ページと同じロジックでダミーデータを生成
      const fallbackCustomers = [
        { id: 'C-00001', name: '大阪情報専門学校', contactPerson: '山田太郎' },
        { id: 'C-00002', name: '株式会社スマートソリューションズ', contactPerson: '佐藤次郎' },
        { id: 'C-00003', name: '株式会社SCC', contactPerson: '田中三郎' },
        { id: 'C-00004', name: '株式会社くら寿司', contactPerson: '鈴木四郎' },
        { id: 'C-00005', name: '株式会社大阪テクノロジー', contactPerson: '伊藤五郎' },
        { id: 'C-00006', name: '関西医科大学', contactPerson: '高橋六郎' },
        { id: 'C-00007', name: 'グローバル貿易株式会社', contactPerson: '中村七海' },
        { id: 'C-00008', name: '大阪市立図書館', contactPerson: '小林八雲' },
        { id: 'C-00009', name: '近畿大学', contactPerson: '松本九十' },
        { id: 'C-00010', name: '株式会社関西出版', contactPerson: '渡辺十郎' },
        { id: 'C-00011', name: 'さくら幼稚園', contactPerson: '斎藤春子' },
        { id: 'C-00012', name: '大阪府立高校', contactPerson: '加藤夏子' },
        { id: 'C-00013', name: '株式会社大阪エンジニアリング', contactPerson: '山本秋雄' },
        { id: 'C-00014', name: '関西料理学校', contactPerson: '木村冬彦' },
        { id: 'C-00015', name: '大阪アート美術館', contactPerson: '井上春夫' },
        { id: 'C-00016', name: '関西経済研究所', contactPerson: '佐々木夏子' },
        { id: 'C-00017', name: '大阪音楽院', contactPerson: '山下秋男' },
        { id: 'C-00018', name: '関西健康センター', contactPerson: '中島冬美' },
        { id: 'C-00019', name: '大阪ITスクール', contactPerson: '田村春樹' },
        { id: 'C-00020', name: '関西メディカルセンター', contactPerson: '小川夏菜' },
      ];

      // 商品データ
      const fallbackProducts = [
        { name: '世界の名著シリーズ', price: 12000 },
        { name: '現代文学全集', price: 15000 },
        { name: 'プログラミング入門書', price: 5000 },
        { name: 'ビジネス戦略ガイド', price: 3000 },
        { name: '英語学習教材セット', price: 8500 },
        { name: '日本の歴史図鑑', price: 5000 },
        { name: '子供向け絵本セット', price: 3000 },
        { name: 'デザイン年鑑', price: 8000 },
        { name: '美術全集', price: 30000 },
        { name: '専門用語辞典', price: 5000 },
        { name: 'AI入門ガイド', price: 6500 },
        { name: 'データサイエンス実践書', price: 7800 },
        { name: '世界経済年鑑', price: 9200 },
        { name: '健康医学事典', price: 11000 },
        { name: '料理レシピ大全', price: 4500 },
        { name: '建築デザイン集', price: 15800 },
        { name: '写真集・日本の風景', price: 12500 },
        { name: 'クラシック名曲解説', price: 6800 },
        { name: '現代アート図録', price: 18000 },
        { name: '日本文学選集', price: 9800 },
        { name: '科学実験図鑑', price: 7200 },
        { name: '世界遺産ガイド', price: 5600 },
        { name: 'プログラミング言語辞典', price: 8900 },
        { name: 'ビジネスマナー教本', price: 3200 },
        { name: '子育てハンドブック', price: 4100 },
        { name: '心理学入門', price: 5300 },
        { name: '環境問題資料集', price: 6700 },
        { name: '宇宙科学図鑑', price: 9500 },
        { name: 'スポーツトレーニング指南', price: 4800 },
        { name: '日本の伝統工芸', price: 11200 },
      ];

      // シード値を使った決定的な生成
      const getSeededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      const orderSeed = parseInt(orderId.replace(/\D/g, '')) || 1;
      const orderNumber = parseInt(orderId.replace(/^O0*/, '')) || 1;
      const customerIndex = (orderNumber - 1) % 20;
      const selectedCustomerData = fallbackCustomers[customerIndex];

      // 顧客データを設定
      const customer = DUMMY_CUSTOMERS.find(c => c.id === selectedCustomerData.id) || DUMMY_CUSTOMERS[0];
      setSelectedCustomer(customer);
      setCustomerSearchTerm(customer.name);

      // 注文日を設定
      setOrderDate(new Date('2025-01-01'));

      // 備考を設定
      setNote(`${customer.name}からの注文`);

      // 商品明細を生成（編集可能）
      const detailCount = Math.floor(getSeededRandom(orderSeed) * 3) + 2;
      const generatedDetails: OrderDetailEdit[] = [];

      for (let i = 1; i <= detailCount; i++) {
        const productIndex = Math.floor(getSeededRandom(orderSeed + i) * fallbackProducts.length);
        const product = fallbackProducts[productIndex];
        const quantity = Math.floor(getSeededRandom(orderSeed + i + 100) * 10) + 1;

        const orderDetailId = `${orderId}-${String(i).padStart(2, '0')}`;
        const deliveryInfo = getDeliveryInfo(orderDetailId, quantity);

        generatedDetails.push({
          id: orderDetailId,
          productName: product.name,
          unitPrice: product.price,
          quantity: quantity,
          description: `${customer.name}向け商品`,
          deliveryStatus: deliveryInfo.deliveryStatus
        });
      }

      setOrderDetails(generatedDetails);

    } catch (error) {
      console.error('注文データの読み込みに失敗しました:', error);
      alert('注文データの読み込みに失敗しました。');
    }
  }, [orderId]);

  // ページ読み込み時に既存データを取得
  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId, loadOrderData]);
  
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
  
  // 商品追加ハンドラー
  const handleAddOrderDetail = useCallback(() => {
    if (orderDetails.length >= MAX_PRODUCTS) {
      alert(`商品は最大${MAX_PRODUCTS}個までです`);
      return;
    }
    
    const newOrderDetail: OrderDetailEdit = {
      id: generateTempOrderDetailId(orderDetails.length),
      productName: '',
      quantity: 1,
      unitPrice: 0,
      description: '',
      deliveryStatus: '' // 新規商品は納品状況なし
    };
    setOrderDetails(prev => [...prev, newOrderDetail]);
  }, [orderDetails.length]);

  // 商品編集ハンドラー
  const handleEditOrderDetail = useCallback((index: number, field: keyof OrderDetailEdit, value: string | number) => {
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

  // 注文更新ハンドラー
  const handleUpdateOrder = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // OrderDetailEditからPrismaの型に変換
      const orderDetailsForUpdate = orderDetails.map(detail => ({
        productName: detail.productName,
        unitPrice: detail.unitPrice,
        quantity: detail.quantity,
        description: detail.description || null
      }));

      const orderData: OrderUpdateData = {
        orderDetails: orderDetailsForUpdate,
        orderDate,
        customerId: selectedCustomer?.id || '',
        note: note || null
      };
      
      const validation = validateOrderData(orderData);
      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }
      
      // 実際のAPI呼び出しをここで行う
      // console.log('注文更新データ:', orderData);
      // console.log('選択された顧客:', selectedCustomer);
      
      // 成功時の処理
      alert('注文を更新しました');
      router.push('/Home/OrderList');
      
    } catch (error) {
      console.error('注文の更新に失敗しました:', error);
      alert('注文の更新に失敗しました。もう一度お試しください。');
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
      {/* ページヘッダー */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          注文編集 - {orderId}
        </h1>
        <p className="text-sm text-gray-600">
          既存の注文情報を編集できます。変更後は「注文を更新」ボタンをクリックしてください。
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start lg:items-stretch">
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
                        <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[25%]">
                          <div className="flex items-center justify-center gap-2">
                            商品名
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-md">必須</span>
                          </div>
                        </th>
                        <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[15%]">数量</th>
                        <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[15%]">単価</th>
                        <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[15%]">納品状況</th>
                        <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[30%]">
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
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded transition-colors duration-200 flex items-center justify-center"
                      onClick={() => handleDeleteOrderDetail(index)}
                      title="商品を削除"
                    >
                      {/* スマホ版は×アイコン、デスクトップ版は削除テキスト */}
                      <span className="text-sm font-bold sm:hidden">×</span>
                      <span className="hidden sm:inline">削除</span>
                    </button>
                  </div>
                ))}
              </div>
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
            <div className="mt-2 font-semibold text-sm flex">
              <div className="w-[25%]"></div> {/* 商品名列のスペース */}
              <div className="w-[15%]"></div> {/* 数量列のスペース */}
              <div className="w-[15%]"></div> {/* 単価列のスペース */}
              <div className="w-[15%]"></div> {/* 納品状況列のスペース */}
              <div className="w-[30%] text-right"> {/* 摘要列の位置・右寄せ */}
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
        <div className="w-full lg:w-1/2 max-w-md mx-auto lg:mx-0 lg:max-w-none">
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
      
      {/* 注文更新ボタン */}
      <div className="flex justify-center mt-6">
        <button 
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-base shadow-lg border-2 border-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleUpdateOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              処理中...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              注文を更新
            </div>
          )}
        </button>
      </div>
      
      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        productName={deleteModal.productName}
        description={deleteModal.description}
      />
    </div>
  );
}