import React from 'react';

/**
 * 共通検索コンポーネントのProps
 */
export type CommonSearchProps = {
  // 検索キーワード
  keyword: string;
  // 検索キーワード変更ハンドラー
  onKeywordChange: (value: string) => void;
  // 選択された検索フィールド
  searchField: string;
  // 検索フィールド変更ハンドラー
  onSearchFieldChange: (value: string) => void;
  // 検索フィールドのオプション
  searchFieldOptions: { value: string; label: string }[];
  // 検索プレースホルダー
  placeholder?: string;
  // アクションボタン（注文追加など）のラベル
  actionButtonLabel?: string;
  // アクションボタンのクリックハンドラー
  onActionButtonClick?: () => void;
};

/**
 * 共通検索コンポーネント
 * 検索フィールド選択、検索キーワード入力、アクションボタンを提供
 */
export default function CommonSearch({
  keyword,
  onKeywordChange,
  searchField,
  onSearchFieldChange,
  searchFieldOptions,
  placeholder = '検索キーワードを入力',
  actionButtonLabel,
  onActionButtonClick,
}: CommonSearchProps) {
  return (
    <div className="mb-4 flex w-full flex-row items-center justify-center gap-2 sm:gap-4">
      {/* アクションボタン（注文追加など） */}
      {actionButtonLabel && onActionButtonClick && (
        <button
          className="h-[48px] flex-shrink-0 rounded-md border border-black bg-yellow-400 px-3 text-xs font-bold whitespace-nowrap text-black hover:bg-yellow-500 sm:px-4 sm:text-sm"
          onClick={onActionButtonClick}
          type="button"
        >
          {actionButtonLabel}
        </button>
      )}

      {/* 検索フィールド選択 */}
      <select
        value={searchField}
        onChange={(e) => onSearchFieldChange(e.target.value)}
        className="h-[48px] w-24 flex-shrink-0 rounded-md border border-black px-2 py-2 text-xs sm:w-32 sm:text-sm"
      >
        {searchFieldOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* 検索キーワード入力 */}
      <div className="relative flex min-w-0 flex-1 items-center">
        <div className="absolute left-2 z-10 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4 sm:h-5 sm:w-5"
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
          placeholder={placeholder}
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="h-[48px] w-full rounded-md border border-black bg-white py-2 pr-3 pl-8 text-xs focus:border-orange-500 focus:outline-none sm:text-sm"
          aria-label="検索フィールド"
        />
      </div>
    </div>
  );
}
