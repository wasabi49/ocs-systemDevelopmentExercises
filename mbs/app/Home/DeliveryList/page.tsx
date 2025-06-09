'use client';

import DeliveryTable, { Delivery } from './DeliveryTable';
import React, { useState } from 'react';

// ダミーデータ（DスタートID）
const dummyDeliveries: Delivery[] = [
  { id: 'D123456', date: '2004/4/7', customerName: '大阪情報専門学校', note: '(⌒∇⌒)ヤッホー' },
  {
    id: 'D123457',
    date: '2004/4/11',
    customerName: '株式会社スマートソリューションズ',
    note: '納品が約1ヶ月の遅れ',
  },
  { id: 'D223458', date: '2003/8/21', customerName: '株式会社SCC', note: '納品を約2ヶ月早めたい' },
  { id: 'D234056', date: '2010/3/7', customerName: '株式会社くら寿司', note: '納品中' },
];

export default function DeliveryListPage() {
  const [searchField, setSearchField] = useState<
    'すべて' | '納品ID' | '納品日' | '顧客名' | '備考' | '商品名'
  >('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [deliveries, setDeliveries] = useState<Delivery[]>(dummyDeliveries);
  const [sortField, setSortField] = useState<keyof Delivery | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const renderSortIcons = (field: keyof Delivery) => {
    return (
      <span className="ml-1 text-xs">
        <span
          className={sortField === field && sortOrder === 'asc' ? 'font-bold' : 'text-gray-400'}
        >
          ▲
        </span>
        <span
          className={sortField === field && sortOrder === 'desc' ? 'font-bold' : 'text-gray-400'}
        >
          ▼
        </span>
      </span>
    );
  };

  const handleSort = (field: keyof Delivery) => {
    const order = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    const sorted = [...deliveries].sort((a, b) => {
      if (a[field] === b[field]) return 0;
      return order === 'asc' ? (a[field] > b[field] ? 1 : -1) : a[field] < b[field] ? 1 : -1;
    });
    setSortField(field);
    setSortOrder(order);
    setDeliveries(sorted);
  };

  const handleSearch = () => {
    console.log('検索確定：', searchKeyword);
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (searchField === 'すべて') {
      return (
        delivery.id.includes(searchKeyword) ||
        delivery.date.includes(searchKeyword) ||
        delivery.customerName.includes(searchKeyword) ||
        delivery.note.includes(searchKeyword)
      );
    }
    return delivery[searchField as keyof Delivery].includes(searchKeyword);
  });

  // 15行確保
  const displayedDeliveries = [...filteredDeliveries];
  while (displayedDeliveries.length < 15) {
    displayedDeliveries.push({ id: '', date: '', customerName: '', note: '' });
  }

  return (
    <div className="mb-4 flex flex-col items-center justify-center gap-2 md:gap-4">
      {/* 納品追加ボタン＋検索 */}
      <div className="mt-6 flex flex-wrap items-center justify-start gap-4">
        <a
          href="/Home/DeliveryList/Add"
          className="inline-block rounded bg-yellow-400 px-4 py-2 text-center font-bold text-black hover:bg-yellow-500"
        >
          納品追加
        </a>

        <select
          value={searchField}
          onChange={(e) =>
            setSearchField(
              e.target.value as 'すべて' | '納品ID' | '納品日' | '顧客名' | '備考' | '商品名',
            )
          }
          className="rounded border p-2"
        >
          <option value="すべて">すべて検索</option>
          <option value="納品ID">納品ID</option>
          <option value="納品日">納品日</option>
          <option value="顧客名">顧客名</option>
          <option value="備考">備考</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-start gap-4">
        <input
          type="text"
          placeholder="例：納品ID"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-64 rounded border p-2"
        />
      </div>

      {/* テーブル */}
      <div className="w-full max-w-full overflow-x-auto px-4 md:px-8">
        <DeliveryTable
          deliveries={displayedDeliveries}
          onSort={handleSort}
          renderSortIcons={renderSortIcons}
          sortField={sortField}
          sortOrder={sortOrder}
        />
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
