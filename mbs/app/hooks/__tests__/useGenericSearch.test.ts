import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useGenericSearch, useSimpleSearch } from '../useGenericSearch';

interface TestItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  tags: string[];
}

describe('useGenericSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockItems: TestItem[] = [
    {
      id: 'item-001',
      name: 'ノートパソコン',
      category: 'Electronics',
      price: 80000,
      description: '高性能なノートパソコン',
      tags: ['PC', 'laptop'],
    },
    {
      id: 'item-002',
      name: 'マウス',
      category: 'Electronics',
      price: 2000,
      description: 'ワイヤレスマウス',
      tags: ['mouse', 'wireless'],
    },
    {
      id: 'item-003',
      name: 'デスク',
      category: 'Furniture',
      price: 25000,
      description: undefined,
      tags: ['desk', 'office'],
    },
    {
      id: 'SPEC-001',
      name: 'Special Item',
      category: 'Special',
      price: 0,
      description: 'Special description',
      tags: ['special'],
    },
  ];

  describe('基本的なフィルタリング機能', () => {
    it('検索語が空の場合、全てのアイテムを返す', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, '', ['name'])
      );

      expect(result.current).toEqual(mockItems);
    });

    it('検索語が空文字（空白のみ）の場合、全てのアイテムを返す', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, '   ', ['name'])
      );

      expect(result.current).toEqual(mockItems);
    });

    it('指定されたフィールドで検索できる', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'ノート', ['name'])
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('ノートパソコン');
    });

    it('複数のフィールドで検索できる', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'Electronics', ['name', 'category'])
      );

      expect(result.current).toHaveLength(2);
      expect(result.current.every(item => item.category === 'Electronics')).toBe(true);
    });

    it('数値フィールドでも検索できる', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, '2000', ['price'])
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].price).toBe(2000);
    });

    it('配列フィールドでも検索できる', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'laptop', ['tags'])
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].tags).toContain('laptop');
    });
  });

  describe('全フィールド検索', () => {
    it('"all"を指定すると全フィールドを対象に検索する', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'Special', 'all')
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe('SPEC-001');
    });

    it('全フィールド検索で複数のアイテムが見つかる', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'Electronics', 'all')
      );

      expect(result.current).toHaveLength(2);
      expect(result.current.every(item => item.category === 'Electronics')).toBe(true);
    });

    it('全フィールド検索でnullやundefinedの値を無視する', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'undefined', 'all')
      );

      expect(result.current).toEqual([]);
    });
  });

  describe('大文字小文字の区別', () => {
    it('caseSensitive=falseの場合、大文字小文字を区別しない（デフォルト）', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'electronics', ['category'])
      );

      expect(result.current).toHaveLength(2);
    });

    it('caseSensitive=trueの場合、大文字小文字を区別する', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'electronics', ['category'], true)
      );

      expect(result.current).toEqual([]);
    });

    it('caseSensitive=trueで正確にマッチする場合', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'Electronics', ['category'], true)
      );

      expect(result.current).toHaveLength(2);
    });
  });

  describe('nullとundefinedの処理', () => {
    it('undefinedの値は検索対象から除外される', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'undefined', ['description'])
      );

      expect(result.current).toEqual([]);
    });

    it('nullやundefinedを含むアイテムでも他のフィールドで検索できる', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'デスク', ['name', 'description'])
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('デスク');
    });
  });

  describe('部分一致検索', () => {
    it('部分一致で検索できる', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'パソ', ['name'])
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('ノートパソコン');
    });

    it('複数の部分一致がある場合、全て返す', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'item', ['id'])
      );

      expect(result.current).toHaveLength(3);
    });
  });

  describe('メモ化の動作確認', () => {
    it('同じ引数の場合、結果が再計算されない', () => {
      const { result, rerender } = renderHook(
        ({ items, searchTerm, searchFields, caseSensitive }) =>
          useGenericSearch(items, searchTerm, searchFields, caseSensitive),
        {
          initialProps: {
            items: mockItems,
            searchTerm: 'ノート',
            searchFields: ['name'] as (keyof TestItem)[],
            caseSensitive: false,
          },
        }
      );

      const firstResult = result.current;

      // 同じ引数で再レンダリング
      rerender({
        items: mockItems,
        searchTerm: 'ノート',
        searchFields: ['name'],
        caseSensitive: false,
      });

      // 参照が同じであることを確認（メモ化されている）
      expect(result.current).toStrictEqual(firstResult);
    });

    it('引数が変更された場合、結果が再計算される', () => {
      const { result, rerender } = renderHook(
        ({ items, searchTerm, searchFields, caseSensitive }) =>
          useGenericSearch(items, searchTerm, searchFields, caseSensitive),
        {
          initialProps: {
            items: mockItems,
            searchTerm: 'ノート',
            searchFields: ['name'] as (keyof TestItem)[],
            caseSensitive: false,
          },
        }
      );

      const firstResult = result.current;

      // searchTermを変更して再レンダリング
      rerender({
        items: mockItems,
        searchTerm: 'マウス',
        searchFields: ['name'],
        caseSensitive: false,
      });

      // 参照が異なることを確認（再計算されている）
      expect(result.current).not.toBe(firstResult);
      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('マウス');
    });
  });

  describe('エッジケース', () => {
    it('空の配列でも正常に動作する', () => {
      const { result } = renderHook(() =>
        useGenericSearch([], 'test', ['name'])
      );

      expect(result.current).toEqual([]);
    });

    it('存在しないフィールドを指定してもエラーにならない', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, 'test', ['nonExistentField' as any])
      );

      expect(result.current).toEqual([]);
    });

    it('マッチしない検索語の場合、空配列を返す', () => {
      const { result } = renderHook(() =>
        useGenericSearch(mockItems, '存在しない検索語', ['name'])
      );

      expect(result.current).toEqual([]);
    });
  });
});

