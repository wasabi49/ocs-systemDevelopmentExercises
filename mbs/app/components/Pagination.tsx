import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

/**
 * ページネーションコンポーネントのProps
 */
export type PaginationProps = {
  // 現在のページ番号
  currentPage: number;
  // 総ページ数
  totalPages: number;
  // ページ変更ハンドラー
  onPageChange: (page: number) => void;
  // 表示アイテム数情報
  itemsInfo?: {
    startIndex: number;
    endIndex: number;
    totalItems: number;
  };
  // 表示するページボタンの最大数
  maxVisiblePages?: number;
};

/**
 * 共通ページネーションコンポーネント
 * ページ番号、ページ移動ボタン、アイテム数表示を提供
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsInfo,
  maxVisiblePages = 5,
}: PaginationProps) {
  // ページング表示用の配列を生成
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];

    if (totalPages <= maxVisiblePages) {
      // 総ページ数が表示最大数以下の場合はすべて表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        // 現在のページが先頭付近の場合
        for (let i = 1; i <= maxVisiblePages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        // 現在のページが末尾付近の場合
        for (let i = totalPages - maxVisiblePages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 現在のページが中央の場合
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  };

  // ページ変更ハンドラー
  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:mt-6 sm:flex-row sm:gap-4">
      {/* アイテム数情報表示 */}
      {itemsInfo && (
        <div className="mb-2 text-xs text-gray-600 sm:mb-0 sm:text-sm">
          {itemsInfo.totalItems > 0 ? (
            <>
              {itemsInfo.startIndex + 1}-{Math.min(itemsInfo.endIndex, itemsInfo.totalItems)} /{' '}
              {itemsInfo.totalItems}件
            </>
          ) : (
            '0件'
          )}
        </div>
      )}

      {/* ページネーションボタングループ */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* 最初のページ */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className="rounded border px-2 py-1 text-xs transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm"
          aria-label="最初のページ"
          type="button"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* 前のページ */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded border px-2 py-1 text-xs transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm"
          aria-label="前のページ"
          type="button"
        >
          <ChevronLeft size={16} />
        </button>

        {/* ページ番号ボタン */}
        {getPageNumbers().map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`rounded border px-2 py-1 text-xs transition-colors sm:px-3 sm:py-2 sm:text-sm ${
              currentPage === page
                ? 'border-blue-500 bg-blue-500 font-bold text-white'
                : 'hover:bg-gray-100'
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
          className="rounded border px-2 py-1 text-xs transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm"
          aria-label="次のページ"
          type="button"
        >
          <ChevronRight size={16} />
        </button>

        {/* 最後のページ */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded border px-2 py-1 text-xs transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:py-2 sm:text-sm"
          aria-label="最後のページ"
          type="button"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
