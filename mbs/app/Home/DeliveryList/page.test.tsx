import { render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import DeliveryListClient from './components/DeliveryListClient';
import '@testing-library/jest-dom/vitest';
import * as deliveryActions from '@/app/actions/deliveryActions';
import DeliveryListPage from './page';

vi.mock('./components/DeliveryListClient', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="delivery-list-client" />),
}));

describe('DeliveryListClient', () => {
  it('DeliveryListClientが表示される', () => {
    render(<DeliveryListClient initialDeliveries={[]} />);
    expect(screen.getByTestId('delivery-list-client')).toBeInTheDocument();
  });
});

describe('DeliveryListPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetchDeliveriesがエラー時にconsole.errorが呼ばれる', async () => {
    const error = new Error('fetch error');
    vi.spyOn(deliveryActions, 'fetchDeliveries').mockResolvedValue({ status: 'error', error: error.message });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // サーバーコンポーネントのためawaitで呼び出し
    await DeliveryListPage();
    expect(errorSpy).toHaveBeenCalledWith('納品データの取得に失敗しました:', error.message);
    errorSpy.mockRestore();
  });
});
