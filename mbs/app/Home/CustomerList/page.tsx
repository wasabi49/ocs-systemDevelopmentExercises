"use client";

import React, { useState } from 'react';
import MessageDialog from './components/Modal';

type Order = {
  id: string;
  customerName: string;
  managerName: string;
};

// CSVファイルインポート後のデータ整形
const chunkOrders = (orders: Order[], chunkSize = 15): Order[][] => {
  const chunks: Order[][] = [];
  for (let i = 0; i < orders.length; i += chunkSize) {
    chunks.push(orders.slice(i, i + chunkSize));
  }
  return chunks;
};

export default function CustormerListPage() {
  const [searchField, setSearchField] = useState<'すべて' | '顧客ID' | '顧客名' | '担当者'>('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 現在のページ番号

  const handleSearch = () => {
    console.log('検索確定：', searchKeyword);
  };

  const handleImport = (data: string[][]) => {
    const mappedOrders = data
      .slice(1) // 1行目をスキップ
      .filter(row => row.length >= 3 && (row[0] || row[1] || row[2])) // 空行と不完全な行を除外
      .map(row => ({
        id: row[0] || '',
        customerName: row[1] || '',
        managerName: row[2] || '',
      }));
    setOrders(mappedOrders);
    setIsOpen(false);
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

  const chunkedOrders = chunkOrders(filteredOrders);

  // 現在のページのデータを取得
  const currentOrders = chunkedOrders[currentPage] || [];

  const handleNextPage = () => {
    if (currentPage < chunkedOrders.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <>
      <MessageDialog open={isOpen} onCancel={() => setIsOpen(false)} onOk={handleImport} />
      <div className="flex flex-col items-center justify-center gap-2 sm:gap-4 mb-4">
        <div className="flex flex-wrap items-center justify-start gap-4 mt-6">
        {/* 一行目 */}
          <button onClick={() => setIsOpen(true)} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
            CSVインポート
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
        </div>

        {/* 二行目 */}
        <div className="flex flex-wrap items-center justify-start gap-4">
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

        {/* 現在のページのテーブル表示 */}
        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">顧客リスト（{currentPage * 15 + 1}〜{currentPage * 15 + currentOrders.length}件）</h2>
          <table className="w-full border-collapse text-center text-sm">
            <thead className="bg-blue-300">
              <tr>
                <th className="border px-2 py-1">顧客ID<br/>(I:個人 C:法人)</th>
                <th className="border px-2 py-1">顧客名</th>
                <th className="border px-2 py-1">担当者</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order, rowIndex) => (
                <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                  <td className="border px-2 py-1">{order.id}</td>
                  <td className="border px-2 py-1">{order.customerName}</td>
                  <td className="border px-2 py-1">{order.managerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ページネーションボタン */}
        <div className="max-w-screen-lg mx-auto">
          <div className="flex justify-between w-full mt-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              前のページ
            </button>

            <button
              onClick={handleNextPage}
              disabled={currentPage === chunkedOrders.length - 1}
              className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              次のページ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
