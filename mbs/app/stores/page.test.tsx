import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import StoreSelectionPage from './page';
import { getAllStores } from '@/app/actions/storeActions';

// Mock the getAllStores action
vi.mock('@/app/actions/storeActions', () => ({
  getAllStores: vi.fn(),
}));

// Mock the StoreSelection component
vi.mock('@/app/components/StoreSelection', () => ({
  default: function StoreSelection({ initialStores, initialError }: { initialStores: unknown[], initialError?: string }) {
    return (
      <div data-testid="store-selection">
        <div data-testid="initial-stores">{JSON.stringify(initialStores)}</div>
        {initialError && <div data-testid="initial-error">{initialError}</div>}
      </div>
    );
  },
}));

describe('StoreSelectionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモック化してエラーログを抑制
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders StoreSelection component with data when getAllStores succeeds', async () => {
    const mockStores = [
      { id: '1', name: 'Store 1' },
      { id: '2', name: 'Store 2' },
    ];

    vi.mocked(getAllStores).mockResolvedValue(mockStores);

    render(await StoreSelectionPage());

    await waitFor(() => {
      expect(screen.getByTestId('store-selection')).toBeInTheDocument();
      expect(screen.getByTestId('initial-stores')).toHaveTextContent(JSON.stringify(mockStores));
      expect(screen.queryByTestId('initial-error')).not.toBeInTheDocument();
    });
  });

  it('renders StoreSelection component with empty stores and error when getAllStores fails', async () => {
    vi.mocked(getAllStores).mockRejectedValue(new Error('Database error'));

    render(await StoreSelectionPage());

    await waitFor(() => {
      expect(screen.getByTestId('store-selection')).toBeInTheDocument();
      expect(screen.getByTestId('initial-stores')).toHaveTextContent('[]');
      expect(screen.getByTestId('initial-error')).toHaveTextContent('店舗データの取得に失敗しました。');
    });
  });

  it('calls getAllStores action', async () => {
    vi.mocked(getAllStores).mockResolvedValue([]);

    render(await StoreSelectionPage());

    expect(getAllStores).toHaveBeenCalledTimes(1);
  });
});