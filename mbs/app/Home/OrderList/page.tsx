'use client';


import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


type Order = {
  id: string;
  date: string;
  customerName: string;
  note: string;
  status: '完了' | '未完了' | '';
};

const dummyOrders: Order[] = [
  {
    id: 'O123456',
    date: '2004/4/7',
    customerName: '大阪情報専門学校',
    note: '',
    status: '完了',
  },
  {
    id: 'O123457',
    date: '2004/4/8',
    customerName: '森ノ宮病院',
    note: '',
    status: '未完了',
  },
];

export default function OrderListPage() {
  const router = useRouter();
  
  const [searchField, setSearchField] = useState<
    'すべて' | '注文ID' | '注文日' | '顧客名' | '備考' | '商品名'
  >('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'完了' | '未完了' | ''>('');
  const [orders, setOrders] = useState<Order[]>(dummyOrders);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Order;
    direction: 'asc' | 'desc';
  } | null>({ key: 'id', direction: 'asc' });

  // 注文追加ページへ遷移する関数
  const handleAddOrder = () => {
    router.push("/Home/OrderList/Create");
  };

  const handleSort = (field: keyof Order) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const sorted = [...orders].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setOrders(sorted);
    setSortConfig({ key: field, direction });
  };

  const filteredOrders = orders.filter((order) => {
    const matchField =
      searchField === 'すべて' || order[searchField as keyof Order]?.includes(searchKeyword);
    const matchStatus = statusFilter === '' || order.status === statusFilter;
    return matchField && matchStatus;
  });

  const displayedOrders = [...filteredOrders];
  while (displayedOrders.length < 15) {
    displayedOrders.push({
      id: '',
      date: '',
      customerName: '',
      note: '',
      status: '',
    });
  }

  const renderSortIcon = (field: keyof Order) => {
    const isActive = sortConfig?.key === field;
    const direction = sortConfig?.direction;
    return (
      <span className="ml-1">
        <span
          className={`inline-block text-xs ${
            isActive && direction === 'asc' ? 'text-black' : 'text-gray-400'
          }`}
        >
          ▲
        </span>
        <span
          className={`ml-0.5 inline-block text-xs ${
            isActive && direction === 'desc' ? 'text-black' : 'text-gray-400'
          }`}
        >
          ▼
        </span>
      </span>
    );
  };

  return (

    <div className="p-4 max-w-screen-lg mx-auto flex flex-col items-center">
      <div className="flex flex-nowrap mb-4 w-full max-w-full overflow-x-auto justify-center gap-2 sm:gap-4">
        <button 
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-[48px] w-12 border border-black rounded-md text-xs md:text-sm"
          onClick={handleAddOrder}
        >

          注文追加
        </button>

        <select
          value={searchField}
          onChange={(e) =>
            setSearchField(
              e.target.value as 'すべて' | '注文ID' | '注文日' | '顧客名' | '備考' | '商品名',
            )
          }
          className="h-[48px] w-25 rounded-md border border-black px-2 py-2 text-xs md:w-32 md:text-sm"
        >
          <option value="すべて">すべて検索</option>
          <option value="注文ID">注文ID</option>
          <option value="注文日">注文日</option>
          <option value="顧客名">顧客名</option>
          <option value="備考">備考</option>
          <option value="商品名">商品名</option>
        </select>

        <div className="relative flex w-64 items-center sm:w-[250px]">
          <div className="absolute left-2 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="例：注文日"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="h-[48px] w-full rounded-md border border-black bg-white py-2 pr-2 pl-8 text-sm focus:border-orange-500 focus:outline-none"
            aria-label="検索フィールド"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-center text-sm sm:table-auto">
          <thead className="bg-blue-300">
            <tr>
              <th
                className="w-24 cursor-pointer truncate border px-1 py-1"
                onClick={() => handleSort('id')}
              >
                注文ID{renderSortIcon('id')}
              </th>
              <th
                className="w-28 cursor-pointer truncate border px-1 py-1"
                onClick={() => handleSort('date')}
              >
                注文日{renderSortIcon('date')}
              </th>
              <th className="w-72 truncate border px-1 py-1">顧客名</th>
              <th className="w-120 truncate border px-1 py-1">備考</th>
              <th className="w-16 truncate border px-1 py-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as '完了' | '未完了' | '')}
                  className="bg-transparent text-sm transition-colors duration-200 hover:bg-blue-200"
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
                <td className="truncate border px-1 py-1">
                  {order.id ? (
                    <Link href={`/Home/OrderList/${order.id}`} className="text-blue-500 underline">
                      {order.id}
                    </Link>
                  ) : (
                    ''
                  )}
                </td>
                <td className="truncate border px-1 py-1">{order.date}</td>
                <td className="truncate border px-1 py-1">{order.customerName}</td>
                <td className="truncate border px-1 py-1">{order.note}</td>
                <td className="truncate border px-1 py-1">
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