"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ERダイアグラムに対応した型定義
type Customer = {
  id: string; // C-XXXXX形式
  storeId: string;
  name: string;
  contactPerson: string;
  address: string;
  phone: string;
  deliveryCondition: string;
  note: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
};

type Order = {
  id: string; // OXXXXXXX形式
  customerId: string;
  orderDate: string;
  note: string;
  status: '完了' | '未完了' | '';
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
};

// 表示用の注文データ型（顧客情報を含む）
type OrderWithCustomer = Order & {
  customerName: string;
  customerContactPerson: string;
};

// ダミーの顧客データ
const dummyCustomers: Customer[] = [
  {
    id: 'C-00001',
    storeId: 'store-001',
    name: '大阪情報専門学校',
    contactPerson: '田中太郎',
    address: '大阪府大阪市北区梅田1-1-1',
    phone: '06-1234-5678',
    deliveryCondition: '平日9:00-17:00',
    note: '教育機関',
    updatedAt: '2024-12-15T09:00:00Z',
    isDeleted: false
  },
  {
    id: 'C-00002',
    storeId: 'store-001',
    name: '森ノ宮病院',
    contactPerson: '佐藤花子',
    address: '大阪府大阪市中央区森ノ宮1-2-3',
    phone: '06-2345-6789',
    deliveryCondition: '24時間対応可',
    note: '医療機関',
    updatedAt: '2024-12-14T14:30:00Z',
    isDeleted: false
  }
];

// ダミーの注文データ（ERダイアグラム対応）
const dummyOrders: Order[] = [
  {
    id: "O1234567",
    customerId: "C-00001",
    orderDate: "2004/4/7",
    note: "",
    status: "完了",
    updatedAt: "2024-12-15T09:00:00Z",
    isDeleted: false
  },
  {
    id: "O1234568",
    customerId: "C-00002",
    orderDate: "2004/4/8",
    note: "早期納品希望",
    status: "未完了",
    updatedAt: "2024-12-15T10:00:00Z",
    isDeleted: false
  }
];

