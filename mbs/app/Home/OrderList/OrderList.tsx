"use client";

import React, { useState } from "react";
import Link from "next/link"; // 注文IDリンク用

type Order = {
  id: string;
  date: string;
  customerName: string;
  note: string;
  status: "完了" | "未完了";
};

const dummyOrders: Order[] = [
  { id: "O12345", date: "2004/4/7", customerName: "大阪情報専門学校", note: "", status: "完了" },
  { id: "O12457", date: "2004/4/8", customerName: "森ノ宮病院", note: "", status: "未完了" },
];

export default function OrderListPage() {
  const [searchField, setSearchField] = useState<'すべて' | '注文ID' | '注文日' | '顧客名' | '備考'>('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'すべて' | '完了' | '未完了'>('すべて');
  const [orders, setOrders] = useState<Order[]>(dummyOrders);

  const handleSort = (field: keyof Order) => {
    const sorted = [...orders].sort((a, b) => (a[field] > b[field] ? 1 : -1));
    setOrders(sorted);
  };

  const handleSearch = () => {
    console.log('検索確定：', searchKeyword);
  };

  const filteredOrders = orders.filter(order => {
    const matchField = searchField === 'すべて' || order[searchField as keyof Order]?.includes(searchKeyword);
    const matchStatus = statusFilter === 'すべて' || order.status === statusFilter;
    return matchField && matchStatus;
  });

  const displayedOrders = [...filteredOrders];
  while (displayedOrders.length < 15) {
    displayedOrders.push({ id: '', date: '', customerName: '', note: '', status: '完了' });
  }

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      {/* 検索エリア */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
          注文追加
        </button>

        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value as any)}
          className="border rounded p-2"
        >
          <option value="すべて">すべて検索</option>
          <option value="注文ID">注文ID</option>
          <option value="注文日">注文日</option>
          <option value="顧客名">顧客名</option>
          <option value="備考">備考</option>
        </select>

        <input
          type="text"
          placeholder="例：注文ID"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="border rounded p-2 w-64"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border rounded p-2"
        >
          <option value="すべて">状態選択</option>
          <option value="完了">完了</option>
          <option value="未完了">未完了</option>
        </select>

        <button
          onClick={handleSearch}
          className="bg-white hover:bg-gray-100 text-black font-bold py-2 px-4 border rounded"
        >
          🔍
        </button>
      </div>

      {/* テーブル（レスポンシブ対応） */}
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-[700px] border-collapse text-center text-sm sm:text-xs">
          <thead className="bg-blue-300">
            <tr>
              <th className="border px-2 py-1 cursor-pointer w-8" onClick={() => handleSort('id')}>
                注文ID ⬍
              </th>
              <th className="border px-2 py-1 cursor-pointer w-10" onClick={() => handleSort('date')}>
                注文日 ⬍
              </th>
              <th className="border px-2 py-1 w-72">
                顧客名
              </th>
              <th className="border px-2 py-1 w-120">
                備考
              </th>
              <th className="border px-2 py-1 w-16">
                状態 ⬍
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((order, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                <td className="border px-2 py-1 break-words">
                  {order.id ? (
                    <Link href={`/Home/OrderList/${order.id}`} className="text-blue-500 underline">
                      {order.id}
                    </Link>
                  ) : ''}
                </td>
                <td className="border px-2 py-1 break-words">{order.date}</td>
                <td className="border px-2 py-1 break-words">{order.customerName}</td>
                <td className="border px-2 py-1 break-words">{order.note}</td>
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
