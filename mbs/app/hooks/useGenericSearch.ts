import { useMemo } from 'react';

/**
 * 汎用的な検索フック
 * 複数のフィールドで部分一致検索を行う
 */
export function useGenericSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[] | 'all',
  caseSensitive: boolean = false
): T[] {
  return useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const keyword = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    
    return items.filter((item) => {
      if (searchFields === 'all') {
        // 全フィールドを対象に検索
        return Object.values(item as Record<string, unknown>).some((value) => {
          if (value == null) return false;
          const stringValue = caseSensitive ? String(value) : String(value).toLowerCase();
          return stringValue.includes(keyword);
        });
      }
      
      // 指定されたフィールドのみを対象に検索
      return searchFields.some((field) => {
        const value = item[field];
        if (value == null) return false;
        const stringValue = caseSensitive ? String(value) : String(value).toLowerCase();
        return stringValue.includes(keyword);
      });
    });
  }, [items, searchTerm, searchFields, caseSensitive]);
}

/**
 * 単一フィールドでの検索フック（シンプル版）
 */
export function useSimpleSearch<T>(
  items: T[],
  searchTerm: string,
  searchField: keyof T,
  caseSensitive: boolean = false
): T[] {
  return useGenericSearch(items, searchTerm, [searchField], caseSensitive);
}