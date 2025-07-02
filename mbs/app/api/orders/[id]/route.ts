// app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@/app/generated/prisma';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// クッキーから店舗IDを取得する関数
async function getStoreIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const storeIdCookie = cookieStore.get('storeId'); // クッキー名を実際の名前に変更してください
    return storeIdCookie?.value || null;
  } catch (error) {
    console.error('クッキーから店舗IDを取得する際のエラー:', error);
    return null;
  }
}

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

    // 顧客が削除されている場合のチェック
    if (!order.customer || order.customer.isDeleted) {
      return NextResponse.json(
        { 
          success: false,
          error: '顧客情報が見つかりません' 
        },
        { status: 404 }
      );
    }

    // 現在は納品機能がないので、納品状況は「未納品」で固定
    const orderDetailsWithDelivery = order.orderDetails.map(detail => ({
      ...detail,
      deliveryAllocations: [],
      totalDelivered: 0,
      deliveryStatus: '未納品'
    }));

    const result = {
      ...order,
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
    console.log('=== 注文更新開始 ===');
    console.log('注文ID:', orderId);

    let body;
    try {
      body = await request.json();
      console.log('受信データ:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('JSON解析エラー:', parseError);
      return NextResponse.json(
        { 
          success: false,
          error: 'リクエストデータの解析に失敗しました' 
        },
        { status: 400 }
      );
    }

    if (!orderId) {
      console.error('注文IDが未指定');
      return NextResponse.json(
        { 
          success: false,
          error: '注文IDが指定されていません' 
        },
        { status: 400 }
      );
    }

    console.log('注文存在確認開始...');
    // 注文の存在確認
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
        isDeleted: false
      }
    });

    if (!existingOrder) {
      console.error('注文が見つかりません:', orderId);
      return NextResponse.json(
        { 
          success: false,
          error: '指定された注文が見つかりません' 
        },
        { status: 404 }
      );
    }
    console.log('注文存在確認完了');

    // バリデーション
    if (!body.orderDetails || body.orderDetails.length === 0) {
      console.error('注文明細が空です');
      return NextResponse.json(
        { 
          success: false,
          error: '商品を1つ以上追加してください' 
        },
        { status: 400 }
      );
    }

    if (!body.customerId) {
      console.error('顧客IDが未指定');
      return NextResponse.json(
        { 
          success: false,
          error: '顧客を選択してください' 
        },
        { status: 400 }
      );
    }

    console.log('顧客存在確認開始...');
    // 顧客の存在確認と店舗IDチェック
    const currentStoreId = await getStoreIdFromCookie();
    console.log('現在の店舗ID:', currentStoreId);
    
    const customer = await prisma.customer.findUnique({
      where: { 
        id: body.customerId, 
        isDeleted: false
      }
    });

    if (!customer) {
      console.error('顧客が見つかりません:', body.customerId);
      return NextResponse.json(
        { 
          success: false,
          error: '指定された顧客が見つかりません' 
        },
        { status: 404 }
      );
    }

    // 店舗IDのチェック（あれば）
    if (currentStoreId && customer.storeId !== currentStoreId) {
      console.error('店舗IDが一致しません:', customer.storeId, 'vs', currentStoreId);
      return NextResponse.json(
        { 
          success: false,
          error: 'この顧客は別の店舗に属しているため、更新できません' 
        },
        { status: 403 }
      );
    }
    console.log('顧客存在確認完了');

    // 注文明細IDの生成
    const generateOrderDetailId = (orderId: string, index: number): string => {
      return `${orderId}-${String(index + 1).padStart(2, '0')}`;
    };

    console.log('トランザクション開始...');
    // トランザクションで注文を更新
    const result = await prisma.$transaction(async (tx) => {
      console.log('既存注文明細の物理削除...');
      // 既存の注文詳細を物理削除（論理削除では ID 競合が起こるため）
      await tx.orderDetail.deleteMany({
        where: {
          orderId: orderId
        }
      });

      console.log('注文の更新...');
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

      console.log('新しい注文明細の作成...');
      // 新しい注文詳細を作成
      const orderDetails = await Promise.all(
        body.orderDetails.map(async (detail: any, index: number) => {
          const newDetailId = generateOrderDetailId(orderId, index);
          console.log(`明細${index + 1}作成 ID: ${newDetailId}`, detail);
          return tx.orderDetail.create({
            data: {
              id: newDetailId,
              orderId: orderId,
              productName: detail.productName,
              unitPrice: detail.unitPrice,
              quantity: detail.quantity,
              description: detail.description,
            }
          });
        })
      );

      return {
        order: updatedOrder,
        orderDetails
      };
    });

    console.log('=== 注文更新成功 ===');
    console.log('更新結果:', result);

    return NextResponse.json({
      success: true,
      data: result,
      message: '注文が正常に更新されました'
    });

  } catch (error) {
    console.error('=== 注文更新エラー ===');
    console.error('エラー詳細:', error);
    console.error('エラースタック:', error instanceof Error ? error.stack : 'スタック情報なし');
    
    return NextResponse.json(
      { 
        success: false,
        error: `注文の更新に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}` 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}