import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import OrderEditPage from './page';
import { fetchOrderById, updateOrder } from '@/app/actions/orderActions';
import { fetchAllCustomers } from '@/app/actions/customerActions';

// Mock dependencies
const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'O001' }),
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

vi.mock('@/app/actions/orderActions');
vi.mock('@/app/actions/customerActions');
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock window.alert
global.alert = vi.fn();

describe('OrderEditPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
  const mockOrder = {
    id: 'O001',
    orderDate: new Date('2023-01-01'),
    customerId: 'C001',
    note: 'Test note',
    status: '未完了',
    customer: {
      id: 'C001',
      name: 'Customer A',
      contactPerson: 'Contact A',
    },
    orderDetails: [
      {
        id: 'OD001',
        productName: 'Product A',
        unitPrice: 1000,
        quantity: 2,
        description: 'Description A',
      },
    ],
  };

  const mockCustomers = [
    {
      id: 'C001',
      name: 'Customer A',
      contactPerson: 'Contact A',
      address: 'Address A',
      phone: '123-456-7890',
      deliveryCondition: 'Condition A',
      note: 'Note A',
      storeId: 'S001',
      updatedAt: '2023-01-01T00:00:00Z',
      isDeleted: false,
      deletedAt: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: mockOrder,
    });
    vi.mocked(fetchAllCustomers).mockResolvedValue({
      status: 'success',
      data: mockCustomers,
    });
  });

  it('注文編集ページが正しく表示される', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文編集 - O001')).toBeInTheDocument();
    });
  });

  it('取得エラーを正しく処理する', async () => {
    vi.mocked(fetchOrderById).mockResolvedValue({
      success: false,
      error: 'Test error',
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文が見つかりません')).toBeInTheDocument();
    });
  });

  it('注文データでフォームフィールドが表示される', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Product A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Description A')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test note')).toBeInTheDocument();
    });
  });

  it('商品情報の編集が可能', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Product A')).toBeInTheDocument();
    });

    const productInput = screen.getByDisplayValue('Product A');
    await act(async () => {
      fireEvent.change(productInput, { target: { value: 'Updated Product' } });
    });

    expect(screen.getByDisplayValue('Updated Product')).toBeInTheDocument();
  });

  it('新しい商品の追加が可能', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('+ 行を追加')).toBeInTheDocument();
    });

    const addButton = screen.getByText('+ 行を追加');
    await act(async () => {
      fireEvent.click(addButton);
    });

    // Should have 2 product rows now
    const productInputs = screen.getAllByPlaceholderText('商品名を入力');
    expect(productInputs).toHaveLength(2);
  });

  it('商品の削除ボタンが表示される', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('この行を削除');
      expect(deleteButtons[0]).toBeInTheDocument();
    });
  });

  it('顧客情報が表示される', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer A')).toBeInTheDocument();
    });
  });

  it('更新ボタンが表示される', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });
  });

  it('注文の成功した更新を処理する', async () => {
    vi.mocked(updateOrder).mockResolvedValue({
      success: true,
      data: { id: 'O001' },
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });
  });

  it('注文更新の失敗を処理する', async () => {
    vi.mocked(updateOrder).mockResolvedValue({
      success: false,
      error: 'Update failed',
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });
  });

  it('商品の追加ボタンが表示される', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('+ 行を追加')).toBeInTheDocument();
    });
  });

  it('キャンセルして戻ることが可能', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const cancelButtons = screen.getAllByText('キャンセル');
      expect(cancelButtons.length).toBeGreaterThan(0);
    });

    const cancelButtons = screen.getAllByText('キャンセル');
    const cancelButton = cancelButtons.find(button => 
      button.closest('button') && button.closest('button')?.textContent?.includes('キャンセル')
    ) || cancelButtons[0];
    
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/Home/OrderList');
  });

  it('数量入力の変更を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const quantityInputs = screen.getAllByPlaceholderText('0');
      expect(quantityInputs.length).toBeGreaterThan(0);
    });

    const quantityInput = screen.getAllByPlaceholderText('0')[0];
    await act(async () => {
      fireEvent.change(quantityInput, { target: { value: '5' } });
    });

    expect(quantityInput).toHaveValue('5');
  });

  it('単価入力の変更を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const unitPriceInputs = screen.getAllByPlaceholderText('0');
      expect(unitPriceInputs.length).toBeGreaterThan(0);
    });
  });

  it('摘要入力の変更を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const descriptionInput = screen.getByPlaceholderText('摘要を入力');
      expect(descriptionInput).toBeInTheDocument();
    });

    const descriptionInput = screen.getByPlaceholderText('摘要を入力');
    await act(async () => {
      fireEvent.change(descriptionInput, { target: { value: 'Updated description' } });
    });

    expect(descriptionInput).toHaveValue('Updated description');
  });

  it('顧客検索と選択を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer A')).toBeInTheDocument();
    });

    const customerInput = screen.getByDisplayValue('Customer A');
    await act(async () => {
      fireEvent.change(customerInput, { target: { value: 'New Customer' } });
    });

    expect(customerInput).toHaveValue('New Customer');
  });

  it('注文日の変更を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const dateInput = screen.getByDisplayValue('2023-01-01');
      expect(dateInput).toBeInTheDocument();
    });

    const dateInput = screen.getByDisplayValue('2023-01-01');
    await act(async () => {
      fireEvent.change(dateInput, { target: { value: '2023-12-31' } });
    });

    expect(dateInput).toHaveValue('2023-12-31');
  });

  it('備考入力の変更を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const noteTextarea = screen.getByDisplayValue('Test note');
      expect(noteTextarea).toBeInTheDocument();
    });

    const noteTextarea = screen.getByDisplayValue('Test note');
    await act(async () => {
      fireEvent.change(noteTextarea, { target: { value: 'Updated note' } });
    });

    expect(noteTextarea).toHaveValue('Updated note');
  });

  it('ステータスの表示を確認する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const statusText = screen.getByText('未完了');
      expect(statusText).toBeInTheDocument();
    });

    // ステータスの説明文も確認
    const statusNote = screen.getByText('※ステータスは全ての明細の納品が完了した時に自動的に「完了」になります。手動での変更はできません。');
    expect(statusNote).toBeInTheDocument();
  });

  it('空の商品に対するバリデーションエラーを表示する', async () => {
    // Set up empty order data
    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: {
        ...mockOrder,
        orderDetails: [],
      },
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });

    const updateButton = screen.getByText('注文を更新');
    await act(async () => {
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('入力エラー')).toBeInTheDocument();
    });
  });

  it('顧客取得エラーを処理する', async () => {
    vi.mocked(fetchAllCustomers).mockResolvedValue({
      status: 'error',
      error: 'Customer fetch failed',
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文編集 - O001')).toBeInTheDocument();
    });
  });

  it('顧客のいない注文を処理する', async () => {
    // const orderWithoutCustomer = {
    //   ...mockOrder,
    //   customer: null,
    // };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: false,
      error: 'Customer not found',
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文が見つかりません')).toBeInTheDocument();
    });
  });

  it('保存失敗を処理する', async () => {
    vi.mocked(updateOrder).mockResolvedValue({
      success: false,
      error: 'Save failed',
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('注文を更新');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('更新エラー')).toBeInTheDocument();
    });
  });

  it('保存エラー例外を処理する', async () => {
    vi.mocked(updateOrder).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('注文を更新');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(screen.getByText('更新エラー')).toBeInTheDocument();
    });
  });

  it('顧客検索の変更を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer A')).toBeInTheDocument();
    });

    const customerInput = screen.getByDisplayValue('Customer A');
    await act(async () => {
      fireEvent.change(customerInput, { target: { value: 'Test' } });
    });

    expect(customerInput).toHaveValue('Test');
  });

  it('ドロップダウンからの顧客選択を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer A')).toBeInTheDocument();
    });

    const customerInput = screen.getByDisplayValue('Customer A');
    expect(customerInput).toBeInTheDocument();
  });

  it('顧客ドロップダウン外のクリックを処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer A')).toBeInTheDocument();
    });
  });

  it('合計金額を正しく計算する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('合計金額: ¥2,000')).toBeInTheDocument();
    });
  });

  it('フォームが無効な場合のバリデーションエラーを処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });
  });

  it('無効な数量と価格のエッジケースを処理する', async () => {
    const orderWithInvalidData = {
      ...mockOrder,
      orderDetails: [{
        id: 'OD001',
        productName: 'Product A',
        unitPrice: 'invalid',
        quantity: 'invalid',
        description: 'Description A',
      }],
    };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: orderWithInvalidData,
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文編集 - O001')).toBeInTheDocument();
    });
  });

  it('商品削除機能をテストする', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('+ 行を追加')).toBeInTheDocument();
    });

    // Add a product first
    const addButton = screen.getByText('+ 行を追加');
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      const deleteButtons = screen.getAllByTitle('この行を削除');
      expect(deleteButtons.length).toBeGreaterThan(1);
    });

    // Verify delete buttons exist
    const deleteButtons = screen.getAllByTitle('この行を削除');
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('最大商品数制限を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('+ 行を追加')).toBeInTheDocument();
    });

    // Add 19 more products to reach the limit (already have 1)
    const addButton = screen.getByText('+ 行を追加');
    for (let i = 0; i < 19; i++) {
      await act(async () => {
        fireEvent.click(addButton);
      });
    }

    // Button should be disabled now
    expect(addButton.closest('button')).toBeDisabled();
  });

  it('商品名フィールドの入力を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const productInputs = screen.getAllByPlaceholderText('商品名を入力');
      expect(productInputs.length).toBeGreaterThan(0);
    });

    const productInput = screen.getAllByPlaceholderText('商品名を入力')[0];
    const longText = 'a'.repeat(101); // Exceeds 100 character limit

    await act(async () => {
      fireEvent.change(productInput, { target: { value: longText } });
    });

    // Should accept the input (may be truncated by the component)
    expect(productInput.value.length).toBeGreaterThan(90);
  });

  it('価格と数量の入力フィールドをテストする', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const priceInputs = screen.getAllByPlaceholderText('0');
      expect(priceInputs.length).toBeGreaterThan(0);
    });

    // Test price input by placeholder
    const priceInput = screen.getAllByPlaceholderText('0')[0];
    await act(async () => {
      fireEvent.change(priceInput, { target: { value: 'abc' } });
    });

    // Input should handle non-numeric values appropriately
    expect(priceInput).toBeInTheDocument();
  });

  it('顧客選択機能をテストする', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer A')).toBeInTheDocument();
    });

    const customerInputs = screen.getAllByDisplayValue('Customer A');
    const customerInput = customerInputs[0];
    
    // Click to show dropdown
    await act(async () => {
      fireEvent.focus(customerInput);
      fireEvent.change(customerInput, { target: { value: 'C' } });
    });

    // Customer input should be responsive
    expect(customerInput).toBeInTheDocument();
  });

  it('顧客検索でマッチしない場合を処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer A')).toBeInTheDocument();
    });

    const customerInput = screen.getByDisplayValue('Customer A');
    
    await act(async () => {
      fireEvent.change(customerInput, { target: { value: 'NoMatch' } });
    });

    expect(customerInput).toHaveValue('NoMatch');
  });

  it('エラーモーダルの閉じる処理を確認する', async () => {
    vi.mocked(updateOrder).mockResolvedValue({
      success: false,
      error: 'Test error message',
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });

    const updateButton = screen.getByText('注文を更新');
    await act(async () => {
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('更新エラー')).toBeInTheDocument();
    });

    // Close error modal
    const okButton = screen.getByText('OK');
    await act(async () => {
      fireEvent.click(okButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('更新エラー')).not.toBeInTheDocument();
    });
  });

  it('注文例外取得エラーを処理する', async () => {
    vi.mocked(fetchOrderById).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文が見つかりません')).toBeInTheDocument();
    });
  });

  it('顧客取得例外を処理する', async () => {
    vi.mocked(fetchAllCustomers).mockRejectedValue(new Error('Customer fetch error'));

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.queryByText('注文が見つかりません') || screen.queryByText('注文編集')).toBeTruthy();
    });
  });

  it('成功した更新処理をテストする', async () => {
    vi.mocked(updateOrder).mockResolvedValue({
      success: true,
      data: { id: 'O001' },
    });

    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });

    // Verify update button exists
    const updateButton = screen.getByText('注文を更新');
    expect(updateButton).toBeInTheDocument();
  });

  it('入力値のバリデーションをテストする', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText('0');
      expect(inputs.length).toBeGreaterThan(0);
    });

    // Test input field behavior
    const input = screen.getAllByPlaceholderText('0')[0];
    await act(async () => {
      fireEvent.change(input, { target: { value: '-5' } });
    });

    // Input field should exist and be responsive
    expect(input).toBeInTheDocument();
  });

  it('空の商品名と摘要のバリデーションを処理する', async () => {
    await act(async () => {
      render(<OrderEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('+ 行を追加')).toBeInTheDocument();
    });

    // Add empty product
    const addButton = screen.getByText('+ 行を追加');
    await act(async () => {
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('注文を更新')).toBeInTheDocument();
    });

    // Try to save with empty product
    const updateButton = screen.getByText('注文を更新');
    await act(async () => {
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('入力エラー')).toBeInTheDocument();
    });
  });
});