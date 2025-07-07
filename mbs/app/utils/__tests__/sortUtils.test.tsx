import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { SortIcon, sortItems, SortConfig } from '../sortUtils';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  ChevronUp: ({ size, className }: { size: number; className: string }) => (
    <span data-testid="chevron-up" data-size={size} className={className}>
      ↑
    </span>
  ),
  ChevronDown: ({ size, className }: { size: number; className: string }) => (
    <span data-testid="chevron-down" data-size={size} className={className}>
      ↓
    </span>
  ),
}));

interface TestItem {
  id: string;
  name: string;
  date: Date;
  count: number;
}

describe('sortUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SortIcon', () => {
    it('ソートが設定されていない場合、両方のアイコンがグレーで表示される', () => {
      render(<SortIcon<TestItem> field="name" sortConfig={null} />);

      const upIcon = screen.getByTestId('chevron-up');
      const downIcon = screen.getByTestId('chevron-down');

      expect(upIcon).toHaveClass('text-gray-400');
      expect(downIcon).toHaveClass('text-gray-400');
      expect(upIcon).toHaveAttribute('data-size', '12');
      expect(downIcon).toHaveAttribute('data-size', '12');
    });

    it('昇順ソートが設定されている場合、上向きアイコンがアクティブになる', () => {
      const sortConfig: SortConfig<TestItem> = { key: 'name', direction: 'asc' };
      
      render(<SortIcon<TestItem> field="name" sortConfig={sortConfig} />);

      const upIcon = screen.getByTestId('chevron-up');
      const downIcon = screen.getByTestId('chevron-down');

      expect(upIcon).toHaveClass('text-gray-800');
      expect(downIcon).toHaveClass('text-gray-400');
    });

    it('降順ソートが設定されている場合、下向きアイコンがアクティブになる', () => {
      const sortConfig: SortConfig<TestItem> = { key: 'name', direction: 'desc' };
      
      render(<SortIcon<TestItem> field="name" sortConfig={sortConfig} />);

      const upIcon = screen.getByTestId('chevron-up');
      const downIcon = screen.getByTestId('chevron-down');

      expect(upIcon).toHaveClass('text-gray-400');
      expect(downIcon).toHaveClass('text-gray-800');
    });

    it('異なるフィールドでソートが設定されている場合、両方のアイコンがグレーになる', () => {
      const sortConfig: SortConfig<TestItem> = { key: 'id', direction: 'asc' };
      
      render(<SortIcon<TestItem> field="name" sortConfig={sortConfig} />);

      const upIcon = screen.getByTestId('chevron-up');
      const downIcon = screen.getByTestId('chevron-down');

      expect(upIcon).toHaveClass('text-gray-400');
      expect(downIcon).toHaveClass('text-gray-400');
    });
  });

  describe('sortItems', () => {
    const mockItems: TestItem[] = [
      { id: '3', name: 'Charlie', date: new Date('2025-01-03'), count: 30 },
      { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
      { id: '2', name: 'Bob', date: new Date('2025-01-02'), count: 20 },
    ];

    let setSortConfigMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      setSortConfigMock = vi.fn();
    });

    it('初回ソート時は昇順でソートされる', () => {
      const result = sortItems(mockItems, 'name', null, setSortConfigMock);

      expect(result).toEqual([
        { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
        { id: '2', name: 'Bob', date: new Date('2025-01-02'), count: 20 },
        { id: '3', name: 'Charlie', date: new Date('2025-01-03'), count: 30 },
      ]);

      expect(setSortConfigMock).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });
    });

    it('同じフィールドで再度ソートした場合、降順になる', () => {
      const currentSort: SortConfig<TestItem> = { key: 'name', direction: 'asc' };
      
      const result = sortItems(mockItems, 'name', currentSort, setSortConfigMock);

      expect(result).toEqual([
        { id: '3', name: 'Charlie', date: new Date('2025-01-03'), count: 30 },
        { id: '2', name: 'Bob', date: new Date('2025-01-02'), count: 20 },
        { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
      ]);

      expect(setSortConfigMock).toHaveBeenCalledWith({ key: 'name', direction: 'desc' });
    });

    it('降順から再度ソートした場合、昇順になる', () => {
      const currentSort: SortConfig<TestItem> = { key: 'name', direction: 'desc' };
      
      const result = sortItems(mockItems, 'name', currentSort, setSortConfigMock);

      expect(result).toEqual([
        { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
        { id: '2', name: 'Bob', date: new Date('2025-01-02'), count: 20 },
        { id: '3', name: 'Charlie', date: new Date('2025-01-03'), count: 30 },
      ]);

      expect(setSortConfigMock).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });
    });

    it('異なるフィールドでソートした場合、新しいフィールドで昇順ソートされる', () => {
      const currentSort: SortConfig<TestItem> = { key: 'name', direction: 'desc' };
      
      const result = sortItems(mockItems, 'count', currentSort, setSortConfigMock);

      expect(result).toEqual([
        { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
        { id: '2', name: 'Bob', date: new Date('2025-01-02'), count: 20 },
        { id: '3', name: 'Charlie', date: new Date('2025-01-03'), count: 30 },
      ]);

      expect(setSortConfigMock).toHaveBeenCalledWith({ key: 'count', direction: 'asc' });
    });

    it('Dateオブジェクトを正しくソートできる', () => {
      const result = sortItems(mockItems, 'date', null, setSortConfigMock);

      expect(result).toEqual([
        { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
        { id: '2', name: 'Bob', date: new Date('2025-01-02'), count: 20 },
        { id: '3', name: 'Charlie', date: new Date('2025-01-03'), count: 30 },
      ]);
    });

    it('Dateオブジェクトを降順でソートできる', () => {
      const currentSort: SortConfig<TestItem> = { key: 'date', direction: 'asc' };
      
      const result = sortItems(mockItems, 'date', currentSort, setSortConfigMock);

      expect(result).toEqual([
        { id: '3', name: 'Charlie', date: new Date('2025-01-03'), count: 30 },
        { id: '2', name: 'Bob', date: new Date('2025-01-02'), count: 20 },
        { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
      ]);
    });

    it('文字列形式の日付を正しくソートできる', () => {
      const itemsWithStringDates = [
        { id: '3', name: 'Charlie', date: '2025-01-03' as any, count: 30 },
        { id: '1', name: 'Alice', date: '2025-01-01' as any, count: 10 },
        { id: '2', name: 'Bob', date: '2025-01-02' as any, count: 20 },
      ];

      const result = sortItems(itemsWithStringDates, 'date', null, setSortConfigMock);

      expect(result).toEqual([
        { id: '1', name: 'Alice', date: '2025-01-01', count: 10 },
        { id: '2', name: 'Bob', date: '2025-01-02', count: 20 },
        { id: '3', name: 'Charlie', date: '2025-01-03', count: 30 },
      ]);
    });

    it('null/undefined値を含むデータを正しくソートできる', () => {
      const itemsWithNulls = [
        { id: '3', name: null as any, date: new Date('2025-01-03'), count: 30 },
        { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
        { id: '2', name: undefined as any, date: new Date('2025-01-02'), count: 20 },
      ];

      const result = sortItems(itemsWithNulls, 'name', null, setSortConfigMock);

      expect(result).toEqual([
        { id: '3', name: null, date: new Date('2025-01-03'), count: 30 },
        { id: '2', name: undefined, date: new Date('2025-01-02'), count: 20 },
        { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
      ]);
    });

    it('数値フィールドを正しくソートできる', () => {
      const result = sortItems(mockItems, 'count', null, setSortConfigMock);

      expect(result).toEqual([
        { id: '1', name: 'Alice', date: new Date('2025-01-01'), count: 10 },
        { id: '2', name: 'Bob', date: new Date('2025-01-02'), count: 20 },
        { id: '3', name: 'Charlie', date: new Date('2025-01-03'), count: 30 },
      ]);
    });

    it('元の配列を変更しない（immutable）', () => {
      const originalItems = [...mockItems];
      
      const result = sortItems(mockItems, 'name', null, setSortConfigMock);

      expect(mockItems).toEqual(originalItems);
      expect(result).not.toBe(mockItems);
    });
  });
});