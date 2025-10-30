'use server';

import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';

/**
 * 統計情報を取得するServer Action（表示時自動更新付き）
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

    // 統計情報の最終更新時刻をチェック
    const latestStatistic = await prisma.statistics.findFirst({
      where: {
        isDeleted: false,
        customer: {
          storeId: storeId,
          isDeleted: false,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        updatedAt: true,
      },
    });

    const shouldUpdate = checkIfUpdateNeeded(latestStatistic?.updatedAt);

    // 更新が必要な場合は統計情報を再計算
    if (shouldUpdate) {
      await recalculateStatisticsForStore(storeId);
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
 * 更新が必要かどうかを判定する関数
 * @param lastUpdatedAt 最終更新日時
 * @returns 更新が必要な場合はtrue
 */
function checkIfUpdateNeeded(lastUpdatedAt?: Date): boolean {
  if (!lastUpdatedAt) {
    return true; // 統計データが存在しない場合は更新が必要
  }

  const now = new Date();
  const timeDiff = now.getTime() - lastUpdatedAt.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  // 24時間以上経過している場合は更新が必要
  return hoursDiff >= 24;
}

/**
 * 指定店舗の統計情報を再計算する関数
 * @param storeId 店舗ID
 */
async function recalculateStatisticsForStore(storeId: string) {
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

    await recalculateStatisticsForStore(storeId);

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
