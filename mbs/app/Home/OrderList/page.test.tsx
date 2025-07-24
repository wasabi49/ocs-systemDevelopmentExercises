import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import OrderListPage from './page';
import { fetchOrdersWithDeliveryStatus } from '@/app/actions/orderActions';
import { checkStoreRequirement } from '@/app/utils/storeRedirect';

// Mock dependencies
vi.mock('@/app/actions/orderActions', () => ({
  fetchOrdersWithDeliveryStatus: vi.fn(),
}));

vi.mock('@/app/utils/storeRedirect', () => ({
  checkStoreRequirement: vi.fn(),
}));

vi.mock('./components/OrderListClient', () => ({
  default: function OrderListClient({ initialOrders }: { initialOrders: unknown[] }) {
    return (
      <div data-testid="order-list-client">
        <div data-testid="initial-orders">{JSON.stringify(initialOrders)}</div>
      </div>
    );
  },
}));

describe('OrderListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // デフォルトのモック設定
    vi.mocked(fetchOrdersWithDeliveryStatus).mockResolvedValue({
      status: 'success',
      data: [],
    });
    vi.mocked(checkStoreRequirement).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders OrderListClient with transformed data when fetchOrdersWithDeliveryStatus succeeds', async () => {
    const mockOrderData = [
      {
        id: '1',
        customerId: 'customer1',
        orderDate: '2023-01-01T00:00:00Z',
        note: 'Note 1',
        status: 'pending',
        updatedAt: '2023-01-01T00:00:00Z',
        isDeleted: false,
        deletedAt: null,
        customer: {
          name: 'Customer 1',
          contactPerson: 'Contact 1',
        },
      },
    ];

    const expectedTransformedData = [
      {
        id: '1',
        customerId: 'customer1',
        orderDate: new Date('2023-01-01T00:00:00Z'),
        note: 'Note 1',
        status: 'pending',
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        isDeleted: false,
        deletedAt: null,
        customerName: 'Customer 1',
        customerContactPerson: 'Contact 1',
      },
    ];

    vi.mocked(fetchOrdersWithDeliveryStatus).mockResolvedValue({
      status: 'success',
      data: mockOrderData,
    });

    render(await OrderListPage());

    expect(screen.getByTestId('order-list-client')).toBeInTheDocument();
    expect(screen.getByTestId('initial-orders')).toHaveTextContent(JSON.stringify(expectedTransformedData));
  });

  it('handles customer with null contactPerson', async () => {
    const mockOrderData = [
      {
        id: '1',
        customerId: 'customer1',
        orderDate: '2023-01-01T00:00:00Z',
        note: 'Note 1',
        status: 'pending',
        updatedAt: '2023-01-01T00:00:00Z',
        isDeleted: false,
        deletedAt: null,
        customer: {
          name: 'Customer 1',
          contactPerson: null,
        },
      },
    ];

    vi.mocked(fetchOrdersWithDeliveryStatus).mockResolvedValue({
      status: 'success',
      data: mockOrderData,
    });

    render(await OrderListPage());

    const renderedData = JSON.parse(screen.getByTestId('initial-orders').textContent || '[]');
    expect(renderedData[0].customerContactPerson).toBe('');
  });

  it('handles deletedAt date conversion', async () => {
    const mockOrderData = [
      {
        id: '1',
        customerId: 'customer1',
        orderDate: '2023-01-01T00:00:00Z',
        note: 'Note 1',
        status: 'pending',
        updatedAt: '2023-01-01T00:00:00Z',
        isDeleted: true,
        deletedAt: '2023-01-02T00:00:00Z',
        customer: {
          name: 'Customer 1',
          contactPerson: 'Contact 1',
        },
      },
    ];

    vi.mocked(fetchOrdersWithDeliveryStatus).mockResolvedValue({
      status: 'success',
      data: mockOrderData,
    });

    render(await OrderListPage());

    const renderedData = JSON.parse(screen.getByTestId('initial-orders').textContent || '[]');
    expect(renderedData[0].deletedAt).toBe(new Date('2023-01-02T00:00:00Z').toISOString());
  });

  it('renders OrderListClient with empty array when fetchOrdersWithDeliveryStatus fails', async () => {
    vi.mocked(fetchOrdersWithDeliveryStatus).mockResolvedValue({
      status: 'error',
      error: 'Database connection failed',
    });

    render(await OrderListPage());

    expect(screen.getByTestId('order-list-client')).toBeInTheDocument();
    expect(screen.getByTestId('initial-orders')).toHaveTextContent('[]');
  });

  it('calls checkStoreRequirement with result', async () => {
    const mockResult = {
      status: 'success',
      data: [],
    };

    vi.mocked(fetchOrdersWithDeliveryStatus).mockResolvedValue(mockResult);

    render(await OrderListPage());

    expect(checkStoreRequirement).toHaveBeenCalledWith(mockResult);
  });

  it('calls fetchOrdersWithDeliveryStatus', async () => {
    vi.mocked(fetchOrdersWithDeliveryStatus).mockResolvedValue({
      status: 'success',
      data: [],
    });

    render(await OrderListPage());

    expect(fetchOrdersWithDeliveryStatus).toHaveBeenCalledTimes(1);
  });

  it('logs error when fetchOrdersWithDeliveryStatus fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error');
    
    vi.mocked(fetchOrdersWithDeliveryStatus).mockResolvedValue({
      status: 'error',
      error: 'Database connection failed',
    });

    render(await OrderListPage());

    expect(consoleSpy).toHaveBeenCalledWith('初期データの取得に失敗:', 'Database connection failed');
  });
});