import React from 'react';

/**
 * ソート設定の型定義
 */
export interface SortConfig<T> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

/**
 * ソートアイコンを表示するコンポーネント
 */
export function SortIcon<T>({
  field,
  sortConfig,
}: {
  field: keyof T;
  sortConfig: SortConfig<T> | null;
}) {
  const isActive = sortConfig?.key === field;
  const direction = sortConfig?.direction;

  return (
    <span className="ml-1">
      <span
        className={`inline-block text-xs ${
          isActive && direction === 'asc' ? 'text-black' : 'text-gray-400'
        }`}
      >
        ▲
      </span>
      <span
        className={`ml-0.5 inline-block text-xs ${
          isActive && direction === 'desc' ? 'text-black' : 'text-gray-400'
        }`}
      >
        ▼
      </span>
    </span>
  );
}

/**
 * 配列をソートする関数
 * @param items ソート対象の配列
 * @param field ソートするフィールド名
 * @param sortConfig 現在のソート設定
 * @param setSortConfig ソート設定更新関数
 * @returns ソート後の配列
 */
export function sortItems<T>(
  items: T[],
  field: keyof T,
  sortConfig: SortConfig<T> | null,
  setSortConfig: (config: SortConfig<T>) => void,
): T[] {
  // ソート方向を決定
  let direction: 'asc' | 'desc' = 'asc';
  if (sortConfig && sortConfig.key === field && sortConfig.direction === 'asc') {
    direction = 'desc';
  }

  // 配列をコピーしてソート
  const sorted = [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];

    // Dateオブジェクトの場合は特別な処理
    if (aValue instanceof Date || bValue instanceof Date) {
      const aDate = aValue instanceof Date ? aValue : new Date(aValue as string);
      const bDate = bValue instanceof Date ? bValue : new Date(bValue as string);
      return direction === 'asc'
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }

    // 文字列として比較
    const aStr = String(aValue || '');
    const bStr = String(bValue || '');

    if (aStr < bStr) return direction === 'asc' ? -1 : 1;
    if (aStr > bStr) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // ソート設定を更新
  setSortConfig({ key: field, direction });

  return sorted;
}
