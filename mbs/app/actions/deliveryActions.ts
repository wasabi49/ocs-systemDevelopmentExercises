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
          isDeleted: false, // 削除されていない顧客のみ
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
        customer: {
          isDeleted: false, // 削除されていない顧客のみ
        },
      },
      include: {
        customer: true,
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

    // 顧客が削除されている場合のチェック
    if (!delivery.customer) {
      return {
        success: false,
        error: '関連する顧客データが削除されているため、納品情報を表示できません',
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

/**
 * 指定されたIDの納品を削除するServer Action
 * @param id 納品ID
 * @returns 削除結果
 */
export async function deleteDeliveryById(id: string) {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 納品の存在確認と店舗の権限チェック
    const delivery = await prisma.delivery.findFirst({
      where: {
        id: id,
        isDeleted: false,
        customer: {
          storeId: storeId,
          isDeleted: false,
        },
      },
      include: {
        deliveryDetails: {
          where: { isDeleted: false },
          include: {
            deliveryAllocations: {
              where: { isDeleted: false },
            },
          },
        },
      },
    });

    if (!delivery) {
      return {
        success: false,
        error: '納品が見つからないか、削除権限がありません',
      };
    }

    // トランザクション内で関連データを論理削除
    await prisma.$transaction(async (prisma) => {
      const now = new Date();

      // 納品割当を論理削除
      for (const detail of delivery.deliveryDetails) {
        if (detail.deliveryAllocations.length > 0) {
          await prisma.deliveryAllocation.updateMany({
            where: {
              deliveryDetailId: detail.id,
              isDeleted: false,
            },
            data: {
              isDeleted: true,
              deletedAt: now,
            },
          });
        }
      }

      // 納品明細を論理削除
      if (delivery.deliveryDetails.length > 0) {
        await prisma.deliveryDetail.updateMany({
          where: {
            deliveryId: id,
            isDeleted: false,
          },
          data: {
            isDeleted: true,
            deletedAt: now,
          },
        });
      }

      // 納品を論理削除
      await prisma.delivery.update({
        where: { id: id },
        data: {
          isDeleted: true,
          deletedAt: now,
        },
      });
    });

    return {
      success: true,
      message: '納品を削除しました',
    };
  } catch (error) {
    console.error('納品削除に失敗しました:', error);
    return {
      success: false,
      error: '納品削除に失敗しました',
    };
  }
}
