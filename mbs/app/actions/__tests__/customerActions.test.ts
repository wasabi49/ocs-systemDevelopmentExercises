import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchCustomers, fetchCustomerById, fetchAllCustomers, importCustomersFromCSV, fetchCustomersAction } from '../customerActions';
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
      updateMany: vi.fn(),
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
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId, name: 'Store 1' } as unknown as { id: string; name: string });
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as unknown as Array<{ id: string; name: string; updatedAt: Date; deletedAt: Date | null }>);

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

      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as unknown as { id: string; name: string; updatedAt: Date; deletedAt: Date | null });

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

    it('顧客統計がnullの場合、statisticsはnullを返す', async () => {
      const mockCustomer = {
        id: 'C-00001',
        name: '顧客1',
        contactPerson: '担当者1',
        statistics: null,
      };

      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as unknown as { id: string; name: string; updatedAt: Date; deletedAt: Date | null });

      const result = await fetchCustomerById('C-00001');

      expect(result).toEqual({
        status: 'success',
        data: {
          id: 'C-00001',
          customerName: '顧客1',
          managerName: '担当者1',
          statistics: null,
        },
      });
    });

    it('統計のaverageLeadTimeがnullの場合、0を返す', async () => {
      const mockCustomer = {
        id: 'C-00001',
        name: '顧客1',
        contactPerson: '担当者1',
        statistics: {
          averageLeadTime: null,
          totalSales: 10000,
          updatedAt: new Date('2025-01-01'),
        },
      };

      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as unknown as { id: string; name: string; updatedAt: Date; deletedAt: Date | null });

      const result = await fetchCustomerById('C-00001');

      expect(result).toEqual({
        status: 'success',
        data: {
          id: 'C-00001',
          customerName: '顧客1',
          managerName: '担当者1',
          statistics: {
            averageLeadTime: 0,
            totalSales: 10000,
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        },
      });
    });

    it('統計のtotalSalesがnullの場合、0を返す', async () => {
      const mockCustomer = {
        id: 'C-00001',
        name: '顧客1',
        contactPerson: '担当者1',
        statistics: {
          averageLeadTime: 5,
          totalSales: null,
          updatedAt: new Date('2025-01-01'),
        },
      };

      vi.mocked(prisma.customer.findFirst).mockResolvedValue(mockCustomer as unknown as { id: string; name: string; updatedAt: Date; deletedAt: Date | null });

      const result = await fetchCustomerById('C-00001');

      expect(result).toEqual({
        status: 'success',
        data: {
          id: 'C-00001',
          customerName: '顧客1',
          managerName: '担当者1',
          statistics: {
            averageLeadTime: 5,
            totalSales: 0,
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
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
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockCustomers as unknown as Array<{ id: string; name: string; updatedAt: Date; deletedAt: Date | null }>);

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

    it('正常なインポートの場合、成功を返す', async () => {
      const mockStore = { id: 'store-1', name: '店舗1' };
      const mockExistingCustomers = [
        {
          id: 'C-00001',
          name: '顧客1',
          contactPerson: '古い担当者',
          address: '古い住所',
          phone: '古い電話',
          deliveryCondition: null,
          note: null,
        },
        {
          id: 'C-00002',
          name: '削除予定顧客',
          contactPerson: null,
          address: null,
          phone: null,
          deliveryCondition: null,
          note: null,
        },
      ];

      vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore);
      vi.mocked(prisma.customer.findMany).mockResolvedValue(mockExistingCustomers as unknown as Array<{ id: string; name: string }>);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'C-00002' } as unknown as { id: string });
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

      // トランザクション内の処理をモック
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          customer: {
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          },
        };
        await fn(tx);
        return undefined;
      });

      const result = await importCustomersFromCSV(mockCSVData, 'store-1');

      expect(result).toEqual({
        status: 'success',
        data: {
          addedCount: 1,
          updatedCount: 1,
          deletedCount: 1,
          totalProcessed: 2,
        },
      });
    });

    it('店舗名が異なる場合、エラーを返す', async () => {
      const wrongStoreData = [
        ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
        ['C-00001', '異なる店舗', '顧客1', '担当者1', '住所1', '090-1234-5678', '配送条件1', '備考1'],
      ];

      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1', name: '店舗1' });

      const result = await importCustomersFromCSV(wrongStoreData, 'store-1');

      expect(result.status).toBe('error');
      expect(result.error).toBe('CSVファイルに異なる店舗のデータが含まれています。');
      expect(result.errorData).toEqual({
        currentStoreName: '店舗1',
        invalidCustomers: [{
          customerId: 'C-00001',
          storeName: '異なる店舗',
        }],
        moreCount: 0,
      });
    });

    it('顧客データの各フィールドが異なる場合、更新対象として認識される', async () => {
      // Test each field difference separately to cover all branches
      const testCases = [
        { field: 'contactPerson', csvValue: '新担当者', dbValue: '旧担当者' },
        { field: 'address', csvValue: '新住所', dbValue: '旧住所' },
        { field: 'phone', csvValue: '090-9999-9999', dbValue: '090-1111-1111' },
        { field: 'deliveryCondition', csvValue: '新配送条件', dbValue: '旧配送条件' },
        { field: 'note', csvValue: '新備考', dbValue: '旧備考' },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        
        const csvData = [
          ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
          ['C-00001', '店舗1', '顧客1', 
           testCase.field === 'contactPerson' ? testCase.csvValue : '担当者1',
           testCase.field === 'address' ? testCase.csvValue : '住所1',
           testCase.field === 'phone' ? testCase.csvValue : '090-1234-5678',
           testCase.field === 'deliveryCondition' ? testCase.csvValue : '配送条件1',
           testCase.field === 'note' ? testCase.csvValue : '備考1'
          ],
        ];

        const mockStore = { id: 'store-1', name: '店舗1' };
        const mockExistingCustomer = {
          id: 'C-00001',
          name: '顧客1',
          contactPerson: testCase.field === 'contactPerson' ? testCase.dbValue : '担当者1',
          address: testCase.field === 'address' ? testCase.dbValue : '住所1',
          phone: testCase.field === 'phone' ? testCase.dbValue : '090-1234-5678',
          deliveryCondition: testCase.field === 'deliveryCondition' ? testCase.dbValue : '配送条件1',
          note: testCase.field === 'note' ? testCase.dbValue : '備考1',
        };

        vi.mocked(prisma.store.findUnique).mockResolvedValue(mockStore);
        vi.mocked(prisma.customer.findMany).mockResolvedValue([mockExistingCustomer] as unknown as Array<{ id: string; name: string }>);

        const updateMock = vi.fn();
        vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
          const tx = {
            customer: {
              update: updateMock,
              updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            },
          };
          await fn(tx);
          return undefined;
        });

        const result = await importCustomersFromCSV(csvData, 'store-1');

        expect(result.status).toBe('success');
        expect(result.data?.updatedCount).toBe(1);
        expect(updateMock).toHaveBeenCalledWith({
          where: { id: 'C-00001' },
          data: {
            contactPerson: testCase.field === 'contactPerson' ? testCase.csvValue : '担当者1',
            address: testCase.field === 'address' ? testCase.csvValue : '住所1',
            phone: testCase.field === 'phone' ? testCase.csvValue : '090-1234-5678',
            deliveryCondition: testCase.field === 'deliveryCondition' ? testCase.csvValue : '配送条件1',
            note: testCase.field === 'note' ? testCase.csvValue : '備考1',
          },
        });
      }
    });
  });

  describe('fetchCustomersAction', () => {
    it('正常な場合、loading:falseでデータを返す', async () => {
      const mockCustomers = [
        {
          id: 'C-00001',
          customerName: '顧客1',
          managerName: '担当者1',
          storeName: '店舗1',
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1', name: 'Store 1' } as unknown as { id: string; name: string });
      vi.mocked(prisma.customer.findMany).mockResolvedValue([{
        id: 'C-00001',
        name: '顧客1',
        contactPerson: '担当者1',
        store: { name: '店舗1' },
      }] as unknown as Array<{ id: string; name: string; updatedAt: Date; deletedAt: Date | null }>);

      const result = await fetchCustomersAction();

      expect(result).toEqual({
        loading: false,
        error: null,
        data: mockCustomers,
        needsStoreSelection: false,
      });
    });

    it('店舗選択が必要な場合、needsStoreSelection:trueを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await fetchCustomersAction();

      expect(result).toEqual({
        loading: false,
        error: '店舗を選択してください',
        data: [],
        needsStoreSelection: true,
      });
    });

    it('エラーが発生した場合、エラーメッセージを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockRejectedValue(new Error('Unexpected error'));

      const result = await fetchCustomersAction();

      expect(result).toEqual({
        loading: false,
        error: '顧客データの取得に失敗しました',
        data: [],
        needsStoreSelection: false,
      });
    });
  });

  describe('generateCustomerId', () => {
    // generateCustomerIdが内部関数のため、importCustomersFromCSVを通じてテスト
    it('既存の顧客IDがある場合、次の番号を生成する', async () => {
      const csvData = [
        ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
        ['', '店舗1', '新規顧客', '担当者', '住所', '電話', '条件', '備考'],
      ];

      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1', name: '店舗1' });
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: 'C-00005' } as unknown as { id: string });
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

      const createMock = vi.fn();
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          customer: {
            create: createMock,
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        await fn(tx);
        return undefined;
      });

      await importCustomersFromCSV(csvData, 'store-1');

      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'C-00006',
          storeId: 'store-1',
          name: '新規顧客',
        }),
      });
    });

    it('既存の顧客IDがない場合、C-00001から開始する', async () => {
      const csvData = [
        ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
        ['', '店舗1', '新規顧客', '担当者', '住所', '電話', '条件', '備考'],
      ];

      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1', name: '店舗1' });
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

      const createMock = vi.fn();
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          customer: {
            create: createMock,
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        };
        await fn(tx);
        return undefined;
      });

      await importCustomersFromCSV(csvData, 'store-1');

      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'C-00001',
        }),
      });
    });

    it('P2002エラーの場合、重複エラーメッセージを返す', async () => {
      const csvData = [
        ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
        ['C-00001', '店舗1', '顧客1', '担当者1', '住所1', '090-1234-5678', '配送条件1', '備考1'],
      ];
      
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1', name: '店舗1' });
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      
      const dbError = new Error('Unique constraint failed') as Error & { code: string };
      dbError.code = 'P2002';
      vi.mocked(prisma.$transaction).mockRejectedValue(dbError);

      const result = await importCustomersFromCSV(csvData, 'store-1');

      expect(result).toEqual({
        status: 'error',
        error: '重複するデータが検出されました。',
      });
    });

    it('その他のデータベースエラーの場合、エラーコードを含むメッセージを返す', async () => {
      const csvData = [
        ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
        ['C-00001', '店舗1', '顧客1', '担当者1', '住所1', '090-1234-5678', '配送条件1', '備考1'],
      ];
      
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1', name: '店舗1' });
      vi.mocked(prisma.customer.findMany).mockResolvedValue([]);
      
      const dbError = new Error('Foreign key constraint failed') as Error & { code: string };
      dbError.code = 'P2003';
      vi.mocked(prisma.$transaction).mockRejectedValue(dbError);

      const result = await importCustomersFromCSV(csvData, 'store-1');

      expect(result).toEqual({
        status: 'error',
        error: 'データベースエラー（P2003）',
      });
    });
  });
});