/**
 * PDF生成用のユーティリティ関数 (@react-pdf/renderer使用)
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';

// 日本語フォント登録状態
let fontRegistered = false;
let fontAvailable = false;

/**
 * publicフォルダの日本語フォントを登録する関数
 */
const registerJapaneseFont = (): boolean => {
  if (fontRegistered) return fontAvailable;

  try {
    const fontPath = path.join(process.cwd(), 'public', 'NotoSansJP-VariableFont_wght.ttf');

    // フォントファイルが存在するかチェック
    if (fs.existsSync(fontPath)) {
      // フォントファイルをBase64として読み込み
      const fontBuffer = fs.readFileSync(fontPath);
      const fontBase64 = `data:font/truetype;base64,${fontBuffer.toString('base64')}`;

      Font.register({
        family: 'NotoSansJP',
        src: fontBase64,
      });

      fontRegistered = true;
      fontAvailable = true;
      console.log('日本語フォント (Noto Sans JP) が正常に登録されました');
    } else {
      console.warn('フォントファイルが見つかりません:', fontPath);
      fontRegistered = true;
      fontAvailable = false;
    }
  } catch (error) {
    console.error('フォント登録エラー:', error);
    fontRegistered = true;
    fontAvailable = false;
  }

  return fontAvailable;
};

// PDFスタイル定義を動的に生成する関数
const createStyles = (useCustomFont: boolean) =>
  StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 20,
      fontFamily: useCustomFont ? 'NotoSansJP' : 'Helvetica',
      fontSize: 9,
      lineHeight: 1.2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: '2 solid #333333',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#2c3e50',
      letterSpacing: 1.2,
    },
    dateSection: {
      alignItems: 'flex-end',
    },
    dateLabel: {
      fontSize: 9,
      color: '#666666',
      marginBottom: 2,
    },
    date: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    customerSection: {
      marginBottom: 10,
      paddingHorizontal: 15,
    },
    customerRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'flex-start',
      marginBottom: 6,
    },
    customerName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#2c3e50',
      textAlign: 'left',
      minWidth: 180,
    },
    customerUnderline: {
      height: 2,
      backgroundColor: '#34495e',
      marginTop: 12,
      marginBottom: 5,
    },
    customerLabel: {
      fontSize: 14,
      marginLeft: 8,
      color: '#2c3e50',
    },
    message: {
      fontSize: 10,
      marginBottom: 10,
      textAlign: 'left',
      color: '#2c3e50',
      paddingLeft: 15,
    },
    table: {
      marginBottom: 8,
      border: '2 solid #34495e',
      borderRadius: 2,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#34495e',
      paddingVertical: 6,
    },
    tableRow: {
      flexDirection: 'row',
      minHeight: 20,
      alignItems: 'center',
      borderBottom: '0.5 solid #bdc3c7',
    },
    tableRowEven: {
      backgroundColor: '#f8f9fa',
    },
    tableRowOdd: {
      backgroundColor: '#ffffff',
    },
    colProductName: {
      width: '45%',
      textAlign: 'left',
      borderRight: '0.5 solid #bdc3c7',
      paddingHorizontal: 4,
      paddingVertical: 3,
    },
    colQuantity: {
      width: '6%',
      textAlign: 'center',
      borderRight: '0.5 solid #bdc3c7',
      paddingVertical: 3,
    },
    colUnitPrice: {
      width: '8%',
      textAlign: 'right',
      borderRight: '0.5 solid #bdc3c7',
      paddingHorizontal: 3,
      paddingVertical: 3,
    },
    colDescription: {
      width: '41%',
      textAlign: 'left',
      paddingHorizontal: 4,
      paddingVertical: 3,
    },
    headerText: {
      fontSize: 10,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#ffffff',
    },
    cellText: {
      fontSize: 9,
      color: '#2c3e50',
    },
    cellTextBold: {
      fontSize: 9,
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    emptyRow: {
      minHeight: 20,
    },
    remarksSection: {
      marginTop: 6,
      marginBottom: 6,
    },
    remarksTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: 5,
    },
    remarksBox: {
      border: '1 solid #bdc3c7',
      borderRadius: 3,
      minHeight: 65,
      padding: 8,
      backgroundColor: '#f8f9fa',
    },
    remarksText: {
      fontSize: 10,
      color: '#2c3e50',
      lineHeight: 1.6,
    },
    footer: {
      marginTop: 5,
      paddingTop: 4,
      borderTop: '0.5 solid #bdc3c7',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    footerText: {
      fontSize: 8,
      color: '#7f8c8d',
    },
  });

