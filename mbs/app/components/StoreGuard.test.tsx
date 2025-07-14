import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import StoreGuard from './StoreGuard';

// Mock dependencies
const mockUseStore = vi.fn();
const mockUseStoreRedirect = vi.fn();
const mockUsePathname = vi.fn();

vi.mock('@/app/contexts/StoreContext', () => ({
  useStore: () => mockUseStore(),
}));

vi.mock('@/app/hooks/useStoreRedirect', () => ({
  useStoreRedirect: () => mockUseStoreRedirect(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('StoreGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when on store selection page', () => {
    mockUsePathname.mockReturnValue('/stores');
    mockUseStore.mockReturnValue({ selectedStore: null });

    render(
      <StoreGuard>
        <div>Test Content</div>
      </StoreGuard>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders children when on home page', () => {
    mockUsePathname.mockReturnValue('/');
    mockUseStore.mockReturnValue({ selectedStore: null });

    render(
      <StoreGuard>
        <div>Test Content</div>
      </StoreGuard>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders children when store is selected', () => {
    mockUsePathname.mockReturnValue('/Home');
    mockUseStore.mockReturnValue({ selectedStore: { id: 'S001', name: 'Store 1' } });

    render(
      <StoreGuard>
        <div>Test Content</div>
      </StoreGuard>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('shows loading state when no store selected and not on store selection page', () => {
    mockUsePathname.mockReturnValue('/Home');
    mockUseStore.mockReturnValue({ selectedStore: null });

    render(
      <StoreGuard>
        <div>Test Content</div>
      </StoreGuard>
    );

    expect(screen.getByText('店舗選択画面にリダイレクト中...')).toBeInTheDocument();
    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
  });

  it('calls useStoreRedirect hook', () => {
    mockUsePathname.mockReturnValue('/Home');
    mockUseStore.mockReturnValue({ selectedStore: { id: 'S001', name: 'Store 1' } });

    render(
      <StoreGuard>
        <div>Test Content</div>
      </StoreGuard>
    );

    expect(mockUseStoreRedirect).toHaveBeenCalled();
  });
});