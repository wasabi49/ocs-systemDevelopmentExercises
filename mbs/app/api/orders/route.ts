// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// 注文作成のリクエスト型
type CreateOrderRequest = {
  orderDetails: {
    productName: string;
    unitPrice: number;
    quantity: number;
    description: string | null;
  }[];
  orderDate: string; // ISO文字列として受信
  customerId: string;
  note: string | null;
};

// 注文IDの生成関数
async function generateOrderId(): Promise<string> {
  const lastOrder = await prisma.order.findFirst({
    select: { id: true },
    orderBy: { id: 'desc' }
  });

  if (!lastOrder) {
    return 'O0000001';
  }

  // O0000001 形式から数値部分を抽出して+1
  const lastNumber = parseInt(lastOrder.id.slice(1));
  const nextNumber = lastNumber + 1;
  return `O${String(nextNumber).padStart(7, '0')}`;
}

// 注文明細IDの生成関数
function generateOrderDetailId(orderId: string, index: number): string {
  return `${orderId}-${String(index + 1).padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    
    console.log('受信した注文データ:', body);

    // バリデーション
    if (!body.orderDetails || body.orderDetails.length === 0) {
      return NextResponse.json(
        { error: '商品を1つ以上追加してください' },
        { status: 400 }
      );
    }

    if (!body.customerId) {
      return NextResponse.json(
        { error: '顧客を選択してください' },
        { status: 400 }
      );
    }

    // 顧客の存在確認
    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId, isDeleted: false }
    });

    if (!customer) {
      return NextResponse.json(
        { error: '指定された顧客が見つかりません' },
        { status: 404 }
      );
    }

    // 商品の必須項目チェック
    const hasInvalidProducts = body.orderDetails.some(
      detail => !detail.productName.trim() && !(detail.description || '').trim()
    );

    if (hasInvalidProducts) {
      return NextResponse.json(
        { error: '各商品の商品名または摘要を入力してください' },
        { status: 400 }
      );
    }

    // トランザクションで注文とその詳細を作成
    const result = await prisma.$transaction(async (tx) => {
      // 注文IDを生成
      const orderId = await generateOrderId();

      // 注文の作成
      const order = await tx.order.create({
        data: {
          id: orderId,
          orderDate: new Date(body.orderDate),
          customerId: body.customerId,
          note: body.note,
          status: '未完了', // デフォルトステータス
        }
      });

      // 注文詳細の作成
      const orderDetails = await Promise.all(
        body.orderDetails.map((detail, index) =>
          tx.orderDetail.create({
            data: {
              id: generateOrderDetailId(orderId, index),
              orderId: order.id,
              productName: detail.productName,
              unitPrice: detail.unitPrice, // Float型として保存
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

    console.log('注文作成成功:', result);

    return NextResponse.json({
      success: true,
      data: result,
      message: '注文が正常に作成されました'
    });

  } catch (error) {
    console.error('注文作成エラー:', error);
    
    // Prismaエラーの詳細なハンドリング
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: '注文の作成に失敗しました',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: '予期しないエラーが発生しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 注文一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      where: { isDeleted: false },
      include: {
        customer: {
          where: { isDeleted: false }
        },
        orderDetails: {
          where: { isDeleted: false },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: {
        orderDate: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.order.count({
      where: { isDeleted: false }
    });

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('注文取得エラー:', error);
    
    return NextResponse.json(
      { error: '注文の取得に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}