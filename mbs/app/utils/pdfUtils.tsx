/**
 * PDF生成用のユーティリティ関数 (@react-pdf/renderer使用)
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';

// 日本語フォントを登録（サーバーサイド対応）
let fontRegistered = false;
let fontAvailable = false;

const registerJapaneseFont = () => {
  if (fontRegistered) return fontAvailable;

  try {
    const fontPath = path.join(process.cwd(), 'public', 'NotoSansJP-VariableFont_wght.ttf');
    console.log('フォントパス:', fontPath);

    // フォントファイルが存在するかチェック
    if (fs.existsSync(fontPath)) {
      // フォントファイルをBase64として読み込み
      console.log('フォントファイルを読み込み中...');
      const fontBuffer = fs.readFileSync(fontPath);
      const fontBase64 = `data:font/truetype;base64,${fontBuffer.toString('base64')}`;
      console.log('Base64変換完了 (長さ:', fontBase64.length, ')');

      Font.register({
        family: 'NotoSansJP',
        src: fontBase64,
      });

      fontRegistered = true;
      fontAvailable = true;
      console.log('日本語フォントが正常に登録されました (Base64形式)');

      // 登録されたフォントを確認
      try {
        const registeredFonts = Font.getHyphenationCallback
          ? 'Font.getHyphenationCallback available'
          : 'Standard registration';
        console.log('フォント登録確認:', registeredFonts);
      } catch (e) {
        console.log('フォント確認中にエラー:', e);
      }
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
      fontSize: 10,
    },
    header: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'left',
      color: '#000000',
    },
    dateSection: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: 20,
      gap: 10,
    },
    dateLabel: {
      fontSize: 10,
      color: '#000000',
    },
    dateBox: {
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#000000',
      padding: 5,
      minWidth: 40,
      textAlign: 'center',
    },
    customerSection: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginBottom: 10,
    },
    customerName: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#000000',
      marginRight: 10,
    },
    honorific: {
      fontSize: 14,
      color: '#000000',
    },
    dividerLine: {
      borderStyle: 'solid',
      borderBottomWidth: 1,
      borderColor: '#4A90E2',
      marginBottom: 15,
      width: '50%', // 左半分のみ
    },
    orderText: {
      fontSize: 10,
      color: '#000000',
      marginBottom: 20,
      textAlign: 'left',
    },
    table: {
      width: '100%',
      borderStyle: 'solid',
      borderWidth: 2,
      borderColor: '#4A90E2', // 青色のボーダー
      marginBottom: 20,
    },
    tableHeader: {
      backgroundColor: '#4A90E2', // 青い背景
      flexDirection: 'row',
    },
    tableRow: {
      flexDirection: 'row',
      borderStyle: 'solid',
      borderBottomWidth: 1,
      borderColor: '#4A90E2',
    },
    tableColHeader: {
      borderStyle: 'solid',
      borderRightWidth: 1,
      borderColor: '#FFFFFF', // 白いボーダーでセル区切り
      padding: 8,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 25,
    },
    tableCol: {
      borderStyle: 'solid',
      borderRightWidth: 1,
      borderColor: '#4A90E2',
      padding: 6,
      justifyContent: 'center',
      minHeight: 20,
    },
    // 列幅の調整（画像に合わせて）
    productNameCol: {
      width: '45%', // 品名列（拡大）
    },
    quantityCol: {
      width: '7%', // 数量列（縮小）
    },
    priceCol: {
      width: '8%', // 単価列（縮小）
    },
    descriptionCol: {
      width: '40%', // 摘要列（拡大）
    },
    tableCellHeader: {
      fontSize: 11,
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#FFFFFF', // 白い文字
    },
    tableCell: {
      fontSize: 9,
      lineHeight: 1.2,
      color: '#000000',
      textAlign: 'left',
    },
    tableCellRight: {
      fontSize: 9,
      textAlign: 'right',
      lineHeight: 1.2,
      color: '#000000',
    },
    tableCellCenter: {
      fontSize: 9,
      textAlign: 'center',
      lineHeight: 1.2,
      color: '#000000',
    },
    noteSection: {
      marginBottom: 15,
    },
    noteTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      marginBottom: 5,
      color: '#000000',
    },
    noteBox: {
      border: '1pt solid #4A90E2',
      minHeight: 40,
      padding: 8,
      backgroundColor: '#FFFFFF',
    },
    noteText: {
      fontSize: 9,
      lineHeight: 1.3,
      color: '#000000',
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
        {/* タイトル */}
        <View style={styles.header}>
          <Text style={styles.title}>{safeJapaneseText('注文書')}</Text>
        </View>

        {/* 日付欄 */}
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>{formatJapaneseDate(orderData.orderDate)}</Text>
        </View>

        {/* 顧客名 */}
        <View style={styles.customerSection}>
          <Text style={styles.customerName}>
            {safeJapaneseText(`${orderData.customer.name}`, 30)}
          </Text>
          <Text style={styles.honorific}>様</Text>
        </View>

        {/* 区切り線 */}
        <View style={styles.dividerLine} />

        {/* 注文テキスト */}
        <View>
          <Text style={styles.orderText}>{safeJapaneseText('下記の通り御注文申し上げます')}</Text>
        </View>

        {/* テーブル */}
        <View style={styles.table}>
          {/* ヘッダー行（青い背景） */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableColHeader, styles.productNameCol]}>
              <Text style={styles.tableCellHeader}>品名</Text>
            </View>
            <View style={[styles.tableColHeader, styles.quantityCol]}>
              <Text style={styles.tableCellHeader}>数量</Text>
            </View>
            <View style={[styles.tableColHeader, styles.priceCol]}>
              <Text style={styles.tableCellHeader}>単価</Text>
            </View>
            <View style={[styles.tableColHeader, styles.descriptionCol]}>
              <Text style={styles.tableCellHeader}>摘要</Text>
            </View>
          </View>

          {/* データ行 */}
          {tableRows.map((detail, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.tableCol, styles.productNameCol]}>
                <Text style={styles.tableCell}>
                  {detail.productName ? safeJapaneseText(detail.productName) : ''}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.quantityCol]}>
                <Text style={styles.tableCellCenter}>
                  {detail.quantity > 0 ? detail.quantity.toString() : ''}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.priceCol]}>
                <Text style={styles.tableCellRight}>
                  {detail.unitPrice > 0 ? `¥${detail.unitPrice.toLocaleString()}` : ''}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.descriptionCol]}>
                <Text style={styles.tableCell}>
                  {detail.description ? safeJapaneseText(detail.description) : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 備考欄 */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>{safeJapaneseText('備考')}</Text>
          <View style={styles.noteBox}>
            {orderData.note && (
              <Text style={styles.noteText}>{safeJapaneseText(orderData.note, 300)}</Text>
            )}
          </View>
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

  // フォント登録を試行（ただし失敗しても続行）
  let useCustomFont = false;
  try {
    useCustomFont = registerJapaneseFont();
    console.log('カスタムフォント使用:', useCustomFont);
  } catch (fontError) {
    console.warn('カスタムフォント登録に失敗、デフォルトフォントを使用:', fontError);
    useCustomFont = false;
  }

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
        pdfBuffer = Buffer.from(pdfData as Uint8Array);
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
