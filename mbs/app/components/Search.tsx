import React from 'react';

type SearchFilterProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  searchField: string;
  onSearchFieldChange: (value: string) => void;
};

export default function SearchFilter({
  keyword,
  onKeywordChange,
  searchField,
  onSearchFieldChange,
}: SearchFilterProps) {
  return (
    <div className="flex flex-wrap items-center justify-start gap-4">
      {/* 検索対象のプルダウン */}
      <select
        className="rounded border p-2"
        value={searchField}
        onChange={(e) => onSearchFieldChange(e.target.value)}
      >
        <option value="all">すべて検索</option>
        <option value="id">顧客ID</option>
        <option value="customerName">顧客名</option>
        <option value="managerName">担当者</option>
      </select>

      {/* 検索キーワード入力 */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-4 w-4 text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="例：I-12345"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          className="w-64 rounded border p-2 pl-10"
        />
      </div>
    </div>
  );
}
