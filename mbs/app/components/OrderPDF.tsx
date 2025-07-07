import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';
import type { Prisma } from '@/app/generated/prisma';

// フォントを登録
Font.register({
  family: 'NotoSansJP',
  src: '/NotoSansJP-VariableFont_wght.ttf',
});

// PDFのスタイル定義
const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansJP',
    fontSize: 9,
    padding: 20,
    backgroundColor: '#ffffff',
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
  colNo: {
    width: '8%',
    textAlign: 'center',
    borderRight: '0.5 solid #bdc3c7',
    paddingVertical: 3,
  },
  colName: {
    width: '45%',
    textAlign: 'left',
    borderRight: '0.5 solid #bdc3c7',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  colDescription: {
    width: '20%',
    textAlign: 'left',
    borderRight: '0.5 solid #bdc3c7',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  colQuantity: {
    width: '9%',
    textAlign: 'center',
    borderRight: '0.5 solid #bdc3c7',
    paddingVertical: 3,
  },
  colUnitPrice: {
    width: '9%',
    textAlign: 'right',
    borderRight: '0.5 solid #bdc3c7',
    paddingHorizontal: 3,
    paddingVertical: 3,
  },
  colAmount: {
    width: '9%',
    textAlign: 'right',
    paddingHorizontal: 3,
    paddingVertical: 3,
  },
  summarySection: {
    flexDirection: 'row',
    marginTop: 6,
    justifyContent: 'flex-end',
  },
  totalContainer: {
    width: '40%',
    backgroundColor: '#2c3e50',
    border: '2 solid #34495e',
    borderRadius: 3,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalTitle: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#ffffff',
  },
  totalAmount: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#ffffff',
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
  // 備考欄
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
    minHeight: 75,
    padding: 8,
    backgroundColor: '#f8f9fa',
  },
  remarksText: {
    fontSize: 10,
    color: '#2c3e50',
    lineHeight: 1.6,
  },
});

// 日本円のフォーマット関数
const formatJPY = (amount: number): string => {
  return `¥${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// 日付フォーマット関数
const formatDate = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return `${dateObj.getFullYear()}年${String(dateObj.getMonth() + 1).padStart(2, '0')}月${String(dateObj.getDate()).padStart(2, '0')}日`;
};

// OrderWithRelations型を使用
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    orderDetails: true;
  };
}>;

interface OrderPDFProps {
  orderData: OrderWithRelations;
}

// PDF生成コンポーネント
const OrderPDF: React.FC<OrderPDFProps> = ({ orderData }) => {
  // 合計金額を計算
  const totalAmount = orderData.orderDetails.reduce(
    (sum, detail) => sum + detail.unitPrice * detail.quantity,
    0,
  );

  // 表示用データ（20行に調整）
  const displayDetails = [...orderData.orderDetails];
  while (displayDetails.length < 20) {
    displayDetails.push({
      id: '',
      orderId: '',
      productName: '',
      unitPrice: 0,
      quantity: 0,
      description: null,
      updatedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
    });
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>注文書</Text>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>注文日</Text>
            <Text style={styles.date}>{formatDate(orderData.orderDate)}</Text>
          </View>
        </View>

        {/* 顧客セクション */}
        <View style={styles.customerSection}>
          <View style={styles.customerRow}>
            <View>
              <Text style={styles.customerName}>{orderData.customer.name}</Text>
              <View style={styles.customerUnderline}></View>
            </View>
            <Text style={styles.customerLabel}>様</Text>
          </View>
        </View>

        <Text style={styles.message}>下記のとおり注文いたします。</Text>

        {/* テーブル */}
        <View style={styles.table}>
          {/* テーブルヘッダー */}
          <View style={styles.tableHeader}>
            <View style={styles.colNo}>
              <Text style={styles.headerText}>品番</Text>
            </View>
            <View style={styles.colName}>
              <Text style={styles.headerText}>品名</Text>
            </View>
            <View style={styles.colDescription}>
              <Text style={styles.headerText}>摘要</Text>
            </View>
            <View style={styles.colQuantity}>
              <Text style={styles.headerText}>数量</Text>
            </View>
            <View style={styles.colUnitPrice}>
              <Text style={styles.headerText}>単価</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.headerText}>金額</Text>
            </View>
          </View>

          {/* テーブル行 */}
          {displayDetails.map((detail, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                detail.productName === '' ? styles.emptyRow : {},
              ]}
            >
              <View style={styles.colNo}>
                <Text style={styles.cellText}>{detail.productName ? index + 1 : ''}</Text>
              </View>
              <View style={styles.colName}>
                <Text style={styles.cellTextBold}>{detail.productName}</Text>
              </View>
              <View style={styles.colDescription}>
                <Text style={styles.cellText}>{detail.description || ''}</Text>
              </View>
              <View style={styles.colQuantity}>
                <Text style={styles.cellText}>
                  {detail.quantity > 0 ? detail.quantity.toString() : ''}
                </Text>
              </View>
              <View style={styles.colUnitPrice}>
                <Text style={styles.cellText}>
                  {detail.unitPrice > 0 ? formatJPY(detail.unitPrice) : ''}
                </Text>
              </View>
              <View style={styles.colAmount}>
                <Text style={styles.cellTextBold}>
                  {detail.quantity > 0 && detail.unitPrice > 0
                    ? formatJPY(detail.unitPrice * detail.quantity)
                    : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 合計セクション */}
        <View style={styles.summarySection}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalTitle}>合計金額</Text>
            <Text style={styles.totalAmount}>{formatJPY(totalAmount)}</Text>
          </View>
        </View>

        {/* 備考欄 */}
        <View style={styles.remarksSection}>
          <Text style={styles.remarksTitle}>備考</Text>
          <View style={styles.remarksBox}>
            <Text style={styles.remarksText}>
              {orderData.note || '特記事項はありません。'}
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

// PDF生成とダウンロード用のユーティリティ関数
export const generateOrderPDF = async (orderData: OrderWithRelations) => {
  const doc = <OrderPDF orderData={orderData} />;
  const pdfBlob = await pdf(doc).toBlob();
  
  // ダウンロード処理
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `注文書_${orderData.customer.name}_${orderData.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default OrderPDF;