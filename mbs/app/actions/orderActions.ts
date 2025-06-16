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
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        success: false,
        error: '店舗を選択してください',
      };
    }

    // 注文データを取得
    const orderResult = await fetchOrderWithDetails(orderId);

    if (!orderResult.success || !orderResult.data) {
      return {
        success: false,
        error: '注文データが見つかりません',
      };
    }

    const orderData = orderResult.data;

    // 注文明細を最大20件に制限
    const limitedOrderDetails = orderData.orderDetails.slice(0, 20);

    // 合計金額を計算
    const totalAmount = limitedOrderDetails.reduce(
      (sum, detail) => sum + detail.unitPrice * detail.quantity,
      0,
    );

    // 日付フォーマット関数
    const formatDate = (date: Date | string): string => {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    };

    // 日本円フォーマット関数
    const formatJPY = (amount: number): string => {
      return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY',
      }).format(amount);
    };

    // HTMLテンプレートを生成
    const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>注文書</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic UI', sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #333;
          background: white;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          border-bottom: 2px solid #0066cc;
          padding-bottom: 15px;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
        }
        
        .date {
          text-align: right;
          font-size: 14px;
          color: #666;
        }
        
        .customer-info {
          margin-bottom: 20px;
          text-align: right;
        }
        
        .customer-name {
          font-size: 18px;
          font-weight: bold;
          border-bottom: 1px solid #333;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        
        .order-info {
          margin-bottom: 20px;
          font-size: 11px;
          color: #666;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border: 2px solid #0066cc;
        }
        
        .items-table th {
          background-color: #e6f3ff;
          color: #0066cc;
          font-weight: bold;
          padding: 8px 6px;
          text-align: center;
          border: 1px solid #0066cc;
          font-size: 11px;
        }
        
        .items-table td {
          padding: 6px;
          border: 1px solid #0066cc;
          text-align: center;
          font-size: 10px;
          min-height: 20px;
        }
        
        .items-table td.product-name {
          text-align: left;
          font-weight: 500;
        }
        
        .items-table td.amount {
          text-align: right;
          font-weight: bold;
        }
        
        .items-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        
        .total-row {
          background-color: #fff3cd !important;
          font-weight: bold;
        }
        
        .total-row td {
          border-top: 2px solid #0066cc;
        }
        
        .remarks {
          margin-top: 30px;
          border: 1px solid #ccc;
          padding: 15px;
          min-height: 80px;
          background-color: #fafafa;
        }
        
        .remarks-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #0066cc;
        }
        
        .col-product { width: 45%; }
        .col-quantity { width: 12%; }
        .col-unit { width: 15%; }
        .col-amount { width: 18%; }
        .col-note { width: 10%; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">注文書</div>
        <div class="date">${formatDate(new Date())
          .replace(/\//g, '年')
          .replace(/(\d+)$/, '$1日')
          .replace(/年(\d+)/, '年$1月')}</div>
      </div>
      
      <div class="customer-info">
        <div class="customer-name">${orderData.customer.name} 様</div>
      </div>
      
      <div class="order-info">
        下記の通り注文いたします。
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-product">品名</th>
            <th class="col-quantity">数量</th>
            <th class="col-unit">単価</th>
            <th class="col-amount">金額</th>
            <th class="col-note">摘要</th>
          </tr>
        </thead>
        <tbody>
          ${limitedOrderDetails
            .map(
              (detail) => `
            <tr>
              <td class="product-name">${detail.productName || ''}</td>
              <td>${detail.quantity ? detail.quantity.toLocaleString() : ''}</td>
              <td>${detail.unitPrice ? formatJPY(detail.unitPrice) : ''}</td>
              <td class="amount">${detail.unitPrice && detail.quantity ? formatJPY(detail.unitPrice * detail.quantity) : ''}</td>
              <td>${detail.description || ''}</td>
            </tr>
          `,
            )
            .join('')}
          ${Array.from(
            { length: Math.max(0, 15 - limitedOrderDetails.length) },
            () => `
            <tr>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          `,
          ).join('')}
          <tr class="total-row">
            <td colspan="3" style="text-align: center; font-weight: bold;">合計</td>
            <td class="amount">${formatJPY(totalAmount)}</td>
            <td>&nbsp;</td>
          </tr>
        </tbody>
      </table>
      
      <div class="remarks">
        <div class="remarks-title">備考</div>
        <div>${orderData.note || ''}</div>
      </div>
    </body>
    </html>
    `;

    // PuppeteerでPDF生成
    const puppeteer = (await import('puppeteer-core')).default;
    const chromium = (await import('@sparticuz/chromium')).default;

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    // Base64エンコード
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    return {
      success: true,
      data: {
        pdfData: pdfBase64,
        filename: `注文書_${orderId}_${formatDate(orderData.orderDate)}.pdf`,
      },
    };
  } catch (error) {
    console.error('PDF生成エラー:', error);
    return {
      success: false,
      error: 'PDF生成に失敗しました',
    };
  }
}
