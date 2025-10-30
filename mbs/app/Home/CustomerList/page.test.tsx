import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import CustomerListPage from './page';
import { fetchCustomers } from '@/app/actions/customerActions';

// Mock redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock fetchCustomers
vi.mock('@/app/actions/customerActions', () => ({
  fetchCustomers: vi.fn(),
}));

// Mock CustomerListClient
vi.mock('./components/CustomerListClient', () => ({
  default: function CustomerListClient({ initialCustomers }: { initialCustomers: unknown[] }) {
    return (
      <div data-testid="customer-list-client">
        <div data-testid="initial-customers">{JSON.stringify(initialCustomers)}</div>
      </div>
    );
  },
}));

describe('CustomerListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders CustomerListClient with data when fetchCustomers succeeds', async () => {
    const mockCustomers = [
      { id: '1', customerName: 'Customer 1', managerName: 'Manager 1', storeName: 'Store 1' },
      { id: '2', customerName: 'Customer 2', managerName: 'Manager 2', storeName: 'Store 2' },
    ];

    vi.mocked(fetchCustomers).mockResolvedValue({
      status: 'success',
      data: mockCustomers,
    });

    render(await CustomerListPage());

    expect(screen.getByTestId('customer-list-client')).toBeInTheDocument();
    expect(screen.getByTestId('initial-customers')).toHaveTextContent(JSON.stringify(mockCustomers));
  });

  it('redirects to /stores when store is required', async () => {
    const { redirect } = await import('next/navigation');
    
    vi.mocked(fetchCustomers).mockResolvedValue({
      status: 'store_required',
    });

    await CustomerListPage();

    expect(redirect).toHaveBeenCalledWith('/stores');
  });

  it('redirects to /stores when store is invalid', async () => {
    const { redirect } = await import('next/navigation');
    
    vi.mocked(fetchCustomers).mockResolvedValue({
      status: 'store_invalid',
    });

    await CustomerListPage();

    expect(redirect).toHaveBeenCalledWith('/stores');
  });

  it('renders CustomerListClient with empty array when fetchCustomers fails', async () => {
    vi.mocked(fetchCustomers).mockResolvedValue({
      status: 'error',
      error: 'Database connection failed',
    });

    render(await CustomerListPage());

    expect(screen.getByTestId('customer-list-client')).toBeInTheDocument();
    expect(screen.getByTestId('initial-customers')).toHaveTextContent('[]');
  });

  it('calls fetchCustomers', async () => {
    vi.mocked(fetchCustomers).mockResolvedValue({
      status: 'success',
      data: [],
    });

    render(await CustomerListPage());

    expect(fetchCustomers).toHaveBeenCalledTimes(1);
  });
});