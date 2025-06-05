'use client';

import React, { useState } from 'react';

type List = {
  customerId: string,
  customerName: string,
  leadTime: number, // 平均リードタイム（例: 日数）
  totalSales: number
};

const dummyOrders: List[] = [
  { customerId: 'C001', customerName: '大阪情報専門学校', leadTime: 5, totalSales: 0 },
  { customerId: 'C002', customerName: '森ノ宮病院', leadTime: 7, totalSales: 0 },
];

type SortOrder = 'asc' | 'desc';

export default function StatisticalInfo() {
  // sortField, sortOrderのuseStateを追加
  const [searchField, setSearchField] = useState<'すべて' | '顧客ID' | '顧客名' | '平均リードタイム'>('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [orders, setOrders] = useState<List[]>(dummyOrders);
  const [sortField, setSortField] = useState<keyof List | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: keyof List) => {
    let nextOrder: SortOrder = 'asc';
    if (sortField === field) {
      nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortField(field);
    setSortOrder(nextOrder);

    const sorted = [...orders].sort((a, b) => {
      if (a[field] === b[field]) return 0;
      if (nextOrder === 'asc') {
        return a[field] > b[field] ? 1 : -1;
      } else {
        return a[field] < b[field] ? 1 : -1;
      }
    });
    setOrders(sorted);
  };

  const filteredOrders = orders.filter(list => {
    if (searchField === 'すべて') {
      return (
        list.customerId.includes(searchKeyword) ||
        list.customerName.includes(searchKeyword) ||
        list.leadTime.toString().includes(searchKeyword) ||
        list.totalSales.toString().includes(searchKeyword)
      );
    }
    const fieldValue =
      searchField === '顧客ID'
        ? list.customerId
        : searchField === '顧客名'
        ? list.customerName
        : searchField === '平均リードタイム'
        ? list.leadTime
        : '';
    return fieldValue.toString().includes(searchKeyword);
  });

  const exportToCSV = () => {
    const headers = ['顧客ID', '顧客名', '平均リードタイム（日）', '累計売上額'];
    const rows = filteredOrders.map(order => [
      order.customerId,
      order.customerName,
      order.leadTime.toString(),
      order.totalSales.toString()
    ]);
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(value => `"${value}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '顧客情報.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 15行確保
  const displayedOrders = [...filteredOrders];
  while (displayedOrders.length < 15) {
    displayedOrders.push({ customerId: '', customerName: '', leadTime: 0, totalSales: 0 });
  }

  // ソートアイコン
  const renderSortIcon = (field: keyof List) => {
    if (sortField !== field) return null; // 最初は何も表示しない
    return sortOrder === 'asc' ? <span>▲</span> : <span>▼</span>;
  };

  return (
    <div className="p-4  mx-auto text-black bg-white">
      {/* 検索セクション */}
      <div className="flex flex-row sm:flex-row sm:items-center sm:justify-center gap-4 mb-4 w-full max-w-md mx-auto">
        {/* CSVエクスポートボタン（PCのみ表示） */}
        <div className="hidden sm:block justify-center ">
          <button
            onClick={exportToCSV}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-2 rounded border border-black text-center leading-tight">
            <span className="text-sm">CSV</span>
            <span className="text-sm min-w-[120px] inline-block text-center">エクスポート</span>
          </button>
        </div>

        <select
          value={searchField}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setSearchField(e.target.value as 'すべて' | '顧客ID' | '顧客名' | '平均リードタイム')
          }
          className="border rounded p-2 text-black w-40"
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
          className="border rounded p-2 w-40 text-black"
        />
      </div>

      {/* テーブル */}
      <div className="max-w-screen-lg mx-auto w-full overflow-x-auto px-4 mb-4">
        <table
          className="min-w-[600px] w-full border-collapse text-center text-sm text-black">
          <thead className="bg-blue-300 text-black">
            <tr>
              <th className="border px-2 py-1 cursor-pointer"
                onClick={() => handleSort('customerId')}
              >
                顧客ID {renderSortIcon('customerId')}
              </th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('customerName')}>
                顧客名 {renderSortIcon('customerName')}
              </th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('leadTime')}>
                平均リードタイム（日） {renderSortIcon('leadTime')}
              </th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('totalSales')}>
                累計売上額 {renderSortIcon('totalSales')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedOrders.map((order, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                <td className="border px-2 py-1">{order.customerId}</td>
                <td className="border px-2 py-1">{order.customerName}</td>
                <td className="border px-2 py-1">{order.customerId === '' ? '' : order.leadTime}</td>
                <td className="border px-2 py-1">{order.customerId === '' ? '' : order.totalSales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CSVエクスポートボタン（スマホ専用） */}
      <div className="block sm:hidden mb-4 text-center">
        <button
          onClick={exportToCSV}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded border border-black">
          CSVエクスポート
        </button>
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