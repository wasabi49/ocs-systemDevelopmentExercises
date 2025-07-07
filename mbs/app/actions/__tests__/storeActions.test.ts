import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getAllStores,
  fetchStoresAction,
  getStoreById
} from '../storeActions';
import prisma from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    store: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('storeActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllStores', () => {
    it('正常な場合、店舗データを返す', async () => {
      const mockStores = [
        {
          id: 'store-1',
          name: '店舗1',
        },
        {
          id: 'store-2',
          name: '店舗2',
        },
      ];

      vi.mocked(prisma.store.findMany).mockResolvedValue(mockStores as any);

      const result = await getAllStores();

      expect(result).toEqual(mockStores);

      expect(prisma.store.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('店舗が存在しない場合、空の配列を返す', async () => {
      vi.mocked(prisma.store.findMany).mockResolvedValue([]);

      const result = await getAllStores();

      expect(result).toEqual([]);
    });

    it('エラーが発生した場合、エラーをthrowする', async () => {
      vi.mocked(prisma.store.findMany).mockRejectedValue(new Error('Database error'));

      await expect(getAllStores()).rejects.toThrow('店舗データの取得に失敗しました');
    });
  });

  describe('fetchStoresAction', () => {
    it('正常な場合、店舗データを含むstateを返す', async () => {
      const mockStores = [
        {
          id: 'store-1',
          name: '店舗1',
        },
      ];

      vi.mocked(prisma.store.findMany).mockResolvedValue(mockStores as any);

      const result = await fetchStoresAction({
        stores: [],
        error: null,
        isLoading: false,
      });

      expect(result).toEqual({
        stores: mockStores,
        error: null,
        isLoading: false,
      });
    });

    it('エラーが発生した場合、エラーメッセージを含むstateを返す', async () => {
      vi.mocked(prisma.store.findMany).mockRejectedValue(new Error('Database error'));

      const result = await fetchStoresAction({
        stores: [],
        error: null,
        isLoading: false,
      });

      expect(result).toEqual({
        stores: [],
        error: '店舗データの取得に失敗しました',
        isLoading: false,
      });
    });
  });

  describe('getStoreById', () => {
    it('店舗が見つかった場合、店舗データを返す', async () => {
      const mockStore = {
        id: 'store-1',
        name: '店舗1',
      };

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore as any);

      const result = await getStoreById('store-1');

      expect(result).toEqual(mockStore);

      expect(prisma.store.findUnique).toHaveBeenCalledWith({
        where: { id: 'store-1' },
        select: {
          id: true,
          name: true,
        },
      });
    });

    it('店舗が見つからない場合、nullを返す', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const result = await getStoreById('non-existent-store');

      expect(result).toBeNull();
    });

    it('エラーが発生した場合、エラーをthrowする', async () => {
      vi.mocked(prisma.store.findUnique).mockRejectedValue(new Error('Database error'));

      await expect(getStoreById('store-1')).rejects.toThrow('店舗データの取得に失敗しました');
    });
  });
});