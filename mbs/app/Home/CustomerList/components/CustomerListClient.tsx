'use client';

import React, { useState, useTransition } from 'react';
import MessageDialog from './Modal';
import Search from '@/app/components/Search';
import Pagination from '@/app/components/Pagination';
import { fetchCustomers } from '@/app/actions/customerActions';
import { useServerActionStoreCheck } from '@/app/hooks/useServerActionStoreCheck';

// 顧客データの型定義
type Customer = {
  id: string;
  customerName: string;
  managerName: string;
  storeName: string;
};

type CustomerListClientProps = {
  initialCustomers: Customer[];
};

export default function CustomerListClient({ initialCustomers }: CustomerListClientProps) {
  const { checkStoreRequirement } = useServerActionStoreCheck();

  // 状態管理
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchField, setSearchField] = useState('すべて');
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const itemsPerPage = 15; // 1ページあたり15件

  // Server Actionを呼び出す関数
  const loadCustomers = () => {
    startTransition(async () => {
      // Cookie版：店舗IDは自動取得される
      const result = await fetchCustomers();

      // 店舗選択チェック
      if (checkStoreRequirement(result)) {
        return;
      }

      if (result.status === 'success') {
        setCustomers(result.data);
        setCurrentPage(1);
      } else {
        console.error('顧客データの取得に失敗しました:', result.error);
        setCustomers([]);
      }
    });
  };

  // CSVインポート成功時にデータを再取得する関数
  const handleImportSuccess = () => {
    loadCustomers();
  };

  // ローディング状態
  const loading = isPending;

  // 検索ロジック
  const filteredCustomers = customers.filter((customer) => {
    if (!searchKeyword) return true;

    const lowerKeyword = searchKeyword.toLowerCase();

    if (searchField === '顧客ID') {
      return customer.id.toLowerCase().includes(lowerKeyword);
    } else if (searchField === '顧客名') {
      return customer.customerName.toLowerCase().includes(lowerKeyword);
    } else if (searchField === '担当者') {
      return customer.managerName.toLowerCase().includes(lowerKeyword);
    } else {
      // 'すべて' の場合は全フィールド対象
      return (
        customer.id.toLowerCase().includes(lowerKeyword) ||
        customer.customerName.toLowerCase().includes(lowerKeyword) ||
        customer.managerName.toLowerCase().includes(lowerKeyword)
      );
    }
  });

  // ページング計算
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredCustomers.length);
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // 表示用に空行を追加（現在のページのアイテム数が15未満の場合）
  const displayedCustomers = [...paginatedCustomers];
  while (displayedCustomers.length < itemsPerPage) {
    displayedCustomers.push({ id: '', customerName: '', managerName: '', storeName: '' });
  }

  // ページング関数
  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <MessageDialog
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <div className="mx-auto flex min-h-142 max-w-screen-xl flex-col items-center p-2 sm:p-4 lg:p-5">
        {/* 検索・フィルター エリア */}
        <Search
          keyword={searchKeyword}
          onKeywordChange={setSearchKeyword}
          searchField={searchField}
          onSearchFieldChange={(value: string) => setSearchField(value)}
          searchFieldOptions={[
            { value: 'すべて', label: 'すべて検索' },
            { value: '顧客ID', label: '顧客ID' },
            { value: '顧客名', label: '顧客名' },
            { value: '担当者', label: '担当者' },
          ]}
          placeholder="例：I-12345、大阪情報専門学校、山田太郎"
          actionButtonLabel="CSVインポート"
          onActionButtonClick={() => setIsOpen(true)}
        />

        {/* テーブル エリア */}
        <div className="w-full overflow-x-auto rounded-lg bg-white shadow-sm">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-lg font-semibold text-gray-600">データを読み込み中...</div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-lg font-semibold text-gray-600">顧客データがありません</div>
            </div>
          ) : (
            <table className="w-full min-w-[400px] border-collapse text-center text-[10px] sm:text-xs md:text-sm">
              <thead className="bg-blue-300">
                <tr>
                  <th className="w-[25%] truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm">
                    顧客ID
                  </th>
                  <th className="w-[40%] truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm">
                    顧客名
                  </th>
                  <th className="w-[35%] truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm">
                    担当者
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map((customer, index) => (
                  <tr
                    key={customer.id || `empty-${index}`}
                    className={`${
                      index % 2 === 0 ? 'bg-blue-100' : 'bg-white'
                    } h-6 transition-colors hover:bg-blue-200 sm:h-8 md:h-10`}
                  >
                    <td className="truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-1.5 md:text-sm">
                      {customer.id}
                    </td>
                    <td className="truncate border px-1 py-0.5 text-left text-[10px] sm:px-2 sm:py-1 sm:text-center sm:text-xs md:px-3 md:py-1.5 md:text-sm">
                      {customer.customerName}
                    </td>
                    <td className="truncate border px-1 py-0.5 text-left text-[10px] sm:px-2 sm:py-1 sm:text-center sm:text-xs md:px-3 md:py-1.5 md:text-sm">
                      {customer.managerName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ページング エリア */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          itemsInfo={{
            startIndex: startIndex,
            endIndex: endIndex,
            totalItems: filteredCustomers.length,
          }}
        />
      </div>
    </>
  );
}
