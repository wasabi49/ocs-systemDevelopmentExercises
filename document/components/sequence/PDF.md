# PDF Components (OrderPDF.tsx & DeliveryPDF.tsx) - シーケンス図

## 概要
注文書・納品書PDF生成コンポーネントの処理フローを示すシーケンス図です。

## 1. PDF生成の初期化

```mermaid
sequenceDiagram
    participant Component as 呼び出し元
    participant PDFComp as PDF Component
    participant ReactPDF as @react-pdf/renderer
    participant Font as Font Registry

    Component->>PDFComp: generateOrderPDF(order) / generateDeliveryPDF(delivery)
    PDFComp->>Font: Font.register() 実行
    Note over Font: "NotoSansJP フォント登録<br/>src: '/NotoSansJP-VariableFont_wght.ttf'"
    Font-->>PDFComp: フォント登録完了
    PDFComp->>ReactPDF: Document コンポーネント作成
```

## 2. スタイルシート適用

```mermaid
sequenceDiagram
    participant PDFComp as PDF Component
    participant StyleSheet as StyleSheet
    participant Styles as styles

    PDFComp->>StyleSheet: StyleSheet.create() 実行
    StyleSheet->>Styles: ページスタイル定義
    Note over Styles: "page: { fontFamily: 'NotoSansJP', fontSize: 9, padding: 20 }"
    StyleSheet->>Styles: ヘッダースタイル定義
    Note over Styles: "header: { flexDirection: 'row', justifyContent: 'space-between' }"
    StyleSheet->>Styles: テーブルスタイル定義
    Note over Styles: "table, tableRow, tableCell など"
    Styles-->>PDFComp: 完成したスタイルオブジェクト
```

## 3. PDFドキュメント構築

```mermaid
sequenceDiagram
    participant PDFComp as PDF Component
    participant Document as Document
    participant Page as Page
    participant View as View Components

    PDFComp->>Document: <Document> 作成
    Document->>Page: <Page style={styles.page}> 作成
    Page->>View: ヘッダーセクション構築
    Note over View: "タイトル、日付、ドキュメント番号"
    Page->>View: 顧客情報セクション構築
    Note over View: "顧客名、担当者、住所、電話番号"
    Page->>View: テーブルセクション構築
    Note over View: "商品一覧、数量、単価、金額"
    Page->>View: フッターセクション構築
    Note over View: "合計金額、備考"
```

## 4. 注文書PDF生成 (OrderPDF)

```mermaid
sequenceDiagram
    participant Component as 呼び出し元
    participant OrderPDF as OrderPDF
    participant PDF as pdf()
    participant Browser as ブラウザ

    Component->>OrderPDF: generateOrderPDF(order)
    OrderPDF->>OrderPDF: OrderDocument コンポーネント作成
    
    OrderPDF->>OrderPDF: ヘッダー情報設定
    Note over OrderPDF: "タイトル: "注文書"<br/>注文日: order.orderDate<br/>注文番号: order.id"
    
    OrderPDF->>OrderPDF: 顧客情報設定
    Note over OrderPDF: "顧客名: order.customer.name<br/>担当者: order.customer.contactPerson<br/>住所: order.customer.address"
    
    OrderPDF->>OrderPDF: 注文明細テーブル作成
    loop 各注文明細
        OrderPDF->>OrderPDF: 商品行追加
        Note over OrderPDF: "商品名、数量、単価、金額"
    end
    
    OrderPDF->>PDF: pdf(OrderDocument).toBlob()
    PDF-->>OrderPDF: PDF Blob
    OrderPDF->>Browser: window.open(blobURL)
    Browser-->>Component: PDF表示
```

## 5. 納品書PDF生成 (DeliveryPDF)

```mermaid
sequenceDiagram
    participant Component as 呼び出し元
    participant DeliveryPDF as DeliveryPDF
    participant PDF as pdf()
    participant Browser as ブラウザ

    Component->>DeliveryPDF: generateDeliveryPDF(delivery)
    DeliveryPDF->>DeliveryPDF: DeliveryDocument コンポーネント作成
    
    DeliveryPDF->>DeliveryPDF: ヘッダー情報設定
    Note over DeliveryPDF: "タイトル: "納品書"<br/>納品日: delivery.deliveryDate<br/>納品番号: delivery.id"
    
    DeliveryPDF->>DeliveryPDF: 顧客情報設定
    Note over DeliveryPDF: "顧客名: delivery.customer.name<br/>担当者: delivery.customer.contactPerson<br/>住所: delivery.customer.address"
    
    DeliveryPDF->>DeliveryPDF: 納品明細テーブル作成
    loop 各納品明細
        DeliveryPDF->>DeliveryPDF: 商品行追加
        Note over DeliveryPDF: "商品名、数量、単価、金額"
    end
    
    DeliveryPDF->>PDF: pdf(DeliveryDocument).toBlob()
    PDF-->>DeliveryPDF: PDF Blob
    DeliveryPDF->>Browser: window.open(blobURL)
    Browser-->>Component: PDF表示
```