// 注文詳細の型定義
export interface OrderDetail {
  productName: string;
  quantity: number;
  unitPrice: number;
  description?: string;
}

// 注文データの型定義
export interface OrderData {
  id: string;
  orderDate: string;
  customer: {
    name: string;
  };
  orderDetails: OrderDetail[];
  note?: string;
}

/**
 * 日本語テキストを安全に処理する関数
 */
export function safeJapaneseText(text: string, maxLength?: number): string {
  if (!text) return '';

  const textStr = String(text);
  let safeText = textStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();

  if (maxLength && safeText.length > maxLength) {
    safeText = safeText.substring(0, maxLength - 3) + '...';
  }

  return safeText;
}

/**
 * 日付を日本語形式でフォーマット
 */
export function formatJapaneseDate(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 金額を日本円形式でフォーマット
 */
export function formatJapaneseYen(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
}

/**
 * 注文書PDFコンポーネント
 */
const OrderPDF: React.FC<{ orderData: OrderData; useCustomFont: boolean }> = ({
  orderData,
  useCustomFont,
}) => {
  // 入力データの検証
  if (!orderData) {
    throw new Error('注文データが提供されていません');
  }

  if (!orderData.id) {
    throw new Error('注文IDが設定されていません');
  }

  if (!orderData.customer || !orderData.customer.name) {
    throw new Error('顧客情報が不完全です');
  }

  if (!Array.isArray(orderData.orderDetails)) {
    throw new Error('注文明細が配列ではありません');
  }

  // スタイルを動的に生成
  const styles = createStyles(useCustomFont);

  // 注文明細を最大20件に制限
  const limitedOrderDetails = orderData.orderDetails.slice(0, 20);

  // 空行を追加（最大20行まで）
  const tableRows = [...limitedOrderDetails];
  const remainingRows = 20 - limitedOrderDetails.length;
  for (let i = 0; i < remainingRows; i++) {
    tableRows.push({
      productName: '',
      quantity: 0,
      unitPrice: 0,
      description: '',
    });
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>{safeJapaneseText('注文書')}</Text>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>注文日</Text>
            <Text style={styles.date}>{formatJapaneseDate(orderData.orderDate)}</Text>
          </View>
        </View>

        {/* 顧客セクション */}
        <View style={styles.customerSection}>
          <View style={styles.customerRow}>
            <View>
              <Text style={styles.customerName}>{safeJapaneseText(orderData.customer.name, 30)}</Text>
              <View style={styles.customerUnderline}></View>
            </View>
            <Text style={styles.customerLabel}>様</Text>
          </View>
        </View>

        <Text style={styles.message}>下記の通り御注文申し上げます。</Text>

        {/* テーブル */}
        <View style={styles.table}>
          {/* テーブルヘッダー */}
          <View style={styles.tableHeader}>
            <View style={styles.colProductName}>
              <Text style={styles.headerText}>品名</Text>
            </View>
            <View style={styles.colQuantity}>
              <Text style={styles.headerText}>数量</Text>
            </View>
            <View style={styles.colUnitPrice}>
              <Text style={styles.headerText}>単価</Text>
            </View>
            <View style={styles.colDescription}>
              <Text style={styles.headerText}>摘要</Text>
            </View>
          </View>

          {/* テーブル行 */}
          {tableRows.map((detail, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                detail.productName === '' ? styles.emptyRow : {},
              ]}
            >
              <View style={styles.colProductName}>
                <Text style={styles.cellTextBold}>
                  {detail.productName ? safeJapaneseText(detail.productName) : ''}
                </Text>
              </View>
              <View style={styles.colQuantity}>
                <Text style={styles.cellText}>
                  {detail.quantity > 0 ? detail.quantity.toString() : ''}
                </Text>
              </View>
              <View style={styles.colUnitPrice}>
                <Text style={styles.cellText}>
                  {detail.unitPrice > 0 ? `¥${detail.unitPrice.toLocaleString()}` : ''}
                </Text>
              </View>
              <View style={styles.colDescription}>
                <Text style={styles.cellText}>
                  {detail.description ? safeJapaneseText(detail.description) : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 備考欄 */}
        <View style={styles.remarksSection}>
          <Text style={styles.remarksTitle}>{safeJapaneseText('備考')}</Text>
          <View style={styles.remarksBox}>
            <Text style={styles.remarksText}>
              {orderData.note ? safeJapaneseText(orderData.note, 300) : '特記事項はありません。'}
            </Text>
          </View>
        </View>

        {/* フッター */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>発行日: {new Date().toLocaleDateString('ja-JP')}</Text>
          <Text style={styles.footerText}>注文書 ID: {orderData.id}</Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * 注文書PDFを生成する関数
 */
export async function generateOrderPdfBuffer(orderData: OrderData): Promise<Buffer> {
  console.log('PDF生成開始');
  console.log('注文データ:', JSON.stringify(orderData, null, 2));

  // 日本語フォント登録を試行
  const fontRegistered = registerJapaneseFont();
  const useCustomFont = fontRegistered;

  console.log('日本語フォント使用:', useCustomFont);

  const pdfDoc = <OrderPDF orderData={orderData} useCustomFont={useCustomFont} />;

  try {
    console.log('PDF生成中...');

    // PDFの生成を実行
    const pdfInstance = pdf(pdfDoc);
    const pdfData = await pdfInstance.toBuffer();

    // TypeScriptの型問題を回避するための変換
    let pdfBuffer: Buffer;
    if (Buffer.isBuffer(pdfData)) {
      pdfBuffer = pdfData;
    } else {
      // ReadableStreamの場合は手動でBufferに変換
      const chunks: Buffer[] = [];
      const stream = pdfData as unknown as NodeJS.ReadableStream;

      if (stream && typeof stream.on === 'function') {
        return new Promise<Buffer>((resolve, reject) => {
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log('PDF生成完了、バッファサイズ:', buffer.length);
            resolve(buffer);
          });
          stream.on('error', reject);
        });
      } else {
        // Uint8Arrayなど他の型の場合
        pdfBuffer = Buffer.from(pdfData as unknown as Uint8Array);
      }
    }

    console.log('PDF生成完了、バッファサイズ:', pdfBuffer.length);

    // Bufferの型チェック
    if (!Buffer.isBuffer(pdfBuffer)) {
      console.error('生成されたデータがBufferではありません:', typeof pdfBuffer);
      throw new Error('PDF生成でBufferが返されませんでした');
    }

    return pdfBuffer;
  } catch (error) {
    console.error('PDF生成中にエラーが発生:', error);
    console.error('エラーの詳細:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      orderDataKeys: Object.keys(orderData),
      orderDetailsCount: orderData.orderDetails?.length || 0,
    });
    throw new Error(
      `PDF生成に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * 注文書PDFのファイル名を生成する関数
 */
export function generateOrderPdfFileName(orderData: OrderData): string {
  const dateStr = formatJapaneseDate(orderData.orderDate).replace(/\//g, '');
  return `order_${orderData.id}_${dateStr}.pdf`;
}
