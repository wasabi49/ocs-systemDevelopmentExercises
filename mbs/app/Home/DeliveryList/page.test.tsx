import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DeliveryListPage from './page';
import { fetchDeliveries } from '@/app/actions/deliveryActions';
import { checkStoreRequirement } from '@/app/utils/storeRedirect';

// Mock dependencies
vi.mock('@/app/actions/deliveryActions', () => ({
  fetchDeliveries: vi.fn(),
}));

vi.mock('@/app/utils/storeRedirect', () => ({
  checkStoreRequirement: vi.fn(),
}));

vi.mock('./components/DeliveryListClient', () => ({
  default: function DeliveryListClient({ initialDeliveries }: { initialDeliveries: unknown[] }) {
    return (
      <div data-testid="delivery-list-client">
        <div data-testid="initial-deliveries">{JSON.stringify(initialDeliveries)}</div>
      </div>
    );
  },
}));

describe('DeliveryListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders DeliveryListClient with data when fetchDeliveries succeeds', async () => {
    const mockDeliveries = [
      { id: '1', orderNumber: 'ORDER-001', customerName: 'Customer 1' },
      { id: '2', orderNumber: 'ORDER-002', customerName: 'Customer 2' },
    ];

    vi.mocked(fetchDeliveries).mockResolvedValue({
      status: 'success',
      data: mockDeliveries,
    });

    render(await DeliveryListPage());

    expect(screen.getByTestId('delivery-list-client')).toBeInTheDocument();
    expect(screen.getByTestId('initial-deliveries')).toHaveTextContent(JSON.stringify(mockDeliveries));
  });

  it('renders DeliveryListClient with empty array when fetchDeliveries fails', async () => {
    vi.mocked(fetchDeliveries).mockResolvedValue({
      status: 'error',
      error: 'Database connection failed',
    });

    render(await DeliveryListPage());

    expect(screen.getByTestId('delivery-list-client')).toBeInTheDocument();
    expect(screen.getByTestId('initial-deliveries')).toHaveTextContent('[]');
  });

  it('calls checkStoreRequirement with result', async () => {
    const mockResult = {
      status: 'success',
      data: [],
    };

    vi.mocked(fetchDeliveries).mockResolvedValue(mockResult);

    render(await DeliveryListPage());

    expect(checkStoreRequirement).toHaveBeenCalledWith(mockResult);
  });

  it('calls fetchDeliveries', async () => {
    vi.mocked(fetchDeliveries).mockResolvedValue({
      status: 'success',
      data: [],
    });

    render(await DeliveryListPage());

    expect(fetchDeliveries).toHaveBeenCalledTimes(1);
  });

  it('logs error when fetchDeliveries fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error');
    
    vi.mocked(fetchDeliveries).mockResolvedValue({
      status: 'error',
      error: 'Database connection failed',
    });

    render(await DeliveryListPage());

    expect(consoleSpy).toHaveBeenCalledWith('納品データの取得に失敗しました:', 'Database connection failed');
  });
});