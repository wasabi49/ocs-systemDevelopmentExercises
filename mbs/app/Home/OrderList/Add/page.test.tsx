import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import OrderAddPage from './page';

// Mock dependencies
const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

const mockCreateOrder = vi.fn();
const mockFetchAllCustomers = vi.fn();

vi.mock('@/app/contexts/StoreContext', () => ({
  useStore: () => ({
    selectedStore: { id: 'store1', name: 'Test Store' },
  }),
}));

vi.mock('@/app/actions/orderActions', () => ({
  createOrder: mockCreateOrder,
}));

vi.mock('@/app/actions/customerActions', () => ({
  fetchAllCustomers: mockFetchAllCustomers,
}));

vi.mock('@/app/hooks/useGenericSearch', () => ({
  useSimpleSearch: () => ({
    filteredItems: [],
    searchKeyword: '',
    setSearchKeyword: vi.fn(),
  }),
}));

vi.mock('@/app/components/Loading', () => ({
  Loading: () => <div data-testid="loading">Loading...</div>,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('OrderAddPage', () => {
  const mockCustomers = [
    {
      id: 'C001',
      name: 'Customer A',
      contactPerson: 'Contact A',
      address: 'Address A',
      phone: '123-456-7890',
      deliveryCondition: 'Condition A',
      note: 'Note A',
      storeId: 'store1',
      updatedAt: new Date('2023-01-01'),
      isDeleted: false,
      deletedAt: null,
    },
    {
      id: 'C002',
      name: 'Customer B',
      contactPerson: 'Contact B',
      address: 'Address B',
      phone: '123-456-7891',
      deliveryCondition: 'Condition B',
      note: 'Note B',
      storeId: 'store1',
      updatedAt: new Date('2023-01-02'),
      isDeleted: false,
      deletedAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchAllCustomers.mockResolvedValue({
      status: 'success',
      data: mockCustomers,
    });
  });

  it('renders without crashing', () => {
    const { container } = render(<OrderAddPage />);
    expect(container).toBeInTheDocument();
  });

  it('renders basic structure with store information', () => {
    render(<OrderAddPage />);
    expect(screen.getByText('現在の店舗:')).toBeInTheDocument();
    expect(screen.getByText('Test Store')).toBeInTheDocument();
    expect(screen.getByText('商品情報')).toBeInTheDocument();
    expect(screen.getByText('顧客情報')).toBeInTheDocument();
    expect(screen.getByText('注文日')).toBeInTheDocument();
    expect(screen.getByText('備考')).toBeInTheDocument();
  });

  it('renders initial product row', () => {
    render(<OrderAddPage />);
    expect(screen.getByPlaceholderText('商品名を入力')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('摘要を入力')).toBeInTheDocument();
    expect(screen.getByText('+ 行を追加')).toBeInTheDocument();
  });

  it('adds new product row when add button is clicked', async () => {
    render(<OrderAddPage />);
    
    const addButton = screen.getByText('+ 行を追加');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const productNameInputs = screen.getAllByPlaceholderText('商品名を入力');
      expect(productNameInputs).toHaveLength(2);
    });
  });

  it('limits maximum number of products to 20', async () => {
    render(<OrderAddPage />);
    
    const addButton = screen.getByText('+ 行を追加');
    
    // Add 19 more products (starting with 1)
    for (let i = 0; i < 19; i++) {
      fireEvent.click(addButton);
    }
    
    await waitFor(() => {
      const productNameInputs = screen.getAllByPlaceholderText('商品名を入力');
      expect(productNameInputs).toHaveLength(20);
    });
    
    // Try to add one more
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('商品追加エラー')).toBeInTheDocument();
      expect(screen.getByText('商品は最大20個までです')).toBeInTheDocument();
    });
  });

  it('handles product name input', async () => {
    render(<OrderAddPage />);
    
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    await waitFor(() => {
      expect(productNameInput).toHaveValue('Test Product');
    });
  });

  it('handles quantity input', async () => {
    render(<OrderAddPage />);
    
    const quantityInput = screen.getByDisplayValue('');
    fireEvent.change(quantityInput, { target: { value: '5' } });
    
    await waitFor(() => {
      expect(quantityInput).toHaveValue(5);
    });
  });

  it('handles unit price input', async () => {
    render(<OrderAddPage />);
    
    const unitPriceInput = screen.getByPlaceholderText('0');
    fireEvent.change(unitPriceInput, { target: { value: '1000' } });
    
    await waitFor(() => {
      expect(unitPriceInput).toHaveValue('1000');
    });
  });

  it('handles description input', async () => {
    render(<OrderAddPage />);
    
    const descriptionInput = screen.getByPlaceholderText('摘要を入力');
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    
    await waitFor(() => {
      expect(descriptionInput).toHaveValue('Test Description');
    });
  });

  it('shows delete confirmation modal when delete button is clicked', async () => {
    render(<OrderAddPage />);
    
    // Add second product first
    const addButton = screen.getByText('+ 行を追加');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('この行を削除');
      expect(deleteButtons).toHaveLength(2);
    });
    
    // Add product name for better identification
    const productNameInputs = screen.getAllByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInputs[0], { target: { value: 'Test Product' } });
    
    // Click delete button
    const deleteButtons = screen.getAllByTitle('この行を削除');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('商品削除')).toBeInTheDocument();
      expect(screen.getByText('以下の商品を削除してもよろしいですか？')).toBeInTheDocument();
    });
  });

  it('prevents deletion of last product', async () => {
    render(<OrderAddPage />);
    
    const deleteButton = screen.getByTitle('この行を削除');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(screen.getByText('削除エラー')).toBeInTheDocument();
      expect(screen.getByText('商品は最低1つ必要です')).toBeInTheDocument();
    });
  });

  it('confirms product deletion', async () => {
    render(<OrderAddPage />);
    
    // Add second product first
    const addButton = screen.getByText('+ 行を追加');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('この行を削除');
      expect(deleteButtons).toHaveLength(2);
    });
    
    // Click delete button
    const deleteButtons = screen.getAllByTitle('この行を削除');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('商品削除')).toBeInTheDocument();
    });
    
    // Confirm deletion
    const confirmButton = screen.getByText('削除');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      const productNameInputs = screen.getAllByPlaceholderText('商品名を入力');
      expect(productNameInputs).toHaveLength(1);
    });
  });

  it('cancels product deletion', async () => {
    render(<OrderAddPage />);
    
    // Add second product first
    const addButton = screen.getByText('+ 行を追加');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('この行を削除');
      expect(deleteButtons).toHaveLength(2);
    });
    
    // Click delete button
    const deleteButtons = screen.getAllByTitle('この行を削除');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('商品削除')).toBeInTheDocument();
    });
    
    // Cancel deletion
    const cancelButton = screen.getByText('キャンセル');
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('商品削除')).not.toBeInTheDocument();
    });
  });

  it('loads customers on component mount', async () => {
    render(<OrderAddPage />);
    
    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalledTimes(1);
    });
  });

  it('handles customer search', async () => {
    render(<OrderAddPage />);
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.change(customerInput, { target: { value: 'Customer A' } });
    
    await waitFor(() => {
      expect(customerInput).toHaveValue('Customer A');
    });
  });

  it('shows customer dropdown when search input is clicked', async () => {
    render(<OrderAddPage />);
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
      expect(screen.getByText('Customer B')).toBeInTheDocument();
    });
  });

  it('selects customer from dropdown', async () => {
    render(<OrderAddPage />);
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    await waitFor(() => {
      expect(customerInput).toHaveValue('Customer A');
      expect(screen.getByText('選択された顧客: Customer A')).toBeInTheDocument();
    });
  });

  it('shows no customers found message when no customers match search', async () => {
    render(<OrderAddPage />);
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.change(customerInput, { target: { value: 'NonExistent' } });
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('顧客が見つかりません')).toBeInTheDocument();
    });
  });

  it('handles order date change', async () => {
    render(<OrderAddPage />);
    
    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    fireEvent.change(dateInput, { target: { value: '2023-12-25' } });
    
    await waitFor(() => {
      expect(dateInput).toHaveValue('2023-12-25');
    });
  });

  it('handles note input', async () => {
    render(<OrderAddPage />);
    
    const noteTextarea = screen.getByPlaceholderText('備考を入力してください');
    fireEvent.change(noteTextarea, { target: { value: 'Test note' } });
    
    await waitFor(() => {
      expect(noteTextarea).toHaveValue('Test note');
    });
  });

  it('calculates total amount correctly', async () => {
    render(<OrderAddPage />);
    
    // Add product with price and quantity
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    const quantityInput = screen.getByDisplayValue('');
    fireEvent.change(quantityInput, { target: { value: '2' } });
    
    const unitPriceInput = screen.getByPlaceholderText('0');
    fireEvent.change(unitPriceInput, { target: { value: '1000' } });
    fireEvent.blur(unitPriceInput);
    
    await waitFor(() => {
      expect(screen.getByText('合計金額: ¥2,000')).toBeInTheDocument();
    });
  });

  it('shows validation errors when form is invalid', async () => {
    render(<OrderAddPage />);
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('入力エラー')).toBeInTheDocument();
      expect(screen.getByText('顧客を選択してください')).toBeInTheDocument();
    });
  });

  it('successfully creates order', async () => {
    mockCreateOrder.mockResolvedValue({
      success: true,
      data: {
        order: {
          id: 'ORDER-001',
          orderDate: new Date('2023-12-25'),
        },
        orderDetails: [
          {
            id: 'DETAIL-001',
            productName: 'Test Product',
            unitPrice: 1000,
            quantity: 2,
            description: 'Test Description',
          },
        ],
      },
    });
    
    render(<OrderAddPage />);
    
    // Fill in required fields
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    await waitFor(() => {
      expect(screen.getByText('選択された顧客: Customer A')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByText('注文追加完了')).toBeInTheDocument();
    });
  });

  it('handles order creation error', async () => {
    mockCreateOrder.mockResolvedValue({
      success: false,
      error: 'Order creation failed',
    });
    
    render(<OrderAddPage />);
    
    // Fill in required fields
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    await waitFor(() => {
      expect(screen.getByText('選択された顧客: Customer A')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('注文追加エラー')).toBeInTheDocument();
      expect(screen.getByText('Order creation failed')).toBeInTheDocument();
    });
  });

  it('handles order creation exception', async () => {
    mockCreateOrder.mockRejectedValue(new Error('Network error'));
    
    render(<OrderAddPage />);
    
    // Fill in required fields
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    await waitFor(() => {
      expect(screen.getByText('選択された顧客: Customer A')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('注文追加エラー')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('navigates to order list after successful creation', async () => {
    mockCreateOrder.mockResolvedValue({
      success: true,
      data: {
        order: {
          id: 'ORDER-001',
          orderDate: new Date('2023-12-25'),
        },
        orderDetails: [
          {
            id: 'DETAIL-001',
            productName: 'Test Product',
            unitPrice: 1000,
            quantity: 2,
            description: 'Test Description',
          },
        ],
      },
    });
    
    render(<OrderAddPage />);
    
    // Fill in required fields
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    await waitFor(() => {
      expect(screen.getByText('選択された顧客: Customer A')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('注文追加完了')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByText('注文一覧へ');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/Home/OrderList');
    });
  });

  it('closes error modal when OK button is clicked', async () => {
    render(<OrderAddPage />);
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('入力エラー')).toBeInTheDocument();
    });
    
    const okButton = screen.getByText('OK');
    fireEvent.click(okButton);
    
    await waitFor(() => {
      expect(screen.queryByText('入力エラー')).not.toBeInTheDocument();
    });
  });

  it('formats currency input correctly', async () => {
    render(<OrderAddPage />);
    
    const unitPriceInput = screen.getByPlaceholderText('0');
    fireEvent.change(unitPriceInput, { target: { value: '1,000' } });
    fireEvent.blur(unitPriceInput);
    
    await waitFor(() => {
      expect(unitPriceInput).toHaveValue('1,000');
    });
  });

  it('handles empty unit price input', async () => {
    render(<OrderAddPage />);
    
    const unitPriceInput = screen.getByPlaceholderText('0');
    fireEvent.change(unitPriceInput, { target: { value: '' } });
    fireEvent.blur(unitPriceInput);
    
    await waitFor(() => {
      expect(unitPriceInput).toHaveValue('');
    });
  });

  it('shows loading state during order creation', async () => {
    mockCreateOrder.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<OrderAddPage />);
    
    // Fill in required fields
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    await waitFor(() => {
      expect(screen.getByText('選択された顧客: Customer A')).toBeInTheDocument();
    });
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('処理中...')).toBeInTheDocument();
    });
  });

  it('handles customer fetch error', async () => {
    mockFetchAllCustomers.mockResolvedValue({
      status: 'error',
      data: [],
    });
    
    render(<OrderAddPage />);
    
    await waitFor(() => {
      expect(mockFetchAllCustomers).toHaveBeenCalledTimes(1);
    });
  });

  it('displays validation errors in mobile view', async () => {
    render(<OrderAddPage />);
    
    // Should show validation errors at bottom
    expect(screen.getByText('以下の項目を確認してください：')).toBeInTheDocument();
    expect(screen.getByText('顧客を選択してください')).toBeInTheDocument();
    expect(screen.getByText('各商品の商品名または摘要を入力してください')).toBeInTheDocument();
  });

  it('handles customer dropdown close on outside click', async () => {
    render(<OrderAddPage />);
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Customer A')).not.toBeInTheDocument();
    });
  });

  it('clears selected customer when search term changes', async () => {
    render(<OrderAddPage />);
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    await waitFor(() => {
      expect(screen.getByText('選択された顧客: Customer A')).toBeInTheDocument();
    });
    
    // Change search term
    fireEvent.change(customerInput, { target: { value: 'Customer B' } });
    
    await waitFor(() => {
      expect(screen.getByText('選択された顧客: 未選択')).toBeInTheDocument();
    });
  });

  it('handles quantity input with empty value', async () => {
    render(<OrderAddPage />);
    
    const quantityInput = screen.getByDisplayValue('');
    fireEvent.change(quantityInput, { target: { value: '' } });
    
    await waitFor(() => {
      expect(quantityInput).toHaveValue(null);
    });
  });

  it('validates minimum quantity', async () => {
    render(<OrderAddPage />);
    
    const quantityInput = screen.getByDisplayValue('');
    fireEvent.change(quantityInput, { target: { value: '0' } });
    
    await waitFor(() => {
      expect(quantityInput).toHaveValue(1);
    });
  });

  it('shows product deletion modal with product name and description', async () => {
    render(<OrderAddPage />);
    
    // Add second product first
    const addButton = screen.getByText('+ 行を追加');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const productNameInputs = screen.getAllByPlaceholderText('商品名を入力');
      const descriptionInputs = screen.getAllByPlaceholderText('摘要を入力');
      
      fireEvent.change(productNameInputs[0], { target: { value: 'Test Product' } });
      fireEvent.change(descriptionInputs[0], { target: { value: 'Test Description' } });
    });
    
    const deleteButtons = screen.getAllByTitle('この行を削除');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });
  });

  it('shows product deletion modal with no product name or description', async () => {
    render(<OrderAddPage />);
    
    // Add second product first
    const addButton = screen.getByText('+ 行を追加');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('この行を削除');
      expect(deleteButtons).toHaveLength(2);
    });
    
    const deleteButtons = screen.getAllByTitle('この行を削除');
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('（商品名・摘要未入力）')).toBeInTheDocument();
    });
  });

  it('resets form after successful order creation', async () => {
    mockCreateOrder.mockResolvedValue({
      success: true,
      data: {
        order: {
          id: 'ORDER-001',
          orderDate: new Date('2023-12-25'),
        },
        orderDetails: [
          {
            id: 'DETAIL-001',
            productName: 'Test Product',
            unitPrice: 1000,
            quantity: 2,
            description: 'Test Description',
          },
        ],
      },
    });
    
    render(<OrderAddPage />);
    
    // Fill in fields
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    const noteTextarea = screen.getByPlaceholderText('備考を入力してください');
    fireEvent.change(noteTextarea, { target: { value: 'Test note' } });
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('注文追加完了')).toBeInTheDocument();
    });
    
    // Check that form is reset
    expect(productNameInput).toHaveValue('');
    expect(noteTextarea).toHaveValue('');
    expect(customerInput).toHaveValue('');
  });

  it('handles contact person display when not set', async () => {
    const customersWithoutContact = [
      {
        id: 'C001',
        name: 'Customer A',
        contactPerson: null,
        address: 'Address A',
        phone: '123-456-7890',
        deliveryCondition: 'Condition A',
        note: 'Note A',
        storeId: 'store1',
        updatedAt: new Date('2023-01-01'),
        isDeleted: false,
        deletedAt: null,
      },
    ];
    
    mockFetchAllCustomers.mockResolvedValue({
      status: 'success',
      data: customersWithoutContact,
    });
    
    render(<OrderAddPage />);
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('担当者未設定')).toBeInTheDocument();
    });
  });

  it('handles successful order creation without order data', async () => {
    mockCreateOrder.mockResolvedValue({
      success: true,
      data: null,
    });
    
    render(<OrderAddPage />);
    
    // Fill in required fields
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('注文追加完了')).toBeInTheDocument();
    });
  });

  it('handles non-Error exception in order creation', async () => {
    mockCreateOrder.mockRejectedValue('String error');
    
    render(<OrderAddPage />);
    
    // Fill in required fields
    const productNameInput = screen.getByPlaceholderText('商品名を入力');
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    
    const customerInput = screen.getByPlaceholderText('顧客名を検索');
    fireEvent.click(customerInput);
    
    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
    
    const customerOption = screen.getByText('Customer A');
    fireEvent.click(customerOption);
    
    const submitButton = screen.getByText('注文を追加');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('注文の追加に失敗しました。もう一度お試しください。')).toBeInTheDocument();
    });
  });
});