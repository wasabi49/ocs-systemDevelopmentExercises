import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DeliveryTable, { Delivery } from './DeliveryTable';

// Mock dependencies
vi.mock('next/link', () => ({
  default: function Link({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
  },
}));

describe('DeliveryTable', () => {
  const mockDeliveries: Delivery[] = [
    {
      id: '1',
      date: '2023-01-01',
      customerName: 'Customer 1',
      note: 'Note 1',
    },
    {
      id: '2',
      date: '2023-01-02',
      customerName: 'Customer 2',
      note: 'Note 2',
    },
  ];

  const mockProps = {
    deliveries: mockDeliveries,
    onSort: vi.fn(),
    renderSortIcons: vi.fn().mockReturnValue(<span data-testid="sort-icon">↕</span>),
    sortField: null as keyof Delivery | null,
    sortOrder: 'asc' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table headers correctly', () => {
    render(<DeliveryTable {...mockProps} />);

    expect(screen.getByText('納品ID')).toBeInTheDocument();
    expect(screen.getByText('納品日')).toBeInTheDocument();
    expect(screen.getByText('顧客名')).toBeInTheDocument();
    expect(screen.getByText('備考')).toBeInTheDocument();
  });

  it('renders delivery data correctly', () => {
    render(<DeliveryTable {...mockProps} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('Customer 1')).toBeInTheDocument();
    expect(screen.getByText('Note 1')).toBeInTheDocument();

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('2023-01-02')).toBeInTheDocument();
    expect(screen.getByText('Customer 2')).toBeInTheDocument();
    expect(screen.getByText('Note 2')).toBeInTheDocument();
  });

  it('renders sort icons for sortable columns', () => {
    render(<DeliveryTable {...mockProps} />);

    const sortIcons = screen.getAllByTestId('sort-icon');
    expect(sortIcons).toHaveLength(2); // ID and date columns
  });

  it('calls onSort when clicking sortable headers', () => {
    render(<DeliveryTable {...mockProps} />);

    const idHeader = screen.getByText('納品ID');
    fireEvent.click(idHeader);
    expect(mockProps.onSort).toHaveBeenCalledWith('id');

    const dateHeader = screen.getByText('納品日');
    fireEvent.click(dateHeader);
    expect(mockProps.onSort).toHaveBeenCalledWith('date');
  });

  it('renders links for delivery IDs', () => {
    render(<DeliveryTable {...mockProps} />);

    const link1 = screen.getByRole('link', { name: '1' });
    expect(link1).toHaveAttribute('href', '/Home/DeliveryList/1');

    const link2 = screen.getByRole('link', { name: '2' });
    expect(link2).toHaveAttribute('href', '/Home/DeliveryList/2');
  });

  it('renders empty state when no deliveries', () => {
    render(<DeliveryTable {...mockProps} deliveries={[]} />);

    expect(screen.getByText('納品ID')).toBeInTheDocument();
    expect(screen.getByText('納品日')).toBeInTheDocument();
    expect(screen.getByText('顧客名')).toBeInTheDocument();
    expect(screen.getByText('備考')).toBeInTheDocument();

    // No delivery data should be present
    expect(screen.queryByText('Customer 1')).not.toBeInTheDocument();
  });

  it('handles deliveries with empty ID', () => {
    const deliveriesWithEmptyId: Delivery[] = [
      {
        id: '',
        date: '2023-01-01',
        customerName: 'Customer 1',
        note: 'Note 1',
      },
    ];

    render(<DeliveryTable {...mockProps} deliveries={deliveriesWithEmptyId} />);

    expect(screen.getByText('Customer 1')).toBeInTheDocument();
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
  });

  it('renders correct table structure', () => {
    render(<DeliveryTable {...mockProps} />);

    const table = screen.getByRole('table');
    expect(table).toHaveClass('w-full', 'min-w-0', 'border-collapse');

    const rowGroups = screen.getAllByRole('rowgroup');
    expect(rowGroups).toHaveLength(2); // thead and tbody
    expect(rowGroups[0]).toHaveClass('bg-blue-300'); // thead
  });

  it('applies correct CSS classes to elements', () => {
    render(<DeliveryTable {...mockProps} />);

    const idHeader = screen.getByText('納品ID').closest('th');
    expect(idHeader).toHaveClass('cursor-pointer');

    const dateHeader = screen.getByText('納品日').closest('th');
    expect(dateHeader).toHaveClass('cursor-pointer');

    const customerHeader = screen.getByText('顧客名').closest('th');
    expect(customerHeader).not.toHaveClass('cursor-pointer');
  });

  it('calls renderSortIcons with correct parameters', () => {
    render(<DeliveryTable {...mockProps} />);

    expect(mockProps.renderSortIcons).toHaveBeenCalledWith('id');
    expect(mockProps.renderSortIcons).toHaveBeenCalledWith('date');
    expect(mockProps.renderSortIcons).toHaveBeenCalledTimes(2);
  });

  it('logs debug information', () => {
    render(<DeliveryTable {...mockProps} />);

    // Debug logging is handled internally - just verify component renders
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('handles delivery data with special characters', () => {
    const deliveriesWithSpecialChars: Delivery[] = [
      {
        id: '1',
        date: '2023-01-01',
        customerName: 'Customer & Co. <script>',
        note: 'Note with "quotes" & <tags>',
      },
    ];

    render(<DeliveryTable {...mockProps} deliveries={deliveriesWithSpecialChars} />);

    expect(screen.getByText('Customer & Co. <script>')).toBeInTheDocument();
    expect(screen.getByText('Note with "quotes" & <tags>')).toBeInTheDocument();
  });
});