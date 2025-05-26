'use client';

import { FC } from 'react';
import { useRouter, useParams } from 'next/navigation';

// 注文明細データの型定義
type OrderDetailItem = {
  orderDetailId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  deliveryDetailId: string;
  description: string;
};

// 注文情報の型定義
type OrderInfo = {
  orderId: string;
  orderDate: string;
  status: string;
  remarks: string;
};

// 顧客情報の型定義
type CustomerInfo = {
  name: string;
  responsiblePerson: string;
  phoneNumber: string;
  deliveryCondition: string;
  address: string;
};

// 注文データを格納する型定義
type OrderData = {
  orderDetails: OrderDetailItem[];
  orderInfo: OrderInfo;
  customerInfo: CustomerInfo;
};

// 注文データの定義（注文IDごとにデータを用意）
const orderDataMap: Record<string, OrderData> = {
  // 大阪情報専門学校の注文データ
  'O123456': {
    orderDetails: [
      { 
        orderDetailId: "O123456-01", 
        productName: "転写型汎用ソフト5版", 
        unitPrice: 13500, 
        quantity: 5, 
        deliveryDetailId: "D123456-01", 
        description: "" 
      },
      { 
        orderDetailId: "O123456-02", 
        productName: "CADデータによるドリル", 
        unitPrice: 2135, 
        quantity: 10, 
        deliveryDetailId: "D123456-02", 
        description: "" 
      }
    ],
    orderInfo: {
      orderId: "O123456",
      orderDate: "2004/4/7",
      status: "完了",
      remarks: ""
    },
    customerInfo: {
      name: "大阪情報専門学校",
      responsiblePerson: "山田太郎",
      phoneNumber: "06-1234-5678",
      deliveryCondition: "平日可",
      address: "大阪市浪速区..."
    }
  },
  // 森ノ宮病院の注文データ
  'O123457': {
    orderDetails: [
      { 
        orderDetailId: "O123457-01", 
        productName: "医療用記録システム", 
        unitPrice: 45000, 
        quantity: 1, 
        deliveryDetailId: "D123457-01", 
        description: "緊急" 
      },
      { 
        orderDetailId: "O123457-02", 
        productName: "患者管理ソフト", 
        unitPrice: 35000, 
        quantity: 1, 
        deliveryDetailId: "D123457-02", 
        description: "" 
      }
    ],
    orderInfo: {
      orderId: "O123457",
      orderDate: "2004/4/8",
      status: "未完了",
      remarks: "早期納品希望"
    },
    customerInfo: {
      name: "森ノ宮病院",
      responsiblePerson: "佐藤医師",
      phoneNumber: "06-9876-5432",
      deliveryCondition: "24時間対応",
      address: "大阪市中央区森ノ宮..."
    }
  }
};

// デフォルトの空データ
const emptyOrderData: OrderData = {
  orderDetails: [],
  orderInfo: {
    orderId: "",
    orderDate: "",
    status: "",
    remarks: ""
  },
  customerInfo: {
    name: "",
    responsiblePerson: "",
    phoneNumber: "",
    deliveryCondition: "",
    address: ""
  }
};

// 日本円のフォーマット関数
const formatJPY = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount);
};

