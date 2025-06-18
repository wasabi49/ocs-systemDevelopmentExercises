'use server';

import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';
import { Order, Customer } from '@/app/generated/prisma';

type OrderWithCustomer = Order & { customer: Customer };

/**
 * 注文一覧データを取得するServer Action
 * @returns 注文と顧客情報を含むデータの配列
 */
export async function fetchOrders() {
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

    const orders = await prisma.order.findMany({
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
        isDeleted: false,
      },
      include: {
        customer: {
          where: {
            isDeleted: false, // 削除されていない顧客のみ
          },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        error: '注文が見つかりませんでした',
      };
    }

    // 顧客が削除されている場合のチェック
    if (!order.customer) {
      return {
        success: false,
        error: '関連する顧客データが削除されているため、注文情報を表示できません',
      };
    }

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

/**
 * useActionState用の注文一覧データ取得アクション
 * @returns 注文データの状態
 */
export async function fetchOrdersAction() {
  try {
    // 既存のfetchOrders関数を使用
    const result = await fetchOrders();

    return {
      loading: false,
      error: result.status === 'error' ? result.error : null,
      data: result.status === 'success' ? result.data : [],
    };
  } catch (error) {
    console.error('注文データの取得に失敗しました:', error);
    return {
      loading: false,
      error: '注文データの取得中にエラーが発生しました',
      data: [],
    };
  }
}
