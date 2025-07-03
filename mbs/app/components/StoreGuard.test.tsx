/// <reference types="vitest" />
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import StoreGuard from './StoreGuard';
import { vi } from 'vitest';

// モックの再定義
const mockUseStore = vi.fn();
vi.mock('@/app/contexts/StoreContext', () => ({
  useStore: () => mockUseStore(),
}));

const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

const mockUseStoreRedirect = vi.fn();
vi.mock('@/app/hooks/useStoreRedirect', () => ({
  useStoreRedirect: () => mockUseStoreRedirect(),
}));

describe('StoreGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('選択中の店舗がある場合、children を表示する', () => {
    mockUseStore.mockReturnValue({ selectedStore: { id: 1, name: '今里店' } });
    mockUsePathname.mockReturnValue('/home');
    mockUseStoreRedirect.mockReturnValue(undefined);

    render(
      <StoreGuard>
        <div data-testid="protected-content">保護された内容</div>
      </StoreGuard>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(mockUseStoreRedirect).toHaveBeenCalled();
  });

  it('選択中の店舗がない場合、リダイレクトされる（children は表示しない）', () => {
    mockUseStore.mockReturnValue({ selectedStore: null });
    mockUsePathname.mockReturnValue('/home');

    render(
      <StoreGuard>
        <div data-testid="protected-content">保護された内容</div>
      </StoreGuard>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(mockUseStoreRedirect).toHaveBeenCalled();
  });

  it('pathname が特定パスの場合の挙動（必要なら）', () => {
    mockUseStore.mockReturnValue({ selectedStore: null });
    mockUsePathname.mockReturnValue('/stores'); // 例

    render(
      <StoreGuard>
        <div data-testid="protected-content">保護された内容</div>
      </StoreGuard>
    );

    // 条件に応じたアサーションを記述
  });
});
