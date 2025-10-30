import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import OrderListClient from './OrderListClient';

// Mock Order type
interface MockOrder {
  id: string;
  customerId: string;
  orderDate: Date;
  note: string;
  status: string;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  customerName: string;
  customerContactPerson: string;
}

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
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
  SortIcon: ({ field, sortConfig }: { field: string; sortConfig: { key: string; direction: 'asc' | 'desc' } | null }) => (
    <span data-testid={`sort-icon-${field}`}>
      {sortConfig?.key === field ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  ),
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

describe('OrderListClient', () => {
  const mockOrders: MockOrder[] = [
    {
      id: 'O001',
      customerId: 'C001',
      orderDate: new Date('2023-01-01'),
      note: 'Test note 1',
      status: '未完了',
      updatedAt: new Date('2023-01-01'),
      isDeleted: false,
      deletedAt: null,
      customerName: 'Customer A',
      customerContactPerson: 'Contact A',
    },
    {
      id: 'O002',
      customerId: 'C002',
      orderDate: new Date('2023-01-02'),
      note: 'Test note 2',
      status: '完了',
      updatedAt: new Date('2023-01-02'),
      isDeleted: false,
      deletedAt: null,
      customerName: 'Customer B',
      customerContactPerson: 'Contact B',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order list with initial data', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('Customer B')).toBeInTheDocument();
    expect(screen.getByText('Test note 1')).toBeInTheDocument();
    expect(screen.getByText('Test note 2')).toBeInTheDocument();
  });

  it('renders search component with correct props', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    expect(screen.getByTestId('search')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getByTestId('action-button')).toHaveTextContent('注文追加');
  });

  it('handles search functionality', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Customer A' } });

    expect(searchInput).toHaveValue('Customer A');
  });

  it('handles search field change', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const searchField = screen.getByTestId('search-field');
    fireEvent.change(searchField, { target: { value: '注文ID' } });

    expect(searchField).toHaveValue('注文ID');
  });

  it('handles add order button click', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const addButton = screen.getByTestId('action-button');
    fireEvent.click(addButton);

    expect(mockPush).toHaveBeenCalledWith('/Home/OrderList/Add');
  });

  it('handles sort functionality for id field', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const idHeaders = screen.getAllByText('注文ID');
    const tableHeader = idHeaders.find(header => header.closest('th'));
    fireEvent.click(tableHeader!);

    expect(screen.getByTestId('sort-icon-id')).toBeInTheDocument();
  });

  it('handles sort functionality for orderDate field', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const dateHeaders = screen.getAllByText('注文日');
    const tableHeader = dateHeaders.find(header => header.closest('th'));
    fireEvent.click(tableHeader!);

    expect(screen.getByTestId('sort-icon-orderDate')).toBeInTheDocument();
  });

  it('handles status filter change', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects[1]; // Second combobox is status filter
    fireEvent.change(statusSelect, { target: { value: '完了' } });

    expect(statusSelect).toHaveValue('完了');
  });

  it('renders order links correctly', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const orderLink = screen.getByText('O001');
    expect(orderLink).toBeInTheDocument();
    expect(orderLink.closest('a')).toHaveAttribute('href', '/Home/OrderList/O001');
  });

  it('formats dates correctly', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('2023-01-02')).toBeInTheDocument();
  });

  it('renders status badges correctly', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const incompleteStatuses = screen.getAllByText('未完了');
    const completeStatuses = screen.getAllByText('完了');

    // Find the status badges (not the select options)
    const incompleteStatus = incompleteStatuses.find(el => el.tagName === 'SPAN');
    const completeStatus = completeStatuses.find(el => el.tagName === 'SPAN');

    expect(incompleteStatus).toBeInTheDocument();
    expect(completeStatus).toBeInTheDocument();
    expect(incompleteStatus).toHaveClass('text-red-600');
    expect(completeStatus).toHaveClass('text-green-600');
  });

  it('handles pagination with many orders', () => {
    const manyOrders: MockOrder[] = Array.from({ length: 20 }, (_, i) => ({
      id: `O${(i + 1).toString().padStart(3, '0')}`,
      customerId: `C${(i + 1).toString().padStart(3, '0')}`,
      orderDate: new Date(`2023-01-${(i + 1).toString().padStart(2, '0')}`),
      note: `Test note ${i + 1}`,
      status: i % 2 === 0 ? '未完了' : '完了',
      updatedAt: new Date(`2023-01-${(i + 1).toString().padStart(2, '0')}`),
      isDeleted: false,
      deletedAt: null,
      customerName: `Customer ${i + 1}`,
      customerContactPerson: `Contact ${i + 1}`,
    }));

    render(<OrderListClient initialOrders={manyOrders} />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('page-info')).toHaveTextContent('1 of 2');
  });

  it('handles page change', () => {
    const manyOrders: MockOrder[] = Array.from({ length: 20 }, (_, i) => ({
      id: `O${(i + 1).toString().padStart(3, '0')}`,
      customerId: `C${(i + 1).toString().padStart(3, '0')}`,
      orderDate: new Date(`2023-01-${(i + 1).toString().padStart(2, '0')}`),
      note: `Test note ${i + 1}`,
      status: i % 2 === 0 ? '未完了' : '完了',
      updatedAt: new Date(`2023-01-${(i + 1).toString().padStart(2, '0')}`),
      isDeleted: false,
      deletedAt: null,
      customerName: `Customer ${i + 1}`,
      customerContactPerson: `Contact ${i + 1}`,
    }));

    render(<OrderListClient initialOrders={manyOrders} />);

    const nextButton = screen.getByTestId('next-page');
    fireEvent.click(nextButton);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('pads orders to 15 items when less than itemsPerPage', () => {
    const { container } = render(<OrderListClient initialOrders={mockOrders} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(15);
  });

  it('handles empty initial orders', () => {
    render(<OrderListClient initialOrders={[]} />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('search')).toBeInTheDocument();
  });

  it('displays correct pagination info', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    expect(screen.getByTestId('items-info')).toHaveTextContent('1-2 of 2');
  });

  it('handles different search field types', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const searchField = screen.getByTestId('search-field');
    
    // Test different search field options
    fireEvent.change(searchField, { target: { value: '注文ID' } });
    expect(searchField).toHaveValue('注文ID');

    fireEvent.change(searchField, { target: { value: '注文日' } });
    expect(searchField).toHaveValue('注文日');

    fireEvent.change(searchField, { target: { value: '顧客名' } });
    expect(searchField).toHaveValue('顧客名');

    fireEvent.change(searchField, { target: { value: '備考' } });
    expect(searchField).toHaveValue('備考');

    fireEvent.change(searchField, { target: { value: '商品名' } });
    expect(searchField).toHaveValue('商品名');
  });

  it('handles status filter options', () => {
    render(<OrderListClient initialOrders={mockOrders} />);

    const statusSelects = screen.getAllByRole('combobox');
    const statusSelect = statusSelects[1]; // Second combobox is status filter
    
    fireEvent.change(statusSelect, { target: { value: '未完了' } });
    expect(statusSelect).toHaveValue('未完了');

    fireEvent.change(statusSelect, { target: { value: '完了' } });
    expect(statusSelect).toHaveValue('完了');

    fireEvent.change(statusSelect, { target: { value: '' } });
    expect(statusSelect).toHaveValue('');
  });

  it('handles null note values', () => {
    const orderWithNullNote: MockOrder = {
      ...mockOrders[0],
      note: null as unknown as string,
    };

    render(<OrderListClient initialOrders={[orderWithNullNote]} />);

    expect(screen.getByTestId('search')).toBeInTheDocument();
  });

  it('handles empty order rows correctly', () => {
    const { container } = render(<OrderListClient initialOrders={[mockOrders[0]]} />);

    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(15);
    
    // Check that empty rows don't have links
    const emptyRows = container.querySelectorAll('tbody tr td:first-child');
    expect(emptyRows[0]).toHaveTextContent('O001');
    expect(emptyRows[1]).toHaveTextContent('');
  });
});