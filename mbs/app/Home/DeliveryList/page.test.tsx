import React from 'react';
import { vi } from 'vitest';

vi.mock('./components/DeliveryListClient', () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="delivery-list-client" />),
}));



describe('DeliveryListPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });
});
