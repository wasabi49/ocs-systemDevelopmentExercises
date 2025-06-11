'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Order } from '@/app/generated/prisma';
import Search from '@/app/components/Search';
import Pagination from '@/app/components/Pagination';
import { SortConfig, SortIcon, sortItems } from '@/app/utils/sortUtils';

// 表示用の注文データ型（seed.tsのOrder + フラット化された顧客情報）
interface OrderWithCustomer extends Order {
  customerName: string;
  customerContactPerson: string;
}

// 検索フィールドの型定義
type SearchFieldType = 'すべて' | '注文ID' | '注文日' | '顧客名' | '備考' | '商品名';

// ステータスフィルターの型定義
type StatusFilterType = '完了' | '未完了' | '';

interface OrderListClientProps {
  initialOrders: OrderWithCustomer[];
}

const OrderListClient: React.FC<OrderListClientProps> = ({ initialOrders }) => {
  const router = useRouter();

  const [searchField, setSearchField] = useState<SearchFieldType>('すべて');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('');
  const [orders, setOrders] = useState<OrderWithCustomer[]>(initialOrders);
  const [sortConfig, setSortConfig] = useState<SortConfig<OrderWithCustomer> | null>({
    key: 'id',
    direction: 'asc',
  });

  // ページング関連の状態
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage: number = 15; // 15行に設定

  // 注文追加ページへ遷移する関数
  const handleAddOrder = (): void => {
    router.push('/Home/OrderList/Create');
  };

  // ソート処理
  const handleSort = (field: keyof OrderWithCustomer): void => {
    const sortedOrders = sortItems<OrderWithCustomer>(
      orders || [],
      field,
      sortConfig,
      setSortConfig,
    );
    setOrders(sortedOrders);
  };

  // 日付を表示用文字列に変換する関数
  const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD形式
  };

  const filteredOrders = (orders || []).filter((order) => {
    let matchField = false;

    const orderDateStr = formatDate(order.orderDate);

    if (searchField === 'すべて') {
      // すべてのフィールドで検索
      matchField =
        order.id.includes(searchKeyword) ||
        orderDateStr.includes(searchKeyword) ||
        order.customerName.includes(searchKeyword) ||
        (order.note || '').includes(searchKeyword);
    } else if (searchField === '注文ID') {
      matchField = order.id.includes(searchKeyword);
    } else if (searchField === '注文日') {
      matchField = orderDateStr.includes(searchKeyword);
    } else if (searchField === '顧客名') {
      matchField = order.customerName.includes(searchKeyword);
    } else if (searchField === '備考') {
      matchField = (order.note || '').includes(searchKeyword);
    } else if (searchField === '商品名') {
      // 商品名検索は今回は実装しない（OrderDetailsテーブルとの結合が必要）
      matchField = false;
    }

    const matchStatus = statusFilter === '' || order.status === statusFilter;
    return matchField && matchStatus;
  });

  // ページング計算
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // 表示用に空行を追加（現在のページのアイテム数が15未満の場合）
  const displayedOrders = [...paginatedOrders];
  while (displayedOrders.length < itemsPerPage) {
    const emptyOrder: OrderWithCustomer = {
      id: '',
      customerId: '',
      orderDate: new Date(),
      note: '',
      status: '',
      updatedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
      customerName: '',
      customerContactPerson: '',
    };
    displayedOrders.push(emptyOrder);
  }

  // ページング関数
  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderSortIcon = (field: keyof OrderWithCustomer) => {
    return <SortIcon<OrderWithCustomer> field={field} sortConfig={sortConfig} />;
  };

  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setStatusFilter(event.target.value as StatusFilterType);
  };

  return (
    <div className="mx-auto flex min-h-142 max-w-screen-xl flex-col items-center p-2 sm:p-4 lg:p-5">
      {/* 検索・フィルター エリア */}
      <Search
        keyword={searchKeyword}
        onKeywordChange={setSearchKeyword}
        searchField={searchField}
        onSearchFieldChange={(value) => setSearchField(value as SearchFieldType)}
        searchFieldOptions={[
          { value: 'すべて', label: 'すべて検索' },
          { value: '注文ID', label: '注文ID' },
          { value: '注文日', label: '注文日' },
          { value: '顧客名', label: '顧客名' },
          { value: '備考', label: '備考' },
          { value: '商品名', label: '商品名' },
        ]}
        placeholder="例：大阪情報専門学校、O000001、2025-01-01"
        actionButtonLabel="注文追加"
        onActionButtonClick={handleAddOrder}
      />

      {/* テーブル エリア */}
      <div className="w-full overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[600px] border-collapse text-center text-xs sm:text-sm">
          <thead className="bg-blue-300">
            <tr>
              <th
                className="w-[15%] cursor-pointer truncate border px-1 py-0.5 text-[10px] transition-colors hover:bg-blue-400 sm:w-[12%] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm"
                onClick={() => handleSort('id')}
              >
                <div className="flex items-center justify-center">注文ID{renderSortIcon('id')}</div>
              </th>
              <th
                className="w-[15%] cursor-pointer truncate border px-1 py-0.5 text-[10px] transition-colors hover:bg-blue-400 sm:w-[12%] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm"
                onClick={() => handleSort('orderDate')}
              >
                <div className="flex items-center justify-center">
                  注文日{renderSortIcon('orderDate')}
                </div>
              </th>
              <th className="w-[25%] truncate border px-1 py-0.5 text-[10px] sm:w-[30%] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm">
                顧客名
              </th>
              <th className="w-[25%] truncate border px-1 py-0.5 text-[10px] sm:w-[30%] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm">
                備考
              </th>
              <th className="w-[15%] truncate border px-1 py-0.5 text-[10px] sm:w-[12%] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm">
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="w-full border-none bg-transparent text-center text-[10px] transition-colors duration-200 outline-none hover:bg-blue-200 sm:text-xs md:text-sm"
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
              <tr
                key={order.id || `empty-${index}`}
                className={`${
                  index % 2 === 0 ? 'bg-blue-100' : 'bg-white'
                } h-6 transition-colors hover:bg-blue-200 sm:h-8 md:h-10`}
              >
                <td className="truncate border px-2 py-1 sm:px-3 sm:py-2">
                  {order.id ? (
                    <Link
                      href={`/Home/OrderList/${order.id}`}
                      className="font-medium text-blue-600 underline transition-colors hover:text-blue-800"
                    >
                      {order.id}
                    </Link>
                  ) : (
                    ''
                  )}
                </td>
                <td className="truncate border px-2 py-1 sm:px-3 sm:py-2">
                  {order.id ? formatDate(order.orderDate) : ''}
                </td>
                <td className="truncate border px-2 py-1 text-left sm:px-3 sm:py-2 sm:text-center">
                  {order.customerName}
                </td>
                <td className="truncate border px-2 py-1 text-left sm:px-3 sm:py-2 sm:text-center">
                  {order.note}
                </td>
                <td className="truncate border px-2 py-1 text-center sm:px-3 sm:py-2">
                  {order.status === '未完了' ? (
                    <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                      {order.status}
                    </span>
                  ) : order.status === '完了' ? (
                    <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-600">
                      {order.status}
                    </span>
                  ) : (
                    ''
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページング エリア */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsInfo={{
          startIndex: startIndex,
          endIndex: endIndex,
          totalItems: filteredOrders.length,
        }}
      />
    </div>
  );
};

export default OrderListClient;
