'use client';

import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { SortConfig, sortItems } from '@/app/utils/sortUtils';
import Search from '@/app/components/Search';
import Pagination from '@/app/components/Pagination';
import DeliveryTable, { Delivery } from './DeliveryTable';
import {useRouter} from 'next/navigation';

// Delivery型を再エクスポート
export type { Delivery };

interface DeliveryListClientProps {
  initialDeliveries: Delivery[];
}

const DeliveryListClient: React.FC<DeliveryListClientProps> = ({ initialDeliveries }) => {
  const route = useRouter();
  const [searchField, setSearchField] = useState<
    'すべて' | '納品ID' | '納品日' | '顧客名' | '備考' | '商品名'
  >('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [deliveries, setDeliveries] = useState<Delivery[]>(initialDeliveries);
  const [sortConfig, setSortConfig] = useState<SortConfig<Delivery> | null>({
    key: 'id',
    direction: 'asc',
  });

  // 現在のページ
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // 1ページあたり15件

  const handleSort = (field: keyof Delivery) => {
    const sortedDeliveries = sortItems<Delivery>(deliveries, field, sortConfig, setSortConfig);
    setDeliveries(sortedDeliveries);
  };

  // 納品追加ハンドラー
  const handleAddDelivery = () => {
    
    route.push('/Home/DeliveryList/Add');
  };

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (!searchKeyword) return true;

    if (searchField === 'すべて') {
      return (
        delivery.id.includes(searchKeyword) ||
        delivery.date.includes(searchKeyword) ||
        delivery.customerName.includes(searchKeyword) ||
        delivery.note.includes(searchKeyword)
      );
    } else if (searchField === '納品ID') {
      return delivery.id.includes(searchKeyword);
    } else if (searchField === '納品日') {
      return delivery.date.includes(searchKeyword);
    } else if (searchField === '顧客名') {
      return delivery.customerName.includes(searchKeyword);
    } else if (searchField === '備考') {
      return delivery.note.includes(searchKeyword);
    }

    return false;
  });

  // ソートアイコンを生成する関数
  const renderSortIcons = (field: keyof Delivery) => {
    const isActive = sortConfig?.key === field;
    const direction = sortConfig?.direction;
    return (
      <span className="ml-1 inline-flex flex-col">
        <ChevronUp
          size={12}
          className={isActive && direction === 'asc' ? 'text-gray-800' : 'text-gray-400'}
        />
        <ChevronDown
          size={12}
          className={isActive && direction === 'desc' ? 'text-gray-800' : 'text-gray-400'}
        />
      </span>
    );
  };

  // ページング計算
  const totalPages = Math.ceil(filteredDeliveries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDeliveries = filteredDeliveries.slice(startIndex, endIndex);

  // 15行確保
  const displayedDeliveries = [...paginatedDeliveries];
  while (displayedDeliveries.length < itemsPerPage) {
    displayedDeliveries.push({ id: '', date: '', customerName: '', note: '' });
  }

  return (
    <div className="mx-auto flex min-h-142 max-w-screen-xl flex-col items-center p-2 sm:p-4 lg:p-5">
      {/* 検索・フィルター エリア */}
      <Search
        keyword={searchKeyword}
        onKeywordChange={setSearchKeyword}
        searchField={searchField}
        onSearchFieldChange={(value) =>
          setSearchField(value as 'すべて' | '納品ID' | '納品日' | '顧客名' | '備考' | '商品名')
        }
        searchFieldOptions={[
          { value: 'すべて', label: 'すべて検索' },
          { value: '納品ID', label: '納品ID' },
          { value: '納品日', label: '納品日' },
          { value: '顧客名', label: '顧客名' },
          { value: '備考', label: '備考' },
        ]}
        placeholder="例：納品ID、顧客名など"
        actionButtonLabel="納品追加"
        onActionButtonClick={handleAddDelivery}
      />

      {/* テーブル */}
      <div className="w-full overflow-x-auto rounded-lg bg-white shadow-sm">
        <DeliveryTable
          deliveries={displayedDeliveries}
          onSort={handleSort}
          renderSortIcons={renderSortIcons}
          sortField={sortConfig?.key || null}
          sortOrder={sortConfig?.direction || 'asc'}
        />
      </div>

      {/* ページネーション */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsInfo={{
          startIndex: startIndex,
          endIndex: endIndex,
          totalItems: filteredDeliveries.length,
        }}
      />
    </div>
  );
};

export default DeliveryListClient;
