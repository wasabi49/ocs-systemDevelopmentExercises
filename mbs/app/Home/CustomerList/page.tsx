"use client";

import React, { useState } from 'react';
import MessageDialog from './components/Modal';
import SearchFilter from '../../components/Search';
import { useFilteredOrders } from '../../hooks/Filtere';

type Order = {
  id: string;
  customerName: string;
  managerName: string;
};

// データをページごとに分割
const chunkOrders = (orders: Order[], chunkSize = 15): Order[][] => {
  const chunks: Order[][] = [];
  for (let i = 0; i < orders.length; i += chunkSize) {
    chunks.push(orders.slice(i, i + chunkSize));
  }
  return chunks;
};

export default function CustormerListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const handleImport = (data: string[][]) => {
    const dataRows = data.slice(1); // ヘッダー除外

    const mappedOrders: Order[] = dataRows.map((row, i) => ({
      id: (i + 1).toString(),
      customerName: row[0] ?? '',
      managerName: row[1] ?? '',
    }));

    setOrders(mappedOrders);
    setCurrentPage(0);
    setIsOpen(false);
  };

  // 検索ロジック（カスタムフック）
  const filteredOrders = useFilteredOrders(orders, searchKeyword, searchField);
  const chunkedOrders = chunkOrders(filteredOrders);
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
          {/* CSVインポートボタン */}
          <button
            onClick={() => setIsOpen(true)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded"
          >
            CSVインポート
          </button>
        </div>

        {/* 検索フィルター */}
        <SearchFilter
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
          searchField={searchField}
          onSearchFieldChange={setSearchField}
        />

        {/* 顧客リスト表示 */}
        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">
            顧客リスト（{currentPage * 15 + 1}〜{currentPage * 15 + currentOrders.length}件）
          </h2>
          <table className="w-full border-collapse text-center text-sm">
            <thead className="bg-blue-300">
              <tr>
                <th className="border px-2 py-1">顧客ID</th>
                <th className="border px-2 py-1">顧客名</th>
                <th className="border px-2 py-1">担当者</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.map((order, rowIndex) => (
                <tr key={order.id} className={`${rowIndex % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                  <td className="border px-2 py-1">{order.id}</td>
                  <td className="border px-2 py-1">{order.customerName}</td>
                  <td className="border px-2 py-1">{order.managerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        <div className="w-full mt-4">
          <div className="flex justify-between max-w-2xl mx-auto px-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className="bg-gray-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              前のページ
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= chunkedOrders.length - 1}
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
