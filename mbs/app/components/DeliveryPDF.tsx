import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer';

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
    width: '50%',
    textAlign: 'left',
    borderRight: '0.5 solid #bdc3c7',
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  colQuantity: {
    width: '14%',
    textAlign: 'center',
    borderRight: '0.5 solid #bdc3c7',
    paddingVertical: 3,
  },
  colUnitPrice: {
    width: '14%',
    textAlign: 'right',
    borderRight: '0.5 solid #bdc3c7',
    paddingHorizontal: 3,
    paddingVertical: 3,
  },
  colAmount: {
    width: '14%',
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
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`;
};

// DeliveryDetail型定義
interface DeliveryDetail {
  id: string;
  deliveryId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

interface Customer {
  id: string;
  storeId: string;
  name: string;
  contactPerson?: string;
  address?: string;
  phone?: string;
  deliveryCondition?: string;
  note?: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

interface DeliveryData {
  id: string;
  customerId: string;
  deliveryDate: string;
  totalAmount?: number;
  totalQuantity?: number;
  note?: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  customer: Customer;
  deliveryDetails: DeliveryDetail[];
}

interface DeliveryPDFProps {
  deliveryData: DeliveryData;
}

// PDF生成コンポーネント
const DeliveryPDF: React.FC<DeliveryPDFProps> = ({ deliveryData }) => {
  // 合計金額を計算
  const totalAmount = deliveryData.deliveryDetails.reduce(
    (sum, detail) => sum + detail.unitPrice * detail.quantity,
    0,
  );

  // 表示用データ（20行に調整）
  const displayDetails = [...deliveryData.deliveryDetails];
  while (displayDetails.length < 20) {
    displayDetails.push({
      id: '',
      deliveryId: '',
      productName: '',
      unitPrice: 0,
      quantity: 0,
      updatedAt: '',
      isDeleted: false,
      deletedAt: null,
    });
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>納品書</Text>
          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>納品日</Text>
            <Text style={styles.date}>{formatDate(deliveryData.deliveryDate)}</Text>
          </View>
        </View>

        {/* 顧客セクション */}
        <View style={styles.customerSection}>
          <View style={styles.customerRow}>
            <View>
              <Text style={styles.customerName}>{deliveryData.customer.name}</Text>
              <View style={styles.customerUnderline}></View>
            </View>
            <Text style={styles.customerLabel}>様</Text>
          </View>
        </View>

        <Text style={styles.message}>下記のとおり納品いたしました。</Text>

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
              {deliveryData.note || '特記事項はありません。'}
            </Text>
          </View>
        </View>

        {/* フッター */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>発行日: {new Date().toLocaleDateString('ja-JP')}</Text>
          <Text style={styles.footerText}>納品書 ID: {deliveryData.id}</Text>
        </View>
      </Page>
    </Document>
  );
};

// PDF生成とダウンロード用のユーティリティ関数
export const generateDeliveryPDF = async (deliveryData: DeliveryData) => {
  const doc = <DeliveryPDF deliveryData={deliveryData} />;
  const pdfBlob = await pdf(doc).toBlob();
  
  // ダウンロード処理
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `納品書_${deliveryData.customer.name}_${deliveryData.id}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default DeliveryPDF;