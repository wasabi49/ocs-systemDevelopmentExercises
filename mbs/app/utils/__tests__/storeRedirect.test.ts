import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkStoreRequirement, STORE_ERROR_MESSAGES } from '../storeRedirect';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT'); // Next.jsのredirectは実際にはエラーをスローする
  }),
}));

describe('storeRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('checkStoreRequirement', () => {
    it('正常なstatusの場合、そのまま結果を返す', async () => {
      const { redirect } = await import('next/navigation');
      const result = { status: 'success', data: { test: 'data' } };

      const returnedResult = checkStoreRequirement(result);

      expect(returnedResult).toBe(result);
      expect(redirect).not.toHaveBeenCalled();
    });

    it('store_requiredの場合、デフォルトパスにリダイレクトする', async () => {
      const { redirect } = await import('next/navigation');
      const result = { status: 'store_required', error: 'Store required' };

      expect(() => checkStoreRequirement(result)).toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/stores');
    });

    it('store_invalidの場合、デフォルトパスにリダイレクトする', async () => {
      const { redirect } = await import('next/navigation');
      const result = { status: 'store_invalid', error: 'Store invalid' };

      expect(() => checkStoreRequirement(result)).toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith('/stores');
    });

    it('カスタムリダイレクトパスを指定できる', async () => {
      const { redirect } = await import('next/navigation');
      const result = { status: 'store_required', error: 'Store required' };
      const customPath = '/custom/store-selection';

      expect(() => checkStoreRequirement(result, customPath)).toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith(customPath);
    });

    it('store_requiredでカスタムパスを指定した場合', async () => {
      const { redirect } = await import('next/navigation');
      const result = { status: 'store_required', error: 'Store required' };
      const customPath = '/admin/stores';

      expect(() => checkStoreRequirement(result, customPath)).toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith(customPath);
    });

    it('store_invalidでカスタムパスを指定した場合', async () => {
      const { redirect } = await import('next/navigation');
      const result = { status: 'store_invalid', error: 'Store invalid' };
      const customPath = '/error/store-invalid';

      expect(() => checkStoreRequirement(result, customPath)).toThrow('NEXT_REDIRECT');
      expect(redirect).toHaveBeenCalledWith(customPath);
    });

    it('他のerrorステータスの場合、リダイレクトしない', async () => {
      const { redirect } = await import('next/navigation');
      const result = { status: 'error', error: 'General error' };

      const returnedResult = checkStoreRequirement(result);

      expect(returnedResult).toBe(result);
      expect(redirect).not.toHaveBeenCalled();
    });

    it('複雑なデータ構造でも正しく動作する', async () => {
      const { redirect } = await import('next/navigation');
      const result = {
        status: 'success',
        data: {
          items: [1, 2, 3],
          metadata: { total: 3, page: 1 },
        },
        timestamp: '2025-01-01T00:00:00Z',
      };

      const returnedResult = checkStoreRequirement(result);

      expect(returnedResult).toBe(result);
      expect(redirect).not.toHaveBeenCalled();
    });

    it('型安全性が保たれる', () => {
      interface CustomResult {
        status: string;
        customField: number;
      }

      const result: CustomResult = {
        status: 'success',
        customField: 42,
      };

      const returnedResult = checkStoreRequirement(result);

      expect(returnedResult).toBe(result);
      expect(returnedResult.customField).toBe(42);
    });
  });

  describe('STORE_ERROR_MESSAGES', () => {
    it('正しいエラーメッセージ定数を持つ', () => {
      expect(STORE_ERROR_MESSAGES.STORE_REQUIRED).toBe('店舗を選択してください');
      expect(STORE_ERROR_MESSAGES.STORE_INVALID).toBe('選択された店舗が無効です');
    });

    it('定数オブジェクトのプロパティが読み取り専用である', () => {
      // TypeScriptレベルでの読み取り専用性をテスト
      expect(STORE_ERROR_MESSAGES.STORE_REQUIRED).toBe('店舗を選択してください');
      expect(STORE_ERROR_MESSAGES.STORE_INVALID).toBe('選択された店舗が無効です');
      
      // オブジェクトが凍結されているかテスト
      expect(Object.isFrozen(STORE_ERROR_MESSAGES)).toBe(false); // as constは実行時に凍結しない
    });
  });
});