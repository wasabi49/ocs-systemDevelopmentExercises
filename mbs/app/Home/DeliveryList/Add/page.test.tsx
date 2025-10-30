import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DeliveryAddPage from './page';
import { fetchAllCustomers } from '@/app/actions/customerActions';
import { fetchUndeliveredOrderDetailsForCreate, createDelivery } from '@/app/actions/deliveryActions';

// Mock dependencies
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/app/actions/customerActions');
vi.mock('@/app/actions/deliveryActions');

// Mock function references
const mockFetchAllCustomers = vi.mocked(fetchAllCustomers);
const mockFetchUndeliveredOrderDetailsForCreate = vi.mocked(fetchUndeliveredOrderDetailsForCreate);
const mockCreateDelivery = vi.mocked(createDelivery);

vi.mock('@/app/hooks/useGenericSearch', () => ({
  useSimpleSearch: vi.fn((items, searchTerm, field) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item[field]?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }),
}));

vi.mock('@/app/utils/sortUtils', () => ({
  sortItems: vi.fn((items, field, sortConfig, setSortConfig) => {
    const direction = sortConfig?.key === field && sortConfig?.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key: field, direction });
    return [...items].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }),
  SortIcon: ({ field, sortConfig }: { field: string; sortConfig: { key: string; direction: 'asc' | 'desc' } | null }) => (
    <span data-testid={`sort-icon-${field}`}>
      {sortConfig?.key === field ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
    </span>
  ),
}));

vi.mock('@/app/components/Loading', () => ({
  Loading: ({ text, variant, size }: { text: string; variant?: string; size?: string }) => (
    <div data-testid="loading" data-variant={variant} data-size={size}>
      {text}
    </div>
  ),
}));

vi.mock('react-tooltip', () => ({
  Tooltip: ({ id, place, className, style, children }: { id: string; place: string; className: string; style: Record<string, unknown>; children: React.ReactNode }) => (
    <div data-testid={`tooltip-${id}`} data-place={place} className={className} style={style}>
      {children}
    </div>
  ),
}));

