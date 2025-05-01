"use client";

import Link from 'next/link';
import React, { useState } from 'react';

type Order = {
  id: string;
  customerName: string;
  managerName: string;
};

// ダミーデータ（OスタートID）
const dummyOrders: Order[] = [
  { id: 'I-00001', customerName: '田中　太郎', managerName: ''},
  { id: 'C-00001', customerName: '株式会社SCC', managerName: '鈴木　太郎'},
];

export default function CustormerListPage() {
  const [searchField, setSearchField] = useState<'すべて' | '顧客ID' | '顧客名' | '担当者'>('すべて');
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
        order.customerName.includes(searchKeyword) ||
        order.managerName.includes(searchKeyword)
      );
    }
    return order[searchField as keyof Order].includes(searchKeyword);
  });

  // 15行確保
  const displayedOrders = [...filteredOrders];
  while (displayedOrders.length < 15) {
    displayedOrders.push({ id: '', customerName: '', managerName: ''});
  }

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      {/* 注文追加ボタン＋検索 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
          <Link href="CustomerList/CsvImport">CSVインポート</Link>
        </button>

        <select
          value={searchField}
          onChange={e => setSearchField(e.target.value as any)}
          className="border rounded p-2"
        >
          <option value="すべて">すべて検索</option>
          <option value="顧客ID">顧客ID</option>
          <option value="顧客名">顧客名</option>
          <option value="担当者">担当者</option>
        </select>

        <input
          type="text"
          placeholder="例：I-12345"
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
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('id')}>顧客ID<br></br>(I:個人 C:法人)</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('customerName')}>顧客名</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('managerName')}>担当者</th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((order, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                <td className="border px-2 py-1">{order.id}</td>
                <td className="border px-2 py-1">{order.customerName}</td>
                <td className="border px-2 py-1">{order.managerName}</td>
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
