'use server';

import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';

/**
 * 統計情報を取得するServer Action
 * @returns 統計データの配列
 */
export async function fetchStatistics() {
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

    // 統計情報を顧客情報と一緒に取得
    const statistics = await prisma.statistics.findMany({
      where: {
        isDeleted: false,
        customer: {
          storeId: storeId,
          isDeleted: false,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        customer: {
          id: 'asc',
        },
      },
    });

    return {
      status: 'success' as const,
      data: statistics.map((stat) => ({
        customerId: stat.customer.id,
        customerName: stat.customer.name,
        averageLeadTime: stat.averageLeadTime || 0,
        totalSales: stat.totalSales || 0,
        updatedAt: stat.updatedAt.toISOString(),
      })),
    };
  } catch (error) {
    console.error('統計データの取得に失敗しました:', error);
    return {
      status: 'error' as const,
      error: '統計データの取得に失敗しました',
    };
  }
}

/**
 * 統計情報を再計算するServer Action
 * 注文データと納品データから平均リードタイムと累計売上を計算してStatisticsテーブルを更新
 */
export async function recalculateStatistics() {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        status: 'store_required' as const,
        error: '店舗を選択してください',
      };
    }

    // 対象店舗の顧客を取得
    const customers = await prisma.customer.findMany({
      where: {
        storeId: storeId,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    // 各顧客の統計情報を計算
    for (const customer of customers) {
      // 顧客の注文データから累計売上を計算
      const orders = await prisma.order.findMany({
        where: {
          customerId: customer.id,
          isDeleted: false,
        },
        include: {
          orderDetails: true,
        },
      });

      const totalSales = orders.reduce((total, order) => {
        const orderTotal = order.orderDetails
          .filter((detail) => !detail.isDeleted)
          .reduce((orderSum, detail) => {
            return orderSum + detail.unitPrice * detail.quantity;
          }, 0);
        return total + orderTotal;
      }, 0);

      // 平均リードタイムを計算（注文日から最初の納品日まで）
      let totalLeadTime = 0;
      let completedOrders = 0;

      for (const order of orders) {
        // 注文の最初の納品日を取得
        const firstDelivery = await prisma.delivery.findFirst({
          where: {
            customerId: customer.id,
            deliveryDate: {
              gte: order.orderDate,
            },
            isDeleted: false,
          },
          orderBy: {
            deliveryDate: 'asc',
          },
        });

        if (firstDelivery) {
          const leadTimeDays = Math.ceil(
            (firstDelivery.deliveryDate.getTime() - order.orderDate.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          totalLeadTime += leadTimeDays;
          completedOrders++;
        }
      }

      const averageLeadTime = completedOrders > 0 ? totalLeadTime / completedOrders : 0;

      // Statisticsテーブルを更新または作成
      await prisma.statistics.upsert({
        where: {
          customerId: customer.id,
        },
        update: {
          averageLeadTime: averageLeadTime,
          totalSales: totalSales,
          isDeleted: false,
        },
        create: {
          customerId: customer.id,
          averageLeadTime: averageLeadTime,
          totalSales: totalSales,
          isDeleted: false,
        },
      });
    }

    return {
      status: 'success' as const,
      message: '統計情報を再計算しました',
    };
  } catch (error) {
    console.error('統計情報の再計算に失敗しました:', error);
    return {
      status: 'error' as const,
      error: '統計情報の再計算に失敗しました',
    };
  }
}
