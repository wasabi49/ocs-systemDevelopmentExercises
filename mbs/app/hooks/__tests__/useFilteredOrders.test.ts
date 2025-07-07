import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useFilteredOrders } from '../useFilteredOrders';

describe('useFilteredOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockOrders = [
    { id: 'ord-001', customerName: '田中商事', managerName: '佐藤太郎' },
    { id: 'ord-002', customerName: '山田物産', managerName: '鈴木花子' },
    { id: 'ord-003', customerName: '田中工業', managerName: '高橋次郎' },
    { id: 'spec-001', customerName: '特殊案件', managerName: '佐藤太郎' },
  ];

  describe('フィルタリング機能', () => {
    it('keywordが空の場合、全ての注文を返す', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '', 'all')
      );

      expect(result.current).toEqual(mockOrders);
    });

    it('keywordが空文字列の場合、全ての注文を返す', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '', 'id')
      );

      expect(result.current).toEqual(mockOrders);
    });

    it('IDでフィルタリングできる', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, 'ord', 'id')
      );

      expect(result.current).toHaveLength(3);
      expect(result.current).toEqual([
        { id: 'ord-001', customerName: '田中商事', managerName: '佐藤太郎' },
        { id: 'ord-002', customerName: '山田物産', managerName: '鈴木花子' },
        { id: 'ord-003', customerName: '田中工業', managerName: '高橋次郎' },
      ]);
    });

    it('ID（小文字）でフィルタリングできる', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, 'spec', 'id')
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe('spec-001');
    });

    it('顧客名でフィルタリングできる', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '田中', 'customerName')
      );

      expect(result.current).toHaveLength(2);
      expect(result.current).toEqual([
        { id: 'ord-001', customerName: '田中商事', managerName: '佐藤太郎' },
        { id: 'ord-003', customerName: '田中工業', managerName: '高橋次郎' },
      ]);
    });

    it('顧客名（大小文字区別なし）でフィルタリングできる', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '山田', 'customerName')
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].customerName).toBe('山田物産');
    });

    it('担当者名でフィルタリングできる', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '佐藤', 'managerName')
      );

      expect(result.current).toHaveLength(2);
      expect(result.current).toEqual([
        { id: 'ord-001', customerName: '田中商事', managerName: '佐藤太郎' },
        { id: 'spec-001', customerName: '特殊案件', managerName: '佐藤太郎' },
      ]);
    });

    it('担当者名（大小文字区別なし）でフィルタリングできる', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '太郎', 'managerName')
      );

      expect(result.current).toHaveLength(2);
      expect(result.current.every(order => order.managerName.includes('太郎'))).toBe(true);
    });

    it('全フィールドでフィルタリングできる（IDにマッチ）', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, 'spec', 'all')
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe('spec-001');
    });

    it('全フィールドでフィルタリングできる（顧客名にマッチ）', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '工業', 'all')
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].customerName).toBe('田中工業');
    });

    it('全フィールドでフィルタリングできる（担当者名にマッチ）', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '花子', 'all')
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].managerName).toBe('鈴木花子');
    });

    it('全フィールドでフィルタリング（複数フィールドにマッチ）', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '001', 'all')
      );

      expect(result.current).toHaveLength(2);
      expect(result.current.map(order => order.id)).toEqual(['ord-001', 'spec-001']);
    });

    it('マッチしない場合、空配列を返す', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '存在しない', 'all')
      );

      expect(result.current).toEqual([]);
    });
  });

  describe('未知のfieldでの動作', () => {
    it('未知のfieldの場合、全フィールド検索として動作する', () => {
      const { result } = renderHook(() =>
        useFilteredOrders(mockOrders, '田中', 'unknownField' as any)
      );

      expect(result.current).toHaveLength(2);
      expect(result.current).toEqual([
        { id: 'ord-001', customerName: '田中商事', managerName: '佐藤太郎' },
        { id: 'ord-003', customerName: '田中工業', managerName: '高橋次郎' },
      ]);
    });
  });

  describe('空の注文リスト', () => {
    it('空の注文リストでも正常に動作する', () => {
      const { result } = renderHook(() =>
        useFilteredOrders([], 'test', 'all')
      );

      expect(result.current).toEqual([]);
    });
  });

  describe('メモ化の動作確認', () => {
    it('同じ引数の場合、結果が再計算されない', () => {
      const { result, rerender } = renderHook(
        ({ orders, keyword, field }) => useFilteredOrders(orders, keyword, field),
        {
          initialProps: { orders: mockOrders, keyword: '田中', field: 'customerName' },
        }
      );

      const firstResult = result.current;

      // 同じ引数で再レンダリング
      rerender({ orders: mockOrders, keyword: '田中', field: 'customerName' });

      // 参照が同じであることを確認（メモ化されている）
      expect(result.current).toBe(firstResult);
    });

    it('引数が変更された場合、結果が再計算される', () => {
      const { result, rerender } = renderHook(
        ({ orders, keyword, field }) => useFilteredOrders(orders, keyword, field),
        {
          initialProps: { orders: mockOrders, keyword: '田中', field: 'customerName' },
        }
      );

      const firstResult = result.current;

      // keywordを変更して再レンダリング
      rerender({ orders: mockOrders, keyword: '山田', field: 'customerName' });

      // 参照が異なることを確認（再計算されている）
      expect(result.current).not.toBe(firstResult);
      expect(result.current).toHaveLength(1);
      expect(result.current[0].customerName).toBe('山田物産');
    });
  });
});