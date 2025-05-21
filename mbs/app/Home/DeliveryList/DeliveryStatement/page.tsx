"use client";

import React, { useState } from 'react';

type Delivery = {
  id: string;
  brandName: string;
  price: string;
  Num: string;
};

const dummyDeliveries: Delivery[] = [
  { id: 'D1234567-01', brandName: 'はだしのゲン', price: '￥110', Num: '55' },
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
                  // 削除処理例：全削除（実際は個別IDなどで対応）
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
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* 明細表 */}
      <div className="bg-white rounded-2xl shadow p-4 overflow-auto">
        <table className="w-full border-collapse text-xs table-auto">
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

        <div className="mt-6 flex justify-center items-center gap-2 ml-4">
          <button
            onClick={onDeleteClick}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-lg w-[220px]"
          >
            削除
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-lg w-[220px]">
            PDF出力
          </button>
        </div>
      </div>

      {/* 右側情報表 */}
      <div className="bg-white rounded-2xl shadow p-6 text-base w-full min-w-[700px]">
        <div className="flex justify-end mb-4">
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white text-xl px-6 py-2 rounded">
            編集
          </button>
        </div>

        <table className="w-full table-fixed border border-black mb-6">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th colSpan={2} className="text-left text-xl px-2 py-1 border border-black">納品情報</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="bg-blue-900 text-white text-xl px-2 py-1 w-32 border border-black">納品ID</td>
              <td className="text-xl px-2 py-1 border border-black">D1234567</td>
            </tr>
            <tr>
              <td className="bg-blue-900 text-white text-xl px-2 py-1 border border-black">納品日</td>
              <td className="text-xl px-2 py-1 border border-black">2025/4/7</td>
            </tr>
            <tr>
              <td className="bg-blue-900 text-white text-xl px-2 py-1 border border-black">合計金額</td>
              <td className="text-xl px-2 py-1 border border-black">¥7,500</td>
            </tr>
            <tr>
              <td className="bg-blue-900 text-white text-xl px-2 py-1 border border-black">備考</td>
              <td className="text-xl px-2 py-1 border border-black">納品が遅れる可能性大</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full table-fixed border border-black">
          <thead>
            <tr className="bg-blue-900 text-white">
              <th colSpan={2} className="text-left text-xl px-2 py-1 border border-black">顧客情報</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="bg-blue-900 text-white text-xl px-2 py-1 w-32 border border-black">名義</td>
              <td className="text-xl px-2 py-1 border border-black">奥田真那斗</td>
            </tr>
            <tr>
              <td className="bg-blue-900 text-white text-xl px-2 py-1 border border-black">電話番号</td>
              <td className="text-xl px-2 py-1 border border-black">090-xxxx-xxxx</td>
            </tr>
            <tr>
              <td className="bg-blue-900 text-white text-xl px-2 py-1 border border-black">配送先条件</td>
              <td className="text-xl px-2 py-1 border border-black">平日不在</td>
            </tr>
            <tr>
              <td className="bg-blue-900 text-white text-xl px-2 py-1 border border-black">住所</td>
              <td className="text-xl px-2 py-1 border border-black">587-xxxx 大阪府堺市xxxxxxx-xx</td>
            </tr>
            <tr>
              <td className="bg-blue-900 text-white text-xl px-2 py-1 border border-black">備考</td>
              <td className="text-xl px-2 py-1 border border-black">２０２５年２月以降廃業予定</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
