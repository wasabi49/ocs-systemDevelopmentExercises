'use client';

import React, { useState } from 'react';

type Order = {
  customerId: string;
  customerName: string;
  leadTime: number; // 平均リードタイム（例: 日数）
};

const dummyOrders: Order[] = [
  { customerId: 'C001', customerName: '大阪情報専門学校', leadTime: 5 },
  { customerId: 'C002', customerName: '森ノ宮病院', leadTime: 7 },
];

export default function OrderListPage() {
  const [searchField, setSearchField] = useState<'すべて' | '顧客ID' | '顧客名' | '平均リードタイム'>('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [orders, setOrders] = useState<Order[]>(dummyOrders);

  const handleSort = (field: keyof Order) => {
    const sorted = [...orders].sort((a, b) =>
      a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0
    );
    setOrders(sorted);
  };

  const handleSearch = () => {
    console.log('検索確定：', searchKeyword);
  };

  const filteredOrders = orders.filter(order => {
    if (searchField === 'すべて') {
      return (
        order.customerId.includes(searchKeyword) ||
        order.customerName.includes(searchKeyword) ||
        order.leadTime.toString().includes(searchKeyword)
      );
    }

    const fieldValue = order[searchField === '顧客ID' ? 'customerId'
                      : searchField === '顧客名' ? 'customerName'
                      : 'leadTime'];

    return fieldValue.toString().includes(searchKeyword);
  });

  // 15行確保
  const displayedOrders = [...filteredOrders];
  while (displayedOrders.length < 15) {
    displayedOrders.push({ customerId: '', customerName: '', leadTime: 0 });
  }

  return (
    <div className="p-4 max-w-screen-lg mx-auto text-black bg-white">
      {/* 検索セクション */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded border-1 border-black">
          CSVエクスポート
        </button>

        <select
          value={searchField}
          onChange={e => setSearchField(e.target.value as any)}
          className="border rounded p-2 text-black"
        >
          <option value="すべて">すべて検索</option>
          <option value="顧客ID">顧客ID</option>
          <option value="顧客名">顧客名</option>
          <option value="平均リードタイム">平均リードタイム</option>
        </select>

        <input
          type="text"
          placeholder="例：顧客ID"
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          className="border rounded p-2 w-64 text-black"
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
        <table className="w-full border-collapse text-center text-sm text-black">
          <thead className="bg-blue-300 text-black">
            <tr>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('customerId')}>顧客ID</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('customerName')}>顧客名</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('leadTime')}>平均リードタイム（日）</th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((order, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                <td className="border px-2 py-1">{order.customerId}</td>
                <td className="border px-2 py-1">{order.customerName}</td>
                <td className="border px-2 py-1">{order.leadTime || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページネーション */}
      <div className="mt-2 text-center text-sm text-black">
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
