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
        customer: true,
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

/**
 * 注文明細を含む注文詳細を取得するServer Action
 * @param orderId 注文ID
 * @returns 注文詳細データ（注文明細を含む）
 */
export async function fetchOrderWithDetails(orderId: string) {
  try {
    if (!orderId) {
      return {
        success: false,
        error: '注文IDが指定されていません',
      };
    }

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        isDeleted: false,
      },
      include: {
        customer: true,
        orderDetails: {
          where: {
            isDeleted: false,
          },
          orderBy: {
            id: 'asc',
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

    if (!order.customer || order.customer.isDeleted) {
      return {
        success: false,
        error: '関連する顧客データが削除されているため、注文情報を表示できません',
      };
    }

    return {
      success: true,
      data: {
        ...order,
        orderDate: order.orderDate.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        deletedAt: order.deletedAt ? order.deletedAt.toISOString() : null,
        customer: {
          ...order.customer,
          updatedAt: order.customer.updatedAt.toISOString(),
          deletedAt: order.customer.deletedAt ? order.customer.deletedAt.toISOString() : null,
        },
        orderDetails: order.orderDetails.map((detail) => ({
          ...detail,
          updatedAt: detail.updatedAt.toISOString(),
          deletedAt: detail.deletedAt ? detail.deletedAt.toISOString() : null,
        })),
      },
    };
  } catch (error) {
    console.error('注文詳細の取得に失敗しました:', error);
    return {
      success: false,
      error: '注文詳細の取得に失敗しました',
    };
  }
}

/**
 * 注文明細を作成するServer Action
 * @param orderDetailData 注文明細データ
 * @returns 作成結果
 */
export async function createOrderDetail(orderDetailData: {
  orderId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  description?: string;
}) {
  try {
    const { orderId, productName, unitPrice, quantity, description } = orderDetailData;

    if (!orderId || !productName || unitPrice <= 0 || quantity <= 0) {
      return {
        success: false,
        error: '必要な項目が正しく入力されていません',
      };
    }

    // 注文の存在確認
    const order = await prisma.order.findUnique({
      where: { id: orderId, isDeleted: false },
      include: { orderDetails: { where: { isDeleted: false } } },
    });

    if (!order) {
      return {
        success: false,
        error: '指定された注文が見つかりません',
      };
    }

    // 注文明細IDを生成
    const nextDetailNumber = order.orderDetails.length + 1;
    const orderDetailId = `${orderId}-${nextDetailNumber.toString().padStart(2, '0')}`;

    const orderDetail = await prisma.orderDetail.create({
      data: {
        id: orderDetailId,
        orderId,
        productName,
        unitPrice,
        quantity,
        description: description || '',
      },
    });

    return {
      success: true,
      data: {
        ...orderDetail,
        updatedAt: orderDetail.updatedAt.toISOString(),
        deletedAt: orderDetail.deletedAt ? orderDetail.deletedAt.toISOString() : null,
      },
      message: '注文明細が正常に作成されました',
    };
  } catch (error) {
    console.error('注文明細の作成に失敗しました:', error);
    return {
      success: false,
      error: '注文明細の作成に失敗しました',
    };
  }
}

/**
 * 注文明細を更新するServer Action
 * @param orderDetailId 注文明細ID
 * @param updateData 更新データ
 * @returns 更新結果
 */
export async function updateOrderDetail(
  orderDetailId: string,
  updateData: {
    productName?: string;
    unitPrice?: number;
    quantity?: number;
    description?: string;
  },
) {
  try {
    if (!orderDetailId) {
      return {
        success: false,
        error: '注文明細IDが指定されていません',
      };
    }

    // 注文明細の存在確認
    const existingDetail = await prisma.orderDetail.findUnique({
      where: { id: orderDetailId, isDeleted: false },
    });

    if (!existingDetail) {
      return {
        success: false,
        error: '指定された注文明細が見つかりません',
      };
    }

    const updatedDetail = await prisma.orderDetail.update({
      where: { id: orderDetailId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: {
        ...updatedDetail,
        updatedAt: updatedDetail.updatedAt.toISOString(),
        deletedAt: updatedDetail.deletedAt ? updatedDetail.deletedAt.toISOString() : null,
      },
      message: '注文明細が正常に更新されました',
    };
  } catch (error) {
    console.error('注文明細の更新に失敗しました:', error);
    return {
      success: false,
      error: '注文明細の更新に失敗しました',
    };
  }
}

/**
 * 注文明細を削除（論理削除）するServer Action
 * @param orderDetailId 注文明細ID
 * @returns 削除結果
 */
export async function deleteOrderDetail(orderDetailId: string) {
  try {
    if (!orderDetailId) {
      return {
        success: false,
        error: '注文明細IDが指定されていません',
      };
    }

    // 注文明細の存在確認
    const existingDetail = await prisma.orderDetail.findUnique({
      where: { id: orderDetailId, isDeleted: false },
    });

    if (!existingDetail) {
      return {
        success: false,
        error: '指定された注文明細が見つかりません',
      };
    }

    await prisma.orderDetail.update({
      where: { id: orderDetailId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: '注文明細が正常に削除されました',
    };
  } catch (error) {
    console.error('注文明細の削除に失敗しました:', error);
    return {
      success: false,
      error: '注文明細の削除に失敗しました',
    };
  }
}

/**
 * PDF注文書を生成するServer Action
 * @param orderId - 注文ID
 * @returns PDF生成結果（Base64エンコードされたPDFデータ）
 */
export async function generateOrderPdf(orderId: string) {
  try {
    console.log('PDF生成処理開始 - 注文ID:', orderId);

    const storeId = await getStoreIdFromCookie();
    console.log('店舗ID:', storeId);

    if (!storeId) {
      console.log('店舗IDが設定されていません');
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 注文データを取得
    console.log('注文データ取得開始...');
    const orderResult = await fetchOrderWithDetails(orderId);
    console.log('注文データ取得結果:', orderResult.success ? '成功' : '失敗');

    if (!orderResult.success || !orderResult.data) {
      console.log('注文データが見つかりません:', orderResult.error);
      return {
        success: false,
        error: '注文データが見つかりません',
      };
    }

    const orderData = orderResult.data;
    console.log('注文データ:', {
      id: orderData.id,
      customerName: orderData.customer.name,
      orderDetailsCount: orderData.orderDetails.length,
    });

    // @react-pdf/rendererでPDF生成
    console.log('PDFユーティリティ読み込み開始...');
    const { generateOrderPdfBuffer, generateOrderPdfFileName } = await import(
      '@/app/utils/pdfUtils'
    );
    console.log('PDFユーティリティ読み込み完了');

    // PDFバッファを生成
    console.log('PDFバッファ生成開始...');

    // PDF生成用にデータを変換（null -> undefined変換など）
    const pdfOrderData = {
      id: orderData.id,
      orderDate: orderData.orderDate,
      customer: {
        name: orderData.customer.name,
      },
      orderDetails: orderData.orderDetails.map((detail) => ({
        productName: detail.productName || '',
        quantity: detail.quantity || 0,
        unitPrice: detail.unitPrice || 0,
        description: detail.description || undefined,
      })),
      note: orderData.note || undefined,
    };

    console.log('PDF用データ変換完了:', {
      id: pdfOrderData.id,
      customerName: pdfOrderData.customer.name,
      orderDetailsCount: pdfOrderData.orderDetails.length,
    });

    const pdfBuffer = await generateOrderPdfBuffer(pdfOrderData);
    console.log('PDFバッファ生成完了、サイズ:', pdfBuffer.length);

    // Bufferの妥当性チェック
    if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
      throw new Error('PDF生成でBufferが適切に作成されませんでした');
    }

    // Base64エンコード
    console.log('Base64エンコード開始...');
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log('Base64エンコード完了、サイズ:', pdfBase64.length);

    if (!pdfBase64 || pdfBase64.length === 0) {
      throw new Error('Base64エンコードに失敗しました');
    }

    const filename = generateOrderPdfFileName(pdfOrderData);
    console.log('生成ファイル名:', filename);

    console.log('PDF生成処理完了');
    return {
      success: true,
      data: {
        pdfData: pdfBase64,
        filename: filename,
      },
    };
  } catch (error) {
    console.error('PDF生成エラー:', error);
    return {
      success: false,
      error: `PDF生成に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
    };
  }
}
