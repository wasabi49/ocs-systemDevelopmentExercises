'use server';

import prisma from '@/lib/prisma';
import { Delivery, Customer } from '@/app/generated/prisma';

type DeliveryWithCustomer = Delivery & { customer: Customer };

/**
 * 納品一覧データを取得するServer Action
 * @returns 納品データの配列
 */
export async function fetchDeliveries() {
  try {
    // Prismaを使って納品データを取得（顧客情報を含む）
    const deliveries = await prisma.delivery.findMany({
      where: {
        isDeleted: false, // 削除されていないデータのみ
      },
      include: {
        customer: true, // 顧客情報を含める
      },
      orderBy: {
        id: 'asc', // IDで昇順ソート
      },
    });

    // 取得データをフロントエンド用にシリアライズ
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
        isDeleted: false, // 削除されていないデータのみ
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
