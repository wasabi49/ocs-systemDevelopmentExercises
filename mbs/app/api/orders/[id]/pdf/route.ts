import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { fetchOrderWithDetails } from '@/app/actions/orderActions';

/**
 * PDF生成API Route
 *
 * 注意: 現在はServer Actions (generateOrderPdf) を使用しているため、
 * このAPI Routeは使用されていません。
 * 外部システムからの呼び出しや、将来的な拡張のために残しています。
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 注文データを取得
    const result = await fetchOrderWithDetails(id);

    if (!result.success || !result.data) {
      return NextResponse.json({ error: '注文データが見つかりません' }, { status: 404 });
    }

    const orderData = result.data;

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

    // HTML テンプレート生成
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>注文書 - ${orderData.id}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
            color: #333;
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
            color: #333;
          }
          
          .date-customer {
            text-align: right;
          }
          
          .customer-name {
            font-size: 16px;
            font-weight: bold;
            margin-top: 5px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
            min-width: 200px;
          }
          
          .order-info {
            margin-bottom: 20px;
            font-size: 11px;
          }
          
          .order-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 2px solid #0066cc;
          }
          
          .order-table th {
            background-color: #e6f3ff;
            border: 1px solid #0066cc;
            padding: 8px 4px;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
          }
          
          .order-table td {
            border: 1px solid #0066cc;
            padding: 6px 4px;
            vertical-align: top;
            min-height: 25px;
            font-size: 11px;
          }
          
          .order-table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .product-name {
            text-align: left;
            word-wrap: break-word;
            max-width: 120px;
          }
          
          .quantity, .unit-price {
            text-align: center;
            width: 60px;
          }
          
          .amount {
            text-align: right;
            width: 80px;
          }
          
          .remarks {
            text-align: left;
            font-size: 10px;
          }
          
          .total-section {
            margin-top: 20px;
            text-align: right;
          }
          
          .total-amount {
            font-size: 16px;
            font-weight: bold;
            border: 2px solid #333;
            padding: 10px;
            display: inline-block;
            min-width: 150px;
          }
          
          .notes-section {
            margin-top: 30px;
            border: 1px solid #333;
            padding: 10px;
            min-height: 60px;
          }
          
          .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">注文書</div>
          <div class="date-customer">
            <div>${formatDate(new Date())}</div>
            <div class="customer-name">${orderData.customer.name} 様</div>
          </div>
        </div>
        
        <div class="order-info">
          下記の通り注文いたします
          <br>
          注文ID: ${orderData.id} | 注文日: ${formatDate(orderData.orderDate)}
        </div>
        
        <table class="order-table">
          <thead>
            <tr>
              <th style="width: 25%">品名</th>
              <th style="width: 10%">数量</th>
              <th style="width: 15%">単価</th>
              <th style="width: 15%">金額</th>
              <th style="width: 35%">摘要</th>
            </tr>
          </thead>
          <tbody>
            ${limitedOrderDetails
              .map(
                (detail, index) => `
              <tr>
                <td class="product-name">${detail.productName}</td>
                <td class="quantity">${detail.quantity.toLocaleString()}</td>
                <td class="unit-price">${formatJPY(detail.unitPrice)}</td>
                <td class="amount">${formatJPY(detail.unitPrice * detail.quantity)}</td>
                <td class="remarks">${detail.description || ''}</td>
              </tr>
            `,
              )
              .join('')}
            ${Array.from(
              { length: Math.max(0, 20 - limitedOrderDetails.length) },
              (_, index) => `
              <tr>
                <td class="product-name">&nbsp;</td>
                <td class="quantity">&nbsp;</td>
                <td class="unit-price">&nbsp;</td>
                <td class="amount">&nbsp;</td>
                <td class="remarks">&nbsp;</td>
              </tr>
            `,
            ).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-amount">
            合計金額: ${formatJPY(totalAmount)}
          </div>
        </div>
        
        <div class="notes-section">
          <div class="notes-title">備考</div>
          <div>${orderData.note || ''}</div>
        </div>
      </body>
      </html>
    `;

    // PuppeteerでPDF生成
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm',
      },
    });

    await browser.close();

    // PDFファイル名を生成
    const fileName = `注文書_${orderData.id}_${formatDate(new Date()).replace(/\//g, '')}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF生成エラー:', error);
    return NextResponse.json({ error: 'PDF生成に失敗しました' }, { status: 500 });
  }
}
