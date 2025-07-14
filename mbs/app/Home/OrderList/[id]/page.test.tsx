import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import OrderDetailPage from './page';
import { fetchOrderById, deleteOrder } from '@/app/actions/orderActions';

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
vi.mock('@/app/components/OrderPDF', () => ({
  generateOrderPDF: vi.fn(),
}));
vi.mock('@/app/components/Loading', () => ({
  Loading: ({ text }: { text: string }) => (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <span className="text-lg text-gray-600">{text}</span>
      </div>
    </div>
  ),
}));

// Mock window.alert
global.alert = vi.fn();

describe('OrderDetailPage', () => {
  const mockOrder = {
    id: 'O001',
    orderDate: new Date('2023-01-01'),
    customerId: 'C001',
    note: 'Test note',
    status: 'active',
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: mockOrder,
    });
  });

  it('注文詳細ページが正しく表示される', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('O001')).toBeInTheDocument();
    });
  });

  it('初期状態でローディングが表示される', () => {
    // Mock a slower response to catch loading state
    vi.mocked(fetchOrderById).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          success: true,
          order: mockOrder,
        }), 100)
      )
    );

    render(<OrderDetailPage />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('取得エラーを正しく処理する', async () => {
    vi.mocked(fetchOrderById).mockResolvedValue({
      success: false,
      error: 'Test error',
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文が見つかりません')).toBeInTheDocument();
    });
  });

  it('注文詳細と顧客情報が表示される', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('O001')).toBeInTheDocument();
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Customer A')).toBeInTheDocument();
      expect(screen.getByText('Test note')).toBeInTheDocument();
    });
  });

  it('書式化された日付が表示される', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('O001')).toBeInTheDocument();
    });
  });

  it('編集ボタンを表示し編集ナビゲーションを処理する', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('編集')).toBeInTheDocument();
    });

    const editButton = screen.getByText('編集');
    await act(async () => {
      fireEvent.click(editButton);
    });

    expect(mockPush).toHaveBeenCalledWith('/Home/OrderList/O001/Edit');
  });

  it('PDFエクスポートボタンが表示される', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('PDF出力')).toBeInTheDocument();
    });
  });

  it('正しいデータで注文詳細テーブルが表示される', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文明細一覧')).toBeInTheDocument();
      expect(screen.getByText('注文明細ID')).toBeInTheDocument();
      expect(screen.getByText('商品名')).toBeInTheDocument();
      expect(screen.getByText('単価')).toBeInTheDocument();
      expect(screen.getByText('数量')).toBeInTheDocument();
      expect(screen.getByText('OD001')).toBeInTheDocument();
      expect(screen.getByText('Description A')).toBeInTheDocument();
    });
  });

  it('注文情報セクションが表示される', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文情報')).toBeInTheDocument();
    });
  });

  it('顧客情報セクションが表示される', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('顧客情報')).toBeInTheDocument();
    });
  });

  it('注文データが見つからない場合を処理する', async () => {
    vi.mocked(fetchOrderById).mockResolvedValue({
      success: false,
      error: 'Not found',
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文が見つかりません')).toBeInTheDocument();
    });
  });

  it('空の注文詳細を処理する', async () => {
    const orderWithoutDetails = {
      ...mockOrder,
      orderDetails: [],
    };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: orderWithoutDetails,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文明細一覧')).toBeInTheDocument();
    });
  });

  it('注文ステータスが表示される', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('O001')).toBeInTheDocument();
    });
  });

  it('PDFエクスポート機能を処理する', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
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
      render(<OrderDetailPage />);
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
      expect(screen.getByText('注文削除')).toBeInTheDocument();
    });
  });

  it('注文の成功した削除を処理する', async () => {
    vi.mocked(deleteOrder).mockResolvedValue({
      success: true,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });
  });

  it('PDF生成中のエラーを処理する', async () => {
    const mockGenerateOrderPDF = vi.fn().mockRejectedValue(new Error('PDF error'));
    vi.doMock('@/app/components/OrderPDF', () => ({
      generateOrderPDF: mockGenerateOrderPDF,
    }));

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('PDF出力')).toBeInTheDocument();
    });
  });

  it('書式化された通貨値が表示される', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('O001')).toBeInTheDocument();
    });
  });

  it('注文日のフォーマットを処理する', async () => {
    const orderWithStringDate = {
      ...mockOrder,
      orderDate: '2023-01-01',
    };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: orderWithStringDate,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('O001')).toBeInTheDocument();
    });
  });


  it('数量がゼロの注文を表示する', async () => {
    const orderWithZeroQuantity = {
      ...mockOrder,
      orderDetails: [{
        id: 'OD001',
        productName: 'Product A',
        unitPrice: 1000,
        quantity: 0,
        description: 'Description A',
      }],
    };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: orderWithZeroQuantity,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });
  });

  it('複数の注文詳細を持つ注文を表示する', async () => {
    const orderWithMultipleDetails = {
      ...mockOrder,
      orderDetails: [
        {
          id: 'OD001',
          productName: 'Product A',
          unitPrice: 1000,
          quantity: 2,
          description: 'Description A',
        },
        {
          id: 'OD002',
          productName: 'Product B',
          unitPrice: 500,
          quantity: 3,
          description: 'Description B',
        },
      ],
    };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: orderWithMultipleDetails,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });
  });

  it('取得中のネットワークエラーを処理する', async () => {
    vi.mocked(fetchOrderById).mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文が見つかりません')).toBeInTheDocument();
    });
  });


  it('正しい注文情報で削除モーダルを表示する', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('削除');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText('注文削除')).toBeInTheDocument();
    });
  });

  it('削除モーダルのキャンセルを処理する', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('削除');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(screen.getByText('キャンセル')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('キャンセル');
    await act(async () => {
      fireEvent.click(cancelButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('注文削除')).not.toBeInTheDocument();
    });
  });

  it('注文削除の失敗を処理する', async () => {
    vi.mocked(deleteOrder).mockResolvedValue({
      success: false,
      error: 'Deletion failed',
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('削除');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      const confirmButtons = screen.getAllByText('削除');
      expect(confirmButtons.length).toBeGreaterThan(1);
    });

    const confirmButtons = screen.getAllByText('削除');
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('削除エラー')).toBeInTheDocument();
    });
  });

  it('注文削除中のエラーを処理する', async () => {
    vi.mocked(deleteOrder).mockRejectedValue(new Error('Delete error'));

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('削除')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('削除');
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      const confirmButtons = screen.getAllByText('削除');
      expect(confirmButtons.length).toBeGreaterThan(1);
    });

    const confirmButtons = screen.getAllByText('削除');
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    await act(async () => {
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(screen.getByText('削除エラー')).toBeInTheDocument();
    });
  });

  it('注文データなしでPDFエクスポートを処理する', async () => {
    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: null,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文が見つかりません')).toBeInTheDocument();
    });
  });

  it('注文詳細行の展開を切り替える', async () => {
    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('▼')).toBeInTheDocument();
    });

    const expandButton = screen.getByText('▼');
    await act(async () => {
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('▲')).toBeInTheDocument();
    });

    const collapseButton = screen.getByText('▲');
    await act(async () => {
      fireEvent.click(collapseButton);
    });

    await waitFor(() => {
      expect(screen.getByText('▼')).toBeInTheDocument();
    });
  });

  it('完了注文の納品ステータスを表示する', async () => {
    const completedOrder = {
      ...mockOrder,
      status: '完了',
    };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: completedOrder,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getAllByText('完了')).toHaveLength(3);
    });

    const expandButton = screen.getByText('▼');
    await act(async () => {
      fireEvent.click(expandButton);
    });

    await waitFor(() => {
      expect(screen.getByText('▲')).toBeInTheDocument();
    });
  });

  it('単価がゼロの注文詳細を処理する', async () => {
    const orderWithZeroPrice = {
      ...mockOrder,
      orderDetails: [{
        id: 'OD001',
        productName: 'Product A',
        unitPrice: 0,
        quantity: 2,
        description: 'Description A',
      }],
    };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: orderWithZeroPrice,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
    });
  });

  it('OKボタンがクリックされた時にエラーモーダルを閉じる', async () => {
    vi.mocked(fetchOrderById).mockResolvedValue({
      success: false,
      error: 'Test error',
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('注文が見つかりません')).toBeInTheDocument();
    });
  });

  it('ゼロ金額の通貨を正しくフォーマットする', async () => {
    const orderWithZeroTotal = {
      ...mockOrder,
      orderDetails: [{
        id: 'OD001',
        productName: 'Product A',
        unitPrice: 0,
        quantity: 0,
        description: 'Description A',
      }],
    };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: orderWithZeroTotal,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('￥0')).toBeInTheDocument();
    });
  });

  it('備考のない注文を処理する', async () => {
    const orderWithoutNote = {
      ...mockOrder,
      note: null,
    };

    vi.mocked(fetchOrderById).mockResolvedValue({
      success: true,
      order: orderWithoutNote,
    });

    await act(async () => {
      render(<OrderDetailPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('（なし）')).toBeInTheDocument();
    });
  });
});