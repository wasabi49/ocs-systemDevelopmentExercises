import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DeliveryEditPage from './page';
import { fetchDeliveryForEdit, fetchUndeliveredOrderDetails } from '@/app/actions/deliveryActions';

// Mock dependencies
const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'D001' }),
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

vi.mock('@/app/actions/deliveryActions');
vi.mock('@/app/hooks/useGenericSearch', () => ({
  useSimpleSearch: vi.fn((items: unknown[]) => {
    return Array.isArray(items) ? items : [];
  }),
}));
vi.mock('@/app/components/Loading', () => ({
  Loading: ({ text }: { text: string }) => (
    <div data-testid="loading">{text}</div>
  ),
}));
vi.mock('react-tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock window.alert
global.alert = vi.fn();

describe('DeliveryEditPage', () => {
  const mockDelivery = {
    id: 'D001',
    customerId: 'C001',
    deliveryDate: '2023-01-15',
    totalAmount: 2000,
    totalQuantity: 3,
    note: 'Test delivery note',
    customer: {
      id: 'C001',
      name: 'Customer A',
      contactPerson: 'Contact A',
      address: 'Address A',
    },
    deliveryDetails: [
      {
        id: 'DD001',
        productName: 'Product A',
        unitPrice: 1000,
        quantity: 2,
        allocations: [],
      },
    ],
  };

  const mockUndeliveredOrderDetails = [
    {
      orderDetailId: 'OD001',
      orderId: 'O001',
      productName: 'Product A',
      unitPrice: 1000,
      totalQuantity: 5,
      allocatedInOtherDeliveries: 2,
      currentAllocation: 1,
      remainingQuantity: 2,
      description: 'Description A',
      orderDate: '2023-01-01',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchDeliveryForEdit).mockResolvedValue({
      success: true,
      delivery: mockDelivery,
    });
    vi.mocked(fetchUndeliveredOrderDetails).mockResolvedValue({
      success: true,
      orderDetails: mockUndeliveredOrderDetails,
    });
  });

  it('納品編集ページが正しく表示される', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/納品編集 - D001/)).toBeInTheDocument();
    });
  });

  it('初期状態でローディングが表示される', () => {
    vi.mocked(fetchDeliveryForEdit).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          delivery: mockDelivery,
        }), 100)
      )
    );

    render(<DeliveryEditPage />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('取得エラーを正しく処理する', async () => {
    vi.mocked(fetchDeliveryForEdit).mockResolvedValue({
      success: false,
      error: 'Test error',
    });

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品データが見つかりません')).toBeInTheDocument();
    });
  });

  it('納品データが見つからない場合を処理する', async () => {
    vi.mocked(fetchDeliveryForEdit).mockResolvedValue({
      success: true,
      delivery: null,
    });

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品データが見つかりません')).toBeInTheDocument();
    });
  });

  it('顧客情報が正しく表示される', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
      expect(screen.getByText('担当者: Contact A | ID: C001')).toBeInTheDocument();
      expect(screen.getByText('住所: Address A')).toBeInTheDocument();
    });
  });

  it('納品日が正しく表示される', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      const dateInput = screen.getByDisplayValue('2023-01-15');
      expect(dateInput).toBeInTheDocument();
      // readonly属性は削除されているため、変更可能であることを確認
      expect(dateInput).not.toHaveAttribute('readonly');
    });
  });

  it('納品詳細が正しく表示される', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('現在の納品内容')).toBeInTheDocument();
    });
  });

  it('備考セクションが表示される', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('備考')).toBeInTheDocument();
      expect(screen.getByText('Test delivery note')).toBeInTheDocument();
    });
  });

  it('戻るボタンが表示される', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('戻る')).toBeInTheDocument();
    });
  });

  it('納品内容変更ボタンが表示される', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品内容を変更')).toBeInTheDocument();
    });
  });

  it('戻るボタンのクリックを処理する', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('戻る')).toBeInTheDocument();
    });

    const backButton = screen.getByText('戻る');
    await act(async () => {
      fireEvent.click(backButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/Home/DeliveryList');
  });

  it('詳細のない納品を処理する', async () => {
    const deliveryWithoutDetails = {
      ...mockDelivery,
      deliveryDetails: [],
    };

    vi.mocked(fetchDeliveryForEdit).mockResolvedValue({
      success: true,
      delivery: deliveryWithoutDetails,
    });

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/納品編集 - D001/)).toBeInTheDocument();
      expect(screen.getByText('現在納品商品はありません')).toBeInTheDocument();
    });
  });

  it('オプションフィールドのない顧客を処理する', async () => {
    const deliveryWithMinimalCustomer = {
      ...mockDelivery,
      customer: {
        id: 'C001',
        name: 'Customer A',
      },
    };

    vi.mocked(fetchDeliveryForEdit).mockResolvedValue({
      success: true,
      delivery: deliveryWithMinimalCustomer,
    });

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
      expect(screen.getByText('担当者: 担当者未設定 | ID: C001')).toBeInTheDocument();
    });
  });

  it('未納品注文詳細の取得を処理する', async () => {
    vi.mocked(fetchUndeliveredOrderDetails).mockResolvedValue({
      success: true,
      orderDetails: [{
        orderDetailId: 'OD001',
        orderId: 'O001',
        productName: 'Product B',
        unitPrice: 2000,
        totalQuantity: 3,
        allocatedInOtherDeliveries: 1,
        currentAllocation: 0,
        remainingQuantity: 2,
        description: 'Description B',
        orderDate: '2023-01-02',
      }],
    });

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/納品編集 - D001/)).toBeInTheDocument();
    });
  });

  it('未納品注文詳細の取得エラーを処理する', async () => {
    vi.mocked(fetchUndeliveredOrderDetails).mockResolvedValue({
      success: false,
      error: 'Failed to fetch order details',
    });

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品編集 - D001')).toBeInTheDocument();
    });
  });

  it('未納品注文詳細の例外を処理する', async () => {
    vi.mocked(fetchUndeliveredOrderDetails).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品編集 - D001')).toBeInTheDocument();
    });
  });

  it('納品詳細変更モーダルを処理する', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品内容を変更')).toBeInTheDocument();
    });

    const changeButton = screen.getByText('納品内容を変更');
    await act(async () => {
      fireEvent.click(changeButton);
    });

    expect(screen.getByText('納品内容を変更')).toBeInTheDocument();
  });

  it('納品詳細のない納品を処理する', async () => {
    const deliveryWithoutDetails = {
      ...mockDelivery,
      deliveryDetails: [],
      totalAmount: 0,
      totalQuantity: 0,
    };

    vi.mocked(fetchDeliveryForEdit).mockResolvedValue({
      success: true,
      delivery: deliveryWithoutDetails,
    });

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('現在納品商品はありません')).toBeInTheDocument();
    });
  });

  it('備考がnullの納品を処理する', async () => {
    const deliveryWithNullNote = {
      ...mockDelivery,
      note: null,
    };

    vi.mocked(fetchDeliveryForEdit).mockResolvedValue({
      success: true,
      delivery: deliveryWithNullNote,
    });

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品編集 - D001')).toBeInTheDocument();
    });
  });

  it('納品日の変更が可能', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品編集 - D001')).toBeInTheDocument();
    });

    const dateInput = screen.getByDisplayValue('2023-01-15');
    expect(dateInput).not.toHaveAttribute('readOnly');

    await act(async () => {
      fireEvent.change(dateInput, { target: { value: '2023-12-31' } });
    });

    expect(dateInput).toHaveValue('2023-12-31');
  });


  it('Issue #193: 数量入力フィールドの初期値が現在の割り当て値で、最大値が残り数量', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品内容を変更')).toBeInTheDocument();
    });

    const changeButton = screen.getByText('納品内容を変更');
    await act(async () => {
      fireEvent.click(changeButton);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('商品名で検索...')).toBeInTheDocument();
    });

    // テストデータによると：
    // remainingQuantity = 2 (テストデータで設定済み)
    // currentAllocation = 1
    // 修正後の仕様：
    // 1. 初期値は currentAllocation(1)
    // 2. 最大値は remainingQuantity(2)
    const quantityInputs = screen.getAllByRole('spinbutton');
    expect(quantityInputs[0]).toHaveValue(1); // 初期値 = currentAllocation
    expect(quantityInputs[0]).toHaveAttribute('max', '2'); // remainingQuantity
  });

  it('納品数量でソートが可能', async () => {
    // 複数のアイテムを持つテストデータを作成
    const mockMultipleOrderDetails = [
      {
        orderDetailId: 'OD001',
        orderId: 'O001',
        productName: 'Product A',
        unitPrice: 1000,
        totalQuantity: 5,
        allocatedInOtherDeliveries: 2,
        currentAllocation: 3,
        remainingQuantity: 2,
        description: 'Description A',
        orderDate: '2023-01-01',
      },
      {
        orderDetailId: 'OD002',
        orderId: 'O002',
        productName: 'Product B',
        unitPrice: 1500,
        totalQuantity: 8,
        allocatedInOtherDeliveries: 1,
        currentAllocation: 1,
        remainingQuantity: 6,
        description: 'Description B',
        orderDate: '2023-01-02',
      },
    ];

    vi.mocked(fetchUndeliveredOrderDetails).mockResolvedValue({
      success: true,
      orderDetails: mockMultipleOrderDetails,
    });

    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品内容を変更')).toBeInTheDocument();
    });

    const changeButton = screen.getByText('納品内容を変更');
    await act(async () => {
      fireEvent.click(changeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('納品数量')).toBeInTheDocument();
    });

    // 納品数量ヘッダーをクリックしてソート
    const sortButton = screen.getByText('納品数量');
    await act(async () => {
      fireEvent.click(sortButton);
    });

    // ソート機能が動作することを確認（エラーが発生しないこと）
    expect(screen.getByText('納品数量')).toBeInTheDocument();
  });

  it('ソートヘッダーが正しく表示される', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品内容を変更')).toBeInTheDocument();
    });

    const changeButton = screen.getByText('納品内容を変更');
    await act(async () => {
      fireEvent.click(changeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('納品数量')).toBeInTheDocument();
    });

    // 各ソートヘッダーが存在することを確認（テーブルヘッダー内で）
    const tableHeaders = screen.getAllByRole('columnheader');
    const headerTexts = tableHeaders.map(header => header.textContent?.trim());
    
    // テーブルヘッダーにソート可能なフィールドが含まれていることを確認
    expect(headerTexts.some(text => text?.includes('注文ID'))).toBe(true);
    expect(headerTexts.some(text => text?.includes('商品名'))).toBe(true);
    expect(headerTexts.some(text => text?.includes('納品数量'))).toBe(true);
  });

  it('納品数量のソートヘッダーをクリックできる', async () => {
    await act(async () => {
      render(<DeliveryEditPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品内容を変更')).toBeInTheDocument();
    });

    const changeButton = screen.getByText('納品内容を変更');
    await act(async () => {
      fireEvent.click(changeButton);
    });

    await waitFor(() => {
      expect(screen.getByText('納品数量')).toBeInTheDocument();
    });

    // 納品数量ヘッダーをクリック（エラーが発生しないことを確認）
    const sortHeader = screen.getByText('納品数量');
    await act(async () => {
      fireEvent.click(sortHeader);
    });

    // クリック後もヘッダーが表示されていることを確認
    expect(screen.getByText('納品数量')).toBeInTheDocument();
  });
});