import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCustomers, fetchCustomerById, fetchAllCustomers, importCustomersFromCSV } from '../customerActions';
import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    customer: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
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

describe('customerActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchCustomers', () => {
    it('店舗IDがない場合、store_requiredを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await fetchCustomers();

      expect(result).toEqual({
        status: 'store_required',
        error: '店舗を選択してください',
      });
    });

    it('店舗が存在しない場合、store_invalidを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const result = await fetchCustomers();

      expect(result).toEqual({
        status: 'store_invalid',
        error: '指定された店舗が見つかりません',
      });
    });

    it('正常な場合、顧客データを返す', async () => {
      const mockStoreId = 'store-1';
      const mockCustomers = [
        {
          id: 'C-00001',
          name: '顧客1',
          contactPerson: '担当者1',
          store: { name: '店舗1' },
        },
        {
          id: 'C-00002',
          name: '顧客2',
          contactPerson: null,
          store: { name: '店舗1' },
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as any);

      const result = await fetchCustomers();

      expect(result).toEqual({
        status: 'success',
        data: [
          {
            id: 'C-00001',
            customerName: '顧客1',
            managerName: '担当者1',
            storeName: '店舗1',
          },
          {
            id: 'C-00002',
            customerName: '顧客2',
            managerName: '',
            storeName: '店舗1',
          },
        ],
      });

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
          storeId: mockStoreId,
        },
        include: {
          store: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      });
    });

    it('エラーが発生した場合、errorを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await fetchCustomers();

      expect(result).toEqual({
        status: 'error',
        error: '顧客データの取得に失敗しました',
      });
    });
  });

  describe('fetchCustomerById', () => {
    it('顧客が見つからない場合、errorを返す', async () => {
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      const result = await fetchCustomerById('C-00001');

      expect(result).toEqual({
        status: 'error',
        error: '顧客が見つかりませんでした',
      });
    });

    it('顧客が見つかった場合、顧客データを返す', async () => {
      const mockCustomer = {
        id: 'C-00001',
        name: '顧客1',
        contactPerson: '担当者1',
        statistics: {
          averageLeadTime: 5,
          totalSales: 10000,
          updatedAt: new Date('2025-01-01'),
        },
      };

      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as any);

      const result = await fetchCustomerById('C-00001');

      expect(result).toEqual({
        status: 'success',
        data: {
          id: 'C-00001',
          customerName: '顧客1',
          managerName: '担当者1',
          statistics: {
            averageLeadTime: 5,
            totalSales: 10000,
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        },
      });

      expect(prisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'C-00001',
          isDeleted: false,
          statistics: {
            isDeleted: false,
          },
        },
        include: {
          statistics: true,
        },
      });
    });

    it('エラーが発生した場合、errorを返す', async () => {
      vi.mocked(prisma.customer.findFirst).mockRejectedValue(new Error('Database error'));

      const result = await fetchCustomerById('C-00001');

      expect(result).toEqual({
        status: 'error',
        error: '顧客データの取得に失敗しました',
      });
    });
  });

  describe('fetchAllCustomers', () => {
    it('店舗IDがない場合、store_requiredを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await fetchAllCustomers();

      expect(result).toEqual({
        status: 'store_required',
        error: '店舗を選択してください',
      });
    });

    it('正常な場合、全ての顧客データを返す', async () => {
      const mockStoreId = 'store-1';
      const mockCustomers = [
        {
          id: 'C-00001',
          storeId: 'store-1',
          name: '顧客1',
          contactPerson: '担当者1',
          address: '住所1',
          phone: '090-1234-5678',
          deliveryCondition: '配送条件1',
          note: '備考1',
          updatedAt: new Date('2025-01-01'),
          isDeleted: false,
          deletedAt: null,
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as any);

      const result = await fetchAllCustomers();

      expect(result).toEqual({
        status: 'success',
        data: [
          {
            id: 'C-00001',
            storeId: 'store-1',
            name: '顧客1',
            contactPerson: '担当者1',
            address: '住所1',
            phone: '090-1234-5678',
            deliveryCondition: '配送条件1',
            note: '備考1',
            updatedAt: '2025-01-01T00:00:00.000Z',
            isDeleted: false,
            deletedAt: null,
          },
        ],
      });

      expect(prisma.customer.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
          storeId: mockStoreId,
        },
        select: {
          id: true,
          name: true,
          contactPerson: true,
          address: true,
          phone: true,
          deliveryCondition: true,
          note: true,
          updatedAt: true,
          storeId: true,
          isDeleted: true,
          deletedAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    });

    it('エラーが発生した場合、errorを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findMany).mockRejectedValue(new Error('Database error'));

      const result = await fetchAllCustomers();

      expect(result).toEqual({
        status: 'error',
        error: '顧客データの取得に失敗しました',
      });
    });
  });

  describe('importCustomersFromCSV', () => {
    const mockCSVData = [
      ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
      ['C-00001', '店舗1', '顧客1', '担当者1', '住所1', '090-1234-5678', '配送条件1', '備考1'],
      ['', '店舗1', '新規顧客', '担当者2', '住所2', '090-8765-4321', '配送条件2', '備考2'],
    ];

    it('店舗IDがない場合、エラーを返す', async () => {
      const result = await importCustomersFromCSV(mockCSVData, undefined);

      expect(result).toEqual({
        status: 'store_required',
        error: '店舗を選択してください',
      });
    });

    it('CSVデータが空の場合、エラーを返す', async () => {
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1', name: '店舗1' });
      
      const result = await importCustomersFromCSV([], 'store-1');

      expect(result).toEqual({
        status: 'error',
        error: 'CSVファイルが空か、データ行がありません',
      });
    });

    it('ヘッダー行のみの場合、エラーを返す', async () => {
      const headerOnlyData = [['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考']];
      
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1', name: '店舗1' });
      
      const result = await importCustomersFromCSV(headerOnlyData, 'store-1');

      expect(result).toEqual({
        status: 'error',
        error: 'CSVファイルが空か、データ行がありません',
      });
    });


    it('トランザクションエラーの場合、エラーを返す', async () => {
      // Mock store validation
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1', name: '店舗1' });
      
      // Mock existing customers query
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Transaction error'));

      const result = await importCustomersFromCSV(mockCSVData, 'store-1');

      expect(result).toEqual({
        status: 'error',
        error: 'データのインポートに失敗しました',
      });
    });
  });
});