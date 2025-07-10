import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DeliveryListClient, { Delivery } from './DeliveryListClient';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('lucide-react', () => ({
  ChevronUp: function ChevronUp({ className }: { size?: number; className: string }) {
    return <span data-testid="chevron-up" className={className}>▲</span>;
  },
  ChevronDown: function ChevronDown({ className }: { size?: number; className: string }) {
    return <span data-testid="chevron-down" className={className}>▼</span>;
  },
}));

vi.mock('@/app/utils/sortUtils', () => ({
  sortItems: vi.fn((items, field, sortConfig, setSortConfig) => {
    const direction = sortConfig?.key === field && sortConfig?.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: field, direction });
    
    return [...items].sort((a, b) => {
      const aValue = String(a[field]);
      const bValue = String(b[field]);
      return direction === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }),
}));

vi.mock('@/app/components/Search', () => ({
  default: function Search({
    keyword,
    onKeywordChange,
    searchField,
    onSearchFieldChange,
    searchFieldOptions,
    placeholder,
    actionButtonLabel,
    onActionButtonClick,
  }: {
    keyword: string;
    onKeywordChange: (value: string) => void;
    searchField: string;
    onSearchFieldChange: (value: string) => void;
    searchFieldOptions: Array<{ value: string; label: string }>;
    placeholder: string;
    actionButtonLabel: string;
    onActionButtonClick: () => void;
  }) {
    return (
      <div data-testid="search">
        <input
          data-testid="search-input"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder={placeholder}
        />
        <select
          data-testid="search-field"
          value={searchField}
          onChange={(e) => onSearchFieldChange(e.target.value)}
        >
          {searchFieldOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button data-testid="action-button" onClick={onActionButtonClick}>
          {actionButtonLabel}
        </button>
      </div>
    );
  },
}));

vi.mock('@/app/components/Pagination', () => ({
  default: function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    itemsInfo,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsInfo: { startIndex: number; endIndex: number; totalItems: number };
  }) {
    return (
      <div data-testid="pagination">
        <button
          data-testid="prev-page"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span data-testid="page-info">
          {currentPage} of {totalPages}
        </span>
        <span data-testid="items-info">
          {itemsInfo.startIndex + 1}-{Math.min(itemsInfo.endIndex, itemsInfo.totalItems)} of {itemsInfo.totalItems}
        </span>
        <button
          data-testid="next-page"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    );
  },
}));

