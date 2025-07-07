import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  fetchDeliveries, 
  fetchDeliveryById, 
  fetchUndeliveredOrderDetails,
  updateDeliveryAllocations,
  fetchDeliveryForEdit,
  createDelivery,
  fetchUndeliveredOrderDetailsForCreate,
  deleteDelivery
} from '../deliveryActions';
import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    delivery: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    orderDetail: {
      findMany: vi.fn(),
    },
    deliveryDetail: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    deliveryAllocation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
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

describe('deliveryActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchDeliveries', () => {
    it('店舗IDがない場合、store_requiredを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await fetchDeliveries();

      expect(result).toEqual({
        status: 'store_required',
        error: '店舗を選択してください',
      });
    });

    it('店舗が存在しない場合、store_invalidを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockResolvedValue(null);

      const result = await fetchDeliveries();

      expect(result).toEqual({
        status: 'store_invalid',
        error: '指定された店舗が見つかりません',
      });
    });

    it('正常な場合、配送データを返す', async () => {
      const mockStoreId = 'store-1';
      const mockDeliveries = [
        {
          id: 'D0000001',
          deliveryDate: new Date('2025-01-01'),
          note: 'テスト配送',
          customer: {
            id: 'C-00001',
            name: '顧客1',
          },
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue(mockStoreId);
      vi.mocked(prisma.store.findUnique).mockResolvedValue({ id: mockStoreId });
      vi.mocked(prisma.delivery.findMany).mockResolvedValue(mockDeliveries as any);

      const result = await fetchDeliveries();

      expect(result.status).toBe('success');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('D0000001');
      expect(result.data[0].customerName).toBe('顧客1');
    });

    it('エラーが発生した場合、errorを返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.store.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await fetchDeliveries();

      expect(result).toEqual({
        status: 'error',
        error: '納品データの取得に失敗しました',
      });
    });
  });

  describe('fetchDeliveryById', () => {
    it('配送が見つからない場合、failureを返す', async () => {
      vi.mocked(prisma.delivery.findFirst).mockResolvedValue(null);

      const result = await fetchDeliveryById('D0000001');

      expect(result).toEqual({
        success: false,
        error: '納品が見つかりませんでした',
      });
    });

    it('顧客が削除されている場合、適切なエラーを返す', async () => {
      const mockDelivery = {
        id: 'D0000001',
        deliveryDate: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
        customer: null, // 顧客が削除されている
        deliveryDetails: [],
      };

      vi.mocked(prisma.delivery.findFirst).mockResolvedValue(mockDelivery as any);

      const result = await fetchDeliveryById('D0000001');

      expect(result).toEqual({
        success: false,
        error: '関連する顧客データが削除されているため、納品情報を表示できません',
      });
    });

    it('配送が見つかった場合、配送データを返す', async () => {
      const mockDelivery = {
        id: 'D0000001',
        deliveryDate: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
        deletedAt: null,
        customer: {
          id: 'C-00001',
          name: '顧客1',
          updatedAt: new Date('2025-01-01'),
          deletedAt: null,
        },
        deliveryDetails: [
          {
            id: 'D0000001-01',
            productName: '商品1',
            quantity: 2,
            updatedAt: new Date('2025-01-01'),
            deletedAt: null,
          },
        ],
      };

      vi.mocked(prisma.delivery.findFirst).mockResolvedValue(mockDelivery as any);

      const result = await fetchDeliveryById('D0000001');

      expect(result.success).toBe(true);
      expect(result.delivery.id).toBe('D0000001');
      expect(typeof result.delivery.deliveryDate).toBe('string');
    });

    it('エラーが発生した場合、failureを返す', async () => {
      vi.mocked(prisma.delivery.findFirst).mockRejectedValue(new Error('Database error'));

      const result = await fetchDeliveryById('D0000001');

      expect(result).toEqual({
        success: false,
        error: '納品データの取得に失敗しました',
      });
    });
  });

  describe('fetchUndeliveredOrderDetails', () => {
    it('店舗IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await fetchUndeliveredOrderDetails('C-00001', 'D0000001');

      expect(result).toEqual({
        success: false,
        error: '店舗を選択してください',
      });
    });


    it('エラーが発生した場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.orderDetail.findMany).mockRejectedValue(new Error('Database error'));

      const result = await fetchUndeliveredOrderDetails('C-00001', 'D0000001');

      expect(result).toEqual({
        success: false,
        error: '未納品注文明細の取得に失敗しました',
      });
    });
  });

  describe('updateDeliveryAllocations', () => {
    const mockAllocations = [
      {
        orderDetailId: 'O0000001-01',
        allocatedQuantity: 5,
        unitPrice: 1000,
        productName: '商品1',
      },
    ];

    it('店舗IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await updateDeliveryAllocations('D0000001', mockAllocations);

      expect(result).toEqual({
        success: false,
        error: '店舗を選択してください',
      });
    });

    it('納品が見つからない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(null);

      const result = await updateDeliveryAllocations('D0000001', mockAllocations);

      expect(result).toEqual({
        success: false,
        error: '納品が見つからないか、アクセス権限がありません',
      });
    });

    it('正常な場合、成功を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
        id: 'D0000001',
        customer: { storeId: 'store-1' },
      } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const result = await updateDeliveryAllocations('D0000001', mockAllocations);

      expect(result).toEqual({
        success: true,
        message: '納品割り当てを更新しました',
      });
    });

    it('エラーが発生した場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await updateDeliveryAllocations('D0000001', mockAllocations);

      expect(result).toEqual({
        success: false,
        error: '納品割り当ての更新に失敗しました',
      });
    });
  });

  describe('fetchDeliveryForEdit', () => {
    it('店舗IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await fetchDeliveryForEdit('D0000001');

      expect(result).toEqual({
        success: false,
        error: '店舗を選択してください',
      });
    });

    it('納品が見つからない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(null);

      const result = await fetchDeliveryForEdit('D0000001');

      expect(result).toEqual({
        success: false,
        error: '納品が見つからないか、アクセス権限がありません',
      });
    });

    it('正常な場合、納品データを返す', async () => {
      const mockDelivery = {
        id: 'D0000001',
        customerId: 'C-00001',
        deliveryDate: new Date('2025-01-01'),
        totalAmount: 5000,
        totalQuantity: 5,
        note: 'テスト',
        customer: {
          id: 'C-00001',
          name: '顧客1',
          contactPerson: '担当者1',
          address: '住所1',
          phone: '090-1234-5678',
          deliveryCondition: '配送条件1',
          note: '備考1',
          storeId: 'store-1',
          isDeleted: false,
        },
        deliveryDetails: [],
      };

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery as any);

      const result = await fetchDeliveryForEdit('D0000001');

      expect(result.success).toBe(true);
      expect(result.delivery.id).toBe('D0000001');
      expect(result.delivery.customer.name).toBe('顧客1');
    });

    it('エラーが発生した場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await fetchDeliveryForEdit('D0000001');

      expect(result).toEqual({
        success: false,
        error: '納品データの取得に失敗しました',
      });
    });
  });

  describe('createDelivery', () => {
    const mockDeliveryData = {
      customerId: 'C-00001',
      deliveryDate: new Date('2025-01-01'),
      note: 'テスト納品',
    };

    const mockAllocations = [
      {
        orderDetailId: 'O0000001-01',
        allocatedQuantity: 5,
        unitPrice: 1000,
        productName: '商品1',
      },
    ];

    it('店舗IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await createDelivery(mockDeliveryData, mockAllocations);

      expect(result).toEqual({
        success: false,
        error: '店舗を選択してください',
      });
    });

    it('顧客が見つからない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findUnique).mockResolvedValue(null);

      const result = await createDelivery(mockDeliveryData, mockAllocations);

      expect(result).toEqual({
        success: false,
        error: '顧客が見つからないか、アクセス権限がありません',
      });
    });

    it('割り当てが空の場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        id: 'C-00001',
        storeId: 'store-1',
      } as any);

      const result = await createDelivery(mockDeliveryData, []);

      expect(result).toEqual({
        success: false,
        error: '納品する商品を選択してください',
      });
    });

    it('正常な場合、成功を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        id: 'C-00001',
        storeId: 'store-1',
      } as any);
      vi.mocked(prisma.delivery.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockResolvedValue({ id: 'D0000001' });

      const result = await createDelivery(mockDeliveryData, mockAllocations);

      expect(result.success).toBe(true);
      expect(result.deliveryId).toBe('D0000001');
      expect(result.message).toBe('納品を作成しました');
    });

    it('エラーが発生した場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await createDelivery(mockDeliveryData, mockAllocations);

      expect(result).toEqual({
        success: false,
        error: '納品の作成に失敗しました',
      });
    });
  });

  describe('fetchUndeliveredOrderDetailsForCreate', () => {
    it('店舗IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await fetchUndeliveredOrderDetailsForCreate('C-00001');

      expect(result).toEqual({
        success: false,
        error: '店舗を選択してください',
      });
    });

    it('正常な場合、未納品注文明細を返す', async () => {
      const mockOrderDetails = [
        {
          id: 'O0000001-01',
          orderId: 'O0000001',
          productName: '商品1',
          unitPrice: 1000,
          quantity: 10,
          description: '説明1',
          order: {
            orderDate: new Date('2025-01-01'),
          },
          deliveryAllocations: [],
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.orderDetail.findMany).mockResolvedValue(mockOrderDetails as any);

      const result = await fetchUndeliveredOrderDetailsForCreate('C-00001');

      expect(result.success).toBe(true);
      expect(result.orderDetails).toHaveLength(1);
      expect(result.orderDetails[0].orderDetailId).toBe('O0000001-01');
      expect(result.orderDetails[0].remainingQuantity).toBe(10);
    });

    it('エラーが発生した場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.orderDetail.findMany).mockRejectedValue(new Error('Database error'));

      const result = await fetchUndeliveredOrderDetailsForCreate('C-00001');

      expect(result).toEqual({
        success: false,
        error: '未納品注文明細の取得に失敗しました',
      });
    });
  });

  describe('deleteDelivery', () => {
    it('店舗IDがない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue(null);

      const result = await deleteDelivery('D0000001');

      expect(result).toEqual({
        success: false,
        error: '店舗を選択してください',
      });
    });

    it('納品が見つからない場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(null);

      const result = await deleteDelivery('D0000001');

      expect(result).toEqual({
        success: false,
        error: '納品が見つからないか、アクセス権限がありません',
      });
    });

    it('正常な場合、成功を返す', async () => {
      const mockDelivery = {
        id: 'D0000001',
        customer: { storeId: 'store-1' },
        deliveryDetails: [],
      };

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery as any);
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const result = await deleteDelivery('D0000001');

      expect(result).toEqual({
        success: true,
        message: '納品を削除しました',
      });
    });

    it('エラーが発生した場合、失敗を返す', async () => {
      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockRejectedValue(new Error('Database error'));

      const result = await deleteDelivery('D0000001');

      expect(result).toEqual({
        success: false,
        error: '納品の削除に失敗しました',
      });
    });
  });
});