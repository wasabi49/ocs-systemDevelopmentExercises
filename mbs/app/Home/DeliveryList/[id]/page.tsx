'use client';

import { useParams } from 'next/navigation';
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
  const { id } = useParams();

  return (
    <div className="p-4">
      <OrderDetails deliveries={deliveries} onDeleteClick={() => setShowDeleteModal(true)} />

      {/* モーダル */}
      {showDeleteModal && (
        <div className="bg-opacity-40 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-80 rounded-lg border border-black bg-white p-6 text-center shadow-lg">
            <p className="mb-6 text-lg">本当に削除しますか？</p>
            <div className="flex justify-around">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-md border border-black px-4 py-2 font-bold hover:bg-gray-100"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  setDeliveries([]);
                  setShowDeleteModal(false);
                }}
                className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
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
    <div className="flex flex-col gap-4 xl:grid xl:grid-cols-2">
      {/* 明細表 */}
      <div className="w-full max-w-full overflow-x-auto p-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] table-auto border-collapse text-xs">
            <thead className="bg-blue-300">
              <tr>
                <th className="w-[120px] border px-1 py-1">納品明細ID</th>
                <th className="border px-1 py-1">商品名</th>
                <th className="w-[60px] border px-1 py-1 text-center">単価</th>
                <th className="w-[48px] border px-1 py-1 text-center">数量</th>
              </tr>
            </thead>
            <tbody>
              {displayedDeliveries.map((delivery, index) => (
                <tr key={index} className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                  <td className="border px-2 py-1 text-center text-sm">{delivery.id}</td>
                  <td className="border px-2 py-1 text-center text-sm">{delivery.brandName}</td>
                  <td className="border px-2 py-1 text-center text-sm">{delivery.price}</td>
                  <td className="border px-2 py-1 text-center text-sm">{delivery.Num}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <button
            onClick={onDeleteClick}
            className="w-full rounded bg-red-600 px-3 py-1 text-lg text-white hover:bg-red-700 sm:w-[220px]"
          >
            削除
          </button>
          <button className="w-full rounded bg-blue-600 px-3 py-1 text-lg text-white hover:bg-blue-700 sm:w-[220px]">
            PDF出力
          </button>
        </div>
      </div>

      {/* 右側情報表 */}
      <div className="w-full min-w-[360px] overflow-x-auto p-6 text-base xl:min-w-[700px]">
        <div className="mb-4 flex justify-end">
          <button className="rounded bg-yellow-500 px-6 py-2 text-xl text-black hover:bg-yellow-600">
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
    <div className="mb-6 min-w-[360px] border border-black">
      <div className="border-b border-black bg-blue-900 px-2 py-1 text-left text-xl text-white">
        {title}
      </div>
      <div className="flex flex-col">
        {rows.map((row, index) => (
          <div key={index} className="flex border-b border-black">
            <div className="w-32 shrink-0 border-r border-black bg-blue-900 px-2 py-2 text-xl text-white">
              {row.label}
            </div>
            <div className="overflow-x-auto px-2 py-2 text-sm whitespace-nowrap">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
