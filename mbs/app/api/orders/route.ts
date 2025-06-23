// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// 注文一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const storeId = searchParams.get('storeId') || undefined;

    const skip = (page - 1) * limit;

    // 店舗IDによるフィルタ条件
    const whereCondition = {
      isDeleted: false,
      ...(storeId && {
        customer: {
          storeId: storeId,
          isDeleted: false
        }
      })
    };

    const orders = await prisma.order.findMany({
      where: whereCondition,
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
      },
      orderBy: {
        orderDate: 'desc'
      },
      skip,
      take: limit
    });

    // 削除された顧客の注文を除外
    const filteredOrders = orders.filter(order => 
      order.customer && !order.customer.isDeleted
    );

    const total = await prisma.order.count({
      where: whereCondition
    });

    return NextResponse.json({
      success: true,
      data: {
        orders: filteredOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('注文一覧取得エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '注文一覧の取得に失敗しました' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 注文作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // リクエストボディの型定義
    const orderData: {
      orderDetails: {
        productName: string;
        unitPrice: number;
        quantity: number;
        description: string | null;
      }[];
      orderDate: string;
      customerId: string;
      note: string | null;
    } = body;

    // バリデーション
    if (!orderData.orderDetails || orderData.orderDetails.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: '商品を1つ以上追加してください' 
        },
        { status: 400 }
      );
    }

    if (!orderData.customerId) {
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
        id: orderData.customerId, 
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

    // 商品の必須項目チェック
    const hasInvalidProducts = orderData.orderDetails.some(
      detail => !detail.productName.trim() && !(detail.description || '').trim()
    );

    if (hasInvalidProducts) {
      return NextResponse.json(
        { 
          success: false,
          error: '各商品の商品名または摘要を入力してください' 
        },
        { status: 400 }
      );
    }

    // 注文IDの生成
    const generateOrderId = async (): Promise<string> => {
      const lastOrder = await prisma.order.findFirst({
        select: { id: true },
        orderBy: { id: 'desc' }
      });

      if (!lastOrder) {
        return 'O0000001';
      }

      const lastNumber = parseInt(lastOrder.id.slice(1));
      const nextNumber = lastNumber + 1;
      return `O${String(nextNumber).padStart(7, '0')}`;
    };

    // 注文明細IDの生成
    const generateOrderDetailId = (orderId: string, index: number): string => {
      return `${orderId}-${String(index + 1).padStart(2, '0')}`;
    };

    // トランザクションで注文とその詳細を作成
    const result = await prisma.$transaction(async (tx) => {
      // 注文IDを生成
      const orderId = await generateOrderId();

      // 注文の作成
      const order = await tx.order.create({
        data: {
          id: orderId,
          orderDate: new Date(orderData.orderDate),
          customerId: orderData.customerId,
          note: orderData.note,
          status: '未完了',
        }
      });

      // 注文詳細の作成
      const orderDetails = await Promise.all(
        orderData.orderDetails.map((detail, index) =>
          tx.orderDetail.create({
            data: {
              id: generateOrderDetailId(orderId, index),
              orderId: order.id,
              productName: detail.productName,
              unitPrice: detail.unitPrice,
              quantity: detail.quantity,
              description: detail.description,
            }
          })
        )
      );

      return {
        order,
        orderDetails
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: '注文が正常に作成されました'
    });

  } catch (error) {
    console.error('注文作成エラー:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '注文の作成に失敗しました' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}