## 6. テーブル構築処理

```mermaid
sequenceDiagram
    participant PDFComp as PDF Component
    participant Table as Table View
    participant Row as Table Row
    participant Cell as Table Cell

    PDFComp->>Table: <View style={styles.table}> 作成
    
    Table->>Row: ヘッダー行作成
    Row->>Cell: "商品名" セル
    Row->>Cell: "数量" セル
    Row->>Cell: "単価" セル
    Row->>Cell: "金額" セル
    
    loop 各アイテム
        Table->>Row: データ行作成
        Row->>Cell: item.productName
        Row->>Cell: item.quantity
        Row->>Cell: item.unitPrice.toLocaleString()
        Row->>Cell: (item.quantity * item.unitPrice).toLocaleString()
    end
    
    Table->>Row: 合計行作成
    Row->>Cell: "合計" セル
    Row->>Cell: 空セル
    Row->>Cell: 空セル
    Row->>Cell: totalAmount.toLocaleString()
```

## 7. 日付フォーマット処理

```mermaid
sequenceDiagram
    participant PDFComp as PDF Component
    participant DateFormat as 日付フォーマット
    participant Display as 表示

    PDFComp->>DateFormat: new Date(dateString)
    DateFormat->>DateFormat: toLocaleDateString('ja-JP')
    DateFormat-->>PDFComp: フォーマット済み日付
    
    Note over DateFormat: "例: "2024/12/25""
    
    PDFComp->>Display: 日付表示
```

## 8. 金額フォーマット処理

```mermaid
sequenceDiagram
    participant PDFComp as PDF Component
    participant AmountFormat as 金額フォーマット
    participant Display as 表示

    PDFComp->>AmountFormat: amount.toLocaleString('ja-JP')
    AmountFormat-->>PDFComp: カンマ区切り金額
    
    Note over AmountFormat: "例: 150,000 → "150,000""
    
    PDFComp->>Display: "¥{formattedAmount}"
    Note over Display: "例: "¥150,000""
```

## 共通スタイル構造

```mermaid
classDiagram
    class PDFStyles {
        +Object page
        +Object header
        +Object title
        +Object dateSection
        +Object customerSection
        +Object table
        +Object tableHeader
        +Object tableRow
        +Object tableCell
        +Object totalSection
    }
    
    class PageStyle {
        +string fontFamily = 'NotoSansJP'
        +number fontSize = 9
        +number padding = 20
        +string backgroundColor = '#ffffff'
        +number lineHeight = 1.2
    }
    
    PDFStyles --> PageStyle : contains
```

## エラーハンドリング

```mermaid
sequenceDiagram
    participant Component as 呼び出し元
    participant PDFComp as PDF Component
    participant PDF as pdf()
    participant ErrorHandler as エラーハンドラー

    Component->>PDFComp: generatePDF(data)
    PDFComp->>PDF: pdf(Document).toBlob()
    
    alt PDF生成成功
        PDF-->>PDFComp: PDF Blob
        PDFComp->>Component: PDF表示
    else PDF生成失敗
        PDF-->>ErrorHandler: Error
        ErrorHandler->>ErrorHandler: console.error()
        ErrorHandler->>Component: エラー通知
    end
```

## 使用パターン

### 注文書生成
```typescript
import { generateOrderPDF } from '@/components/OrderPDF';

const handlePrintOrder = async () => {
  try {
    await generateOrderPDF(orderData);
  } catch (error) {
    console.error('PDF生成に失敗しました:', error);
  }
};
```

### 納品書生成
```typescript
import { generateDeliveryPDF } from '@/components/DeliveryPDF';

const handlePrintDelivery = async () => {
  try {
    await generateDeliveryPDF(deliveryData);
  } catch (error) {
    console.error('PDF生成に失敗しました:', error);
  }
};
```

## 特徴

### 1. 日本語対応
- NotoSansJPフォント使用
- 適切な文字エンコーディング

### 2. プロフェッショナルなレイアウト
- ビジネス文書に適したデザイン
- 構造化された情報配置

### 3. 動的コンテンツ
- データに基づく動的生成
- 柔軟な明細行数対応

### 4. ブラウザ統合
- 新しいタブでの表示
- 印刷・保存機能

### 5. 再利用性
- 共通スタイルの活用
- モジュラー設計

## パフォーマンス考慮

### フォント最適化
- フォントファイルの事前読み込み
- 適切なファイルサイズ

### PDF生成最適化
- 効率的なコンポーネント構造
- 最小限のメモリ使用量