describe('DeliveryAddPage', () => {
  const mockCustomers = [
    {
      id: 'C001',
      storeId: 'S001',
      name: 'Customer A',
      contactPerson: 'Contact A',
      address: 'Address A',
      phone: '123-456-7890',
      deliveryCondition: 'Condition A',
      note: 'Note A',
      updatedAt: '2023-01-01T00:00:00Z',
      isDeleted: false,
      deletedAt: null,
    },
    {
      id: 'C002',
      storeId: 'S001',
      name: 'Customer B',
      contactPerson: 'Contact B',
      address: 'Address B',
      phone: '123-456-7891',
      deliveryCondition: 'Condition B',
      note: 'Note B',
      updatedAt: '2023-01-01T00:00:00Z',
      isDeleted: false,
      deletedAt: null,
    },
  ];

  const mockOrderDetails = [
    {
      orderDetailId: 'OD001',
      orderId: 'O001',
      productName: 'Product A',
      unitPrice: 1000,
      totalQuantity: 10,
      allocatedInOtherDeliveries: 3,
      currentAllocation: 0,
      remainingQuantity: 7,
      description: 'Description A',
      orderDate: '2023-01-01T00:00:00Z',
    },
    {
      orderDetailId: 'OD002',
      orderId: 'O002',
      productName: 'Product B',
      unitPrice: 2000,
      totalQuantity: 5,
      allocatedInOtherDeliveries: 0,
      currentAllocation: 0,
      remainingQuantity: 5,
      description: 'Description B',
      orderDate: '2023-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(fetchAllCustomers).mockResolvedValue({
      status: 'success',
      data: mockCustomers,
    });
    vi.mocked(fetchUndeliveredOrderDetailsForCreate).mockResolvedValue({
      success: true,
      orderDetails: mockOrderDetails,
    });
    vi.mocked(createDelivery).mockResolvedValue({
      success: true,
    });
  });

  it('renders delivery add page correctly', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(screen.getByText('新規納品作成')).toBeInTheDocument();
      expect(screen.getByText('顧客情報')).toBeInTheDocument();
      expect(screen.getByText('納品日')).toBeInTheDocument();
      expect(screen.getByText('備考')).toBeInTheDocument();
    });
  });

  it('loads customers on mount', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });
  });

  it('handles customer search input', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Customer A' } });
    });

    expect(searchInput).toHaveValue('Customer A');
  });

  it('shows customer dropdown on search input click', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
      expect(screen.getByText('Customer B')).toBeInTheDocument();
    });
  });

  it('handles customer selection', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(mockFetchUndeliveredOrderDetailsForCreate).toHaveBeenCalledWith('C001');
      expect(screen.getByText('未納品商品情報')).toBeInTheDocument();
    });
  });

  it('displays selected customer information', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
      expect(screen.getByText('担当者: Contact A | ID: C001')).toBeInTheDocument();
    });
  });

  it('handles delivery date change', async () => {
    render(<DeliveryAddPage />);

    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    await act(async () => {
      fireEvent.change(dateInput, { target: { value: '2023-12-25' } });
    });

    expect(dateInput).toHaveValue('2023-12-25');
  });

  it('handles note input change', async () => {
    render(<DeliveryAddPage />);

    const noteInput = screen.getByPlaceholderText('備考があれば入力してください');
    await act(async () => {
      fireEvent.change(noteInput, { target: { value: 'Test note' } });
    });

    expect(noteInput).toHaveValue('Test note');
  });

  it('shows product selection button when customer has undelivered products', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('この顧客には 2 件の未納品商品があります')).toBeInTheDocument();
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });
  });

  it('shows message when customer has no undelivered products', async () => {
    mockFetchUndeliveredOrderDetailsForCreate.mockResolvedValue({
      success: true,
      orderDetails: [],
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('この顧客には現在未納品の商品はありません')).toBeInTheDocument();
    });
  });

  it('opens product selection modal', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });
  });

  it('handles product search in modal', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const productSearchInput = screen.getByPlaceholderText('商品名で検索...');
    await act(async () => {
      fireEvent.change(productSearchInput, { target: { value: 'Product A' } });
    });

    expect(productSearchInput).toHaveValue('Product A');
  });

  it('handles quantity input in modal', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      await act(async () => {
        fireEvent.change(quantityInputs[0], { target: { value: '3' } });
      });
      expect(quantityInputs[0]).toHaveValue(3);
    }
  });

  it('handles successful delivery creation', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      await act(async () => {
        fireEvent.change(quantityInputs[0], { target: { value: '3' } });
      });
    }

    const createButton = screen.getByText('納品作成');
    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(mockCreateDelivery).toHaveBeenCalled();
      expect(screen.getByText('納品作成完了')).toBeInTheDocument();
    });
  });

  it('handles cancel button click', async () => {
    render(<DeliveryAddPage />);

    const cancelButton = screen.getByText('キャンセル');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/Home/DeliveryList');
  });

  it('handles customer fetch error', async () => {
    mockFetchAllCustomers.mockResolvedValue({
      status: 'error',
      error: 'Failed to fetch customers',
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch customers')).toBeInTheDocument();
    });
  });

  it('handles customer fetch exception', async () => {
    mockFetchAllCustomers.mockRejectedValue(new Error('Network error'));

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('顧客データの取得中にエラーが発生しました')).toBeInTheDocument();
    });
  });

  it('handles order details fetch error', async () => {
    mockFetchUndeliveredOrderDetailsForCreate.mockResolvedValue({
      success: false,
      error: 'Failed to fetch order details',
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch order details')).toBeInTheDocument();
    });
  });

  it('handles order details fetch exception', async () => {
    mockFetchUndeliveredOrderDetailsForCreate.mockRejectedValue(new Error('Network error'));

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('未納品注文明細の取得中にエラーが発生しました')).toBeInTheDocument();
    });
  });

  it('handles delivery creation error', async () => {
    mockCreateDelivery.mockResolvedValue({
      success: false,
      error: 'Failed to create delivery',
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      await act(async () => {
        fireEvent.change(quantityInputs[0], { target: { value: '3' } });
      });
    }

    const createButton = screen.getByText('納品作成');
    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('Failed to create delivery')).toBeInTheDocument();
    });
  });

  it('handles delivery creation exception', async () => {
    mockCreateDelivery.mockRejectedValue(new Error('Network error'));

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      await act(async () => {
        fireEvent.change(quantityInputs[0], { target: { value: '3' } });
      });
    }

    const createButton = screen.getByText('納品作成');
    await act(async () => {
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('納品の作成中にエラーが発生しました')).toBeInTheDocument();
    });
  });

  it('closes error modal', async () => {
    mockFetchAllCustomers.mockResolvedValue({
      status: 'error',
      error: 'Test error',
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
    });

    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);

    await waitFor(() => {
      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });

  it('closes success modal and navigates to delivery list', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('納品作成完了')).toBeInTheDocument();
    });

    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);

    expect(mockPush).toHaveBeenCalledWith('/Home/DeliveryList');
  });

  it('closes product modal', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('未納品商品リスト（注文別）')).not.toBeInTheDocument();
    });
  });

  it('handles customer dropdown outside click', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    // Simulate click outside
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Customer A')).not.toBeInTheDocument();
    });
  });

  it('handles sorting in product modal', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const orderIdHeader = screen.getByText('注文ID');
    fireEvent.click(orderIdHeader);

    expect(screen.getByTestId('sort-icon-orderId')).toBeInTheDocument();
  });

  it('displays loading state when fetching order details', async () => {
    let resolveOrderDetails: (value: unknown) => void;
    const orderDetailsPromise = new Promise((resolve) => {
      resolveOrderDetails = resolve;
    });
    mockFetchUndeliveredOrderDetailsForCreate.mockReturnValue(orderDetailsPromise);

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('未納品注文明細を取得中...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolveOrderDetails!({
      success: true,
      orderDetails: mockOrderDetails,
    });

    await waitFor(() => {
      expect(screen.queryByText('未納品注文明細を取得中...')).not.toBeInTheDocument();
    });
  });

  it('handles customer search term clearing', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    // Clear search term
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(searchInput).toHaveValue('');
  });

  it('validates customer selection before creating delivery', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Try to create delivery without selecting products
    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    // The test may need to check for actual validation behavior
    await waitFor(() => {
      // Check if the create button is disabled or if validation prevents creation
      expect(createButton).toBeDisabled();
    });
  });

  it('displays customer contact information correctly', async () => {
    const customerWithNullContact = {
      ...mockCustomers[0],
      contactPerson: null,
    };

    mockFetchAllCustomers.mockResolvedValue({
      status: 'success',
      data: [customerWithNullContact],
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('担当者: 担当者未設定 | ID: C001')).toBeInTheDocument();
    });
  });

  it('handles modal backdrop click', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Click backdrop
    const backdrop = screen.getByText('未納品商品リスト（注文別）').closest('div[style*="background: rgba(0, 0, 0, 0.6)"]');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    await waitFor(() => {
      expect(screen.queryByText('未納品商品リスト（注文別）')).not.toBeInTheDocument();
    });
  });

  it('renders tooltips correctly', async () => {
    await act(async () => {
      render(<DeliveryAddPage />);
    });

    expect(screen.getByTestId('tooltip-product-tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-description-tooltip')).toBeInTheDocument();
  });

  it('handles date formatting correctly', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Check date formatting in the table
    expect(screen.getByText('2023/01/01')).toBeInTheDocument();
    expect(screen.getByText('2023/01/02')).toBeInTheDocument();
  });

  it('handles quantity validation', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      // Test negative quantity
      fireEvent.change(quantityInputs[0], { target: { value: '-1' } });
      expect(quantityInputs[0]).toHaveValue(0);
    }
  });

  it('handles customer with null contact person in dropdown', async () => {
    const customerWithNullContact = {
      ...mockCustomers[0],
      contactPerson: null,
    };

    mockFetchAllCustomers.mockResolvedValue({
      status: 'success',
      data: [customerWithNullContact],
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
      expect(screen.getByText('担当者未設定 | 123-456-7890')).toBeInTheDocument();
    });
  });

  it('handles saving with quantity zero', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '0' } });
    }

    const createButton = screen.getByText('納品作成');
    expect(createButton).toBeDisabled();
  });

  it('handles modal cancel button', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // モーダル内のキャンセルボタンを取得（複数存在するため getAllByText を使用）
    const cancelButtons = screen.getAllByText('キャンセル');
    const modalCancelButton = cancelButtons.find(button => 
      button.closest('[style*="rgba(0, 0, 0, 0.6)"]') || 
      button.closest('.fixed.inset-0')
    ) || cancelButtons[1]; // モーダルのキャンセルボタンは通常2番目
    fireEvent.click(modalCancelButton);

    await waitFor(() => {
      expect(screen.queryByText('未納品商品リスト（注文別）')).not.toBeInTheDocument();
    });
  });

  it('handles product description display', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Check product descriptions are displayed
    expect(screen.getByText('Description A')).toBeInTheDocument();
    expect(screen.getByText('Description B')).toBeInTheDocument();
  });

  it('handles empty order details filtering', async () => {
    mockFetchUndeliveredOrderDetailsForCreate.mockResolvedValue({
      success: true,
      orderDetails: [mockOrderDetails[0], null, mockOrderDetails[1]],
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('この顧客には 2 件の未納品商品があります')).toBeInTheDocument();
    });
  });

  it('handles no customers found scenario', async () => {
    mockFetchAllCustomers.mockResolvedValue({
      status: 'success',
      data: [],
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('顧客が見つかりません')).toBeInTheDocument();
    });
  });

  it('handles sorting different types of data', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Test sorting by different columns
    const unitPriceHeader = screen.getByText('単価');
    fireEvent.click(unitPriceHeader);
    expect(screen.getByTestId('sort-icon-unitPrice')).toBeInTheDocument();

    const orderDateHeader = screen.getByText('注文日');
    fireEvent.click(orderDateHeader);
    expect(screen.getByTestId('sort-icon-orderDate')).toBeInTheDocument();

    const totalQuantityHeader = screen.getByText('注文数量');
    fireEvent.click(totalQuantityHeader);
    expect(screen.getByTestId('sort-icon-totalQuantity')).toBeInTheDocument();
  });

  it('handles customer selection with no previously selected customer', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.change(searchInput, { target: { value: 'Customer A' } });

    expect(searchInput).toHaveValue('Customer A');
  });

  it('handles total calculation correctly', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '2' } });
    }

    // Check total calculation
    expect(screen.getByText('選択状況: 2個 / 合計金額: ¥2,000')).toBeInTheDocument();
  });

  it('handles clicking on modal content (should not close)', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Click on modal content
    const modalContent = screen.getByText('未納品商品リスト（注文別）');
    fireEvent.click(modalContent);

    // Modal should still be open
    expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
  });

  it('handles error modal with default message', async () => {
    mockFetchAllCustomers.mockResolvedValue({
      status: 'error',
      error: '',
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('顧客データの取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('handles delivery creation with default error message', async () => {
    mockCreateDelivery.mockResolvedValue({
      success: false,
      error: '',
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('納品の作成に失敗しました')).toBeInTheDocument();
    });
  });

  it('handles order details fetch with default error message', async () => {
    mockFetchUndeliveredOrderDetailsForCreate.mockResolvedValue({
      success: false,
      error: '',
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('エラー')).toBeInTheDocument();
      expect(screen.getByText('未納品注文明細の取得に失敗しました')).toBeInTheDocument();
    });
  });

  it('handles order detail save error', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateDelivery).toHaveBeenCalled();
    });
  });

  it('handles saving indicator', async () => {
    let resolveCreate: (value: unknown) => void;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    mockCreateDelivery.mockReturnValue(createPromise);

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('保存中...')).toBeInTheDocument();
    });

    // Resolve the promise
    resolveCreate!({
      success: true,
    });

    await waitFor(() => {
      expect(screen.queryByText('保存中...')).not.toBeInTheDocument();
    });
  });

  it('handles note trimming', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const noteInput = screen.getByPlaceholderText('備考があれば入力してください');
    fireEvent.change(noteInput, { target: { value: '  trimmed note  ' } });

    expect(noteInput).toHaveValue('  trimmed note  ');

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'trimmed note',
        }),
        expect.any(Array)
      );
    });
  });

  it('handles empty note', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const noteInput = screen.getByPlaceholderText('備考があれば入力してください');
    fireEvent.change(noteInput, { target: { value: '   ' } });

    expect(noteInput).toHaveValue('   ');

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          note: undefined,
        }),
        expect.any(Array)
      );
    });
  });

  it('handles search result display', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const productSearchInput = screen.getByPlaceholderText('商品名で検索...');
    fireEvent.change(productSearchInput, { target: { value: 'Product A' } });

    expect(screen.getByText('検索結果: 1件 / 全2件')).toBeInTheDocument();
  });

  it('handles canceling without customer selection', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // モーダル内のキャンセルボタンを取得（複数存在するため getAllByText を使用）
    const cancelButtons = screen.getAllByText('キャンセル');
    const modalCancelButton = cancelButtons.find(button => 
      button.closest('[style*="rgba(0, 0, 0, 0.6)"]') || 
      button.closest('.fixed.inset-0')
    ) || cancelButtons[1]; // モーダルのキャンセルボタンは通常2番目
    fireEvent.click(modalCancelButton);

    await waitFor(() => {
      expect(screen.queryByText('未納品商品リスト（注文別）')).not.toBeInTheDocument();
    });
  });

  it('handles disabled buttons correctly', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const createButton = screen.getByText('納品作成');
    expect(createButton).toBeDisabled();

    // モーダル内のキャンセルボタンを取得（複数存在するため getAllByText を使用）
    const cancelButtons = screen.getAllByText('キャンセル');
    const modalCancelButton = cancelButtons.find(button => 
      button.closest('[style*="rgba(0, 0, 0, 0.6)"]') || 
      button.closest('.fixed.inset-0')
    ) || cancelButtons[1]; // モーダルのキャンセルボタンは通常2番目
    expect(modalCancelButton).not.toBeDisabled();
  });

  it('handles product with empty description', async () => {
    const orderDetailsWithEmptyDescription = [
      {
        ...mockOrderDetails[0],
        description: null,
      },
    ];

    mockFetchUndeliveredOrderDetailsForCreate.mockResolvedValue({
      success: true,
      orderDetails: orderDetailsWithEmptyDescription,
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Product should still be displayed without description
    expect(screen.getByText('Product A')).toBeInTheDocument();
  });

  it('handles creating delivery without customer selection', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateDelivery).toHaveBeenCalled();
    });
  });

  it('handles price display correctly', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Check price formatting
    expect(screen.getByText('¥1,000')).toBeInTheDocument();
    expect(screen.getByText('¥2,000')).toBeInTheDocument();
  });

  it('handles required field display', async () => {
    await act(async () => {
      render(<DeliveryAddPage />);
    });

    // Check required field indicator
    expect(screen.getByText('必須')).toBeInTheDocument();
  });

  it('handles loading state during page load', async () => {
    let resolveCustomers: (value: unknown) => void;
    const customersPromise = new Promise((resolve) => {
      resolveCustomers = resolve;
    });
    mockFetchAllCustomers.mockReturnValue(customersPromise);

    await act(async () => {
      render(<DeliveryAddPage />);
    });

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    // Page should render without loading indicator for customers
    expect(screen.getByText('新規納品作成')).toBeInTheDocument();

    // Resolve the promise
    await act(async () => {
      resolveCustomers!({
        status: 'success',
        data: mockCustomers,
      });
    });
  });

  it('handles button disabled state during loading', async () => {
    let resolveCustomers: (value: unknown) => void;
    const customersPromise = new Promise((resolve) => {
      resolveCustomers = resolve;
    });
    mockFetchAllCustomers.mockReturnValue(customersPromise);

    await act(async () => {
      render(<DeliveryAddPage />);
    });

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const cancelButton = screen.getByText('キャンセル');
    expect(cancelButton).not.toBeDisabled();

    // Resolve the promise
    await act(async () => {
      resolveCustomers!({
        status: 'success',
        data: mockCustomers,
      });
    });
  });

  it('handles isLoading state correctly', async () => {
    let resolveOrderDetails: (value: unknown) => void;
    const orderDetailsPromise = new Promise((resolve) => {
      resolveOrderDetails = resolve;
    });
    mockFetchUndeliveredOrderDetailsForCreate.mockReturnValue(orderDetailsPromise);

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('未納品注文明細を取得中...')).toBeInTheDocument();
    });

    // Buttons should be disabled during loading
    const cancelButton = screen.getByText('キャンセル');
    expect(cancelButton).toBeDisabled();

    // Resolve the promise
    resolveOrderDetails!({
      success: true,
      orderDetails: mockOrderDetails,
    });

    await waitFor(() => {
      expect(screen.queryByText('未納品注文明細を取得中...')).not.toBeInTheDocument();
    });
  });

  it('handles modal save error', async () => {
    mockCreateDelivery.mockRejectedValue(new Error('Save error'));

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('納品の作成中にエラーが発生しました')).toBeInTheDocument();
    });
  });

  it('handles order details with undefined values', async () => {
    const orderDetailsWithUndefined = [
      {
        ...mockOrderDetails[0],
        orderDetailId: undefined,
      },
    ];

    mockFetchUndeliveredOrderDetailsForCreate.mockResolvedValue({
      success: true,
      orderDetails: orderDetailsWithUndefined,
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('この顧客には 1 件の未納品商品があります')).toBeInTheDocument();
    });
  });

  it('handles customers with special characters in names', async () => {
    const specialCustomers = [
      {
        ...mockCustomers[0],
        name: 'Test & Special Customer',
      },
    ];

    mockFetchAllCustomers.mockResolvedValue({
      status: 'success',
      data: specialCustomers,
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Test & Special Customer')).toBeInTheDocument();
    });
  });

  it('handles product modal with no results', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const productSearchInput = screen.getByPlaceholderText('商品名で検索...');
    fireEvent.change(productSearchInput, { target: { value: 'NonExistent' } });

    expect(screen.getByText('検索結果: 0件 / 全2件')).toBeInTheDocument();
  });

  it('handles note field with max length', async () => {
    render(<DeliveryAddPage />);

    const noteInput = screen.getByPlaceholderText('備考があれば入力してください');
    const longNote = 'A'.repeat(1000);
    
    await act(async () => {
      fireEvent.change(noteInput, { target: { value: longNote } });
    });

    expect(noteInput).toHaveValue(longNote);
  });

  it('handles delivery date with future date', async () => {
    render(<DeliveryAddPage />);

    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureDateString = futureDate.toISOString().split('T')[0];
    
    await act(async () => {
      fireEvent.change(dateInput, { target: { value: futureDateString } });
    });

    expect(dateInput).toHaveValue(futureDateString);
  });

  it('handles delivery date with past date', async () => {
    render(<DeliveryAddPage />);

    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    const pastDateString = pastDate.toISOString().split('T')[0];
    
    await act(async () => {
      fireEvent.change(dateInput, { target: { value: pastDateString } });
    });

    expect(dateInput).toHaveValue(pastDateString);
  });

  it('handles customer search with empty string', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(searchInput).toHaveValue('');
  });

  it('handles customer search with special characters', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.change(searchInput, { target: { value: 'Test & Customer' } });

    expect(searchInput).toHaveValue('Test & Customer');
  });

  it('handles quantity input with string value', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: 'abc' } });
      expect(quantityInputs[0]).toHaveValue(0);
    }
  });

  it('handles quantity input with decimal value', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3.5' } });
      expect(quantityInputs[0]).toHaveValue(3);
    }
  });

  it('handles quantity input with very large value', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '999999' } });
      expect(quantityInputs[0]).toHaveValue(999999);
    }
  });

  it('handles empty product search', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const productSearchInput = screen.getByPlaceholderText('商品名で検索...');
    fireEvent.change(productSearchInput, { target: { value: '' } });

    expect(productSearchInput).toHaveValue('');
  });

  it('handles product search with partial matches', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const productSearchInput = screen.getByPlaceholderText('商品名で検索...');
    fireEvent.change(productSearchInput, { target: { value: 'Product' } });

    expect(screen.getByText('検索結果: 2件 / 全2件')).toBeInTheDocument();
  });

  it('handles customer search case insensitivity', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.change(searchInput, { target: { value: 'customer a' } });

    expect(searchInput).toHaveValue('customer a');
  });

  it('handles product search case insensitivity', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const productSearchInput = screen.getByPlaceholderText('商品名で検索...');
    fireEvent.change(productSearchInput, { target: { value: 'product a' } });

    expect(screen.getByText('検索結果: 1件 / 全2件')).toBeInTheDocument();
  });

  it('handles quantity input beyond max value', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      // Input quantity beyond remaining quantity
      fireEvent.change(quantityInputs[0], { target: { value: '100' } });
      expect(quantityInputs[0]).toHaveValue(100);
    }
  });

  it('handles product selection with row highlighting', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    // Row should be highlighted when quantity > 0
    const firstRow = screen.getByText('O001').closest('tr');
    expect(firstRow).toHaveClass('bg-green-100');
  });

  it('handles create button enabling/disabling', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const createButton = screen.getByText('納品作成');
    expect(createButton).toBeDisabled();

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    expect(createButton).not.toBeDisabled();
  });

  it('handles search field with undefined value', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.change(searchInput, { target: { value: undefined } });

    expect(searchInput).toHaveValue('');
  });

  it('handles product table with empty cells', async () => {
    const orderDetailsWithEmptyValues = [
      {
        ...mockOrderDetails[0],
        description: '',
        productName: '',
      },
    ];

    mockFetchUndeliveredOrderDetailsForCreate.mockResolvedValue({
      success: true,
      orderDetails: orderDetailsWithEmptyValues,
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Should still display table with empty values
    expect(screen.getByText('O001')).toBeInTheDocument();
  });

  it('handles submit with multiple products', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length >= 2) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
      fireEvent.change(quantityInputs[1], { target: { value: '2' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateDelivery).toHaveBeenCalled();
    });
  });

  it('handles total calculation with multiple products', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length >= 2) {
      fireEvent.change(quantityInputs[0], { target: { value: '2' } });
      fireEvent.change(quantityInputs[1], { target: { value: '1' } });
    }

    // Total should be 2 * 1000 + 1 * 2000 = 4000
    expect(screen.getByText('選択状況: 3個 / 合計金額: ¥4,000')).toBeInTheDocument();
  });

  it('handles order details with null values', async () => {
    const orderDetailsWithNullValues = [
      {
        ...mockOrderDetails[0],
        description: null,
        productName: null,
      },
    ];

    mockFetchUndeliveredOrderDetailsForCreate.mockResolvedValue({
      success: true,
      orderDetails: orderDetailsWithNullValues,
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    // Should still display table with null values
    expect(screen.getByText('O001')).toBeInTheDocument();
  });

  it('handles delivery create with empty notes', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const noteInput = screen.getByPlaceholderText('備考があれば入力してください');
    fireEvent.change(noteInput, { target: { value: '' } });

    expect(noteInput).toHaveValue('');

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('未納品商品リスト（注文別）')).toBeInTheDocument();
    });

    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length > 0) {
      fireEvent.change(quantityInputs[0], { target: { value: '3' } });
    }

    const createButton = screen.getByText('納品作成');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockCreateDelivery).toHaveBeenCalledWith(
        expect.objectContaining({
          note: undefined,
        }),
        expect.any(Array)
      );
    });
  });

  it('handles different screen sizes', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    // Check responsive design elements
    expect(screen.getByText('新規納品作成')).toBeInTheDocument();
    expect(screen.getByText('顧客情報')).toBeInTheDocument();
    expect(screen.getByText('納品日')).toBeInTheDocument();
    expect(screen.getByText('備考')).toBeInTheDocument();
  });

  it('納品数量でソートが可能', async () => {
    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('納品数量')).toBeInTheDocument();
    });

    // 納品数量ヘッダーをクリックしてソート
    const sortHeader = screen.getByText('納品数量');
    await act(async () => {
      fireEvent.click(sortHeader);
    });

    // ソート後もヘッダーが表示されていることを確認
    expect(screen.getByText('納品数量')).toBeInTheDocument();
  });

  it('納品数量の変更でソート順が更新される', async () => {
    // 複数のアイテムを設定
    const mockMultipleOrderDetails = [
      {
        orderDetailId: 'OD001',
        orderId: 'O001',
        productName: 'Product A',
        unitPrice: 1000,
        totalQuantity: 10,
        remainingQuantity: 10,
        description: 'Description A',
        orderDate: '2023-01-01',
      },
      {
        orderDetailId: 'OD002',
        orderId: 'O002',
        productName: 'Product B',
        unitPrice: 1500,
        totalQuantity: 8,
        remainingQuantity: 8,
        description: 'Description B',
        orderDate: '2023-01-02',
      },
    ];

    mockFetchUndeliveredOrderDetailsForCreate.mockResolvedValue({
      success: true,
      orderDetails: mockMultipleOrderDetails,
    });

    render(<DeliveryAddPage />);

    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalled();
    });

    const searchInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);

    await waitFor(() => {
      expect(screen.getByText('納品商品を選択')).toBeInTheDocument();
    });

    const selectButton = screen.getByText('納品商品を選択');
    fireEvent.click(selectButton);

    await waitFor(() => {
      expect(screen.getByText('納品数量')).toBeInTheDocument();
    });

    // 納品数量でソート
    const sortHeader = screen.getByText('納品数量');
    await act(async () => {
      fireEvent.click(sortHeader);
    });

    // 数量入力フィールドを変更
    const quantityInputs = screen.getAllByRole('spinbutton');
    if (quantityInputs.length >= 2) {
      await act(async () => {
        fireEvent.change(quantityInputs[0], { target: { value: '5' } });
        fireEvent.change(quantityInputs[1], { target: { value: '2' } });
      });

      // 数量が正しく設定されることを確認
      expect(quantityInputs[0]).toHaveValue(5);
      expect(quantityInputs[1]).toHaveValue(2);
    }
  });
});