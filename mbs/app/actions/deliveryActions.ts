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
 * 顧客の未完了・一部納品の注文明細と既存の納品割り当てを取得
 * @param customerId 顧客ID
 * @param deliveryId 現在編集中の納品ID
 * @returns 注文明細と割り当て情報
 */
export async function fetchUndeliveredOrderDetails(customerId: string, deliveryId: string) {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 顧客の未完了・一部納品の注文明細を取得
    const orderDetails = await prisma.orderDetail.findMany({
      where: {
        isDeleted: false,
        order: {
          customerId: customerId,
          isDeleted: false,
          customer: {
            storeId: storeId,
            isDeleted: false,
          },
          OR: [
            { status: '未完了' },
            { status: '完了' }, // 完了でも未納品分があるかもしれない
          ],
        },
      },
      include: {
        order: true,
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
      orderBy: [{ order: { orderDate: 'desc' } }, { id: 'asc' }],
    });

    // 各注文明細の未納品数量と現在の納品での割り当て数量を計算
    const enrichedOrderDetails = orderDetails
      .map((orderDetail) => {
        // 他の納品での総割り当て数量を計算
        const totalAllocatedInOtherDeliveries = orderDetail.deliveryAllocations
          .filter((allocation) => allocation.deliveryDetail.deliveryId !== deliveryId)
          .reduce((sum, allocation) => sum + allocation.allocatedQuantity, 0);

        // 現在の納品での割り当て数量を計算
        const currentDeliveryAllocation = orderDetail.deliveryAllocations
          .filter((allocation) => allocation.deliveryDetail.deliveryId === deliveryId)
          .reduce((sum, allocation) => sum + allocation.allocatedQuantity, 0);

        // 残り数量を計算
        const remainingQuantity = orderDetail.quantity - totalAllocatedInOtherDeliveries;

        // 残り数量がある場合のみ返す
        return remainingQuantity > 0
          ? {
              orderDetailId: orderDetail.id,
              orderId: orderDetail.orderId,
              productName: orderDetail.productName,
              unitPrice: orderDetail.unitPrice,
              totalQuantity: orderDetail.quantity,
              allocatedInOtherDeliveries: totalAllocatedInOtherDeliveries,
              currentAllocation: currentDeliveryAllocation,
              remainingQuantity: remainingQuantity,
              description: orderDetail.description,
              orderDate: orderDetail.order.orderDate.toISOString(),
            }
          : null;
      })
      .filter(Boolean);

    return {
      success: true,
      orderDetails: enrichedOrderDetails,
    };
  } catch (error) {
    console.error('未納品注文明細の取得に失敗しました:', error);
    return {
      success: false,
      error: '未納品注文明細の取得に失敗しました',
    };
  }
}

/**
 * 納品割り当ての更新
 * @param deliveryId 納品ID
 * @param allocations 割り当て情報の配列
 * @returns 更新結果
 */
