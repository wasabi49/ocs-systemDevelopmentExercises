import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  fetchStatistics, 
  recalculateStatistics 
} from '../statisticsActions';
import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    statistics: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
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

    it('正常な場合、統計データを返す（更新不要）', async () => {
      const mockStoreId = 'store-1';
      const recentDate = new Date(); // 現在時刻（更新不要）
      const mockLatestStatistic = {
        updatedAt: recentDate,
      };
      const mockStatistics = [
        {
          customerId: 'C-00001',
          averageLeadTime: 5,
          totalSales: 10000,
          updatedAt: recentDate,
          customer: {
            id: 'C-00001',
            name: '顧客1',
          },
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.statistics.findFirst).mockResolvedValue(mockLatestStatistic);
      vi.mocked(prisma.statistics.findMany).mockResolvedValue(mockStatistics as unknown as Array<{ customerId: string; averageLeadTime: number; totalSales: number; updatedAt: Date; customer: { id: string; name: string } }>);

      const result = await fetchStatistics();

      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].customerId).toBe('C-00001');
      expect(result.data[0].customerName).toBe('顧客1');
      expect(result.data[0].averageLeadTime).toBe(5);
      expect(result.data[0].totalSales).toBe(10000);
      expect(typeof result.data[0].updatedAt).toBe('string');
    });

    it('統計データが古い場合、自動更新してから返す', async () => {
      const mockStoreId = 'store-1';
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25時間前
      const mockLatestStatistic = {
        updatedAt: oldDate,
      };
      const mockCustomers = [{ id: 'C-00001' }];
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
      const mockStatistics = [
        {
          customerId: 'C-00001',
          averageLeadTime: 5,
          totalSales: 2000,
          updatedAt: new Date(),
          customer: {
            id: 'C-00001',
            name: '顧客1',
          },
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.statistics.findFirst).mockResolvedValue(mockLatestStatistic);
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as unknown as Array<{ id: string }>);
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as unknown as Array<{ id: string; customerId: string; orderDate: Date; orderDetails: Array<{ unitPrice: number; quantity: number; isDeleted: boolean }> }>);
      vi.mocked(prisma.delivery.findFirst).mockResolvedValue({
        deliveryDate: new Date('2025-01-06'),
      } as unknown as { deliveryDate: Date });
      vi.mocked(prisma.statistics.upsert).mockResolvedValue({} as unknown as Record<string, unknown>);
      vi.mocked(prisma.statistics.findMany).mockResolvedValue(mockStatistics as unknown as Array<{ customerId: string; averageLeadTime: number; totalSales: number; updatedAt: Date; customer: { id: string; name: string } }>);

      const result = await fetchStatistics();

      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(prisma.statistics.upsert).toHaveBeenCalled(); // 更新が実行されたことを確認
    });

    it('統計データが存在しない場合、自動作成してから返す', async () => {
      const mockStoreId = 'store-1';
      const mockCustomers = [{ id: 'C-00001' }];
      const mockOrders = [];
      const mockStatistics = [
        {
          customerId: 'C-00001',
          averageLeadTime: 0,
          totalSales: 0,
          updatedAt: new Date(),
          customer: {
            id: 'C-00001',
            name: '顧客1',
          },
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.statistics.findFirst).mockResolvedValue(null); // 統計データなし
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as unknown as Array<{ id: string }>);
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders);
      vi.mocked(prisma.statistics.upsert).mockResolvedValue({} as unknown as Record<string, unknown>);
      vi.mocked(prisma.statistics.findMany).mockResolvedValue(mockStatistics as unknown as Array<{ customerId: string; averageLeadTime: number; totalSales: number; updatedAt: Date; customer: { id: string; name: string } }>);

      const result = await fetchStatistics();

      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(prisma.statistics.upsert).toHaveBeenCalled(); // 作成が実行されたことを確認
    });

    it('顧客が存在しない場合、空の配列を返す', async () => {
      const mockStoreId = 'store-1';

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.statistics.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]); // 顧客なし
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
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as unknown as Array<{ id: string }>);
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as unknown as Array<{ id: string; customerId: string; orderDate: Date; orderDetails: Array<{ unitPrice: number; quantity: number; isDeleted: boolean }> }>);
      vi.mocked(prisma.delivery.findFirst).mockResolvedValue({
        deliveryDate: new Date('2025-01-06'),
      } as unknown as { deliveryDate: Date });
      vi.mocked(prisma.statistics.upsert).mockResolvedValue({} as unknown as Record<string, unknown>);

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
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as unknown as Array<{ id: string }>);
      vi.mocked(prisma.order.findMany).mockResolvedValue([]); // 注文なし
      vi.mocked(prisma.statistics.upsert).mockResolvedValue({} as unknown as Record<string, unknown>);

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
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as unknown as Array<{ id: string }>);
      vi.mocked(prisma.order.findMany).mockResolvedValue([]);
      vi.mocked(prisma.statistics.upsert).mockRejectedValue(new Error('Upsert error'));

      const result = await recalculateStatistics();

      expect(result).toEqual({
        status: 'error',
        error: '統計情報の再計算に失敗しました',
      });
    });
  });

  describe('checkIfUpdateNeeded (internal function behavior)', () => {
    it('統計データが24時間以上古い場合は自動更新される', async () => {
      const mockStoreId = 'store-1';
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25時間前
      const mockLatestStatistic = {
        updatedAt: oldDate,
      };

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.statistics.findFirst).mockResolvedValue(mockLatestStatistic);
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(prisma.statistics.findMany).mockResolvedValue([]);

      await fetchStatistics();

      // 自動更新のためにrecalculateStatisticsForStoreが呼ばれることを確認
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          isDeleted: false,
        },
        select: {
          id: true,
        },
      });
    });

    it('統計データが24時間以内の場合は更新されない', async () => {
      const mockStoreId = 'store-1';
      const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1時間前
      const mockLatestStatistic = {
        updatedAt: recentDate,
      };

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.statistics.findFirst).mockResolvedValue(mockLatestStatistic);
      vi.mocked(prisma.statistics.findMany).mockResolvedValue([]);

      await fetchStatistics();

      // 更新が不要なのでrecalculateStatisticsForStoreは呼ばれない
      expect(prisma.customer.findMany).not.toHaveBeenCalled();
    });

    it('統計データが存在しない場合は自動作成される', async () => {
      const mockStoreId = 'store-1';

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.statistics.findFirst).mockResolvedValue(null); // データなし
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(prisma.statistics.findMany).mockResolvedValue([]);

      await fetchStatistics();

      // 初回作成のためにrecalculateStatisticsForStoreが呼ばれることを確認
      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          storeId: mockStoreId,
          isDeleted: false,
        },
        select: {
          id: true,
        },
      });
    });
  });
});