const OrderDetailPage: FC = () => {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string || '';
  
  // 注文IDに対応するデータを取得（存在しない場合は空データ）
  const orderData = orderDataMap[orderId] || emptyOrderData;
  
  // 表示用に空行を追加
  const displayOrderDetails = [
    ...orderData.orderDetails,
    // 空行を追加（合計10行になるよう調整）
    ...Array(Math.max(10 - orderData.orderDetails.length, 0)).fill(null).map(() => ({
      orderDetailId: "",
      productName: "",
      unitPrice: 0,
      quantity: 0,
      deliveryDetailId: "",
      description: ""
    }))
  ];

  // 編集ボタンのハンドラー
  const handleEdit = () => {
    alert('注文を編集します（デモのため実際の編集は行われていません）');
  };

  // 削除ボタンのハンドラー
  const handleDelete = () => {
    if (confirm('この注文を削除してもよろしいですか？')) {
      alert('注文を削除しました（デモのため実際の削除は行われていません）');
    }
  };

  // PDF出力ボタンのハンドラー
  const handlePdfExport = () => {
    alert('PDFを出力しています（デモのため実際の出力は行われていません）');
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      {/* 編集ボタン */}
      <div className="flex justify-end mb-4 sm:mb-6">
        <button
          onClick={handleEdit}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-1 px-3 sm:py-1 sm:px-4 rounded text-sm sm:text-base border border-black"
        >
          編集
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* 注文明細テーブル（左側） */}
        <div className="w-full lg:w-2/3 overflow-x-auto">
          <table className="w-full min-w-[320px] sm:min-w-[600px] border-collapse text-center text-xs sm:text-sm table-fixed sm:table-auto">
            <thead className="bg-blue-300">
              <tr>
                <th className="border px-1 py-1 w-[12%] sm:w-[15%] truncate">注文明細ID</th>
                <th className="border px-1 py-1 w-[20%] sm:w-[25%] truncate">商品名</th>
                <th className="border px-1 py-1 w-[10%] sm:w-[12%] truncate">単価</th>
                <th className="border px-1 py-1 w-[6%] sm:w-[8%] truncate">数量</th>
                <th className="border px-1 py-1 w-[12%] sm:w-[15%] truncate">納品明細ID</th>
                <th className="border px-1 py-1 w-[40%] sm:w-[25%] truncate">摘要</th>
              </tr>
            </thead>
            <tbody>
              {displayOrderDetails.map((item, index) => (
                <tr key={index} className={`${index % 2 === 0 ? "bg-blue-100" : "bg-white"} h-8`}>
                  <td className="border px-1 py-1 h-8 sm:h-10 truncate">{item.orderDetailId}</td>
                  <td className="border px-1 py-1 h-8 sm:h-10 truncate">{item.productName}</td>
                  <td className="border px-1 py-1 text-right h-8 sm:h-10">
                    {item.unitPrice > 0 ? formatJPY(item.unitPrice) : ""}
                  </td>
                  <td className="border px-1 py-1 text-right h-8 sm:h-10">
                    {item.quantity > 0 ? item.quantity : ""}
                  </td>
                  <td className="border px-1 py-1 h-8 sm:h-10 truncate">{item.deliveryDetailId}</td>
                  <td className="border px-1 py-1 h-8 sm:h-10 truncate">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 注文情報と顧客情報（右側） */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4 sm:gap-6">
          {/* 注文情報 */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-slate-700 text-white p-2 sm:p-3">
              <h2 className="font-semibold text-sm sm:text-base">注文情報</h2>
            </div>
            <div className="text-xs sm:text-sm">
              <div className="grid grid-cols-[40%_60%] sm:grid-cols-[35%_65%]">
                <div className="p-2 sm:p-3 bg-slate-700 text-white border-t border-gray-300">注文ID</div>
                <div className="p-2 sm:p-3 border-t border-gray-300 break-all">{orderData.orderInfo.orderId}</div>
                
                <div className="p-2 sm:p-3 bg-slate-700 text-white border-t border-gray-300">注文日</div>
                <div className="p-2 sm:p-3 border-t border-gray-300">{orderData.orderInfo.orderDate}</div>
                
                <div className="p-2 sm:p-3 bg-slate-700 text-white border-t border-gray-300">状態</div>
                <div className="p-2 sm:p-3 border-t border-gray-300">{orderData.orderInfo.status}</div>
                
                <div className="p-2 sm:p-3 bg-slate-700 text-white border-t border-gray-300">備考</div>
                <div className="p-2 sm:p-3 border-t border-gray-300 break-all">{orderData.orderInfo.remarks}</div>
              </div>
            </div>
          </div>

          {/* 顧客情報 */}
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-slate-700 text-white p-2 sm:p-3">
              <h2 className="font-semibold text-sm sm:text-base">顧客情報</h2>
            </div>
            <div className="text-xs sm:text-sm">
              <div className="grid grid-cols-[40%_60%] sm:grid-cols-[35%_65%]">
                <div className="p-2 sm:p-3 bg-slate-700 text-white border-t border-gray-300">名義</div>
                <div className="p-2 sm:p-3 border-t border-gray-300 break-all">{orderData.customerInfo.name}</div>
                
                <div className="p-2 sm:p-3 bg-slate-700 text-white border-t border-gray-300">担当者</div>
                <div className="p-2 sm:p-3 border-t border-gray-300 break-all">{orderData.customerInfo.responsiblePerson}</div>
                
                <div className="p-2 sm:p-3 bg-slate-700 text-white border-t border-gray-300">電話番号</div>
                <div className="p-2 sm:p-3 border-t border-gray-300">{orderData.customerInfo.phoneNumber}</div>
                
                <div className="p-2 sm:p-3 bg-slate-700 text-white border-t border-gray-300">配達条件</div>
                <div className="p-2 sm:p-3 border-t border-gray-300 break-all">{orderData.customerInfo.deliveryCondition}</div>
                
                <div className="p-2 sm:p-3 bg-slate-700 text-white border-t border-gray-300">住所</div>
                <div className="p-2 sm:p-3 border-t border-gray-300 break-all">{orderData.customerInfo.address}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
        <button
          onClick={handleDelete}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 sm:px-6 rounded order-2 sm:order-1 text-sm sm:text-base border border-black"
        >
          削除
        </button>
        <button
          onClick={handlePdfExport}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 sm:px-6 rounded order-1 sm:order-2 text-sm sm:text-base border border-black"
        >
          PDF出力
        </button>
      </div>
    </div>
  );
};

export default OrderDetailPage;