vi.mock('../DeliveryTable', () => ({
  default: function DeliveryTable({
    deliveries,
    onSort,
    renderSortIcons,
  }: {
    deliveries: Delivery[];
    onSort: (field: keyof Delivery) => void;
    renderSortIcons: (field: keyof Delivery) => React.ReactNode;
    sortField?: keyof Delivery | null;
    sortOrder?: 'asc' | 'desc';
  }) {
    return (
      <table data-testid="delivery-table">
        <thead>
          <tr>
            <th data-testid="header-id" onClick={() => onSort('id')}>
              納品ID{renderSortIcons('id')}
            </th>
            <th data-testid="header-date" onClick={() => onSort('date')}>
              納品日{renderSortIcons('date')}
            </th>
            <th>顧客名</th>
            <th>備考</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map((delivery, index) => (
            <tr key={delivery.id || `empty-${index}`} data-testid={`delivery-row-${index}`}>
              <td>{delivery.id}</td>
              <td>{delivery.date}</td>
              <td>{delivery.customerName}</td>
              <td>{delivery.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  },
}));

describe('DeliveryListClient', () => {
  const mockDeliveries: Delivery[] = [
    {
      id: 'D001',
      date: '2023-01-01',
      customerName: 'Customer A',
      note: 'Note A',
    },
    {
      id: 'D002',
      date: '2023-01-02',
      customerName: 'Customer B',
      note: 'Note B',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders delivery list with initial data', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    expect(screen.getByTestId('delivery-table')).toBeInTheDocument();
    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('Customer B')).toBeInTheDocument();
  });

  it('renders search component with correct props', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    expect(screen.getByTestId('search')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getByTestId('action-button')).toHaveTextContent('納品追加');
  });

  it('handles search functionality', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Customer A' } });

    expect(searchInput).toHaveValue('Customer A');
  });

  it('handles search field change', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    const searchField = screen.getByTestId('search-field');
    fireEvent.change(searchField, { target: { value: '納品ID' } });

    expect(searchField).toHaveValue('納品ID');
  });

  it('handles sort functionality', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    const idHeader = screen.getByTestId('header-id');
    fireEvent.click(idHeader);

    // Verify sort icons are rendered
    expect(screen.getAllByTestId('chevron-up')).toHaveLength(2); // For id and date columns
    expect(screen.getAllByTestId('chevron-down')).toHaveLength(2);
  });

  it('handles pagination', () => {
    // Create more than 15 items to test pagination
    const manyDeliveries: Delivery[] = Array.from({ length: 20 }, (_, i) => ({
      id: `D${(i + 1).toString().padStart(3, '0')}`,
      date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
      customerName: `Customer ${i + 1}`,
      note: `Note ${i + 1}`,
    }));

    render(<DeliveryListClient initialDeliveries={manyDeliveries} />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('page-info')).toHaveTextContent('1 of 2');
  });

  it('handles page change', () => {
    const manyDeliveries: Delivery[] = Array.from({ length: 20 }, (_, i) => ({
      id: `D${(i + 1).toString().padStart(3, '0')}`,
      date: `2023-01-${(i + 1).toString().padStart(2, '0')}`,
      customerName: `Customer ${i + 1}`,
      note: `Note ${i + 1}`,
    }));

    render(<DeliveryListClient initialDeliveries={manyDeliveries} />);

    const nextButton = screen.getByTestId('next-page');
    fireEvent.click(nextButton);

    // Should still show pagination component
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('handles add delivery button click', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    const addButton = screen.getByTestId('action-button');
    fireEvent.click(addButton);

    // The button should be clickable
    expect(addButton).toBeInTheDocument();
  });

  it('renders empty deliveries to fill 15 rows', () => {
    render(<DeliveryListClient initialDeliveries={[mockDeliveries[0]]} />);

    // Should render 15 rows total (1 with data + 14 empty)
    const rows = screen.getAllByTestId(/^delivery-row-/);
    expect(rows).toHaveLength(15);
  });

  it('handles different search fields', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    // Test each search field option
    const searchField = screen.getByTestId('search-field');
    
    fireEvent.change(searchField, { target: { value: '納品ID' } });
    expect(searchField).toHaveValue('納品ID');

    fireEvent.change(searchField, { target: { value: '納品日' } });
    expect(searchField).toHaveValue('納品日');

    fireEvent.change(searchField, { target: { value: '顧客名' } });
    expect(searchField).toHaveValue('顧客名');

    fireEvent.change(searchField, { target: { value: '備考' } });
    expect(searchField).toHaveValue('備考');
  });

  it('renders sort icons correctly', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    // Check that sort icons are present
    expect(screen.getAllByTestId('chevron-up')).toHaveLength(2);
    expect(screen.getAllByTestId('chevron-down')).toHaveLength(2);
  });

  it('handles empty initial deliveries', () => {
    render(<DeliveryListClient initialDeliveries={[]} />);

    expect(screen.getByTestId('delivery-table')).toBeInTheDocument();
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('displays correct pagination info', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    expect(screen.getByTestId('items-info')).toHaveTextContent('1-2 of 2');
  });

  it('handles date sorting', () => {
    render(<DeliveryListClient initialDeliveries={mockDeliveries} />);

    const dateHeader = screen.getByTestId('header-date');
    fireEvent.click(dateHeader);

    // Should render without errors
    expect(screen.getByTestId('delivery-table')).toBeInTheDocument();
  });
});