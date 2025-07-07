import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  fetchStatistics, 
  recalculateStatistics 
} from '../statisticsActions';
import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';
import { logger } from '@/lib/logger';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    statistics: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    customer: {
      findMany: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
    delivery: {
      findFirst: vi.fn(),
    },
    store: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock store utils
vi.mock('@/app/utils/storeUtils', () => ({
  getStoreIdFromCookie: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('statisticsActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchStatistics', () => {
    it('店舗IDがない場合、store_requiredを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await fetchStatistics();

      expect(result).toEqual({
        status: 'store_required',
        error: '店舗を選択してください',
      });
    });

    it('店舗が存在しない場合、store_invalidを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const result = await fetchStatistics();

      expect(result).toEqual({
        status: 'store_invalid',
        error: '指定された店舗が見つかりません',
      });
    });

    it('正常な場合、統計データを返す', async () => {
      const mockStoreId = 'store-1';
      const mockStatistics = [
        {
          customerId: 'C-00001',
          averageLeadTime: 5,
          totalSales: 10000,
          updatedAt: new Date('2025-01-01'),
          customer: {
            id: 'C-00001',
            name: '顧客1',
          },
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.statistics.findMany).mockResolvedValue(mockStatistics as any);

      const result = await fetchStatistics();

      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].customerId).toBe('C-00001');
      expect(result.data[0].customerName).toBe('顧客1');
      expect(result.data[0].averageLeadTime).toBe(5);
      expect(result.data[0].totalSales).toBe(10000);
      expect(typeof result.data[0].updatedAt).toBe('string');
    });

    it('統計データが存在しない場合、空の配列を返す', async () => {
      const mockStoreId = 'store-1';

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.statistics.findMany).mockResolvedValue([]);

      const result = await fetchStatistics();

      expect(result.status).toBe('success');
      expect(result.data).toEqual([]);
    });

    it('エラーが発生した場合、errorを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await fetchStatistics();

      expect(result).toEqual({
        status: 'error',
        error: '統計データの取得に失敗しました',
      });
    });
  });

  describe('recalculateStatistics', () => {
    it('店舗IDがない場合、store_requiredを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await recalculateStatistics();

      expect(result).toEqual({
        status: 'store_required',
        error: '店舗を選択してください',
      });
    });

    it('正常な場合、統計を再計算して成功を返す', async () => {
      const mockStoreId = 'store-1';
      const mockCustomers = [
        {
          id: 'C-00001',
        },
      ];

      const mockOrders = [
        {
          id: 'O0000001',
          customerId: 'C-00001',
          orderDate: new Date('2025-01-01'),
          orderDetails: [
            {
              unitPrice: 1000,
              quantity: 2,
              isDeleted: false,
            },
          ],
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as any);
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any);
      vi.mocked(prisma.delivery.findFirst).mockResolvedValue({
        deliveryDate: new Date('2025-01-06'),
      } as any);
      vi.mocked(prisma.statistics.upsert).mockResolvedValue({} as any);

      const result = await recalculateStatistics();

      expect(result).toEqual({
        status: 'success',
        message: '統計情報を再計算しました',
      });
    });

    it('顧客が存在しない場合でも成功を返す', async () => {
      const mockStoreId = 'store-1';

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      const result = await recalculateStatistics();

      expect(result).toEqual({
        status: 'success',
        message: '統計情報を再計算しました',
      });
    });

    it('顧客が存在しない場合でも成功を返す', async () => {
      const mockStoreId = 'store-1';

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);

      const result = await recalculateStatistics();

      expect(result).toEqual({
        status: 'success',
        message: '統計情報を再計算しました',
      });
    });

    it('注文が存在しない顧客の統計を正しく処理する', async () => {
      const mockStoreId = 'store-1';
      const mockCustomers = [
        {
          id: 'C-00001',
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as any);
      vi.mocked(prisma.order.findMany).mockResolvedValue([]); // 注文なし
      vi.mocked(prisma.statistics.upsert).mockResolvedValue({} as any);

      const result = await recalculateStatistics();

      expect(result).toEqual({
        status: 'success',
        message: '統計情報を再計算しました',
      });
    });

    it('エラーが発生した場合、errorを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findMany).mockRejectedValue(new Error('Database error'));

      const result = await recalculateStatistics();

      expect(result).toEqual({
        status: 'error',
        error: '統計情報の再計算に失敗しました',
      });
    });

    it('統計データの更新中にエラーが発生した場合、errorを返す', async () => {
      const mockStoreId = 'store-1';
      const mockCustomers = [{ id: 'C-00001' }];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as any);
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.statistics.upsert).mockRejectedValue(new Error('Upsert error'));

      const result = await recalculateStatistics();

      expect(result).toEqual({
        status: 'error',
        error: '統計情報の再計算に失敗しました',
      });
    });
  });
});