describe('useSimpleSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockItems: TestItem[] = [
    {
      id: 'item-001',
      name: 'ノートパソコン',
      category: 'Electronics',
      price: 80000,
      description: '高性能なノートパソコン',
      tags: ['PC', 'laptop'],
    },
    {
      id: 'item-002',
      name: 'マウス',
      category: 'Electronics',
      price: 2000,
      description: 'ワイヤレスマウス',
      tags: ['mouse', 'wireless'],
    },
  ];

  describe('基本機能', () => {
    it('単一フィールドで検索できる', () => {
      const { result } = renderHook(() =>
        useSimpleSearch(mockItems, 'ノート', 'name')
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].name).toBe('ノートパソコン');
    });

    it('caseSensitiveオプションが動作する', () => {
      const { result } = renderHook(() =>
        useSimpleSearch(mockItems, 'electronics', 'category', true)
      );

      expect(result.current).toEqual([]);
    });

    it('検索語が空の場合、全てのアイテムを返す', () => {
      const { result } = renderHook(() =>
        useSimpleSearch(mockItems, '', 'name')
      );

      expect(result.current).toEqual(mockItems);
    });
  });

  describe('useGenericSearchとの一貫性', () => {
    it('useGenericSearchの単一フィールド指定と同じ結果を返す', () => {
      const { result: simpleResult } = renderHook(() =>
        useSimpleSearch(mockItems, 'Electronics', 'category')
      );

      const { result: genericResult } = renderHook(() =>
        useGenericSearch(mockItems, 'Electronics', ['category'])
      );

      expect(simpleResult.current).toEqual(genericResult.current);
    });

    it('大文字小文字の区別でも一貫した動作をする', () => {
      const { result: simpleResult } = renderHook(() =>
        useSimpleSearch(mockItems, 'electronics', 'category', false)
      );

      const { result: genericResult } = renderHook(() =>
        useGenericSearch(mockItems, 'electronics', ['category'], false)
      );

      expect(simpleResult.current).toEqual(genericResult.current);
    });
  });
});