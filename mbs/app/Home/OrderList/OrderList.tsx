"use client";

import React, { useState } from 'react';

type Order = {
  id: string;
  date: string;
  customerName: string;
  note: string;
  status: '完了' | '未完了';
};

// ダミーデータ（OスタートID）
const dummyOrders: Order[] = [
  { id: 'O12345', date: '2004/4/7', customerName: '大阪情報専門学校', note: '', status: '完了' },
  { id: 'O12457', date: '2004/4/8', customerName: '森ノ宮病院', note: '', status: '未完了' },
];

export default function OrderListPage() {
  const [searchField, setSearchField] = useState<'すべて' | '注文ID' | '注文日' | '顧客名' | '備考' | '状態'>('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [orders, setOrders] = useState<Order[]>(dummyOrders);

  const handleSort = (field: keyof Order) => {
    const sorted = [...orders].sort((a, b) => (a[field] > b[field] ? 1 : -1));
    setOrders(sorted);
  };

  const handleSearch = () => {
    console.log('検索確定：', searchKeyword);
  };

  const filteredOrders = orders.filter(order => {
    if (searchField === 'すべて') {
      return (
        order.id.includes(searchKeyword) ||
        order.date.includes(searchKeyword) ||
        order.customerName.includes(searchKeyword) ||
        order.note.includes(searchKeyword) ||
        order.status.includes(searchKeyword)
      );
    }
    return order[searchField as keyof Order].includes(searchKeyword);
  });

  // 15行確保
  const displayedOrders = [...filteredOrders];
  while (displayedOrders.length < 15) {
    displayedOrders.push({ id: '', date: '', customerName: '', note: '', status: '完了' });
  }

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      {/* 注文追加ボタン＋検索 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
          注文追加
        </button>

        <select
          value={searchField}
          onChange={e => setSearchField(e.target.value as any)}
          className="border rounded p-2"
        >
          <option value="すべて">すべて検索</option>
          <option value="注文ID">注文ID</option>
          <option value="注文日">注文日</option>
          <option value="顧客名">顧客名</option>
          <option value="備考">備考</option>
          <option value="状態">状態</option>
        </select>

        <input
          type="text"
          placeholder="例：注文ID"
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          className="border rounded p-2 w-64"
        />

        <button
          onClick={handleSearch}
          className="bg-white hover:bg-gray-100 text-black font-bold py-2 px-4 border rounded"
        >
          🔍
        </button>
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-sm">
          <thead className="bg-blue-300">
            <tr>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('id')}>注文ID</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('date')}>注文日</th>
              <th className="border px-2 py-1">顧客名</th>
              <th className="border px-2 py-1">備考</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('status')}>状態</th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((order, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                <td className="border px-2 py-1">{order.id}</td>
                <td className="border px-2 py-1">{order.date}</td>
                <td className="border px-2 py-1">{order.customerName}</td>
                <td className="border px-2 py-1">{order.note}</td>
                <td className="border px-2 py-1">
                  <span className={order.status === '未完了' ? 'text-red-500' : ''}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      <div className="mt-2 text-center text-sm">
        <span className="mx-1 cursor-pointer">&lt;&lt;</span>
        <span className="mx-1 cursor-pointer font-bold">1</span>
        <span className="mx-1 cursor-pointer">2</span>
        <span className="mx-1 cursor-pointer">3</span>
        <span className="mx-1 cursor-pointer">4</span>
        <span className="mx-1 cursor-pointer">5</span>
        <span className="mx-1 cursor-pointer">&gt;&gt;</span>
      </div>
    </div>
  );
}