export async function updateDeliveryAllocations(
  deliveryId: string,
  allocations: {
    orderDetailId: string;
    allocatedQuantity: number;
    unitPrice: number;
    productName: string;
  }[],
) {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 納品が存在し、適切な店舗に属するかチェック
    const delivery = await prisma.delivery.findUnique({
      where: {
        id: deliveryId,
        isDeleted: false,
      },
      include: {
        customer: true,
      },
    });

    if (!delivery || delivery.customer.storeId !== storeId) {
      return {
        success: false,
        error: '納品が見つからないか、アクセス権限がありません',
      };
    }

    await prisma.$transaction(async (tx) => {
      // 既存の割り当てを削除（論理削除）
      await tx.deliveryAllocation.updateMany({
        where: {
          deliveryDetail: {
            deliveryId: deliveryId,
          },
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      // 既存の納品明細を削除（論理削除）
      await tx.deliveryDetail.updateMany({
        where: {
          deliveryId: deliveryId,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      if (allocations.length > 0) {
        // 新しい納品明細ID生成のための連番取得
        const lastDeliveryDetail = await tx.deliveryDetail.findFirst({
          where: {
            deliveryId: deliveryId,
          },
          orderBy: {
            id: 'desc',
          },
          select: {
            id: true,
          },
        });

        let detailSequence = 1;
        if (lastDeliveryDetail) {
          const match = lastDeliveryDetail.id.match(/-(\d+)$/);
          if (match) {
            detailSequence = parseInt(match[1], 10) + 1;
          }
        }

        // 新しい納品明細と割り当てを作成
        for (const allocation of allocations) {
          const deliveryDetailId = `${deliveryId}-${detailSequence.toString().padStart(2, '0')}`;

          // 納品明細を作成
          await tx.deliveryDetail.create({
            data: {
              id: deliveryDetailId,
              deliveryId: deliveryId,
              productName: allocation.productName,
              unitPrice: allocation.unitPrice,
              quantity: allocation.allocatedQuantity,
            },
          });

          // 納品割り当てを作成
          await tx.deliveryAllocation.create({
            data: {
              orderDetailId: allocation.orderDetailId,
              deliveryDetailId: deliveryDetailId,
              allocatedQuantity: allocation.allocatedQuantity,
            },
          });

          detailSequence++;
        }

        // 納品の合計金額と合計数量を更新
        const totalAmount = allocations.reduce(
          (sum, alloc) => sum + alloc.unitPrice * alloc.allocatedQuantity,
          0,
        );
        const totalQuantity = allocations.reduce((sum, alloc) => sum + alloc.allocatedQuantity, 0);

        await tx.delivery.update({
          where: { id: deliveryId },
          data: {
            totalAmount: totalAmount,
            totalQuantity: totalQuantity,
          },
        });
      } else {
        // 割り当てがない場合は合計をゼロに
        await tx.delivery.update({
          where: { id: deliveryId },
          data: {
            totalAmount: 0,
            totalQuantity: 0,
          },
        });
      }
    });

    return {
      success: true,
      message: '納品割り当てを更新しました',
    };
  } catch (error) {
    console.error('納品割り当ての更新に失敗しました:', error);
    return {
      success: false,
      error: '納品割り当ての更新に失敗しました',
    };
  }
}

/**
 * 編集用の納品データを取得
 * @param deliveryId 納品ID
 * @returns 納品データと顧客情報
 */
export async function fetchDeliveryForEdit(deliveryId: string) {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    const delivery = await prisma.delivery.findUnique({
      where: {
        id: deliveryId,
        isDeleted: false,
      },
      include: {
        customer: true,
        deliveryDetails: {
          where: {
            isDeleted: false,
          },
          include: {
            deliveryAllocations: {
              where: {
                isDeleted: false,
              },
              include: {
                orderDetail: {
                  include: {
                    order: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (
      !delivery ||
      !delivery.customer ||
      delivery.customer.isDeleted ||
      delivery.customer.storeId !== storeId
    ) {
      return {
        success: false,
        error: '納品が見つからないか、アクセス権限がありません',
      };
    }

    // フロントエンド用にシリアライズ
    return {
      success: true,
      delivery: {
        id: delivery.id,
        customerId: delivery.customerId,
        deliveryDate: delivery.deliveryDate.toISOString(),
        totalAmount: delivery.totalAmount,
        totalQuantity: delivery.totalQuantity,
        note: delivery.note,
        customer: {
          id: delivery.customer.id,
          name: delivery.customer.name,
          contactPerson: delivery.customer.contactPerson,
          address: delivery.customer.address,
          phone: delivery.customer.phone,
          deliveryCondition: delivery.customer.deliveryCondition,
          note: delivery.customer.note,
        },
        deliveryDetails: delivery.deliveryDetails.map((detail) => ({
          id: detail.id,
          productName: detail.productName,
          unitPrice: detail.unitPrice,
          quantity: detail.quantity,
          allocations: detail.deliveryAllocations.map((alloc) => ({
            orderDetailId: alloc.orderDetailId,
            allocatedQuantity: alloc.allocatedQuantity,
            orderDetail: {
              id: alloc.orderDetail.id,
              orderId: alloc.orderDetail.orderId,
              productName: alloc.orderDetail.productName,
              unitPrice: alloc.orderDetail.unitPrice,
              quantity: alloc.orderDetail.quantity,
              description: alloc.orderDetail.description,
              orderDate: alloc.orderDetail.order.orderDate.toISOString(),
            },
          })),
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
 * 新しい納品を作成
 * @param deliveryData 納品データ
 * @param allocations 割り当て情報の配列
 * @returns 作成結果
 */
export async function createDelivery(
  deliveryData: {
    customerId: string;
    deliveryDate: Date;
    note?: string;
  },
  allocations: {
    orderDetailId: string;
    allocatedQuantity: number;
    unitPrice: number;
    productName: string;
  }[],
) {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 顧客が存在し、適切な店舗に属するかチェック
    const customer = await prisma.customer.findUnique({
      where: {
        id: deliveryData.customerId,
        isDeleted: false,
      },
    });

    if (!customer || customer.storeId !== storeId) {
      return {
        success: false,
        error: '顧客が見つからないか、アクセス権限がありません',
      };
    }

    if (allocations.length === 0) {
      return {
        success: false,
        error: '納品する商品を選択してください',
      };
    }

    // 新しい納品IDを生成
    const deliveryId = await generateDeliveryId(storeId);

    const result = await prisma.$transaction(async (tx) => {
      // 納品を作成
      const totalAmount = allocations.reduce(
        (sum, alloc) => sum + alloc.unitPrice * alloc.allocatedQuantity,
        0,
      );
      const totalQuantity = allocations.reduce((sum, alloc) => sum + alloc.allocatedQuantity, 0);

      const delivery = await tx.delivery.create({
        data: {
          id: deliveryId,
          customerId: deliveryData.customerId,
          deliveryDate: deliveryData.deliveryDate,
          totalAmount: totalAmount,
          totalQuantity: totalQuantity,
          note: deliveryData.note || null,
        },
      });

      // 納品明細と割り当てを作成
      for (let i = 0; i < allocations.length; i++) {
        const allocation = allocations[i];
        const deliveryDetailId = `${deliveryId}-${(i + 1).toString().padStart(2, '0')}`;

        // 納品明細を作成
        await tx.deliveryDetail.create({
          data: {
            id: deliveryDetailId,
            deliveryId: deliveryId,
            productName: allocation.productName,
            unitPrice: allocation.unitPrice,
            quantity: allocation.allocatedQuantity,
          },
        });

        // 納品割り当てを作成
        await tx.deliveryAllocation.create({
          data: {
            orderDetailId: allocation.orderDetailId,
            deliveryDetailId: deliveryDetailId,
            allocatedQuantity: allocation.allocatedQuantity,
          },
        });
      }

      return delivery;
    });

    return {
      success: true,
      deliveryId: result.id,
      message: '納品を作成しました',
    };
  } catch (error) {
    console.error('納品の作成に失敗しました:', error);
    return {
      success: false,
      error: '納品の作成に失敗しました',
    };
  }
}

/**
 * 新しい納品IDを生成する
 * 形式: DXXXXXXX (D0000001)
 * @param storeId 店舗ID
 * @returns 新しい納品ID
 */
async function generateDeliveryId(storeId: string): Promise<string> {
  // 指定店舗の最後の納品番号を取得
  const lastDelivery = await prisma.delivery.findFirst({
    where: {
      customer: {
        storeId: storeId,
      },
      id: {
        startsWith: 'D',
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
  if (lastDelivery) {
    // IDから番号部分を抽出 (D0000001 → 0000001)
    const numberPart = lastDelivery.id.substring(1);
    const lastNumber = parseInt(numberPart, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // 重複チェックを行いながら使用可能なIDを生成
  let attempts = 0;
  while (attempts < 1000) {
    const candidateId = `D${nextNumber.toString().padStart(7, '0')}`;

    const existingDelivery = await prisma.delivery.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!existingDelivery) {
      return candidateId;
    }

    nextNumber++;
    attempts++;
  }

  throw new Error('納品IDの生成に失敗しました');
}

/**
 * 顧客の未納品商品一覧を取得（新規作成用）
 * @param customerId 顧客ID
 * @returns 未納品注文明細一覧
 */
export async function fetchUndeliveredOrderDetailsForCreate(customerId: string) {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 顧客の未完了・一部納品の注文明細を取得
    const orderDetails = await prisma.orderDetail.findMany({
      where: {
        isDeleted: false,
        order: {
          customerId: customerId,
          isDeleted: false,
          customer: {
            storeId: storeId,
            isDeleted: false,
          },
          OR: [
            { status: '未完了' },
            { status: '完了' }, // 完了でも未納品分があるかもしれない
          ],
        },
      },
      include: {
        order: true,
        deliveryAllocations: {
          where: {
            isDeleted: false,
          },
        },
      },
      orderBy: [{ order: { orderDate: 'desc' } }, { id: 'asc' }],
    });

    // 各注文明細の未納品数量を計算
    const enrichedOrderDetails = orderDetails
      .map((orderDetail) => {
        // 既に割り当てられた総数量を計算
        const totalAllocated = orderDetail.deliveryAllocations.reduce(
          (sum, allocation) => sum + allocation.allocatedQuantity,
          0,
        );

        // 残り数量を計算
        const remainingQuantity = orderDetail.quantity - totalAllocated;

        // 残り数量がある場合のみ返す
        return remainingQuantity > 0
          ? {
              orderDetailId: orderDetail.id,
              orderId: orderDetail.orderId,
              productName: orderDetail.productName,
              unitPrice: orderDetail.unitPrice,
              totalQuantity: orderDetail.quantity,
              allocatedInOtherDeliveries: totalAllocated,
              currentAllocation: 0, // 新規作成なので0
              remainingQuantity: remainingQuantity,
              description: orderDetail.description,
              orderDate: orderDetail.order.orderDate.toISOString(),
            }
          : null;
      })
      .filter(Boolean);

    return {
      success: true,
      orderDetails: enrichedOrderDetails,
    };
  } catch (error) {
    console.error('未納品注文明細の取得に失敗しました:', error);
    return {
      success: false,
      error: '未納品注文明細の取得に失敗しました',
    };
  }
}
