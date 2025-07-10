import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import StatisticsPage from './page';
import { fetchStatistics } from '@/app/actions/statisticsActions';

// Mock redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock fetchStatistics
vi.mock('@/app/actions/statisticsActions', () => ({
  fetchStatistics: vi.fn(),
}));

// Mock StatisticsListClient
vi.mock('./components/StatisticsListClient', () => ({
  default: function StatisticsListClient({ statisticsData }: { statisticsData: unknown[] }) {
    return (
      <div data-testid="statistics-list-client">
        <div data-testid="statistics-data">{JSON.stringify(statisticsData)}</div>
      </div>
    );
  },
}));

describe('StatisticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders StatisticsListClient with data when fetchStatistics succeeds', async () => {
    const mockStatisticsData = [
      {
        customerId: '1',
        customerName: 'Customer 1',
        averageLeadTime: 5.5,
        totalSales: 10000,
        updatedAt: '2023-01-01T00:00:00Z',
      },
      {
        customerId: '2',
        customerName: 'Customer 2',
        averageLeadTime: 3.2,
        totalSales: 15000,
        updatedAt: '2023-01-02T00:00:00Z',
      },
    ];

    vi.mocked(fetchStatistics).mockResolvedValue({
      status: 'success',
      data: mockStatisticsData,
    });

    render(await StatisticsPage());

    expect(screen.getByTestId('statistics-list-client')).toBeInTheDocument();
    expect(screen.getByTestId('statistics-data')).toHaveTextContent(JSON.stringify(mockStatisticsData));
  });

  it('renders StatisticsListClient with empty array when data is null', async () => {
    vi.mocked(fetchStatistics).mockResolvedValue({
      status: 'success',
      data: null,
    });

    render(await StatisticsPage());

    expect(screen.getByTestId('statistics-list-client')).toBeInTheDocument();
    expect(screen.getByTestId('statistics-data')).toHaveTextContent('[]');
  });

  it('redirects to /stores when store is required', async () => {
    const { redirect } = await import('next/navigation');
    
    vi.mocked(fetchStatistics).mockResolvedValue({
      status: 'store_required',
    });

    await StatisticsPage();

    expect(redirect).toHaveBeenCalledWith('/stores');
  });

  it('renders StatisticsListClient with empty array when fetchStatistics fails', async () => {
    vi.mocked(fetchStatistics).mockResolvedValue({
      status: 'error',
      error: 'Database connection failed',
    });

    render(await StatisticsPage());

    expect(screen.getByTestId('statistics-list-client')).toBeInTheDocument();
    expect(screen.getByTestId('statistics-data')).toHaveTextContent('[]');
  });

  it('calls fetchStatistics', async () => {
    vi.mocked(fetchStatistics).mockResolvedValue({
      status: 'success',
      data: [],
    });

    render(await StatisticsPage());

    expect(fetchStatistics).toHaveBeenCalledTimes(1);
  });

  it('logs error when fetchStatistics fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error');
    
    vi.mocked(fetchStatistics).mockResolvedValue({
      status: 'error',
      error: 'Database connection failed',
    });

    render(await StatisticsPage());

    expect(consoleSpy).toHaveBeenCalledWith('統計データの取得に失敗:', 'Database connection failed');
  });
});