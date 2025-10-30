import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useServerActionStoreCheck } from '../useServerActionStoreCheck';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
  },
}));

describe('useServerActionStoreCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkStoreRequirement', () => {
    it('フックが正しくcheckStoreRequirement関数を返す', () => {
      const { result } = renderHook(() => useServerActionStoreCheck());

      expect(result.current).toHaveProperty('checkStoreRequirement');
      expect(typeof result.current.checkStoreRequirement).toBe('function');
    });

    it('store_requiredステータスの場合、店舗選択ページにリダイレクトする', async () => {
      const { logger } = await import('@/lib/logger');
      const { result } = renderHook(() => useServerActionStoreCheck());

      const serverResult = {
        status: 'store_required',
        error: 'Store selection required',
      };

      act(() => {
        const redirected = result.current.checkStoreRequirement(serverResult);
        expect(redirected).toBe(true);
      });

      expect(logger.info).toHaveBeenCalledWith(
        '店舗選択が必要です。店舗選択ページにリダイレクトします。'
      );
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });

    it('store_invalidステータスの場合、店舗選択ページにリダイレクトする', async () => {
      const { logger } = await import('@/lib/logger');
      const { result } = renderHook(() => useServerActionStoreCheck());

      const serverResult = {
        status: 'store_invalid',
        error: 'Invalid store',
      };

      act(() => {
        const redirected = result.current.checkStoreRequirement(serverResult);
        expect(redirected).toBe(true);
      });

      expect(logger.info).toHaveBeenCalledWith(
        '店舗選択が必要です。店舗選択ページにリダイレクトします。'
      );
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });

    it('needsStoreSelectionがtrueの場合、店舗選択ページにリダイレクトする', async () => {
      const { logger } = await import('@/lib/logger');
      const { result } = renderHook(() => useServerActionStoreCheck());

      const serverResult = {
        status: 'success',
        needsStoreSelection: true,
      };

      act(() => {
        const redirected = result.current.checkStoreRequirement(serverResult);
        expect(redirected).toBe(true);
      });

      expect(logger.info).toHaveBeenCalledWith(
        '店舗選択が必要です。店舗選択ページにリダイレクトします。'
      );
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });

    it('店舗選択が不要な場合、リダイレクトしない', async () => {
      const { logger } = await import('@/lib/logger');
      const { result } = renderHook(() => useServerActionStoreCheck());

      const serverResult = {
        status: 'success',
        data: { message: 'Success' },
      };

      act(() => {
        const redirected = result.current.checkStoreRequirement(serverResult);
        expect(redirected).toBe(false);
      });

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('errorステータスでもstore_requiredやstore_invalid以外はリダイレクトしない', async () => {
      const { logger } = await import('@/lib/logger');
      const { result } = renderHook(() => useServerActionStoreCheck());

      const serverResult = {
        status: 'error',
        error: 'General error',
      };

      act(() => {
        const redirected = result.current.checkStoreRequirement(serverResult);
        expect(redirected).toBe(false);
      });

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('needsStoreSelectionがfalseの場合、リダイレクトしない', async () => {
      const { logger } = await import('@/lib/logger');
      const { result } = renderHook(() => useServerActionStoreCheck());

      const serverResult = {
        status: 'success',
        needsStoreSelection: false,
      };

      act(() => {
        const redirected = result.current.checkStoreRequirement(serverResult);
        expect(redirected).toBe(false);
      });

      expect(logger.info).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('空のオブジェクトでもエラーにならない', () => {
      const { result } = renderHook(() => useServerActionStoreCheck());

      act(() => {
        const redirected = result.current.checkStoreRequirement({});
        expect(redirected).toBe(false);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('undefinedやnullでもエラーにならない', () => {
      const { result } = renderHook(() => useServerActionStoreCheck());

      act(() => {
        const redirected1 = result.current.checkStoreRequirement(undefined as unknown as Record<string, unknown>);
        const redirected2 = result.current.checkStoreRequirement(null as unknown as Record<string, unknown>);
        expect(redirected1).toBe(false);
        expect(redirected2).toBe(false);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('複合的なシナリオ', () => {
    it('statusとneedsStoreSelectionの両方が設定されている場合、statusが優先される', async () => {
      const { logger } = await import('@/lib/logger');
      const { result } = renderHook(() => useServerActionStoreCheck());

      const serverResult = {
        status: 'store_required',
        needsStoreSelection: true,
      };

      act(() => {
        const redirected = result.current.checkStoreRequirement(serverResult);
        expect(redirected).toBe(true);
      });

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/stores');
    });

    it('複数回呼び出しても正しく動作する', async () => {
      const { logger } = await import('@/lib/logger');
      const { result } = renderHook(() => useServerActionStoreCheck());

      // 1回目: リダイレクトあり
      act(() => {
        const redirected1 = result.current.checkStoreRequirement({
          status: 'store_required',
        });
        expect(redirected1).toBe(true);
      });

      // 2回目: リダイレクトなし
      act(() => {
        const redirected2 = result.current.checkStoreRequirement({
          status: 'success',
        });
        expect(redirected2).toBe(false);
      });

      // 3回目: リダイレクトあり
      act(() => {
        const redirected3 = result.current.checkStoreRequirement({
          needsStoreSelection: true,
        });
        expect(redirected3).toBe(true);
      });

      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(mockPush).toHaveBeenCalledTimes(2);
    });

    it('データを持つ複雑なレスポンスでも正しく処理する', async () => {
      const { result } = renderHook(() => useServerActionStoreCheck());

      const complexResult = {
        status: 'success',
        data: {
          items: [1, 2, 3],
          pagination: { page: 1, total: 100 },
          metadata: { timestamp: '2025-01-01' },
        },
        needsStoreSelection: false,
      };

      act(() => {
        const redirected = result.current.checkStoreRequirement(complexResult);
        expect(redirected).toBe(false);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('型安全性の確認', () => {
    it('任意の型のServerActionResultでも動作する', () => {
      const { result } = renderHook(() => useServerActionStoreCheck());

      interface CustomResult {
        status?: string;
        customField: number;
        needsStoreSelection?: boolean;
      }

      const customResult: CustomResult = {
        status: 'custom_status',
        customField: 42,
        needsStoreSelection: false,
      };

      act(() => {
        const redirected = result.current.checkStoreRequirement(customResult);
        expect(redirected).toBe(false);
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});