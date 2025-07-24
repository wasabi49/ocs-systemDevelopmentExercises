'use server';

import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';
import { Order, Customer } from '@/app/generated/prisma';
import { logger } from '@/lib/logger';

type OrderWithCustomer = Order & { customer: Customer };

/**
 * 注文一覧データを実際の納品状況付きで取得するServer Action
 * @returns 注文と顧客情報、計算された納品状況を含むデータの配列
 */
export async function fetchOrdersWithDeliveryStatus() {
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
          isDeleted: false,
        },
      },
      include: {
        customer: true,
        orderDetails: {
          where: {
            isDeleted: false,
          },
          include: {
            deliveryAllocations: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    // 各注文の実際の納品状況を計算
    const ordersWithCalculatedStatus = orders.map(order => {
      // 全ての注文明細の納品状況を確認
      const allItemsCompleted = order.orderDetails.length > 0 && order.orderDetails.every(detail => {
        const totalAllocated = detail.deliveryAllocations.reduce(
          (sum, allocation) => sum + allocation.allocatedQuantity,
          0
        );
        return totalAllocated >= detail.quantity;
      });

      const calculatedStatus = allItemsCompleted ? '完了' : '未完了';

      return {
        ...order,
        calculatedStatus, // 実際の納品状況に基づく計算されたステータス
        orderDate: order.orderDate.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        deletedAt: order.deletedAt ? order.deletedAt.toISOString() : null,
        customer: {
          ...order.customer,
          updatedAt: order.customer.updatedAt.toISOString(),
          deletedAt: order.customer.deletedAt ? order.customer.deletedAt.toISOString() : null,
        },
      };
    });

    return {
      status: 'success' as const,
      data: ordersWithCalculatedStatus,
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
 * 注文一覧データを取得するServer Action（従来版）
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

    // 入力値の検証
    if (!data.customerId || data.customerId.trim() === '') {
      return {
        success: false,
        error: '顧客IDが指定されていません',
      };
    }

    if (!data.orderDetails || data.orderDetails.length === 0) {
      return {
        success: false,
        error: '注文明細が指定されていません',
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
 * 指定されたIDの注文を納品配分情報付きで取得するServer Action
 * @param id 注文ID
 * @returns 注文と顧客情報、納品配分情報を含むデータ
 */
export async function fetchOrderWithDeliveryAllocations(id: string) {
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
          include: {
            deliveryAllocations: {
              where: {
                isDeleted: false,
              },
              include: {
                deliveryDetail: {
                  include: {
                    delivery: true,
                  },
                },
              },
            },
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

    // 各注文明細の納品状況を計算
    const orderDetailsWithStatus = order.orderDetails.map(detail => {
      // 配分数量の合計を計算
      const totalAllocated = detail.deliveryAllocations.reduce(
        (sum, allocation) => sum + allocation.allocatedQuantity,
        0
      );

      // 納品状況を判定
      let deliveryStatus: string;
      if (totalAllocated === 0) {
        deliveryStatus = '未納品';
      } else if (totalAllocated >= detail.quantity) {
        deliveryStatus = '完了';
      } else {
        deliveryStatus = '一部納品';
      }

      // 納品配分情報を整理
      const deliveryAllocations = detail.deliveryAllocations.map(allocation => ({
        deliveryDetailId: allocation.deliveryDetailId,
        deliveryDate: allocation.deliveryDetail.delivery.deliveryDate.toISOString().split('T')[0],
        allocatedQuantity: allocation.allocatedQuantity,
        deliveryId: allocation.deliveryDetail.delivery.id,
      }));

      return {
        ...detail,
        totalDelivered: totalAllocated,
        deliveryStatus,
        deliveryAllocations,
      };
    });

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
        orderDetails: orderDetailsWithStatus,
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
 * 注文を更新するServer Action
 */
/**
 * 注文の実際のステータスを計算し、データベースを更新する関数
 * @param orderId 注文ID
 * @returns 更新結果
 */
export async function syncOrderStatus(orderId: string) {
  try {
    // 注文の詳細と納品配分情報を取得
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        isDeleted: false,
      },
      include: {
        orderDetails: {
          where: {
            isDeleted: false,
          },
          include: {
            deliveryAllocations: {
              where: {
                isDeleted: false,
              },
            },
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

    // 全ての注文明細の納品状況を確認
    const allItemsCompleted = order.orderDetails.length > 0 && order.orderDetails.every(detail => {
      const totalAllocated = detail.deliveryAllocations.reduce(
        (sum, allocation) => sum + allocation.allocatedQuantity,
        0
      );
      return totalAllocated >= detail.quantity;
    });

    const calculatedStatus = allItemsCompleted ? '完了' : '未完了';

    // 現在のステータスと異なる場合のみ更新
    if (order.status !== calculatedStatus) {
      await prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: calculatedStatus,
        },
      });

      logger.info('注文ステータスを自動更新しました', {
        orderId,
        oldStatus: order.status,
        newStatus: calculatedStatus,
      });
    }

    return {
      success: true,
      status: calculatedStatus,
      updated: order.status !== calculatedStatus,
    };
  } catch (error) {
    logger.error('注文ステータスの同期に失敗しました', { 
      orderId,
      error: error instanceof Error ? error.message : String(error) 
    });
    return {
      success: false,
      error: '注文ステータスの同期に失敗しました',
    };
  }
}

export async function updateOrder(
  orderId: string,
  data: {
    orderDate: string;
    customerId: string;
    note: string | null;
    orderDetails: Array<{
      id?: string; // 既存の明細IDを追加
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
      include: {
        orderDetails: {
          where: {
            isDeleted: false,
          },
        },
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
      // 注文を更新（ステータスは明細の納品状況に基づいて自動決定されるため、現在の値を保持）
      const order = await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          orderDate: new Date(data.orderDate),
          customerId: data.customerId,
          note: data.note,
          // status: data.status, // ステータスは自動管理のため削除
        },
      });

      // 既存の明細IDのマップを作成
      const existingDetailsMap = new Map(
        existingOrder.orderDetails.map(detail => [detail.id, detail])
      );
      
      // 更新後に残る明細IDのセット
      const remainingDetailIds = new Set<string>();
      
      // 注文明細を更新または作成
      const orderDetails = await Promise.all(
        data.orderDetails.map(async (detail, index) => {
          // 既存の明細の場合は更新
          if (detail.id && existingDetailsMap.has(detail.id) && !detail.id.startsWith('TEMP-')) {
            remainingDetailIds.add(detail.id);
            return await tx.orderDetail.update({
              where: {
                id: detail.id,
              },
              data: {
                productName: detail.productName,
                unitPrice: detail.unitPrice,
                quantity: detail.quantity,
                description: detail.description,
              },
            });
          } else {
            // 新しい明細の場合は作成
            // 既存のIDと重複しないようにIDを生成
            const existingIds = new Set(existingOrder.orderDetails.map(od => od.id));
            let newId = `${order.id}-${(index + 1).toString().padStart(2, '0')}`;
            let counter = index + 1;
            
            while (existingIds.has(newId) || remainingDetailIds.has(newId)) {
              counter++;
              newId = `${order.id}-${counter.toString().padStart(2, '0')}`;
            }
            
            remainingDetailIds.add(newId);
            
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
          }
        })
      );

      // 削除された明細を論理削除（更新後に残っていない明細）
      const deletedDetailIds = existingOrder.orderDetails
        .filter(detail => !remainingDetailIds.has(detail.id))
        .map(detail => detail.id);
      
      if (deletedDetailIds.length > 0) {
        await tx.orderDetail.updateMany({
          where: {
            id: {
              in: deletedDetailIds,
            },
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      }

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
