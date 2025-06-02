"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Customer, Order, Prisma } from '@/app/generated/prisma';

// Prismaのinclude結果の型（API応答用）
type OrderWithCustomerRelation = Prisma.OrderGetPayload<{
  include: { customer: true };
}>;

// 表示用の注文データ型（seed.tsのOrder + フラット化された顧客情報）
interface OrderWithCustomer extends Order {
  customerName: string;
  customerContactPerson: string;
}

// 検索フィールドの型定義
type SearchFieldType = "すべて" | "注文ID" | "注文日" | "顧客名" | "備考" | "商品名";

// ステータスフィルターの型定義
type StatusFilterType = "完了" | "未完了" | "";

// ソート設定の型定義
interface SortConfig {
  key: keyof OrderWithCustomer;
  direction: "asc" | "desc";
}

const OrderListPage: React.FC = () => {
  const router = useRouter();

  const [searchField, setSearchField] = useState<SearchFieldType>("すべて");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("");
  const [orders, setOrders] = useState<OrderWithCustomer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: "id",
    direction: "asc",
  });

  // ページング関連の状態
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage: number = 15; // 15行に設定

  // API経由でデータを取得する関数
  const fetchOrders = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");
      
      console.log("=== API経由でデータ取得開始 ===");
      
      const response = await fetch("/api/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("APIから取得したデータ:", data);
      
      if (data.success && data.orders && data.orders.length > 0) {
        // APIから取得したOrderデータをOrderWithCustomer形式に変換
        const ordersWithCustomer: OrderWithCustomer[] = data.orders.map((orderData: OrderWithCustomerRelation) => ({
          // PrismaのOrder型のすべてのフィールドを継承
          ...orderData,
          // 日付の型変換
          orderDate: orderData.orderDate instanceof Date ? orderData.orderDate : new Date(orderData.orderDate),
          updatedAt: orderData.updatedAt instanceof Date ? orderData.updatedAt : new Date(orderData.updatedAt),
          deletedAt: orderData.deletedAt ? (orderData.deletedAt instanceof Date ? orderData.deletedAt : new Date(orderData.deletedAt)) : null,
          // nullの場合の安全な変換
          note: orderData.note || "",
          // 顧客情報をフラット化
          customerName: orderData.customer?.name || "",
          customerContactPerson: orderData.customer?.contactPerson || "",
        }));
        
        setOrders(ordersWithCustomer);
        console.log("データベースのデータを表示中");
      } else {
        console.log("APIからのデータが空、またはエラー");
        throw new Error("データが空です");
      }
      
    } catch (err) {
      console.error("エラー詳細:", err);
      setError(`データ取得エラー: ${err}`);
      
      // フォールバック: ダミーデータを使用（seed.tsのOrder型と完全一致）
      console.log("フォールバック: ダミーデータを使用します");
      const fallbackOrders: OrderWithCustomer[] = [
        {
          // seed.tsのOrder型フィールド
          id: "O000001",
          customerId: "C-00001",
          orderDate: new Date("2025-01-01"),
          note: "注文1の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          // 表示用追加フィールド
          customerName: "大阪情報専門学校",
          customerContactPerson: "山田太郎",
        },
        {
          id: "O000002",
          customerId: "C-00002",
          orderDate: new Date("2025-01-02"),
          note: "注文2の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "株式会社スマートソリューションズ",
          customerContactPerson: "佐藤次郎",
        },
        {
          id: "O000003",
          customerId: "C-00003",
          orderDate: new Date("2025-01-03"),
          note: "注文3の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "株式会社SCC",
          customerContactPerson: "田中三郎",
        },
        {
          id: "O000004",
          customerId: "C-00004",
          orderDate: new Date("2025-01-04"),
          note: "注文4の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "株式会社くら寿司",
          customerContactPerson: "鈴木四郎",
        },
        {
          id: "O000005",
          customerId: "C-00005",
          orderDate: new Date("2025-01-05"),
          note: "注文5の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "株式会社大阪テクノロジー",
          customerContactPerson: "伊藤五郎",
        },
        {
          id: "O000006",
          customerId: "C-00006",
          orderDate: new Date("2025-01-06"),
          note: "注文6の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "関西医科大学",
          customerContactPerson: "高橋六郎",
        },
        {
          id: "O000007",
          customerId: "C-00007",
          orderDate: new Date("2025-01-07"),
          note: "注文7の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "グローバル貿易株式会社",
          customerContactPerson: "中村七海",
        },
        {
          id: "O000008",
          customerId: "C-00008",
          orderDate: new Date("2025-01-08"),
          note: "注文8の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "大阪市立図書館",
          customerContactPerson: "小林八雲",
        },
        {
          id: "O000009",
          customerId: "C-00009",
          orderDate: new Date("2025-01-09"),
          note: "注文9の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "近畿大学",
          customerContactPerson: "松本九十",
        },
        {
          id: "O000010",
          customerId: "C-00010",
          orderDate: new Date("2025-01-10"),
          note: "注文10の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "株式会社関西出版",
          customerContactPerson: "渡辺十郎",
        },
        {
          id: "O000011",
          customerId: "C-00011",
          orderDate: new Date("2025-01-11"),
          note: "注文11の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "さくら幼稚園",
          customerContactPerson: "斎藤春子",
        },
        {
          id: "O000012",
          customerId: "C-00012",
          orderDate: new Date("2025-01-12"),
          note: "注文12の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "大阪府立高校",
          customerContactPerson: "加藤夏子",
        },
        {
          id: "O000013",
          customerId: "C-00013",
          orderDate: new Date("2025-01-13"),
          note: "注文13の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "株式会社大阪エンジニアリング",
          customerContactPerson: "山本秋雄",
        },
        {
          id: "O000014",
          customerId: "C-00014",
          orderDate: new Date("2025-01-14"),
          note: "注文14の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "関西料理学校",
          customerContactPerson: "木村冬彦",
        },
        {
          id: "O000015",
          customerId: "C-00015",
          orderDate: new Date("2025-01-15"),
          note: "注文15の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "大阪アート美術館",
          customerContactPerson: "井上春夫",
        },
        {
          id: "O000016",
          customerId: "C-00016",
          orderDate: new Date("2025-01-16"),
          note: "注文16の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "関西経済研究所",
          customerContactPerson: "佐々木夏子",
        },
        {
          id: "O000017",
          customerId: "C-00017",
          orderDate: new Date("2025-01-17"),
          note: "注文17の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "大阪音楽院",
          customerContactPerson: "山下秋男",
        },
        {
          id: "O000018",
          customerId: "C-00018",
          orderDate: new Date("2025-01-18"),
          note: "注文18の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "関西健康センター",
          customerContactPerson: "中島冬美",
        },
        {
          id: "O000019",
          customerId: "C-00019",
          orderDate: new Date("2025-01-19"),
          note: "注文19の備考",
          status: "未完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "大阪ITスクール",
          customerContactPerson: "田村春樹",
        },
        {
          id: "O000020",
          customerId: "C-00020",
          orderDate: new Date("2025-01-20"),
          note: "注文20の備考",
          status: "完了",
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
          customerName: "関西メディカルセンター",
          customerContactPerson: "小川夏菜",
        },
      ];
      setOrders(fallbackOrders);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    fetchOrders();
  }, []);

  // 注文追加ページへ遷移する関数
  const handleAddOrder = (): void => {
    router.push("/Home/OrderList/Create");
  };

  const handleSort = (field: keyof OrderWithCustomer): void => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === field &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    
    const sorted = [...(orders || [])].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      // Dateオブジェクトの場合は特別な処理
      if (field === "orderDate" || field === "updatedAt") {
        const aDate = aValue instanceof Date ? aValue : new Date(aValue as string);
        const bDate = bValue instanceof Date ? bValue : new Date(bValue as string);
        return direction === "asc" 
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      // 文字列として比較
      const aStr = String(aValue || "");
      const bStr = String(bValue || "");

      if (aStr < bStr) return direction === "asc" ? -1 : 1;
      if (aStr > bStr) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setOrders(sorted);
    setSortConfig({ key: field, direction });
  };

  // 日付を表示用文字列に変換する関数
  const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD形式
  };

  const filteredOrders = (orders || []).filter((order) => {
    let matchField = false;

    const orderDateStr = formatDate(order.orderDate);

    if (searchField === "すべて") {
      // すべてのフィールドで検索
      matchField = 
        order.id.includes(searchKeyword) ||
        orderDateStr.includes(searchKeyword) ||
        order.customerName.includes(searchKeyword) ||
        (order.note || "").includes(searchKeyword);
    } else if (searchField === "注文ID") {
      matchField = order.id.includes(searchKeyword);
    } else if (searchField === "注文日") {
      matchField = orderDateStr.includes(searchKeyword);
    } else if (searchField === "顧客名") {
      matchField = order.customerName.includes(searchKeyword);
    } else if (searchField === "備考") {
      matchField = (order.note || "").includes(searchKeyword);
    } else if (searchField === "商品名") {
      // 商品名検索は今回は実装しない（OrderDetailsテーブルとの結合が必要）
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
    const emptyOrder: OrderWithCustomer = {
      id: "",
      customerId: "",
      orderDate: new Date(),
      note: "",
      status: "",
      updatedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
      customerName: "",
      customerContactPerson: "",
    };
    displayedOrders.push(emptyOrder);
  }

  // ページング関数
  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // ページング表示用の配列を生成
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
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

  const handleSearchFieldChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setSearchField(event.target.value as SearchFieldType);
  };

  const handleStatusFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatusFilter(event.target.value as StatusFilterType);
  };

  const handleSearchKeywordChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearchKeyword(event.target.value);
  };

  // ローディング表示
  if (loading) {
    return (
      <div className="p-2 sm:p-4 lg:p-6 max-w-screen-xl mx-auto flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-screen-xl mx-auto flex flex-col items-center min-h-screen">
      {/* 検索・フィルター エリア */}
      <div className="flex flex-row gap-2 sm:gap-4 mb-4 w-full justify-center items-center">
        <button
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-[48px] px-3 sm:px-4 border border-black rounded-md text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
          onClick={handleAddOrder}
          type="button"
        >
          注文追加
        </button>

        <select
          value={searchField}
          onChange={handleSearchFieldChange}
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
            placeholder="例：大阪情報専門学校、O000001、2025-01-01"
            value={searchKeyword}
            onChange={handleSearchKeywordChange}
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
              <th className="border px-2 py-2 sm:px-3 sm:py-3 w-[25%] sm:w-[30%] truncate">
                顧客名
              </th>
              <th className="border px-2 py-2 sm:px-3 sm:py-3 w-[25%] sm:w-[30%] truncate">
                備考
              </th>
              <th className="border px-2 py-2 sm:px-3 sm:py-3 w-[15%] sm:w-[12%] truncate">
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="text-xs sm:text-sm bg-transparent hover:bg-blue-200 transition-colors duration-200 border-none outline-none w-full text-center"
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
                <td className="border px-2 py-1 sm:px-3 sm:py-2 truncate">
                  {order.id ? formatDate(order.orderDate) : ""}
                </td>
                <td className="border px-2 py-1 sm:px-3 sm:py-2 truncate text-left sm:text-center">
                  {order.customerName}
                </td>
                <td className="border px-2 py-1 sm:px-3 sm:py-2 truncate text-left sm:text-center">
                  {order.note}
                </td>
                <td className="border px-2 py-1 sm:px-3 sm:py-2 truncate text-center">
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
              {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} /{" "}
              {filteredOrders.length}件
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
            type="button"
          >
            &lt;&lt;
          </button>

          {/* 前のページ */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="前のページ"
            type="button"
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
              type="button"
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
            type="button"
          >
            &gt;
          </button>

          {/* 最後のページ */}
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="最後のページ"
            type="button"
          >
            &gt;&gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderListPage;