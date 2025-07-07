'use server';

import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';
import { Order, Customer } from '@/app/generated/prisma';
import { logger } from '@/lib/logger';

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
    logger.error('注文データの取得に失敗しました', { error: error instanceof Error ? error.message : String(error) });
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
    const order = await prisma.order.findFirst({
      where: {
        id: id,
        isDeleted: false,
      },
      include: {
        customer: true,
        orderDetails: {
          where: {
            isDeleted: false,
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
    if (!order.customer || order.customer.isDeleted) {
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
    logger.error('注文データの取得に失敗しました', { error: error instanceof Error ? error.message : String(error) });
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
    logger.error('注文データの取得に失敗しました', { error: error instanceof Error ? error.message : String(error) });
    return {
      loading: false,
      error: '注文データの取得中にエラーが発生しました',
      data: [],
    };
  }
}

/**
 * 注文を作成するServer Action
 */
export async function createOrder(data: {
  orderDetails: {
    productName: string;
    unitPrice: number;
    quantity: number;
    description: string | null;
  }[];
  orderDate: string;
  customerId: string;
  note: string | null;
}) {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 顧客が存在し、選択された店舗に属しているか確認
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        storeId: storeId,
        isDeleted: false,
      },
    });

    if (!customer) {
      return {
        success: false,
        error: '指定された顧客が見つかりません',
      };
    }

    // 新しい注文IDを生成
    const lastOrder = await prisma.order.findFirst({
      where: {
        id: {
          startsWith: 'O',
        },
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        id: true,
      },
    });

    let nextNumber = 1;
    if (lastOrder) {
      const numberPart = lastOrder.id.substring(1);
      const lastNumber = parseInt(numberPart, 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const orderId = `O${nextNumber.toString().padStart(7, '0')}`;

    // トランザクションで注文と注文明細を作成
    const result = await prisma.$transaction(async (tx) => {
      // 注文を作成
      const order = await tx.order.create({
        data: {
          id: orderId,
          orderDate: new Date(data.orderDate),
          customerId: data.customerId,
          note: data.note,
          status: '未完了',
          isDeleted: false,
        },
      });

      // 注文明細を作成
      const orderDetails = await Promise.all(
        data.orderDetails.map((detail, index) =>
          tx.orderDetail.create({
            data: {
              id: `${order.id}-${(index + 1).toString().padStart(2, '0')}`,
              orderId: order.id,
              productName: detail.productName,
              unitPrice: detail.unitPrice,
              quantity: detail.quantity,
              description: detail.description,
              isDeleted: false,
            },
          })
        )
      );

      return { order, orderDetails };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error('注文の作成に失敗しました', { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: '注文の作成に失敗しました',
    };
  }
}

/**
 * 注文を削除するServer Action
 */
export async function deleteOrder(orderId: string) {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 注文が存在し、選択された店舗に属しているか確認
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        customer: {
          storeId: storeId,
        },
        isDeleted: false,
      },
    });

    if (!order) {
      return {
        success: false,
        error: '指定された注文が見つかりません',
      };
    }

    // 論理削除を実行
    await prisma.$transaction(async (tx) => {
      // 注文明細を論理削除
      await tx.orderDetail.updateMany({
        where: {
          orderId: orderId,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 注文を論理削除
      await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });

    return {
      success: true,
      message: '注文が正常に削除されました',
    };
  } catch (error) {
    logger.error('注文の削除に失敗しました', { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: '注文の削除に失敗しました',
    };
  }
}

/**
 * 注文を更新するServer Action
 */
export async function updateOrder(
  orderId: string,
  data: {
    orderDate: string;
    customerId: string;
    note: string | null;
    status: string;
    orderDetails: Array<{
      productName: string;
      unitPrice: number;
      quantity: number;
      description: string | null;
    }>;
  }
) {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 注文が存在し、選択された店舗に属しているか確認
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        customer: {
          storeId: storeId,
        },
        isDeleted: false,
      },
    });

    if (!existingOrder) {
      return {
        success: false,
        error: '指定された注文が見つかりません',
      };
    }

    // 顧客が存在し、選択された店舗に属しているか確認
    const customer = await prisma.customer.findFirst({
      where: {
        id: data.customerId,
        storeId: storeId,
        isDeleted: false,
      },
    });

    if (!customer) {
      return {
        success: false,
        error: '指定された顧客が見つかりません',
      };
    }

    // トランザクションで注文と注文明細を更新
    const result = await prisma.$transaction(async (tx) => {
      // 注文を更新
      const order = await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          orderDate: new Date(data.orderDate),
          customerId: data.customerId,
          note: data.note,
          status: data.status,
        },
      });

      // 既存の注文明細を論理削除
      await tx.orderDetail.updateMany({
        where: {
          orderId: orderId,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 既存の注文明細IDを取得して重複を避ける
      const existingOrderDetails = await tx.orderDetail.findMany({
        where: {
          orderId: order.id,
        },
        select: {
          id: true,
        },
      });

      const existingIds = new Set(existingOrderDetails.map(od => od.id));
      
      // 新しい注文明細を作成
      const orderDetails = await Promise.all(
        data.orderDetails.map(async (detail, index) => {
          // 重複しないIDを生成
          let newId = `${order.id}-${(index + 1).toString().padStart(2, '0')}`;
          let counter = index + 1;
          
          while (existingIds.has(newId)) {
            counter++;
            newId = `${order.id}-${counter.toString().padStart(2, '0')}`;
          }
          
          existingIds.add(newId);
          
          return await tx.orderDetail.create({
            data: {
              id: newId,
              orderId: order.id,
              productName: detail.productName,
              unitPrice: detail.unitPrice,
              quantity: detail.quantity,
              description: detail.description,
              isDeleted: false,
            },
          });
        })
      );

      return { order, orderDetails };
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    logger.error('注文の更新に失敗しました', { error: error instanceof Error ? error.message : String(error) });
    return {
      success: false,
      error: '注文の更新に失敗しました',
    };
  }
}
