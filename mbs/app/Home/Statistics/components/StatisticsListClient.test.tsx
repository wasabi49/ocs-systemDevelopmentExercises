import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import StatisticsListClient from './StatisticsListClient';

// Mock global alert
const mockAlert = vi.fn();
global.alert = mockAlert;

// Mock URL for CSV export
global.URL = {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn(),
} as Partial<typeof URL>;

// Mock document.createElement
global.document.createElement = vi.fn((tagName: string) => {
  if (tagName === 'a') {
    return {
      href: '',
      setAttribute: vi.fn(),
      style: { display: '' },
      click: vi.fn(),
    };
  }
  return {};
}) as typeof document.createElement;

// Mock document.body methods
Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
  writable: true,
});
Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
  writable: true,
});

// Mock components
vi.mock('@/app/components/Search', () => ({
  default: function Search({
    keyword,
    onKeywordChange,
    searchField,
    onSearchFieldChange,
    actionButtonLabel,
    onActionButtonClick,
  }: { keyword: string; onKeywordChange: (value: string) => void; searchField: string; onSearchFieldChange: (value: string) => void; actionButtonLabel: string; onActionButtonClick: () => void }) {
    return (
      <div data-testid="search">
        <input
          data-testid="search-input"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
        <select
          data-testid="search-field"
          value={searchField}
          onChange={(e) => onSearchFieldChange(e.target.value)}
        >
          <option value="すべて">すべて</option>
          <option value="顧客ID">顧客ID</option>
          <option value="顧客名">顧客名</option>
        </select>
        <button data-testid="action-button" onClick={onActionButtonClick}>
          {actionButtonLabel}
        </button>
      </div>
    );
  },
}));

vi.mock('@/app/components/Pagination', () => ({
  default: function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
    return (
      <div data-testid="pagination">
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)}>Next</button>
      </div>
    );
  },
}));

