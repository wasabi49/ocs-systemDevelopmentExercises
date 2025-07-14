import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DeliveryDetailPage from './page';
import { fetchDeliveryById, deleteDelivery } from '@/app/actions/deliveryActions';

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
vi.mock('@/app/components/DeliveryPDF');
vi.mock('@/app/components/Loading', () => ({
  Loading: ({ text }: { text: string }) => (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="text-lg text-gray-600">{text}</span>
      </div>
    </div>
  ),
}));

// Mock window.alert
global.alert = vi.fn();

describe('DeliveryDetailPage', () => {
  const mockDelivery = {
    id: 'D001',
    customerId: 'C001',
    deliveryDate: '2023-01-15',
    totalAmount: 2000,
    totalQuantity: 3,
    note: 'Test delivery note',
    updatedAt: '2023-01-15T00:00:00Z',
    isDeleted: false,
    deletedAt: null,
    customer: {
      id: 'C001',
      storeId: 'S001',
      name: 'Customer A',
      contactPerson: 'Contact A',
      address: 'Address A',
      phone: '123-456-7890',
      deliveryCondition: 'Condition A',
      note: 'Customer note',
      updatedAt: '2023-01-01T00:00:00Z',
      isDeleted: false,
      deletedAt: null,
    },
    deliveryDetails: [
      {
        id: 'DD001',
        deliveryId: 'D001',
        productName: 'Product A',
        unitPrice: 1000,
        quantity: 2,
        description: 'Description A',
        updatedAt: '2023-01-15T00:00:00Z',
        isDeleted: false,
        deletedAt: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchDeliveryById).mockResolvedValue({
      success: true,
      delivery: mockDelivery,
    });
  });

  it('納品詳細ページが正しく表示される', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('D001')).toBeInTheDocument();
    });
  });

  it('初期状態でローディングが表示される', () => {
    // Mock a slower response to catch loading state
    vi.mocked(fetchDeliveryById).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          delivery: mockDelivery,
        }), 100)
      )
    );

    render(<DeliveryDetailPage />);

    expect(screen.getByText('データを読み込んでいます...')).toBeInTheDocument();
  });

  it('取得エラーを正しく処理する', async () => {
    vi.mocked(fetchDeliveryById).mockResolvedValue({
      success: false,
      error: 'Test error',
    });

    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  it('納品詳細と顧客情報が表示される', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('D001')).toBeInTheDocument();
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Customer A')).toBeInTheDocument();
      expect(screen.getAllByText('¥2,000')).toHaveLength(2); // appears in total and detail
      expect(screen.getByText('Test delivery note')).toBeInTheDocument();
    });
  });

  it('書式化された日付と通貨が表示される', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('2023/01/15')).toBeInTheDocument();
      expect(screen.getByText('¥1,000')).toBeInTheDocument();
    });
  });

  it('編集ボタンを表示し編集ナビゲーションを処理する', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('編集')).toBeInTheDocument();
    });

    const editButton = screen.getByText('編集');
    await act(async () => {
      fireEvent.click(editButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/Home/DeliveryList/D001/Edit');
  });

  it('PDFエクスポートボタンが表示される', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('PDF出力')).toBeInTheDocument();
    });
  });

  it('正しいデータで納品詳細テーブルが表示される', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品明細一覧')).toBeInTheDocument();
      expect(screen.getByText('納品明細ID')).toBeInTheDocument();
      expect(screen.getByText('商品名')).toBeInTheDocument();
      expect(screen.getByText('単価')).toBeInTheDocument();
      expect(screen.getByText('数量')).toBeInTheDocument();
      expect(screen.getByText('DD001')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('納品情報セクションが表示される', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品情報')).toBeInTheDocument();
    });
  });

  it('顧客情報セクションが表示される', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('顧客情報')).toBeInTheDocument();
    });
  });

  it('納品データが見つからない場合を処理する', async () => {
    vi.mocked(fetchDeliveryById).mockResolvedValue({
      success: false,
      error: 'Not found',
    });

    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });

  it('空の納品詳細を処理する', async () => {
    const deliveryWithoutDetails = {
      ...mockDelivery,
      deliveryDetails: [],
    };

    vi.mocked(fetchDeliveryById).mockResolvedValue({
      success: true,
      delivery: deliveryWithoutDetails,
    });

    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品明細一覧')).toBeInTheDocument();
    });
  });

  it('PDFエクスポート機能を処理する', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('PDF出力')).toBeInTheDocument();
    });

    const pdfButton = screen.getByText('PDF出力');
    await act(async () => {
      fireEvent.click(pdfButton);
    });
  });

  it('削除機能を処理する', async () => {
    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('削除');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    // Should show delete confirmation modal
    await waitFor(() => {
      expect(screen.getByText('納品削除')).toBeInTheDocument();
    });
  });

  it('納品の成功した削除を処理する', async () => {
    vi.mocked(deleteDelivery).mockResolvedValue({
      success: true,
    });

    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });
  });

  it('複数の納品詳細を正しく表示する', async () => {
    const deliveryWithMultipleDetails = {
      ...mockDelivery,
      deliveryDetails: [
        {
          id: 'DD001',
          deliveryId: 'D001',
          productName: 'Product A',
          unitPrice: 1000,
          quantity: 2,
          description: 'Description A',
          updatedAt: '2023-01-15T00:00:00Z',
          isDeleted: false,
          deletedAt: null,
        },
        {
          id: 'DD002',
          deliveryId: 'D001',
          productName: 'Product B',
          unitPrice: 500,
          quantity: 1,
          description: 'Description B',
          updatedAt: '2023-01-15T00:00:00Z',
          isDeleted: false,
          deletedAt: null,
        },
      ],
    };

    vi.mocked(fetchDeliveryById).mockResolvedValue({
      success: true,
      delivery: deliveryWithMultipleDetails,
    });

    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });
  });

  it('取得中のネットワークエラーを処理する', async () => {
    vi.mocked(fetchDeliveryById).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<DeliveryDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('納品データの取得中にエラーが発生しました')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});