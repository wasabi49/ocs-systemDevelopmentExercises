'use server';

import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';
import { Delivery, Customer } from '@/app/generated/prisma';

type DeliveryWithCustomer = Delivery & { customer: Customer };

/**
 * 納品一覧データを取得するServer Action
 * @returns 納品データの配列
 */
export async function fetchDeliveries() {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        status: 'store_required' as const,
        error: '店舗を選択してください',
      };
    }

    const storeExists = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!storeExists) {
      return {
        status: 'store_invalid' as const,
        error: '指定された店舗が見つかりません',
      };
    }

    const deliveries = await prisma.delivery.findMany({
      where: {
        isDeleted: false,
        customer: {
          storeId: storeId,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return {
      status: 'success' as const,
      data: deliveries.map((delivery: DeliveryWithCustomer) => ({
        id: delivery.id,
        date: delivery.deliveryDate.toISOString().split('T')[0].replace(/-/g, '/'),
        customerName: delivery.customer.name,
        note: delivery.note || '',
      })),
    };
  } catch (error) {
    console.error('納品データの取得に失敗しました:', error);
    return {
      status: 'error' as const,
      error: '納品データの取得に失敗しました',
    };
  }
}

/**
 * 指定されたIDの納品を取得するServer Action
 * @param id 納品ID
 * @returns 納品と顧客情報を含むデータ
 */
export async function fetchDeliveryById(id: string) {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: {
        id: id,
        isDeleted: false,
      },
      include: {
        customer: true, // 顧客情報を含める
        deliveryDetails: {
          where: { isDeleted: false },
        },
      },
    });

    if (!delivery) {
      return {
        success: false,
        error: '納品が見つかりませんでした',
      };
    }

    // 取得データをフロントエンド用にシリアライズ
    return {
      success: true,
      delivery: {
        ...delivery,
        deliveryDate: delivery.deliveryDate.toISOString(),
        updatedAt: delivery.updatedAt.toISOString(),
        deletedAt: delivery.deletedAt ? delivery.deletedAt.toISOString() : null,
        customer: {
          ...delivery.customer,
          updatedAt: delivery.customer.updatedAt.toISOString(),
          deletedAt: delivery.customer.deletedAt ? delivery.customer.deletedAt.toISOString() : null,
        },
        deliveryDetails: delivery.deliveryDetails.map((detail) => ({
          ...detail,
          updatedAt: detail.updatedAt.toISOString(),
          deletedAt: detail.deletedAt ? detail.deletedAt.toISOString() : null,
        })),
      },
    };
  } catch (error) {
    console.error('納品データの取得に失敗しました:', error);
    return {
      success: false,
      error: '納品データの取得に失敗しました',
    };
  }
}
