import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getStoreFromCookie, getStoreIdFromCookie } from '../storeUtils';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('storeUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getStoreFromCookie', () => {
    it('店舗IDと名前の両方が存在する場合、店舗オブジェクトを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn()
          .mockReturnValueOnce({ value: 'store-1' }) // selectedStoreId
          .mockReturnValueOnce({ value: '店舗1' }),  // selectedStoreName
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreFromCookie();

      expect(result).toEqual({
        id: 'store-1',
        name: '店舗1',
      });
      expect(mockCookieStore.get).toHaveBeenCalledWith('selectedStoreId');
      expect(mockCookieStore.get).toHaveBeenCalledWith('selectedStoreName');
    });

    it('店舗IDが存在するが名前が存在しない場合、空文字を名前として返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn()
          .mockReturnValueOnce({ value: 'store-1' }) // selectedStoreId
          .mockReturnValueOnce(undefined),           // selectedStoreName
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreFromCookie();

      expect(result).toEqual({
        id: 'store-1',
        name: '',
      });
    });

    it('店舗IDのCookieが存在しない場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreFromCookie();

      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith('selectedStoreId');
    });

    it('店舗IDのCookieのvalueが空の場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: '' }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreFromCookie();

      expect(result).toBeNull();
    });

    it('Cookieの取得でエラーが発生した場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockRejectedValue(new Error('Cookie error'));

      const result = await getStoreFromCookie();

      expect(result).toBeNull();
    });

    it('Cookie解析でエラーが発生した場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn().mockImplementation(() => {
          throw new Error('Parse error');
        }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreFromCookie();

      expect(result).toBeNull();
    });

    it('店舗名Cookieが null の場合、空文字を返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn()
          .mockReturnValueOnce({ value: 'store-1' }) // selectedStoreId
          .mockReturnValueOnce({ value: null }),     // selectedStoreName with null value
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreFromCookie();

      expect(result).toEqual({
        id: 'store-1',
        name: '',
      });
    });
  });

  describe('getStoreIdFromCookie', () => {
    it('店舗IDのCookieが存在する場合、IDを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: 'store-1' }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreIdFromCookie();

      expect(result).toBe('store-1');
      expect(mockCookieStore.get).toHaveBeenCalledWith('selectedStoreId');
    });

    it('店舗IDのCookieが存在しない場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreIdFromCookie();

      expect(result).toBeNull();
    });

    it('店舗IDのCookieのvalueが空文字の場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: '' }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreIdFromCookie();

      expect(result).toBeNull();
    });

    it('Cookieの取得でエラーが発生した場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockRejectedValue(new Error('Cookie error'));

      const result = await getStoreIdFromCookie();

      expect(result).toBeNull();
    });

    it('Cookie解析でエラーが発生した場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn().mockImplementation(() => {
          throw new Error('Parse error');
        }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreIdFromCookie();

      expect(result).toBeNull();
    });

    it('店舗IDのCookieのvalueがnullの場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: null }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreIdFromCookie();

      expect(result).toBeNull();
    });

    it('店舗IDのCookieのvalueがundefinedの場合、nullを返す', async () => {
      const { cookies } = await import('next/headers');
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: undefined }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getStoreIdFromCookie();

      expect(result).toBeNull();
    });

    it('有効な店舗IDが存在する場合、正確にIDを返す', async () => {
      const { cookies } = await import('next/headers');
      const testStoreIds = ['store-123', 'shop-456', 'outlet-789'];

      for (const storeId of testStoreIds) {
        const mockCookieStore = {
          get: vi.fn().mockReturnValue({ value: storeId }),
        };
        vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

        const result = await getStoreIdFromCookie();

        expect(result).toBe(storeId);
      }
    });
  });
});