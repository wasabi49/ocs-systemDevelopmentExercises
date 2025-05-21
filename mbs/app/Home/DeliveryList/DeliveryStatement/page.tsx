"use client";

import React, { useState } from 'react';

// データ型定義
type Delivery = {
  id: string;
  brandName: string;
  price: string;
  Num: string;
};

const dummyDeliveries: Delivery[] = [
  { id: 'D1234567-01', brandName: 'はだしのゲン', price: '￥110', Num: '55' },
];

// 納品情報と顧客情報を配列で定義
const deliveryInfo = [
  { label: '納品ID', value: 'D1234567' },
  { label: '納品日', value: '2025/4/7' },
  { label: '合計金額', value: '¥7,500' },
  { label: '備考', value: '納品が遅れる可能性大' },
];

const customerInfo = [
  { label: '名義', value: '奥田真那斗' },
  { label: '電話番号', value: '090-xxxx-xxxx' },
  { label: '配送先条件', value: '平日不在' },
  { label: '住所', value: '587-xxxx 大阪府堺市xxxxxxx-xx' },
  { label: '備考', value: '2025年2月以降廃業予定であります（^_^）' },
];

export default function DeliveryListPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>(dummyDeliveries);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <div className="p-4">
      <OrderDetails
        deliveries={deliveries}
        onDeleteClick={() => setShowDeleteModal(true)}
      />

      {/* モーダル */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white border border-black rounded-lg p-6 w-80 text-center shadow-lg">
            <p className="text-lg mb-6">本当に削除しますか？</p>
            <div className="flex justify-around">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-black rounded-md hover:bg-gray-100 font-bold"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  setDeliveries([]);
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDetails({
  deliveries,
  onDeleteClick,
}: {
  deliveries: Delivery[];
  onDeleteClick: () => void;
}) {
  const displayedDeliveries = [...deliveries];
  while (displayedDeliveries.length < 18) {
    displayedDeliveries.push({ id: '', brandName: '', price: '', Num: '' });
  }

  return (
    <div className="flex flex-col xl:grid xl:grid-cols-2 gap-4">
      {/* 明細表 */}
      <div className="p-4 overflow-x-auto w-full max-w-full">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs table-auto min-w-[360px]">
            <thead className="bg-blue-300">
              <tr>
                <th className="border px-1 py-1 w-[120px]">納品明細ID</th>
                <th className="border px-1 py-1">商品名</th>
                <th className="border px-1 py-1 text-center w-[60px]">単価</th>
                <th className="border px-1 py-1 text-center w-[48px]">数量</th>
              </tr>
            </thead>
            <tbody>
              {displayedDeliveries.map((delivery, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                  <td className="border px-2 py-1 text-sm text-center">{delivery.id}</td>
                  <td className="border px-2 py-1 text-sm text-center">{delivery.brandName}</td>
                  <td className="border px-2 py-1 text-sm text-center">{delivery.price}</td>
                  <td className="border px-2 py-1 text-sm text-center">{delivery.Num}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-2 ml-4">
          <button
            onClick={onDeleteClick}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg w-full sm:w-[220px]"
          >
            削除
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-lg w-full sm:w-[220px]">
            PDF出力
          </button>
        </div>
      </div>

      {/* 右側情報表 */}
      <div className="p-6 text-base w-full min-w-[360px] xl:min-w-[700px] overflow-x-auto">
        <div className="flex justify-end mb-4">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-black text-xl px-6 py-2 rounded">
            編集
          </button>
        </div>

        <div className="w-[700px] max-w-full overflow-x-auto">
          <TableSection title="納品情報" rows={deliveryInfo} />
          <TableSection title="顧客情報" rows={customerInfo} />
        </div>
      </div>
    </div>
  );
}

function TableSection({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="border border-black mb-6 min-w-[360px]">
      <div className="bg-blue-900 text-white text-left text-xl px-2 py-1 border-b border-black">{title}</div>
      <div className="flex flex-col">
        {rows.map((row, index) => (
          <div key={index} className="flex border-b border-black">
            <div className="bg-blue-900 text-white text-xl px-2 py-2 w-32 border-r border-black shrink-0">{row.label}</div>
            <div className="text-sm px-2 py-2 whitespace-nowrap overflow-x-auto">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
