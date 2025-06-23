// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// 注文詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { 
          success: false,
          error: '注文IDが指定されていません' 
        },
        { status: 400 }
      );
    }

    // 注文とその詳細、顧客情報を取得
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        isDeleted: false
      },
      include: {
        customer: true,
        orderDetails: {
          where: {
            isDeleted: false
          },
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { 
          success: false,
          error: '指定された注文が見つかりません' 
        },
        { status: 404 }
      );
    }

    // 型アサーションを使用して顧客データにアクセス
    const orderWithCustomer = order as typeof order & {
      customer: NonNullable<typeof order.customer>;
    };

    // 顧客が削除されている場合のチェック
    if (!orderWithCustomer.customer || orderWithCustomer.customer.isDeleted) {
      return NextResponse.json(
        { 
          success: false,
          error: '顧客情報が見つかりません' 
        },
        { status: 404 }
      );
    }

    // 現在は納品機能がないので、納品状況は「未納品」で固定
    const orderDetailsWithDelivery = orderWithCustomer.orderDetails.map(detail => ({
      ...detail,
      deliveryAllocations: [],
      totalDelivered: 0,
      deliveryStatus: '未納品'
    }));

    const result = {
      ...orderWithCustomer,
      orderDetails: orderDetailsWithDelivery
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('注文詳細取得エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '注文詳細の取得に失敗しました' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 注文削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    if (!orderId) {
      return NextResponse.json(
        { 
          success: false,
          error: '注文IDが指定されていません' 
        },
        { status: 400 }
      );
    }

    // 注文の存在確認
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
        isDeleted: false
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { 
          success: false,
          error: '指定された注文が見つかりません' 
        },
        { status: 404 }
      );
    }

    // トランザクションで注文と注文詳細を論理削除
    const result = await prisma.$transaction(async (tx) => {
      // 注文詳細を論理削除
      await tx.orderDetail.updateMany({
        where: {
          orderId: orderId,
          isDeleted: false
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      // 注文を論理削除
      const deletedOrder = await tx.order.update({
        where: {
          id: orderId
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      return deletedOrder;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: '注文が正常に削除されました'
    });

  } catch (error) {
    console.error('注文削除エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '注文の削除に失敗しました' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 注文更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { 
          success: false,
          error: '注文IDが指定されていません' 
        },
        { status: 400 }
      );
    }

    // 注文の存在確認
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
        isDeleted: false
      }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { 
          success: false,
          error: '指定された注文が見つかりません' 
        },
        { status: 404 }
      );
    }

    // バリデーション
    if (!body.orderDetails || body.orderDetails.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: '商品を1つ以上追加してください' 
        },
        { status: 400 }
      );
    }

    if (!body.customerId) {
      return NextResponse.json(
        { 
          success: false,
          error: '顧客を選択してください' 
        },
        { status: 400 }
      );
    }

    // 顧客の存在確認
    const customer = await prisma.customer.findUnique({
      where: { 
        id: body.customerId, 
        isDeleted: false
      }
    });

    if (!customer) {
      return NextResponse.json(
        { 
          success: false,
          error: '指定された顧客が見つかりません' 
        },
        { status: 404 }
      );
    }

    // 注文明細IDの生成
    const generateOrderDetailId = (orderId: string, index: number): string => {
      return `${orderId}-${String(index + 1).padStart(2, '0')}`;
    };

    // トランザクションで注文を更新
    const result = await prisma.$transaction(async (tx) => {
      // 既存の注文詳細を論理削除
      await tx.orderDetail.updateMany({
        where: {
          orderId: orderId,
          isDeleted: false
        },
        data: {
          isDeleted: true,
          deletedAt: new Date()
        }
      });

      // 注文を更新
      const updatedOrder = await tx.order.update({
        where: {
          id: orderId
        },
        data: {
          orderDate: new Date(body.orderDate),
          customerId: body.customerId,
          note: body.note,
          status: body.status || '未完了',
        }
      });

      // 新しい注文詳細を作成
      const orderDetails = await Promise.all(
        body.orderDetails.map((detail: any, index: number) =>
          tx.orderDetail.create({
            data: {
              id: generateOrderDetailId(orderId, index),
              orderId: orderId,
              productName: detail.productName,
              unitPrice: detail.unitPrice,
              quantity: detail.quantity,
              description: detail.description,
            }
          })
        )
      );

      return {
        order: updatedOrder,
        orderDetails
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: '注文が正常に更新されました'
    });

  } catch (error) {
    console.error('注文更新エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '注文の更新に失敗しました' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}