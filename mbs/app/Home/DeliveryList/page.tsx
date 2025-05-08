"use client";
 
import DeliveryTable, { Delivery } from './DeliveryTable'; 
import React, { useState } from 'react';
 
// ダミーデータ（DスタートID）
const dummyDeliverys: Delivery[] = [
  { id: 'D123456', date: '2004/4/7', customerName: '大阪情報専門学校', note: '(⌒∇⌒)ヤッホー',},
  { id: 'D123457', date: '2004/4/11', customerName: '株式会社スマートソリューションズ', note: '納品が約1ヶ月の遅れ',},
  { id: 'D223458', date: '2003/8/21', customerName: '株式会社SCC', note: '納品を約2ヶ月早めたい',},
  { id: 'D234056', date: '2010/3/7', customerName: '株式会社くら寿司', note: '納品中',}
];
 
export default function DeliveryListPage() {
  const [searchField, setSearchField] = useState<'すべて' | '納品ID' | '納品日' | '顧客名' | '備考'>('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [deliverys, setDeliverys] = useState<Delivery[]>(dummyDeliverys);
  const [sortField, setSortField] = useState<keyof Delivery | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const renderSortIcons = (field: keyof Delivery) => {
    return (
      <span className="ml-1 text-xs">
        <span className={sortField === field && sortOrder === 'asc' ? 'font-bold' : 'text-gray-400'}>▲</span>
        <span className={sortField === field && sortOrder === 'desc' ? 'font-bold' : 'text-gray-400'}>▼</span>
      </span>
    );
  };
 
  const handleSort = (field: keyof Delivery) => {
    const order = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    const sorted = [...deliverys].sort((a, b) => {
      if (a[field] === b[field]) return 0;
      return order === 'asc' ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1);
    });
    setSortField(field);
    setSortOrder(order);
    setDeliverys(sorted);
  };
 
  const handleSearch = () => {
    console.log('検索確定：', searchKeyword);
  };
 
  const filteredDeliverys = deliverys.filter(delivery => {
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
  const displayedDeliverys = [...filteredDeliverys];
  while (displayedDeliverys.length < 15) {
    displayedDeliverys.push({ id: '', date: '', customerName: '', note: '',});
  }
 
  return (
    <div className="flex flex-col items-center justify-center gap-2 sm:gap-4 mb-4">
      {/* 納品追加ボタン＋検索 */}
      <div className="flex flex-wrap items-center justify-start gap-4 mt-6">
      <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
        納品追加
      </button>
 
        <select
          value={searchField}
          onChange={e => setSearchField(e.target.value as any)}
          className="border rounded p-2"
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
<DeliveryTable
  deliveries={displayedDeliverys}
  onSort={handleSort}
  renderSortIcons={renderSortIcons}
  sortField={sortField}
  sortOrder={sortOrder}
/>

 
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