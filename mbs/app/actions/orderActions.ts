'use server';

import prisma from '@/lib/prisma';
import { Order, Customer } from '@/app/generated/prisma';

type OrderWithCustomer = Order & { customer: Customer };

/**
 * 注文一覧データを取得するServer Action
 * @returns 注文と顧客情報を含むデータの配列
 */
export async function fetchOrders() {
  try {
    // Prismaを使って注文データを取得（顧客情報を含む）
    const orders = await prisma.order.findMany({
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
      data: orders.map((order: OrderWithCustomer) => ({
        ...order,
        orderDate: order.orderDate.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        deletedAt: order.deletedAt ? order.deletedAt.toISOString() : null,
        customer: {
          ...order.customer,
          updatedAt: order.customer.updatedAt.toISOString(),
          deletedAt: order.customer.deletedAt ? order.customer.deletedAt.toISOString() : null,
        },
      })),
    };
  } catch (error) {
    console.error('注文データの取得に失敗しました:', error);
    return {
      status: 'error' as const,
      error: '注文データの取得に失敗しました',
    };
  }
}

/**
 * 指定されたIDの注文を取得するServer Action
 * @param id 注文ID
 * @returns 注文と顧客情報を含むデータ
 */
export async function fetchOrderById(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: {
        id: id,
        isDeleted: false, // 削除されていないデータのみ
      },
      include: {
        customer: true, // 顧客情報を含める
      },
    });

    if (!order) {
      return {
        success: false,
        error: '注文が見つかりませんでした',
      };
    }

    // 取得データをフロントエンド用にシリアライズ
    return {
      success: true,
      order: {
        ...order,
        orderDate: order.orderDate.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        deletedAt: order.deletedAt ? order.deletedAt.toISOString() : null,
        customer: {
          ...order.customer,
          updatedAt: order.customer.updatedAt.toISOString(),
          deletedAt: order.customer.deletedAt ? order.customer.deletedAt.toISOString() : null,
        },
      },
    };
  } catch (error) {
    console.error('注文データの取得に失敗しました:', error);
    return {
      success: false,
      error: '注文データの取得に失敗しました',
    };
  }
}
