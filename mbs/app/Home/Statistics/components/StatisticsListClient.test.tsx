import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatisticsListClient from '@/app/Home/Statistics/components/StatisticsListClient';
import { vi, expect } from 'vitest';

vi.mock('@/app/components/Search', () => ({
  __esModule: true,
  default: ({ keyword, onKeywordChange, onSearchFieldChange, onActionButtonClick }: any) => (
    <div>
      <input
        placeholder="Search"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        data-testid="search-input"
      />
      <button onClick={() => onSearchFieldChange('顧客名')} data-testid="filter-customer-name">
        顧客名で検索
      </button>
      <button onClick={onActionButtonClick} data-testid="csv-export-button">
        CSV出力
      </button>
    </div>
  ),
}));

vi.mock('@/app/components/Pagination', () => ({
  __esModule: true,
  default: ({ currentPage, totalPages, onPageChange }: any) => (
    <div>
      <span data-testid="pagination-info">{`Page ${currentPage} of ${totalPages}`}</span>
      <button onClick={() => onPageChange(currentPage + 1)} data-testid="next-page">
        次のページ
      </button>
    </div>
  ),
}));

const mockData = [
  {
    customerId: 'C-1001',
    customerName: '大阪情報専門学校',
    averageLeadTime: 12.5,
    totalSales: 1500000,
    updatedAt: '2024-01-01',
  },
  {
    customerId: 'C-1002',
    customerName: '東京IT学院',
    averageLeadTime: 8.0,
    totalSales: 800000,
    updatedAt: '2024-02-01',
  },
];

describe('StatisticsListClient', () => {
  test('初期描画でデータが表示されること', () => {
    render(<StatisticsListClient statisticsData={mockData} />);
    expect(screen.getByText('大阪情報専門学校')).toBeInTheDocument();
    expect(screen.getByText('東京IT学院')).toBeInTheDocument();
  });

  test('検索でフィルターされること', async () => {
    render(<StatisticsListClient statisticsData={mockData} />);
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: '大阪' } });

    await waitFor(() => {
      expect(screen.getByText('大阪情報専門学校')).toBeInTheDocument();
      expect(screen.queryByText('東京IT学院')).not.toBeInTheDocument();
    });
  });

  test('CSV出力ボタンが押されたときに警告が出る（データあり）', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<StatisticsListClient statisticsData={mockData} />);
    const button = screen.getByTestId('csv-export-button');
    fireEvent.click(button);
    expect(alertMock).toHaveBeenCalled();
    // デバッグ用: 実際の呼び出し内容を出力
    // eslint-disable-next-line no-console
    console.log('alertMock.calls:', alertMock.mock.calls);
    expect(alertMock.mock.calls[0][0]).toBe(
      'CSV出力中にエラーが発生しました。もう一度お試しください。',
    );
    alertMock.mockRestore();
  });

  test('CSV出力ボタンが押されたときに警告が出る（データなし）', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<StatisticsListClient statisticsData={[]} />);
    const button = screen.getByTestId('csv-export-button');
    fireEvent.click(button);
    expect(alertMock).toHaveBeenCalledWith('出力するデータがありません。');
    alertMock.mockRestore();
  });

  test('ページネーションが機能する', async () => {
    const manyData = Array.from({ length: 30 }, (_, i) => ({
      customerId: `C-${1000 + i}`,
      customerName: `顧客 ${i}`,
      averageLeadTime: i + 1,
      totalSales: i * 1000,
      updatedAt: '2024-01-01',
    }));

    render(<StatisticsListClient statisticsData={manyData} />);
    const nextPageBtn = screen.getByTestId('next-page');
    fireEvent.click(nextPageBtn);

    expect(screen.getByTestId('pagination-info')).toHaveTextContent('Page 2 of 2');
  });

  test('ソート機能が機能する（顧客名クリック）', () => {
    render(<StatisticsListClient statisticsData={mockData} />);
    const header = screen.getByText('顧客名');
    fireEvent.click(header); // 1回目: 昇順
    fireEvent.click(header); // 2回目: 降順
    expect(header).toHaveTextContent('▼');
  });
});
