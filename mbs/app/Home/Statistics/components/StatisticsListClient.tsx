'use client';

import React, { useState } from 'react';
import Search from '@/app/components/Search';
import Pagination from '@/app/components/Pagination';

interface StatisticsData {
  customerId: string;
  customerName: string;
  averageLeadTime: number;
  totalSales: number;
  updatedAt: string;
}

interface StatisticsListClientProps {
  statisticsData: StatisticsData[];
}

export default function StatisticsListClient({ statisticsData }: StatisticsListClientProps) {
  const [searchField, setSearchField] = useState<'すべて' | '顧客ID' | '顧客名'>('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortField, setSortField] = useState<keyof StatisticsData | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 検索機能
  const filteredStatistics = statisticsData.filter((item) => {
    if (searchField === 'すべて') {
      return (
        item.customerId.includes(searchKeyword) ||
        item.customerName.includes(searchKeyword) ||
        item.averageLeadTime.toString().includes(searchKeyword) ||
        item.totalSales.toString().includes(searchKeyword)
      );
    }
    const fieldValue =
      searchField === '顧客ID'
        ? item.customerId
        : searchField === '顧客名'
          ? item.customerName
          : '';
    return fieldValue.toString().includes(searchKeyword);
  });

  // ソート機能
  const sortedData = [...filteredStatistics].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === bValue) return 0;

    const comparison = aValue > bValue ? 1 : -1;
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // ページネーション
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedData.length);
  const currentData = sortedData.slice(startIndex, endIndex);

  // 表示用データ（15行確保）
  const displayData = [...currentData];
  while (displayData.length < itemsPerPage) {
    displayData.push({
      customerId: '',
      customerName: '',
      averageLeadTime: 0,
      totalSales: 0,
      updatedAt: '',
    });
  }

  const handleSort = (field: keyof StatisticsData) => {
    let nextOrder: 'asc' | 'desc' = 'asc';
    if (sortField === field) {
      nextOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    setSortField(field);
    setSortOrder(nextOrder);
  };

  const renderSortIcon = (field: keyof StatisticsData) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <span>▲</span> : <span>▼</span>;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  };

  const exportToCSV = () => {
    try {
      // データが空の場合の処理
      if (filteredStatistics.length === 0) {
        alert('出力するデータがありません。');
        return;
      }

      const headers = ['顧客ID', '顧客名', '平均リードタイム（日）', '累計売上額'];

      // CSVの行データを作成（ソート順を反映）
      const sortedForExport = [...filteredStatistics].sort((a, b) => {
        if (!sortField) return 0;

        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === bValue) return 0;

        const comparison = aValue > bValue ? 1 : -1;
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      const rows = sortedForExport.map((item) => [
        item.customerId,
        item.customerName,
        item.averageLeadTime.toFixed(1),
        // 売上額は数値のままでCSVに出力（Excelで正しく認識されるため）
        item.totalSales,
      ]);

      // CSVコンテンツの作成（BOMを追加してExcelで文字化けを防ぐ）
      const csvContent =
        '\uFEFF' + // BOM (Byte Order Mark)
        [
          headers.join(','),
          ...rows.map((row) =>
            row
              .map((value) => {
                // カンマや改行が含まれる場合はダブルクォートで囲む
                const stringValue = String(value);
                if (
                  stringValue.includes(',') ||
                  stringValue.includes('\n') ||
                  stringValue.includes('"')
                ) {
                  return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
              })
              .join(','),
          ),
        ].join('\n');

      // Blobを作成してダウンロード
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // 現在の日時でファイル名を生成
      const now = new Date();
      const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '_').replace(/-/g, '');
      const filename = `統計情報_${timestamp}.csv`;

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      // クリーンアップ
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 成功メッセージ
      alert(
        `CSV ファイル「${filename}」をダウンロードしました。\n出力件数: ${sortedForExport.length}件`,
      );
    } catch (error) {
      console.error('CSV出力エラー:', error);
      alert('CSV出力中にエラーが発生しました。もう一度お試しください。');
    }
  };

  return (
    <div className="mx-auto flex min-h-142 max-w-screen-xl flex-col items-center p-2 sm:p-4 lg:p-5">
      {/* 検索・フィルター エリア */}
      <Search
        keyword={searchKeyword}
        onKeywordChange={setSearchKeyword}
        searchField={searchField}
        onSearchFieldChange={(value: string) =>
          setSearchField(value as '顧客ID' | '顧客名' | 'すべて')
        }
        searchFieldOptions={[
          { value: 'すべて', label: 'すべて検索' },
          { value: '顧客ID', label: '顧客ID' },
          { value: '顧客名', label: '顧客名' },
        ]}
        placeholder="例：C-12345、大阪情報専門学校"
        actionButtonLabel="CSV出力"
        onActionButtonClick={exportToCSV}
      />

      {/* テーブル エリア */}
      <div className="w-full overflow-x-auto rounded-lg bg-white shadow-sm">
        {filteredStatistics.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-lg font-semibold text-gray-600">統計データがありません</div>
          </div>
        ) : (
          <table className="w-full min-w-[600px] border-collapse text-center text-[10px] sm:text-xs md:text-sm">
            <thead className="bg-blue-300">
              <tr>
                <th
                  className="w-[20%] cursor-pointer truncate border px-1 py-0.5 text-[10px] hover:bg-blue-400 sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm"
                  onClick={() => handleSort('customerId')}
                >
                  顧客ID {renderSortIcon('customerId')}
                </th>
                <th
                  className="w-[30%] cursor-pointer truncate border px-1 py-0.5 text-[10px] hover:bg-blue-400 sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm"
                  onClick={() => handleSort('customerName')}
                >
                  顧客名 {renderSortIcon('customerName')}
                </th>
                <th
                  className="w-[25%] cursor-pointer truncate border px-1 py-0.5 text-[10px] hover:bg-blue-400 sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm"
                  onClick={() => handleSort('averageLeadTime')}
                >
                  平均リードタイム（日） {renderSortIcon('averageLeadTime')}
                </th>
                <th
                  className="w-[25%] cursor-pointer truncate border px-1 py-0.5 text-[10px] hover:bg-blue-400 sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm"
                  onClick={() => handleSort('totalSales')}
                >
                  累計売上額 {renderSortIcon('totalSales')}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? 'bg-blue-100' : 'bg-white'
                  } h-6 transition-colors hover:bg-blue-200 sm:h-8 md:h-10`}
                >
                  <td className="truncate border px-1 py-0.5 font-mono text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-1.5 md:text-sm">
                    {item.customerId}
                  </td>
                  <td className="truncate border px-1 py-0.5 text-left text-[10px] sm:px-2 sm:py-1 sm:text-center sm:text-xs md:px-3 md:py-1.5 md:text-sm">
                    {item.customerName}
                  </td>
                  <td className="truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-1.5 md:text-sm">
                    {item.customerId === '' ? '' : item.averageLeadTime.toFixed(1)}
                  </td>
                  <td className="truncate border px-1 py-0.5 text-right text-[10px] font-medium sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-1.5 md:text-sm">
                    {item.customerId === '' ? '' : formatCurrency(item.totalSales)}
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
        onPageChange={setCurrentPage}
        itemsInfo={{
          startIndex: startIndex,
          endIndex: endIndex,
          totalItems: filteredStatistics.length,
        }}
      />
    </div>
  );
}
