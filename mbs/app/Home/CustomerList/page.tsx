'use client';

import React, { useState, useEffect, useTransition, useActionState } from 'react';
import MessageDialog from './components/Modal';
import CommonSearch from '@/app/components/CommonSearch';
import Pagination from '@/app/components/Pagination';
import { fetchCustomers } from '@/app/actions/customerActions';

// 顧客データの型定義
type Customer = {
  id: string;
  customerName: string;
  managerName: string;
};

export default function CustomerListPage() {
  // 状態管理
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchField, setSearchField] = useState('すべて');
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const itemsPerPage = 15; // 1ページあたり15件

  // Server Actionを呼び出す関数
  const fetchCustomersAction = () => {
    startTransition(() => {
      fetchCustomers();
    });
  };

  // Server Actionの状態を監視
  const state = useActionState(fetchCustomers, {
    status: 'pending' as const,
  });

  // ローディング状態を判定
  const loading = isPending || state.status === 'pending';

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchCustomersAction();
  }, []);

  // Server Actionの結果が更新されたらデータを設定
  useEffect(() => {
    if (state.status === 'success' && state.data) {
      setCustomers(state.data);
      setCurrentPage(1);
    } else if (state.status === 'error') {
      console.error('顧客データの取得に失敗しました:', state.error);
      // エラー時はダミーデータを表示する代わりに空配列を設定
      setCustomers([]);
    }
  }, [state]);

  const handleImport = (data: string[][]) => {
    const dataRows = data.slice(1); // ヘッダー除外

    const mappedCustomers: Customer[] = dataRows.map((row, i) => ({
      id: (i + 1).toString(),
      customerName: row[0] ?? '',
      managerName: row[1] ?? '',
    }));

    setCustomers(mappedCustomers);
    setCurrentPage(1);
    setIsOpen(false);
  };

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
    displayedCustomers.push({ id: '', customerName: '', managerName: '' });
  }

  // ページング関数
  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <MessageDialog open={isOpen} onCancel={() => setIsOpen(false)} onOk={handleImport} />

      <div className="mx-auto flex min-h-screen max-w-screen-xl flex-col items-center p-2 sm:p-4 lg:p-6">
        {/* 検索・フィルター エリア */}
        <CommonSearch
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
            <table className="w-full min-w-[600px] border-collapse text-center text-xs sm:text-sm">
              <thead className="bg-blue-300">
                <tr>
                  <th className="w-[20%] truncate border px-2 py-2 sm:px-3 sm:py-3">顧客ID</th>
                  <th className="w-[40%] truncate border px-2 py-2 sm:px-3 sm:py-3">顧客名</th>
                  <th className="w-[40%] truncate border px-2 py-2 sm:px-3 sm:py-3">担当者</th>
                </tr>
              </thead>
              <tbody>
                {displayedCustomers.map((customer, index) => (
                  <tr
                    key={customer.id || `empty-${index}`}
                    className={`${
                      index % 2 === 0 ? 'bg-blue-100' : 'bg-white'
                    } h-10 transition-colors hover:bg-blue-200 sm:h-12`}
                  >
                    <td className="truncate border px-2 py-1 sm:px-3 sm:py-2">{customer.id}</td>
                    <td className="truncate border px-2 py-1 text-left sm:px-3 sm:py-2 sm:text-center">
                      {customer.customerName}
                    </td>
                    <td className="truncate border px-2 py-1 text-left sm:px-3 sm:py-2 sm:text-center">
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
