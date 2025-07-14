import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  fetchOrders, 
  fetchOrderById, 
  fetchOrdersAction, 
  createOrder, 
  deleteOrder, 
  updateOrder 
} from '../orderActions';
import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';
import { logger } from '@/lib/logger';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    order: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderDetail: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    customer: {
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

describe('orderActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchOrders', () => {
    it('店舗IDがない場合、store_requiredを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await fetchOrders();

      expect(result).toEqual({
        status: 'store_required',
        error: '店舗を選択してください',
      });
    });

    it('店舗が存在しない場合、store_invalidを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const result = await fetchOrders();

      expect(result).toEqual({
        status: 'store_invalid',
        error: '指定された店舗が見つかりません',
      });
    });

    it('正常な場合、注文データを返す', async () => {
      const mockStoreId = 'store-1';
      const mockOrders = [
        {
          id: 'O0000001',
          orderDate: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
          customer: {
            id: 'C-00001',
            name: '顧客1',
            updatedAt: new Date('2025-01-01'),
            deletedAt: null,
          },
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders);

      const result = await fetchOrders();

      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('O0000001');
      expect(typeof result.data[0].orderDate).toBe('string');
    });

    it('エラーが発生した場合、errorを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await fetchOrders();

      expect(result).toEqual({
        status: 'error',
        error: '注文データの取得に失敗しました',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('fetchOrderById', () => {
    it('注文が見つからない場合、failureを返す', async () => {
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const result = await fetchOrderById('O0000001');

      expect(result).toEqual({
        success: false,
        error: '注文が見つかりませんでした',
      });
    });

    it('顧客が削除されている場合、適切なエラーを返す', async () => {
      const mockOrder = {
        id: 'O0000001',
        orderDate: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
        customer: null, // 顧客が削除されている
        orderDetails: [],
      };

      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder);

      const result = await fetchOrderById('O0000001');

      expect(result).toEqual({
        success: false,
        error: '関連する顧客データが削除されているため、注文情報を表示できません',
      });
    });

    it('正常な場合、注文データを返す', async () => {
      const mockOrder = {
        id: 'O0000001',
        orderDate: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
        customer: {
          id: 'C-00001',
          name: '顧客1',
          isDeleted: false,
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
        orderDetails: [
          {
            id: 'O0000001-01',
            productName: '商品1',
            quantity: 2,
          },
        ],
      };

      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder);

      const result = await fetchOrderById('O0000001');

      expect(result.success).toBe(true);
      expect(result.order.id).toBe('O0000001');
      expect(typeof result.order.orderDate).toBe('string');
    });

    it('エラーが発生した場合、failureを返す', async () => {
      vi.mocked(prisma.order.findFirst).mockRejectedValue(new Error('Database error'));

      const result = await fetchOrderById('O0000001');

      expect(result).toEqual({
        success: false,
        error: '注文データの取得に失敗しました',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('fetchOrdersAction', () => {
    it('fetchOrdersを呼び出して結果を変換する', async () => {

      // getStoreIdFromCookieとPrismaをモック
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: 'store-1' });
      vi.mocked(prisma.order.findMany).mockResolvedValue([
        {
          id: 'O0000001',
          orderDate: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
          customer: {
            id: 'C-00001',
            name: '顧客1',
            updatedAt: new Date('2025-01-01'),
            deletedAt: null,
          },
        },
      ]);

      const result = await fetchOrdersAction();

      expect(result.loading).toBe(false);
      expect(result.error).toBe(null);
      expect(result.data).toHaveLength(1);
    });

    it('エラーが発生した場合、エラーメッセージを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await fetchOrdersAction();

      expect(result.loading).toBe(false);
      expect(result.error).toBe('注文データの取得に失敗しました');
      expect(result.data).toEqual([]);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('createOrder', () => {
    const mockOrderData = {
      orderDate: '2025-01-01',
      customerId: 'C-00001',
      note: 'テスト注文',
      orderDetails: [
        {
          productName: '商品1',
          unitPrice: 1000,
          quantity: 2,
          description: '説明1',
        },
      ],
    };

    it('店舗IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await createOrder(mockOrderData);

      expect(result).toEqual({
        success: false,
        error: '店舗を選択してください',
      });
    });

    it('顧客IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');

      const result = await createOrder({
        ...mockOrderData,
        customerId: '',
      });

      expect(result).toEqual({
        success: false,
        error: '顧客IDが指定されていません',
      });
    });

    it('注文明細がない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');

      const result = await createOrder({
        ...mockOrderData,
        orderDetails: [],
      });

      expect(result).toEqual({
        success: false,
        error: '注文明細が指定されていません',
      });
    });

    it('正常な場合、成功を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: 'C-00001',
        name: '顧客1',
        storeId: 'store-1',
        isDeleted: false,
      });
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);
      
      const mockTransactionResult = {
        order: {
          id: 'O0000001',
          orderDate: new Date('2025-01-01'),
        },
        orderDetails: [
          {
            id: 'O0000001-01',
            productName: '商品1',
          },
        ],
      };

      vi.mocked(prisma.$transaction).mockResolvedValue(mockTransactionResult);

      const result = await createOrder(mockOrderData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTransactionResult);
    });

    it('顧客が見つからない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      const result = await createOrder(mockOrderData);

      expect(result).toEqual({
        success: false,
        error: '指定された顧客が見つかりません',
      });
    });

    it('既存の注文IDがある場合、次の番号を生成する', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: 'C-00001',
        name: '顧客1',
        storeId: 'store-1',
        isDeleted: false,
      });
      // 既存の最後の注文IDを返す
      vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: 'O0000005' });

      const createMock = vi.fn().mockResolvedValue({ id: 'O0000006' });
      const createDetailMock = vi.fn();
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          order: {
            create: createMock,
          },
          orderDetail: {
            create: createDetailMock,
          },
        };
        return await fn(tx);
      });

      await createOrder(mockOrderData);

      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'O0000006',
        }),
      });
    });

    it('エラーが発生した場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findFirst).mockRejectedValue(new Error('Database error'));

      const result = await createOrder(mockOrderData);

      expect(result).toEqual({
        success: false,
        error: '注文の作成に失敗しました',
      });
      expect(logger.error).toHaveBeenCalled();
    });

  });

  describe('deleteOrder', () => {
    it('店舗IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await deleteOrder('O0000001');

      expect(result).toEqual({
        success: false,
        error: '店舗を選択してください',
      });
    });

    it('注文が見つからない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const result = await deleteOrder('O0000001');

      expect(result).toEqual({
        success: false,
        error: '指定された注文が見つかりません',
      });
    });

    it('正常な場合、成功を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      const mockOrder = { id: 'O0000001' };
      vi.mocked(prisma.order.findFirst).mockResolvedValue(mockOrder);

      const updateManyMock = vi.fn().mockResolvedValue({ count: 1 });
      const updateMock = vi.fn().mockResolvedValue({ id: 'O0000001' });
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          orderDetail: {
            updateMany: updateManyMock,
          },
          order: {
            update: updateMock,
          },
        };
        await fn(tx);
        return undefined;
      });

      const result = await deleteOrder('O0000001');

      expect(result).toEqual({
        success: true,
        message: '注文が正常に削除されました',
      });
      expect(updateManyMock).toHaveBeenCalledWith({
        where: {
          orderId: 'O0000001',
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
      });
      expect(updateMock).toHaveBeenCalledWith({
        where: {
          id: 'O0000001',
        },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
      });
    });

    it('エラーが発生した場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: 'O0000001' });
      vi.mocked(prisma.$transaction).mockRejectedValue(new Error('Transaction error'));

      const result = await deleteOrder('O0000001');

      expect(result).toEqual({
        success: false,
        error: '注文の削除に失敗しました',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateOrder', () => {
    const mockUpdateData = {
      orderDate: '2025-01-01',
      customerId: 'C-00001',
      note: '更新されたメモ',
      status: '完了',
      orderDetails: [
        {
          productName: '更新された商品',
          unitPrice: 1500,
          quantity: 1,
          description: '更新された説明',
        },
      ],
    };

    it('店舗IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await updateOrder('O0000001', mockUpdateData);

      expect(result).toEqual({
        success: false,
        error: '店舗を選択してください',
      });
    });

    it('注文が見つからない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

      const result = await updateOrder('O0000001', mockUpdateData);

      expect(result).toEqual({
        success: false,
        error: '指定された注文が見つかりません',
      });
    });

    it('顧客が見つからない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: 'O0000001' });
      vi.mocked(prisma.customer.findFirst).mockResolvedValue(null);

      const result = await updateOrder('O0000001', mockUpdateData);

      expect(result).toEqual({
        success: false,
        error: '指定された顧客が見つかりません',
      });
    });

    it('正常な場合、成功を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findFirst).mockResolvedValue({
        id: 'C-00001',
        name: '顧客1',
        storeId: 'store-1',
        isDeleted: false,
      });
      vi.mocked(prisma.order.findFirst).mockResolvedValue({ id: 'O0000001' });

      const updateMock = vi.fn().mockResolvedValue({ id: 'O0000001' });
      const updateManyMock = vi.fn().mockResolvedValue({ count: 1 });
      const createMock = vi.fn().mockResolvedValue({ id: 'O0000001-02' });
      const findManyMock = vi.fn().mockResolvedValue([{ id: 'O0000001-01' }]);

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          order: {
            update: updateMock,
          },
          orderDetail: {
            updateMany: updateManyMock,
            create: createMock,
            findMany: findManyMock,
          },
        };
        return await fn(tx);
      });

      const result = await updateOrder('O0000001', mockUpdateData);

      expect(result.success).toBe(true);
      expect(updateMock).toHaveBeenCalledWith({
        where: {
          id: 'O0000001',
        },
        data: {
          orderDate: new Date('2025-01-01'),
          customerId: 'C-00001',
          note: '更新されたメモ',
          // status フィールドは自動管理のため削除されている
        },
      });
      expect(updateManyMock).toHaveBeenCalledWith({
        where: {
          orderId: 'O0000001',
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
      });
    });

    it('エラーが発生した場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.order.findFirst).mockRejectedValue(new Error('Database error'));

      const result = await updateOrder('O0000001', mockUpdateData);

      expect(result).toEqual({
        success: false,
        error: '注文の更新に失敗しました',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });
});