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
        className="border rounded p-2"
        value={searchField}
        onChange={(e) => onSearchFieldChange(e.target.value)}
      >
        <option value="all">すべて検索</option>
        <option value="id">顧客ID</option>
        <option value="customerName">顧客名</option>
        <option value="managerName">担当者</option>
      </select>

      {/* 検索キーワード入力 */}
      <input
        type="text"
        placeholder="例：I-12345"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        className="border rounded p-2 w-64"
      />
    </div>
  );
}
