'use client';

import { FC } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ERダイアグラムに対応した型定義
type OrderDetail = {
  id: string; // OXXXXXXX-XX形式
  orderId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  description: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
};

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

type Delivery = {
  id: string; // DXXXXXXX形式
  customerId: string;
  deliveryDate: string;
  totalAmount: number;
  totalQuantity: number;
  note: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
};

type DeliveryDetail = {
  id: string; // DXXXXXXX-XX形式
  deliveryId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
};

// 表示用の拡張型
type OrderDetailWithDelivery = OrderDetail & {
  deliveryDetailId?: string;
};

// ダミーデータ
const dummyCustomers: Customer[] = [
  {
    id: 'C-00001',
    storeId: 'store-001',
    name: '大阪情報専門学校',
    contactPerson: '情報太郎',
    address: '大阪府大阪市東成区中本4-1-8',
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
  }
];

const dummyOrders: Order[] = [
  {
    id: "O1234567",
    customerId: "C-00001",
    orderDate: "2004/4/7",
    note: "",
    status: "完了",
    updatedAt: "2024-12-15T09:00:00Z",
    isDeleted: false
  },
  {
    id: "O1234568",
    customerId: "C-00002",
    orderDate: "2004/4/8",
    note: "早期納品希望",
    status: "未完了",
    updatedAt: "2024-12-15T10:00:00Z",
    isDeleted: false
  }
];

const dummyOrderDetails: OrderDetail[] = [
  {
    id: "O1234567-01",
    orderId: "O1234567",
    productName: "リーダブルコード",
    unitPrice: 2640,
    quantity: 29,
    description: "",
    updatedAt: "2024-12-15T09:00:00Z",
    isDeleted: false
  },
  {
    id: "O1234567-02",
    orderId: "O1234567",
    productName: "JavaScript 第7版（オライリー）",
    unitPrice: 4950,
    quantity: 29,
    description: "",
    updatedAt: "2024-12-15T09:05:00Z",
    isDeleted: false
  },
  {
    id: "O1234568-01",
    orderId: "O1234568",
    productName: "医療用記録システム",
    unitPrice: 45000,
    quantity: 1,
    description: "緊急",
    updatedAt: "2024-12-15T10:00:00Z",
    isDeleted: false
  },
  {
    id: "O1234568-02",
    orderId: "O1234568",
    productName: "患者管理ソフト",
    unitPrice: 35000,
    quantity: 1,
    description: "",
    updatedAt: "2024-12-15T10:05:00Z",
    isDeleted: false
  }
];

const dummyDeliveryDetails: DeliveryDetail[] = [
  {
    id: "D1234567-01",
    deliveryId: "D1234567",
    productName: "リーダブルコード",
    unitPrice: 2640,
    quantity: 29,
    updatedAt: "2024-12-15T09:00:00Z",
    isDeleted: false
  },
  {
    id: "D1234567-02",
    deliveryId: "D1234567",
    productName: "JavaScript 第7版（オライリー）",
    unitPrice: 4950,
    quantity: 29,
    updatedAt: "2024-12-15T09:05:00Z",
    isDeleted: false
  },
  {
    id: "D1234568-01",
    deliveryId: "D1234568",
    productName: "医療用記録システム",
    unitPrice: 45000,
    quantity: 1,
    updatedAt: "2024-12-15T10:00:00Z",
    isDeleted: false
  },
  {
    id: "D1234568-02",
    deliveryId: "D1234568",
    productName: "患者管理ソフト",
    unitPrice: 35000,
    quantity: 1,
    updatedAt: "2024-12-15T10:05:00Z",
    isDeleted: false
  }
];

// 日本円のフォーマット関数
const formatJPY = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount);
};

// データ取得関数
const getOrderById = (orderId: string): Order | undefined => {
  return dummyOrders.find(order => order.id === orderId);
};

const getCustomerById = (customerId: string): Customer | undefined => {
  return dummyCustomers.find(customer => customer.id === customerId);
};

const getOrderDetailsByOrderId = (orderId: string): OrderDetail[] => {
  return dummyOrderDetails.filter(detail => detail.orderId === orderId);
};

const getDeliveryDetailIdByOrderDetailId = (orderDetailId: string): string | undefined => {
  // 注文明細IDから対応する納品明細IDを取得（簡易実装）
  const mapping: Record<string, string> = {
    "O1234567-01": "D1234567-01",
    "O1234567-02": "D1234567-02",
    "O1234568-01": "D1234568-01",
    "O1234568-02": "D1234568-02"
  };
  return mapping[orderDetailId];
};

const OrderDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string || '';
  
  // データ取得
  const order = getOrderById(orderId);
  const customer = order ? getCustomerById(order.customerId) : undefined;
  const orderDetails = getOrderDetailsByOrderId(orderId);

  // 表示用データに納品明細IDを追加
  const displayOrderDetails: OrderDetailWithDelivery[] = orderDetails.map(detail => ({
    ...detail,
    deliveryDetailId: getDeliveryDetailIdByOrderDetailId(detail.id)
  }));

  // 空行を追加（合計10行になるよう調整）
  while (displayOrderDetails.length < 10) {
    displayOrderDetails.push({
      id: "",
      orderId: "",
      productName: "",
      unitPrice: 0,
      quantity: 0,
      description: "",
      updatedAt: "",
      isDeleted: false,
      deliveryDetailId: ""
    });
  }

  // 合計金額計算
  const totalAmount = orderDetails.reduce((sum, detail) => 
    sum + (detail.unitPrice * detail.quantity), 0
  );

  // ハンドラー関数
  const handleEdit = () => {
    router.push(`/Home/OrderList/${orderId}/Edit`);
  };

  const handleDelete = () => {
    if (confirm('この注文を削除してもよろしいですか？')) {
      alert('注文を削除しました（デモのため実際の削除は行われていません）');
    }
  };

  const handlePdfExport = () => {
    alert('PDFを出力しています（デモのため実際の出力は行われていません）');
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 max-w-7xl">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
            注文明細 - {order?.id || 'ID不明'}
          </h1>
          {order && (
            <p className="text-sm text-gray-600 mt-1">
              注文日: {order.orderDate} | 状態: 
              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold ${
                order.status === '完了' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {order.status}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={handleEdit}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg text-sm sm:text-base border border-yellow-600 transition-colors shadow-sm"
        >
          編集
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* 注文明細テーブル（左側・メイン） */}
        <div className="w-full xl:w-2/3">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-blue-500 text-white p-3">
              <h2 className="font-semibold text-base sm:text-lg">注文明細一覧</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center text-xs sm:text-sm min-w-[700px]">
                <thead className="bg-blue-300">
                  <tr>
                    <th className="border border-gray-400 px-2 py-2 sm:px-3 sm:py-3 w-[15%] font-semibold">注文明細ID</th>
                    <th className="border border-gray-400 px-2 py-2 sm:px-3 sm:py-3 w-[25%] font-semibold">商品名</th>
                    <th className="border border-gray-400 px-2 py-2 sm:px-3 sm:py-3 w-[12%] font-semibold">単価</th>
                    <th className="border border-gray-400 px-2 py-2 sm:px-3 sm:py-3 w-[8%] font-semibold">数量</th>
                    <th className="border border-gray-400 px-2 py-2 sm:px-3 sm:py-3 w-[15%] font-semibold">納品明細ID</th>
                    <th className="border border-gray-400 px-2 py-2 sm:px-3 sm:py-3 w-[25%] font-semibold">摘要</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrderDetails.map((item, index) => (
                    <tr 
                      key={index} 
                      className={`${
                        index % 2 === 0 ? "bg-blue-50" : "bg-white"
                      } h-10 sm:h-12 hover:bg-blue-100 transition-colors`}
                    >
                      <td className="border border-gray-400 px-2 py-1 sm:px-3 sm:py-2 truncate font-mono text-xs">
                        {item.id}
                      </td>
                      <td className="border border-gray-400 px-2 py-1 sm:px-3 sm:py-2 truncate text-left">
                        {item.productName}
                      </td>
                      <td className="border border-gray-400 px-2 py-1 sm:px-3 sm:py-2 text-right font-medium">
                        {item.unitPrice > 0 ? formatJPY(item.unitPrice) : ""}
                      </td>
                      <td className="border border-gray-400 px-2 py-1 sm:px-3 sm:py-2 text-right font-medium">
                        {item.quantity > 0 ? item.quantity.toLocaleString() : ""}
                      </td>
                      <td className="border border-gray-400 px-2 py-1 sm:px-3 sm:py-2 truncate font-mono text-xs">
                        {item.deliveryDetailId}
                      </td>
                      <td className="border border-gray-400 px-2 py-1 sm:px-3 sm:py-2 truncate text-left">
                        {item.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 合計金額表示 */}
            <div className="bg-gray-50 p-3 sm:p-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base font-medium text-gray-700">
                  合計金額:
                </span>
                <span className="text-lg sm:text-xl font-bold text-blue-600">
                  {formatJPY(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 注文情報と顧客情報（右側） */}
        <div className="w-full xl:w-1/3 flex flex-col gap-6">
          {/* 注文情報 */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-slate-700 text-white p-3">
              <h2 className="font-semibold text-base sm:text-lg">注文情報</h2>
            </div>
            <div className="text-xs sm:text-sm">
              <div className="divide-y divide-gray-200">
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">注文ID</div>
                  <div className="w-3/5 p-3 break-all font-mono">{order?.id || 'N/A'}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">注文日</div>
                  <div className="w-3/5 p-3">{order?.orderDate || 'N/A'}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">状態</div>
                  <div className="w-3/5 p-3">
                    {order?.status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === '完了' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">備考</div>
                  <div className="w-3/5 p-3 break-all">{order?.note || '（なし）'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 顧客情報 */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-slate-700 text-white p-3">
              <h2 className="font-semibold text-base sm:text-lg">顧客情報</h2>
            </div>
            <div className="text-xs sm:text-sm">
              <div className="divide-y divide-gray-200">
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">顧客ID</div>
                  <div className="w-3/5 p-3 break-all font-mono">{customer?.id || 'N/A'}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">名義</div>
                  <div className="w-3/5 p-3 break-all font-semibold">{customer?.name || 'N/A'}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">担当者</div>
                  <div className="w-3/5 p-3 break-all">{customer?.contactPerson || 'N/A'}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">電話番号</div>
                  <div className="w-3/5 p-3">{customer?.phone || 'N/A'}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">配達条件</div>
                  <div className="w-3/5 p-3 break-all">{customer?.deliveryCondition || 'N/A'}</div>
                </div>
                <div className="flex">
                  <div className="w-2/5 p-3 bg-slate-100 font-medium text-gray-700">住所</div>
                  <div className="w-3/5 p-3 break-all">{customer?.address || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-8">
        <button
          onClick={handleDelete}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-sm sm:text-base border border-red-700 transition-colors shadow-sm order-2 sm:order-1"
        >
          削除
        </button>
        <button
          onClick={handlePdfExport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-sm sm:text-base border border-blue-700 transition-colors shadow-sm order-1 sm:order-2"
        >
          PDF出力
        </button>
      </div>
    </div>
  );
};

export default OrderDetailPage;