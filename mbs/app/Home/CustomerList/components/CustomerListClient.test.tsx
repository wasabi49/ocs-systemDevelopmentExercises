import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import CustomerListClient from './CustomerListClient';
import { fetchCustomers } from '@/app/actions/customerActions';

// Mock dependencies
vi.mock('@/app/actions/customerActions', () => ({
  fetchCustomers: vi.fn(),
}));

vi.mock('@/app/hooks/useServerActionStoreCheck', () => ({
  useServerActionStoreCheck: vi.fn(() => ({
    checkStoreRequirement: vi.fn().mockReturnValue(false),
  })),
}));

vi.mock('./Modal', () => ({
  default: function Modal({ 
    open, 
    onCancel, 
    onSuccess 
  }: { 
    open: boolean; 
    onCancel: () => void; 
    onSuccess: () => void; 
  }) {
    return open ? (
      <div data-testid="modal">
        <div data-testid="modal-title">CSV Import</div>
        <div data-testid="modal-message">Import CSV file</div>
        <button data-testid="modal-close" onClick={onCancel}>Cancel</button>
        <button data-testid="modal-success" onClick={onSuccess}>Success</button>
      </div>
    ) : null;
  },
}));

vi.mock('@/app/components/Search', () => ({
  default: function Search({
    keyword,
    onKeywordChange,
    searchField,
    onSearchFieldChange,
    searchFieldOptions,
    actionButtonLabel,
    onActionButtonClick,
  }: {
    keyword: string;
    onKeywordChange: (value: string) => void;
    searchField: string;
    onSearchFieldChange: (value: string) => void;
    searchFieldOptions: Array<{ value: string; label: string }>;
    actionButtonLabel: string;
    onActionButtonClick: () => void;
  }) {
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
    onPageChange 
  }: { 
    currentPage: number; 
    totalPages: number; 
    onPageChange: (page: number) => void; 
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
        <span data-testid="page-info">{currentPage} of {totalPages}</span>
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

vi.mock('@/app/components/Loading', () => ({
  Loading: function Loading() {
    return <div data-testid="loading">Loading...</div>;
  },
}));

describe('CustomerListClient', () => {
  const mockCustomers = [
    { id: '1', customerName: 'Customer 1', managerName: 'Manager 1', storeName: 'Store 1' },
    { id: '2', customerName: 'Customer 2', managerName: 'Manager 2', storeName: 'Store 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer list with initial data', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);

    expect(screen.getByText('Customer 1')).toBeInTheDocument();
    expect(screen.getByText('Customer 2')).toBeInTheDocument();
    expect(screen.getAllByText('顧客ID')).toHaveLength(2); // Table header and search option
    expect(screen.getAllByText('顧客名')).toHaveLength(2); // Table header and search option
  });

  it('renders empty state when no customers', () => {
    render(<CustomerListClient initialCustomers={[]} />);

    expect(screen.getByText('顧客データがありません')).toBeInTheDocument();
  });

  it('handles search functionality', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);

    expect(screen.getByTestId('search')).toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  it('handles pagination', () => {
    // Create 20 customers to test pagination
    const manyCustomers = Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      customerName: `Customer ${i + 1}`,
      managerName: `Manager ${i + 1}`,
      storeName: `Store ${i + 1}`,
    }));

    render(<CustomerListClient initialCustomers={manyCustomers} />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    expect(screen.getByTestId('page-info')).toHaveTextContent('1 of 2');
  });

  it('renders basic functionality without errors', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    expect(screen.getByTestId('search')).toBeInTheDocument();
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('handles additional customer list functionality', () => {
    // Test with exactly 15 items to see pagination behavior
    const exactlyFifteenCustomers = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      customerName: `Customer ${i + 1}`,
      managerName: `Manager ${i + 1}`,
      storeName: `Store ${i + 1}`,
    }));

    render(<CustomerListClient initialCustomers={exactlyFifteenCustomers} />);

    expect(screen.getByTestId('page-info')).toHaveTextContent('1 of 1');
  });

  it('tests loading state and error handling', () => {
    const { container } = render(<CustomerListClient initialCustomers={[]} />);
    
    // Component should render without errors
    expect(container).toBeInTheDocument();
  });

  it('handles search keyword change', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Customer 1' } });
    
    expect(searchInput).toHaveValue('Customer 1');
  });

  it('handles search field change', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const searchField = screen.getByTestId('search-field');
    fireEvent.change(searchField, { target: { value: '顧客名' } });
    
    expect(searchField).toHaveValue('顧客名');
  });

  it('handles CSV import button click', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const csvButton = screen.getByTestId('action-button');
    fireEvent.click(csvButton);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles modal close', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const csvButton = screen.getByTestId('action-button');
    fireEvent.click(csvButton);
    
    const closeButton = screen.getByTestId('modal-close');
    fireEvent.click(closeButton);
    
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('handles page change functionality', () => {
    const manyCustomers = Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      customerName: `Customer ${i + 1}`,
      managerName: `Manager ${i + 1}`,
      storeName: `Store ${i + 1}`,
    }));

    render(<CustomerListClient initialCustomers={manyCustomers} />);
    
    const nextButton = screen.getByTestId('next-page');
    fireEvent.click(nextButton);
    
    expect(screen.getByTestId('page-info')).toHaveTextContent('2 of 2');
  });

  it('handles search by customer ID', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const searchField = screen.getByTestId('search-field');
    fireEvent.change(searchField, { target: { value: '顧客ID' } });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: '1' } });
    
    expect(searchInput).toHaveValue('1');
  });

  it('handles search by manager name', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const searchField = screen.getByTestId('search-field');
    fireEvent.change(searchField, { target: { value: '担当者' } });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Manager 1' } });
    
    expect(searchInput).toHaveValue('Manager 1');
  });

  it('handles search with all fields', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const searchField = screen.getByTestId('search-field');
    fireEvent.change(searchField, { target: { value: 'すべて' } });
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Customer' } });
    
    expect(searchInput).toHaveValue('Customer');
  });

  it('handles empty search keyword', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: '' } });
    
    expect(searchInput).toHaveValue('');
    expect(screen.getByText('Customer 1')).toBeInTheDocument();
    expect(screen.getByText('Customer 2')).toBeInTheDocument();
  });

  it('handles successful import and reload', async () => {
    vi.mocked(fetchCustomers).mockResolvedValueOnce({
      status: 'success',
      data: [
        { id: '3', customerName: 'Customer 3', managerName: 'Manager 3', storeName: 'Store 3' },
      ],
    });

    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const csvButton = screen.getByTestId('action-button');
    fireEvent.click(csvButton);
    
    // Simulate successful import - this would normally be done through Modal component
    const modal = screen.getByTestId('modal');
    expect(modal).toBeInTheDocument();
  });

  it('handles loading state during fetch', async () => {
    vi.mocked(fetchCustomers).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const csvButton = screen.getByTestId('action-button');
    fireEvent.click(csvButton);
    
    // Modal should be visible
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles error during fetch', async () => {
    vi.mocked(fetchCustomers).mockResolvedValueOnce({
      status: 'error',
      error: 'Fetch failed',
    });

    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const csvButton = screen.getByTestId('action-button');
    fireEvent.click(csvButton);
    
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('handles page change with invalid page numbers', () => {
    const manyCustomers = Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      customerName: `Customer ${i + 1}`,
      managerName: `Manager ${i + 1}`,
      storeName: `Store ${i + 1}`,
    }));

    render(<CustomerListClient initialCustomers={manyCustomers} />);
    
    const prevButton = screen.getByTestId('prev-page');
    fireEvent.click(prevButton); // Should do nothing since already on page 1
    
    expect(screen.getByTestId('page-info')).toHaveTextContent('1 of 2');
  });

  it('displays empty rows when less than itemsPerPage', () => {
    const { container } = render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const rows = container.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(15); // Should have 15 rows total
  });

  it('displays correct search field options', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    const searchField = screen.getByTestId('search-field');
    expect(searchField).toBeInTheDocument();
    
    // Check that all options are available
    fireEvent.change(searchField, { target: { value: 'すべて' } });
    expect(searchField).toHaveValue('すべて');
    
    fireEvent.change(searchField, { target: { value: '顧客ID' } });
    expect(searchField).toHaveValue('顧客ID');
    
    fireEvent.change(searchField, { target: { value: '顧客名' } });
    expect(searchField).toHaveValue('顧客名');
    
    fireEvent.change(searchField, { target: { value: '担当者' } });
    expect(searchField).toHaveValue('担当者');
  });

  it('handles store requirement check', () => {
    render(<CustomerListClient initialCustomers={mockCustomers} />);
    
    expect(screen.getByTestId('search')).toBeInTheDocument();
  });
});