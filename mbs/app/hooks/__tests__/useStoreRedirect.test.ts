import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useStoreRedirect } from '../useStoreRedirect';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: vi.fn(),
}));

// Mock StoreContext
vi.mock('@/app/contexts/StoreContext', () => ({
  useStore: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

describe('useStoreRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('店舗選択状態の確認', () => {
    it('店舗が選択されている場合、isStoreSelectedがtrueを返す', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      const mockStore = { id: 'store-1', name: '店舗1' };
      vi.mocked(useStore).mockReturnValue({ selectedStore: mockStore });
      vi.mocked(usePathname).mockReturnValue('/dashboard');

      const { result } = renderHook(() => useStoreRedirect());

      expect(result.current.selectedStore).toBe(mockStore);
      expect(result.current.isStoreSelected).toBe(true);
      expect(mockPush).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('店舗が選択されていない場合、isStoreSelectedがfalseを返す', async () => {
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('/stores');

      const { result } = renderHook(() => useStoreRedirect());

      expect(result.current.selectedStore).toBeNull();
      expect(result.current.isStoreSelected).toBe(false);
    });

    it('店舗がundefinedの場合、isStoreSelectedがfalseを返す', async () => {
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: undefined });
      vi.mocked(usePathname).mockReturnValue('/stores');

      const { result } = renderHook(() => useStoreRedirect());

      expect(result.current.selectedStore).toBeUndefined();
      expect(result.current.isStoreSelected).toBe(false);
    });
  });

  describe('リダイレクト動作', () => {
    it('店舗が選択されておらず、店舗選択ページ以外にいる場合、リダイレクトする', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('/dashboard');

      renderHook(() => useStoreRedirect());

      expect(logger.info).toHaveBeenCalledWith(
        '店舗が選択されていません。店舗選択ページにリダイレクトします。'
      );
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });

    it('店舗が選択されておらず、店舗選択ページ（/stores）にいる場合、リダイレクトしない', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('/stores');

      renderHook(() => useStoreRedirect());

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('店舗が選択されておらず、ホームページ（/）にいる場合、リダイレクトしない', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('/');

      renderHook(() => useStoreRedirect());

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('店舗が選択されている場合、どのページでもリダイレクトしない', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      const mockStore = { id: 'store-1', name: '店舗1' };
      vi.mocked(useStore).mockReturnValue({ selectedStore: mockStore });
      vi.mocked(usePathname).mockReturnValue('/orders');

      renderHook(() => useStoreRedirect());

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('店舗選択ページの判定', () => {
    it('/storesパスが店舗選択ページとして認識される', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('/stores');

      renderHook(() => useStoreRedirect());

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('/パス（ホーム）が店舗選択ページとして認識される', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('/');

      renderHook(() => useStoreRedirect());

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('/stores/configなどのサブパスは店舗選択ページとして認識されない', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('/stores/config');

      renderHook(() => useStoreRedirect());

      expect(logger.info).toHaveBeenCalledWith(
        '店舗が選択されていません。店舗選択ページにリダイレクトします。'
      );
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });
  });

  describe('useEffectの依存関係', () => {
    it('selectedStoreが変更された場合、効果が再実行される', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(usePathname).mockReturnValue('/dashboard');

      // 初回: 店舗が選択されていない
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      const { rerender } = renderHook(() => useStoreRedirect());

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledTimes(1);

      // 店舗が選択された
      const mockStore = { id: 'store-1', name: '店舗1' };
      vi.mocked(useStore).mockReturnValue({ selectedStore: mockStore });
      rerender();

      // リダイレクトは追加で呼ばれない（店舗が選択されたので）
      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it('pathnameが変更された場合、効果が再実行される', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });

      // 初回: 店舗選択ページ
      vi.mocked(usePathname).mockReturnValue('/stores');
      const { rerender } = renderHook(() => useStoreRedirect());

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();

      // 他のページに移動
      vi.mocked(usePathname).mockReturnValue('/dashboard');
      rerender();

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledTimes(1);
    });
  });

  describe('エッジケース', () => {
    it('useStoreが例外的な値を返してもエラーにならない', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: false as any });
      vi.mocked(usePathname).mockReturnValue('/dashboard');

      renderHook(() => useStoreRedirect());

      expect(logger.info).toHaveBeenCalledWith(
        '店舗が選択されていません。店舗選択ページにリダイレクトします。'
      );
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });

    it('pathnameが空文字列でもエラーにならない', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('');

      renderHook(() => useStoreRedirect());

      expect(logger.info).toHaveBeenCalledWith(
        '店舗が選択されていません。店舗選択ページにリダイレクトします。'
      );
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });

    it('複数回レンダリングされても正常に動作する', async () => {
      const { logger } = await import('@/lib/logger');
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('/dashboard');

      const { rerender } = renderHook(() => useStoreRedirect());

      // 同じ条件で再レンダリング
      rerender();
      rerender();

      // エラーが発生しないことを確認
      expect(logger.info).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();
    });
  });

  describe('戻り値の一貫性', () => {
    it('selectedStoreの値が正確に返される', async () => {
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      const mockStore = { id: 'store-1', name: '店舗1' };
      vi.mocked(useStore).mockReturnValue({ selectedStore: mockStore });
      vi.mocked(usePathname).mockReturnValue('/dashboard');

      const { result } = renderHook(() => useStoreRedirect());

      expect(result.current.selectedStore).toBe(mockStore);
      expect(result.current.isStoreSelected).toBe(true);
    });

    it('selectedStoreがnullの場合の戻り値', async () => {
      const { usePathname } = await import('next/navigation');
      const { useStore } = await import('@/app/contexts/StoreContext');
      vi.mocked(useStore).mockReturnValue({ selectedStore: null });
      vi.mocked(usePathname).mockReturnValue('/stores');

      const { result } = renderHook(() => useStoreRedirect());

      expect(result.current.selectedStore).toBeNull();
      expect(result.current.isStoreSelected).toBe(false);
    });
  });
});