describe('StatisticsListClient', () => {
  const mockData = [
    {
      customerId: 'C001',
      customerName: 'Customer A',
      averageLeadTime: 5.5,
      totalSales: 100000,
      updatedAt: '2023-01-01T00:00:00Z',
    },
    {
      customerId: 'C002',
      customerName: 'Customer B',
      averageLeadTime: 3.2,
      totalSales: 250000,
      updatedAt: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders statistics list with initial data', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('Customer B')).toBeInTheDocument();
  });

  it('renders search component', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    expect(screen.getByTestId('search')).toBeInTheDocument();
    expect(screen.getByTestId('action-button')).toHaveTextContent('CSV出力');
  });

  it('handles search functionality', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Customer A' } });

    expect(searchInput).toHaveValue('Customer A');
  });

  it('handles search field change', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const searchField = screen.getByTestId('search-field');
    fireEvent.change(searchField, { target: { value: '顧客ID' } });

    expect(searchField).toHaveValue('顧客ID');
  });

  it('handles sort functionality for customerId', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const customerIdHeader = screen.getByText('顧客ID');
    fireEvent.click(customerIdHeader);

    expect(screen.getByText('▲')).toBeInTheDocument();
  });

  it('handles sort functionality for customerName', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const customerNameHeader = screen.getByText('顧客名');
    fireEvent.click(customerNameHeader);

    expect(screen.getByText('▲')).toBeInTheDocument();
  });

  it('handles sort functionality for averageLeadTime', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const leadTimeHeader = screen.getByText('平均リードタイム（日）');
    fireEvent.click(leadTimeHeader);

    expect(screen.getByText('▲')).toBeInTheDocument();
  });

  it('handles sort functionality for totalSales', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const totalSalesHeader = screen.getByText('累計売上額');
    fireEvent.click(totalSalesHeader);

    expect(screen.getByText('▲')).toBeInTheDocument();
  });

  it('toggles sort order when clicking same header twice', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const customerIdHeader = screen.getByText('顧客ID');
    fireEvent.click(customerIdHeader);
    expect(screen.getByText('▲')).toBeInTheDocument();

    fireEvent.click(customerIdHeader);
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('handles CSV export with data', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const csvButton = screen.getByTestId('action-button');
    fireEvent.click(csvButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(
      expect.stringContaining('CSV ファイル')
    );
  });

  it('handles CSV export with empty data', () => {
    render(<StatisticsListClient statisticsData={[]} />);

    const csvButton = screen.getByTestId('action-button');
    fireEvent.click(csvButton);

    expect(mockAlert).toHaveBeenCalledWith('出力するデータがありません。');
  });

  it('handles CSV export error', () => {
    // Mock URL.createObjectURL to throw error
    vi.mocked(global.URL.createObjectURL).mockImplementation(() => {
      throw new Error('Test error');
    });

    render(<StatisticsListClient statisticsData={mockData} />);

    const csvButton = screen.getByTestId('action-button');
    fireEvent.click(csvButton);

    expect(mockAlert).toHaveBeenCalledWith(
      'CSV出力中にエラーが発生しました。もう一度お試しください。'
    );

    // Restore mock
    vi.mocked(global.URL.createObjectURL).mockReturnValue('mock-url');
  });

  it('handles empty data display', () => {
    render(<StatisticsListClient statisticsData={[]} />);

    expect(screen.getByText('統計データがありません')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    expect(screen.getByText('￥100,000')).toBeInTheDocument();
    expect(screen.getByText('￥250,000')).toBeInTheDocument();
  });

  it('formats lead time correctly', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    expect(screen.getByText('5.5')).toBeInTheDocument();
    expect(screen.getByText('3.2')).toBeInTheDocument();
  });

  it('handles pagination', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('handles pagination with many items', () => {
    const manyStatistics = Array.from({ length: 20 }, (_, i) => ({
      customerId: `C${(i + 1).toString().padStart(3, '0')}`,
      customerName: `Customer ${i + 1}`,
      averageLeadTime: 5.0 + i * 0.1,
      totalSales: 100000 + i * 10000,
      updatedAt: '2023-01-01T00:00:00Z',
    }));

    render(<StatisticsListClient statisticsData={manyStatistics} />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  });

  it('handles page change', () => {
    const manyStatistics = Array.from({ length: 20 }, (_, i) => ({
      customerId: `C${(i + 1).toString().padStart(3, '0')}`,
      customerName: `Customer ${i + 1}`,
      averageLeadTime: 5.0 + i * 0.1,
      totalSales: 100000 + i * 10000,
      updatedAt: '2023-01-01T00:00:00Z',
    }));

    render(<StatisticsListClient statisticsData={manyStatistics} />);

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('handles search with different fields', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const searchField = screen.getByTestId('search-field');
    const searchInput = screen.getByTestId('search-input');

    // Test customer ID search
    fireEvent.change(searchField, { target: { value: '顧客ID' } });
    fireEvent.change(searchInput, { target: { value: 'C001' } });
    expect(searchInput).toHaveValue('C001');

    // Test customer name search
    fireEvent.change(searchField, { target: { value: '顧客名' } });
    fireEvent.change(searchInput, { target: { value: 'Customer A' } });
    expect(searchInput).toHaveValue('Customer A');
  });

  it('displays correct pagination info', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('handles empty search results', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

    // Should still show table structure
    expect(screen.getByText('顧客ID')).toBeInTheDocument();
  });

  it('handles search with all fields', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const searchField = screen.getByTestId('search-field');
    const searchInput = screen.getByTestId('search-input');

    fireEvent.change(searchField, { target: { value: 'すべて' } });
    fireEvent.change(searchInput, { target: { value: 'Customer' } });

    expect(searchInput).toHaveValue('Customer');
  });

  it('pads data to 15 items when less than itemsPerPage', () => {
    const { container } = render(<StatisticsListClient statisticsData={mockData} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(15);
  });

  it('handles CSV export with sort applied', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    // Apply sort first
    const customerIdHeader = screen.getByText('顧客ID');
    fireEvent.click(customerIdHeader);

    // Then export
    const csvButton = screen.getByTestId('action-button');
    fireEvent.click(csvButton);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledWith(
      expect.stringContaining('CSV ファイル')
    );
  });

  it('handles search with numeric values', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: '100000' } });

    expect(searchInput).toHaveValue('100000');
  });

  it('handles lead time search', () => {
    render(<StatisticsListClient statisticsData={mockData} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: '5.5' } });

    expect(searchInput).toHaveValue('5.5');
  });
});