export default function OrderListPage() {
  const router = useRouter();
  
  const [searchField, setSearchField] = useState<
    "すべて" | "注文ID" | "注文日" | "顧客名" | "備考" | "商品名"
  >("すべて");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"完了" | "未完了" | "">("");
  const [orders, setOrders] = useState<Order[]>(dummyOrders);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof OrderWithCustomer;
    direction: "asc" | "desc";
  } | null>({ key: "id", direction: "asc" });
  
  // ページング関連の状態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 注文追加ページへ遷移する関数
  const handleAddOrder = () => {
    router.push("/Home/OrderList/Create");
  };

  // 顧客情報を取得する関数
  const getCustomerById = (customerId: string): Customer | undefined => {
    return dummyCustomers.find(customer => customer.id === customerId);
  };

  // 注文データに顧客情報を結合
  const ordersWithCustomer: OrderWithCustomer[] = orders.map(order => {
    const customer = getCustomerById(order.customerId);
    return {
      ...order,
      customerName: customer?.name || '不明な顧客',
      customerContactPerson: customer?.contactPerson || ''
    };
  });

  const handleSort = (field: keyof OrderWithCustomer) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === field &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    const sorted = [...ordersWithCustomer].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      
      // 文字列として比較
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      
      if (aStr < bStr) return direction === "asc" ? -1 : 1;
      if (aStr > bStr) return direction === "asc" ? 1 : -1;
      return 0;
    });
    
    // ソート結果をorderStateに反映（顧客情報を除いた注文データのみ）
    const sortedOrders = sorted.map(({ customerName, customerContactPerson, ...order }) => order);
    setOrders(sortedOrders);
    setSortConfig({ key: field, direction });
  };

  const filteredOrders = ordersWithCustomer.filter((order) => {
    let matchField = false;
    
    if (searchField === "すべて") {
      matchField = true;
    } else if (searchField === "注文ID") {
      matchField = order.id.includes(searchKeyword);
    } else if (searchField === "注文日") {
      matchField = order.orderDate.includes(searchKeyword);
    } else if (searchField === "顧客名") {
      matchField = order.customerName.includes(searchKeyword);
    } else if (searchField === "備考") {
      matchField = order.note.includes(searchKeyword);
    } else if (searchField === "商品名") {
      // 商品名検索は実装されていないため、falseを返す
      matchField = false;
    }
    
    const matchStatus = statusFilter === "" || order.status === statusFilter;
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
    displayedOrders.push({
      id: "",
      customerId: "",
      orderDate: "",
      note: "",
      status: "" as const,
      updatedAt: "",
      isDeleted: false,
      customerName: "",
      customerContactPerson: ""
    });
  }

  // ページング関数
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ページング表示用の配列を生成
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  const renderSortIcon = (field: keyof OrderWithCustomer) => {
    const isActive = sortConfig?.key === field;
    const direction = sortConfig?.direction;
    return (
      <span className="ml-1">
        <span
          className={`inline-block text-xs ${
            isActive && direction === "asc" ? "text-black" : "text-gray-400"
          }`}
        >
          ▲
        </span>
        <span
          className={`inline-block text-xs ml-0.5 ${
            isActive && direction === "desc" ? "text-black" : "text-gray-400"
          }`}
        >
          ▼
        </span>
      </span>
    );
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-screen-xl mx-auto flex flex-col items-center min-h-screen">
      {/* 検索・フィルター エリア */}
      <div className="flex flex-row gap-2 sm:gap-4 mb-4 w-full justify-center items-center">
        <button 
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-[48px] px-3 sm:px-4 border border-black rounded-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
          onClick={handleAddOrder}
        >
          注文追加
        </button>

        <select
          value={searchField}
          onChange={(e) =>
            setSearchField(
              e.target.value as
                | "すべて"
                | "注文ID"
                | "注文日"
                | "顧客名"
                | "備考"
                | "商品名"
            )
          }
          className="border border-black px-2 py-2 h-[48px] text-xs sm:text-sm rounded-md w-24 sm:w-32 flex-shrink-0"
        >
          <option value="すべて">すべて検索</option>
          <option value="注文ID">注文ID</option>
          <option value="注文日">注文日</option>
          <option value="顧客名">顧客名</option>
          <option value="備考">備考</option>
          <option value="商品名">商品名</option>
        </select>

        <div className="relative flex items-center flex-1 min-w-0">
          <div className="absolute left-2 text-gray-500 z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 sm:w-5 sm:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="例：注文日"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="border border-black pl-8 pr-3 py-2 h-[48px] text-xs sm:text-sm rounded-md w-full bg-white focus:border-orange-500 focus:outline-none"
            aria-label="検索フィールド"
          />
        </div>
      </div>

      {/* テーブル エリア */}
      <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full border-collapse text-center text-xs sm:text-sm min-w-[600px]">
          <thead className="bg-blue-300">
            <tr>
              <th
                className="border px-2 py-2 sm:px-3 sm:py-3 w-[15%] sm:w-[12%] truncate cursor-pointer hover:bg-blue-400 transition-colors"
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center justify-center">
                  注文ID{renderSortIcon("id")}
                </div>
              </th>
              <th
                className="border px-2 py-2 sm:px-3 sm:py-3 w-[15%] sm:w-[12%] truncate cursor-pointer hover:bg-blue-400 transition-colors"
                onClick={() => handleSort("orderDate")}
              >
                <div className="flex items-center justify-center">
                  注文日{renderSortIcon("orderDate")}
                </div>
              </th>
              <th 
                className="border px-2 py-2 sm:px-3 sm:py-3 w-[25%] sm:w-[30%] truncate cursor-pointer hover:bg-blue-400 transition-colors"
                onClick={() => handleSort("customerName")}
              >
                <div className="flex items-center justify-center">
                  顧客名{renderSortIcon("customerName")}
                </div>
              </th>
              <th className="border px-2 py-2 sm:px-3 sm:py-3 w-[25%] sm:w-[30%] truncate">備考</th>
              <th className="border px-2 py-2 sm:px-3 sm:py-3 w-[15%] sm:w-[12%] truncate">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as "完了" | "未完了" | "")
                  }
                  className="text-xs sm:text-sm bg-transparent hover:bg-blue-200 transition-colors duration-200 border-none outline-none w-full"
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
                key={index}
                className={`${
                  index % 2 === 0 ? "bg-blue-100" : "bg-white"
                } h-10 sm:h-12 hover:bg-blue-200 transition-colors`}
              >
                <td className="border px-2 py-1 sm:px-3 sm:py-2 truncate">
                  {order.id ? (
                    <Link
                      href={`/Home/OrderList/${order.id}`}
                      className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors"
                    >
                      {order.id}
                    </Link>
                  ) : (
                    ""
                  )}
                </td>
                <td className="border px-2 py-1 sm:px-3 sm:py-2 truncate">{order.orderDate}</td>
                <td className="border px-2 py-1 sm:px-3 sm:py-2 truncate text-left sm:text-center">
                  {order.customerName}
                </td>
                <td className="border px-2 py-1 sm:px-3 sm:py-2 truncate text-left sm:text-center">{order.note}</td>
                <td className="border px-2 py-1 sm:px-3 sm:py-2 truncate">
                  {order.status === "未完了" ? (
                    <span className="text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-full text-xs">
                      {order.status}
                    </span>
                  ) : order.status === "完了" ? (
                    <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full text-xs">
                      {order.status}
                    </span>
                  ) : (
                    ""
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ページング エリア */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
          {filteredOrders.length > 0 ? (
            <>
              {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} / {filteredOrders.length}件
            </>
          ) : (
            "0件"
          )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {/* 最初のページ */}
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="最初のページ"
          >
            &lt;&lt;
          </button>
          
          {/* 前のページ */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="前のページ"
          >
            &lt;
          </button>

          {/* ページ番号 */}
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded transition-colors ${
                currentPage === page
                  ? "bg-blue-500 text-white font-bold border-blue-500"
                  : "hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}

          {/* 次のページ */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="次のページ"
          >
            &gt;
          </button>

          {/* 最後のページ */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="最後のページ"
          >
            &gt;&gt;
          </button>
        </div>
      </div>
    </div>
  );
}