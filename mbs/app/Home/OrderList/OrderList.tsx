"use client";

import React, { useState } from "react";
import Link from "next/link";

type Order = {
  id: string;
  date: string;
  customerName: string;
  note: string;
  status: "完了" | "未完了" | "";
};

const dummyOrders: Order[] = [
  { id: "O12345", date: "2004/4/7", customerName: "大阪情報専門学校", note: "", status: "完了" },
  { id: "O12457", date: "2004/4/8", customerName: "森ノ宮病院", note: "", status: "未完了" },
];

export default function OrderListPage() {
  const [searchField, setSearchField] = useState<'すべて' | '注文ID' | '注文日' | '顧客名' | '備考'>('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'完了' | '未完了' | ''>('');
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
    const matchStatus = statusFilter === '' || order.status === statusFilter;
    return matchField && matchStatus;
  });

  const displayedOrders = [...filteredOrders];
  while (displayedOrders.length < 15) {
    displayedOrders.push({ id: '', date: '', customerName: '', note: '', status: '' });
  }

  return (
    <div className="p-4 max-w-screen-lg mx-auto">
      {/* 検索エリア：横並びでぴったり配置 */}
      <div className="flex flex-row items-center gap-0 mb-4 w-full">
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-[60px] w-[80px] border border-black text-sm whitespace-pre-line">
          注文追加
        </button>

        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value as any)}
          className="border border-black px-2 py-2 h-[60px] text-sm"
        >
          <option value="すべて">すべて検索</option>
          <option value="注文ID">注文ID</option>
          <option value="注文日">注文日</option>
          <option value="顧客名">顧客名</option>
          <option value="備考">備考</option>
        </select>

        <input
          type="text"
          placeholder="例：注文日"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="border border-black px-2 py-2 h-[60px] w-full text-sm"
        />

        <button
          onClick={handleSearch}
          className="bg-white hover:bg-gray-100 text-black font-bold px-4 py-2 border border-black h-[60px] w-[60px] flex items-center justify-center"
        >
          🔍
        </button>
      </div>

      {/* テーブル表示 */}
      <div className="overflow-x-auto w-full">
        <table className="table-fixed w-full max-w-full border-collapse text-center text-sm">
          <thead className="bg-blue-300">
            <tr>
              <th className="border px-1 py-1 w-20 truncate cursor-pointer" onClick={() => handleSort('id')}>注文ID ⬍</th>
              <th className="border px-1 py-1 w-24 truncate cursor-pointer" onClick={() => handleSort('date')}>注文日 ⬍</th>
              <th className="border px-1 py-1 w-48 truncate">顧客名</th>
              <th className="border px-1 py-1 w-64 truncate">備考</th>
              <th className="border px-1 py-1 w-20 truncate">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as '完了' | '未完了' | '')}
                  className="text-sm bg-transparent"
                >
                  <option value="">状態</option>
                  <option value="完了">完了</option>
                  <option value="未完了">未完了</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((order, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                <td className="border px-1 py-1 truncate">
                  {order.id ? (
                    <Link href={`/Home/OrderList/${order.id}`} className="text-blue-500 underline">
                      {order.id}
                    </Link>
                  ) : ''}
                </td>
                <td className="border px-1 py-1 truncate">{order.date}</td>
                <td className="border px-1 py-1 truncate">{order.customerName}</td>
                <td className="border px-1 py-1 truncate">{order.note}</td>
                <td className="border px-1 py-1 truncate">
                  {order.status === '未完了' ? (
                    <span className="text-red-500">{order.status}</span>
                  ) : (
                    order.status
                  )}
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
