import React from 'react';
import { render, screen } from '@testing-library/react';
import StatisticsPage from './page';
import { fetchStatistics } from '@/app/actions/statisticsActions';
import { redirect } from 'next/navigation';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';

// StatisticsData型をインポート
interface StatisticsData {
  customerId: string;
  customerName: string;
  averageLeadTime: number;
  totalSales: number;
  updatedAt: string;
}

// StatisticsListClientコンポーネントをモック
vi.mock('./components/StatisticsListClient', () => ({
  default: ({ statisticsData }: { statisticsData: StatisticsData[] }) => (
    <div data-testid="statistics-list">
      {statisticsData.map((item) => (
        <div key={item.customerId} data-testid="statistics-item">
          {item.customerName}
        </div>
      ))}
    </div>
  ),
}));

// fetchStatistics のモック
vi.mock('@/app/actions/statisticsActions');

// next/navigation の redirect をモック
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('StatisticsPage', () => {
  // ReferenceError対策: fetchStatistics, redirectを直接importしたものに対してvi.mockedを使う
  const fetchStatisticsMock = vi.mocked(fetchStatistics);
  const redirectMock = vi.mocked(redirect);

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('店舗が選択されていない場合、storesページにリダイレクトする', async () => {
    // モックの実装
    fetchStatisticsMock.mockResolvedValue({status: 'store_required', error: '店舗を選択してください' });

    await StatisticsPage();

    // redirectが'/stores'で呼び出されたことを確認
    expect(redirectMock).toHaveBeenCalledWith('/stores');
    expect(redirectMock).toHaveBeenCalledTimes(1);
  });

  it('統計データが正常に取得できた場合、データを表示する', async () => {
    // テスト用のモックデータ
    const mockStatisticsData = [
      {
        customerId: '1',
        customerName: 'テスト顧客',
        averageLeadTime: 3.5,
        totalSales: 100000,
        updatedAt: '2025-06-19T10:00:00.000Z',
      },
    ];

    // モックの戻り値を設定
    fetchStatisticsMock.mockResolvedValue({
      status: 'success',
      data: mockStatisticsData,
    });

    const page = await StatisticsPage();
    render(page);

    // データが正しく表示されているか確認
    expect(screen.getByText('テスト顧客')).toBeInTheDocument();
  });

  it('エラーが発生した場合、空の配列を渡す', async () => {
    // モックの戻り値を設定（エラーケース）
    fetchStatisticsMock.mockResolvedValue({
      status: 'error',
      error: 'テストエラー',
    });

    const page = await StatisticsPage();
    render(page);

    // StatisticsListClientに空の配列が渡されることを確認
    expect(screen.queryByText('テスト顧客')).not.toBeInTheDocument();
  });
});
