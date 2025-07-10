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
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
      vi.mocked(prisma.delivery.findMany).mockResolvedValue(mockDeliveries as unknown as Array<{ id: string; deliveryDate: Date; note: string; customer: { id: string; name: string } }>);

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

      vi.mocked(prisma.delivery.findFirst).mockResolvedValue(mockDelivery as unknown as { id: string; deliveryDate: Date; updatedAt: Date; deletedAt: Date | null; customer: unknown; deliveryDetails: Array<unknown> });

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

      vi.mocked(prisma.delivery.findFirst).mockResolvedValue(mockDelivery as unknown as { id: string; deliveryDate: Date; updatedAt: Date; deletedAt: Date | null; customer: unknown; deliveryDetails: Array<unknown> });

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
          deliveryAllocations: [
            {
              allocatedQuantity: 3,
              deliveryDetail: {
                deliveryId: 'D0000002', // 他の納品
              },
            },
          ],
        },
        {
          id: 'O0000001-02',
          orderId: 'O0000001',
          productName: '商品2',
          unitPrice: 500,
          quantity: 5,
          description: '説明2',
          order: {
            orderDate: new Date('2025-01-01'),
          },
          deliveryAllocations: [
            {
              allocatedQuantity: 2,
              deliveryDetail: {
                deliveryId: 'D0000001', // 現在編集中の納品
              },
            },
          ],
        },
      ];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.orderDetail.findMany).mockResolvedValue(mockOrderDetails as unknown as Array<{ id: string; productName: string; quantity: number; order: { id: string; orderDate: Date; customer: { id: string; name: string } } }>);

      const result = await fetchUndeliveredOrderDetails('C-00001', 'D0000001');

      expect(result.success).toBe(true);
      expect(result.orderDetails).toHaveLength(2);
      expect(result.orderDetails[0].remainingQuantity).toBe(7); // 10 - 3 (他の納品での割り当て)
      expect(result.orderDetails[0].currentAllocation).toBe(0);
      expect(result.orderDetails[1].remainingQuantity).toBe(5); // 5 - 0 (他の納品での割り当て)
      expect(result.orderDetails[1].currentAllocation).toBe(2);
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
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });
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
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery as unknown as { id: string; deliveryDate: Date; note: string; customer: { id: string; name: string } });

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
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });

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
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });
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
      vi.mocked(prisma.orderDetail.findMany).mockResolvedValue(mockOrderDetails as unknown as Array<{ id: string; productName: string; quantity: number; order: { id: string; orderDate: Date; customer: { id: string; name: string } } }>);

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
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery as unknown as { id: string; deliveryDate: Date; note: string; customer: { id: string; name: string } });
      vi.mocked(prisma.$transaction).mockResolvedValue(undefined);

      const result = await deleteDelivery('D0000001');

      expect(result).toEqual({
        success: true,
        message: '納品を削除しました',
      });
    });

    it('納品明細がある場合の削除テスト', async () => {
      const mockDelivery = {
        id: 'D0000001',
        customer: { storeId: 'store-1' },
        deliveryDetails: [
          {
            id: 'D0000001-01',
            deliveryAllocations: [
              {
                orderDetailId: 'O0000001-01',
                deliveryDetailId: 'D0000001-01',
              },
            ],
          },
        ],
      };

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(mockDelivery as unknown as { id: string; deliveryDate: Date; note: string; customer: { id: string; name: string } });

      const updateAllocationMock = vi.fn();
      const updateDetailMock = vi.fn();
      const updateDeliveryMock = vi.fn();

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          deliveryAllocation: {
            update: updateAllocationMock,
          },
          deliveryDetail: {
            update: updateDetailMock,
          },
          delivery: {
            update: updateDeliveryMock,
          },
        };
        await fn(tx);
        return undefined;
      });

      const result = await deleteDelivery('D0000001');

      expect(result).toEqual({
        success: true,
        message: '納品を削除しました',
      });
      expect(updateAllocationMock).toHaveBeenCalled();
      expect(updateDetailMock).toHaveBeenCalled();
      expect(updateDeliveryMock).toHaveBeenCalled();
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

  describe('generateDeliveryId', () => {
    // generateDeliveryIdはcreateDelivery関数内で呼び出されるため、
    // createDeliveryを通じてテスト
    it('既存の納品IDがある場合、次の番号を生成する', async () => {
      const mockDeliveryData = {
        customerId: 'C-00001',
        deliveryDate: new Date('2025-01-01'),
        note: 'テスト',
      };
      const mockAllocations = [{
        orderDetailId: 'O0000001-01',
        allocatedQuantity: 5,
        unitPrice: 1000,
        productName: '商品1',
      }];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        id: 'C-00001',
        storeId: 'store-1',
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });
      // 既存の最後の納品IDを返す
      vi.mocked(prisma.delivery.findFirst).mockResolvedValue({ id: 'D0000005' } as unknown as { id: string });
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(null);

      const createMock = vi.fn().mockResolvedValue({ id: 'D0000006' });
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          delivery: {
            create: createMock,
          },
          deliveryDetail: {
            create: vi.fn(),
          },
          deliveryAllocation: {
            create: vi.fn(),
          },
        };
        return await fn(tx);
      });

      const result = await createDelivery(mockDeliveryData, mockAllocations);

      expect(result.success).toBe(true);
      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'D0000006',
        }),
      });
    });

    it('generateDeliveryIdで無効なIDがある場合のブランチテスト', async () => {
      const mockDeliveryData = {
        customerId: 'C-00001',
        deliveryDate: new Date('2025-01-01'),
        note: 'テスト',
      };
      const mockAllocations = [{
        orderDetailId: 'O0000001-01',
        allocatedQuantity: 5,
        unitPrice: 1000,
        productName: '商品1',
      }];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        id: 'C-00001',
        storeId: 'store-1',
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });
      // 無効な番号部分を含むIDを返す
      vi.mocked(prisma.delivery.findFirst).mockResolvedValue({ id: 'Dinvalid' } as unknown as { id: string });
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(null);

      const createMock = vi.fn().mockResolvedValue({ id: 'D0000001' });
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          delivery: {
            create: createMock,
          },
          deliveryDetail: {
            create: vi.fn(),
          },
          deliveryAllocation: {
            create: vi.fn(),
          },
        };
        return await fn(tx);
      });

      const result = await createDelivery(mockDeliveryData, mockAllocations);

      expect(result.success).toBe(true);
      // 無効な番号の場合、1から開始
      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'D0000001',
        }),
      });
    });

    it('既存の納品IDがない場合、D0000001から開始する', async () => {
      const mockDeliveryData = {
        customerId: 'C-00001',
        deliveryDate: new Date('2025-01-01'),
        note: 'テスト',
      };
      const mockAllocations = [{
        orderDetailId: 'O0000001-01',
        allocatedQuantity: 5,
        unitPrice: 1000,
        productName: '商品1',
      }];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.customer.findUnique).mockResolvedValue({
        id: 'C-00001',
        storeId: 'store-1',
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });
      // 既存の納品がない
      vi.mocked(prisma.delivery.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue(null);

      const createMock = vi.fn().mockResolvedValue({ id: 'D0000001' });
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          delivery: {
            create: createMock,
          },
          deliveryDetail: {
            create: vi.fn(),
          },
          deliveryAllocation: {
            create: vi.fn(),
          },
        };
        return await fn(tx);
      });

      const result = await createDelivery(mockDeliveryData, mockAllocations);

      expect(result.success).toBe(true);
      expect(createMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'D0000001',
        }),
      });
    });
  });

  describe('updateDeliveryAllocations 追加テスト', () => {
    it('新しい割り当てを作成する場合', async () => {
      const allocations = [{
        orderDetailId: 'O0000001-01',
        allocatedQuantity: 3,
        unitPrice: 1000,
        productName: '新商品',
      }];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
        id: 'D0000001',
        customer: { storeId: 'store-1' },
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });

      const updateMock = vi.fn();
      const createDetailMock = vi.fn();
      const createAllocationMock = vi.fn();
      const findFirstMock = vi.fn().mockResolvedValue(null);
      const findManyMock = vi.fn().mockResolvedValue([]);

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          deliveryAllocation: {
            findFirst: findFirstMock,
            create: createAllocationMock,
            update: vi.fn(),
          },
          deliveryDetail: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: createDetailMock,
            update: vi.fn(),
            findMany: findManyMock,
          },
          delivery: {
            update: updateMock,
          },
        };
        await fn(tx);
        return undefined;
      });

      const result = await updateDeliveryAllocations('D0000001', allocations);

      expect(result.success).toBe(true);
      expect(createDetailMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'D0000001-01',
          deliveryId: 'D0000001',
          productName: '新商品',
          unitPrice: 1000,
          quantity: 3,
        }),
      });
      expect(createAllocationMock).toHaveBeenCalled();
    });

    it('既存の割り当ての数量をゼロにする場合、論理削除を実行', async () => {
      const allocations = [{
        orderDetailId: 'O0000001-01',
        allocatedQuantity: 0,
        unitPrice: 1000,
        productName: '商品1',
      }];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
        id: 'D0000001',
        customer: { storeId: 'store-1' },
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });

      const updateAllocationMock = vi.fn();
      const updateDetailMock = vi.fn();
      const updateDeliveryMock = vi.fn();

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          deliveryAllocation: {
            findFirst: vi.fn().mockResolvedValue({
              orderDetailId: 'O0000001-01',
              deliveryDetailId: 'D0000001-01',
              deliveryDetail: { id: 'D0000001-01' },
            }),
            update: updateAllocationMock,
          },
          deliveryDetail: {
            update: updateDetailMock,
            findMany: vi.fn().mockResolvedValue([]),
          },
          delivery: {
            update: updateDeliveryMock,
          },
        };
        await fn(tx);
        return undefined;
      });

      const result = await updateDeliveryAllocations('D0000001', allocations);

      expect(result.success).toBe(true);
      expect(updateAllocationMock).toHaveBeenCalledWith({
        where: {
          orderDetailId_deliveryDetailId: {
            orderDetailId: 'O0000001-01',
            deliveryDetailId: 'D0000001-01',
          },
        },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
      });
      expect(updateDetailMock).toHaveBeenCalledWith({
        where: { id: 'D0000001-01' },
        data: {
          isDeleted: true,
          deletedAt: expect.any(Date),
        },
      });
    });

    it('既存の割り当ての数量を変更する場合、更新を実行', async () => {
      const allocations = [{
        orderDetailId: 'O0000001-01',
        allocatedQuantity: 8,
        unitPrice: 1200,
        productName: '更新商品',
      }];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
        id: 'D0000001',
        customer: { storeId: 'store-1' },
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });

      const updateAllocationMock = vi.fn();
      const updateDetailMock = vi.fn();
      const updateDeliveryMock = vi.fn();

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          deliveryAllocation: {
            findFirst: vi.fn().mockResolvedValue({
              orderDetailId: 'O0000001-01',
              deliveryDetailId: 'D0000001-01',
              deliveryDetail: { id: 'D0000001-01' },
            }),
            update: updateAllocationMock,
          },
          deliveryDetail: {
            update: updateDetailMock,
            findMany: vi.fn().mockResolvedValue([{
              unitPrice: 1200,
              quantity: 8,
            }]),
          },
          delivery: {
            update: updateDeliveryMock,
          },
        };
        await fn(tx);
        return undefined;
      });

      const result = await updateDeliveryAllocations('D0000001', allocations);

      expect(result.success).toBe(true);
      expect(updateAllocationMock).toHaveBeenCalledWith({
        where: {
          orderDetailId_deliveryDetailId: {
            orderDetailId: 'O0000001-01',
            deliveryDetailId: 'D0000001-01',
          },
        },
        data: {
          allocatedQuantity: 8,
        },
      });
      expect(updateDetailMock).toHaveBeenCalledWith({
        where: { id: 'D0000001-01' },
        data: {
          quantity: 8,
          productName: '更新商品',
          unitPrice: 1200,
        },
      });
    });

    it('納品明細のシーケンスナンバー生成テスト', async () => {
      const allocations = [{
        orderDetailId: 'O0000001-01',
        allocatedQuantity: 5,
        unitPrice: 1000,
        productName: '商品1',
      }];

      vi.mocked(getStoreIdFromCookie).mockResolvedValue('store-1');
      vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
        id: 'D0000001',
        customer: { storeId: 'store-1' },
      } as unknown as { id: string; name: string; storeId: string; isDeleted: boolean });

      const createDetailMock = vi.fn();
      const createAllocationMock = vi.fn();
      const updateDeliveryMock = vi.fn();

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          deliveryAllocation: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: createAllocationMock,
          },
          deliveryDetail: {
            findFirst: vi.fn().mockResolvedValue({ id: 'D0000001-02' }), // 既存の明細あり
            create: createDetailMock,
            findMany: vi.fn().mockResolvedValue([]),
          },
          delivery: {
            update: updateDeliveryMock,
          },
        };
        await fn(tx);
        return undefined;
      });

      const result = await updateDeliveryAllocations('D0000001', allocations);

      expect(result.success).toBe(true);
      expect(createDetailMock).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'D0000001-03', // 次のシーケンス
        }),
      });
    });
  });
});