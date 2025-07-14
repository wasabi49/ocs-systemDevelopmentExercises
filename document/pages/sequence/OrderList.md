# OrderList Page - シーケンス図

## 概要
注文一覧ページの処理フローを示すシーケンス図です。

## 1. ページ初期化とデータ取得

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant Page as OrderListPage
    participant Actions as fetchOrders
    participant Database as データベース
    participant StoreCheck as checkStoreRequirement

    Browser->>Page: /Home/OrderList アクセス
    Page->>Actions: fetchOrders() 実行
    Actions->>Database: 注文データ取得クエリ
    Note over Database: "JOIN customer テーブル<br/>store条件でフィルタ"
    
    Database-->>Actions: 注文データ + 顧客情報
    Actions-->>Page: { status: 'success', data: orders }
    
    Page->>StoreCheck: checkStoreRequirement(result)
    StoreCheck->>StoreCheck: 店舗選択状態確認
```

## 2. 店舗要件チェック処理

```mermaid
sequenceDiagram
    participant Page as OrderListPage
    participant StoreCheck as checkStoreRequirement
    parameter Navigation as redirect
    participant Result as API結果

    Page->>StoreCheck: checkStoreRequirement(result) 実行
    StoreCheck->>Result: result.status 確認
    
    alt store_required
        Result-->>StoreCheck: 店舗選択が必要
        StoreCheck->>Navigation: redirect('/stores')
        Navigation-->>Browser: 店舗選択ページへ遷移
    else success
        Result-->>StoreCheck: 正常データ
        StoreCheck-->>Page: 処理続行
    else error
        Result-->>StoreCheck: エラーデータ
        StoreCheck-->>Page: エラーハンドリングへ
    end
```

## 3. データ変換処理

```mermaid
sequenceDiagram
    participant Page as OrderListPage
    participant DataTransform as データ変換
    participant TypeDef as OrderWithCustomer型
    participant DateConvert as 日付変換

    Page->>DataTransform: result.data.map() 実行
    
    loop 各注文データ
        DataTransform->>TypeDef: 型変換処理
        Note over TypeDef: "id, customerId, note, status<br/>isDeleted フィールド直接コピー"
        
        DataTransform->>DateConvert: 日付フィールド変換
        Note over DateConvert: "orderDate: new Date(orderData.orderDate)<br/>updatedAt: new Date(orderData.updatedAt)<br/>deletedAt: orderData.deletedAt ? new Date() : null"
        
        DataTransform->>TypeDef: 顧客情報フラット化
        Note over TypeDef: "customerName: orderData.customer.name<br/>customerContactPerson: orderData.customer.contactPerson || ''"
    end
    
    DataTransform-->>Page: OrderWithCustomer[] 配列
```

## 4. 型安全性とインターフェース

```mermaid
sequenceDiagram
    participant Page as OrderListPage
    participant Interface as OrderWithCustomer
    participant PrismaType as Order型
    participant ExtendedType as 拡張型

    Page->>Interface: OrderWithCustomer インターフェース定義
    Interface->>PrismaType: Order型を継承
    Note over PrismaType: "@/app/generated/prisma から型取得"
    
    Interface->>ExtendedType: 追加フィールド定義
    Note over ExtendedType: "customerName: string<br/>customerContactPerson: string"
    
    ExtendedType-->>Page: 型安全なデータ構造
```

## 5. エラーハンドリング

```mermaid
sequenceDiagram
    participant Page as OrderListPage
    participant ErrorHandle as エラーハンドリング
    participant Console as console.error
    participant Client as OrderListClient

    Page->>ErrorHandle: result.status === 'error' チェック
    
    alt データ取得エラー
        ErrorHandle->>Console: console.error('初期データの取得に失敗:', result.error)
        ErrorHandle->>ErrorHandle: orders = [] 設定
        ErrorHandle->>Client: 空配列で初期化
    else 正常処理
        ErrorHandle->>Client: 正常データで初期化
    end
    
    Client-->>Page: UIレンダリング
```

## 6. クライアントコンポーネント連携

```mermaid
sequenceDiagram
    participant Page as OrderListPage
    participant Client as OrderListClient
    participant Props as initialOrders
    participant UI as ユーザーインターフェース

    Page->>Props: OrderWithCustomer[] 準備
    Props->>Client: <OrderListClient initialOrders={orders} />
    Client->>UI: クライアントサイド初期化
    
    UI->>UI: テーブル表示
    UI->>UI: 検索機能
    UI->>UI: ソート機能
    UI->>UI: ページネーション
    
    UI-->>Page: インタラクティブな注文一覧
```

## データフロー構造

```mermaid
classDiagram
    class OrderListPage {
        +async function()
        -fetchOrders()
        -checkStoreRequirement()
        +OrderWithCustomer[] orders
    }
    
    class OrderWithCustomer {
        +string id
        +string customerId
        +Date orderDate
        +string note
        +string status
        +Date updatedAt
        +boolean isDeleted
        +Date|null deletedAt
        +string customerName
        +string customerContactPerson
    }
    
    class Order {
        +string id
        +string customerId
        +Date orderDate
        +string note
        +string status
        +Date updatedAt
        +boolean isDeleted
        +Date|null deletedAt
    }
    
    OrderListPage --> OrderWithCustomer : creates
    OrderWithCustomer --|> Order : extends
```

## API レスポンス処理

```mermaid
sequenceDiagram
    participant Page as OrderListPage
    participant API as fetchOrders API
    participant Response as APIレスポンス
    participant Transform as レスポンス変換

    Page->>API: fetchOrders() 呼び出し
    API-->>Response: APIレスポンス受信
    
    Response->>Transform: データ構造確認
    Note over Transform: "{<br/>  status: 'success',<br/>  data: [{<br/>    id, customerId, orderDate,<br/>    customer: { name, contactPerson }<br/>  }]<br/>}"
    
    Transform->>Transform: フラット化処理
    Transform-->>Page: 変換済みデータ
```

## 日付処理パターン

```mermaid
sequenceDiagram
    participant Page as OrderListPage
    participant DateField as 日付フィールド
    participant DateConstructor as Date Constructor
    participant Result as Date オブジェクト

    Page->>DateField: orderData.orderDate (string)
    DateField->>DateConstructor: new Date(orderData.orderDate)
    DateConstructor-->>Result: Date オブジェクト
    
    Page->>DateField: orderData.updatedAt (string)
    DateField->>DateConstructor: new Date(orderData.updatedAt)
    DateConstructor-->>Result: Date オブジェクト
    
    Page->>DateField: orderData.deletedAt (string|null)
    
    alt deletedAt が存在
        DateField->>DateConstructor: new Date(orderData.deletedAt)
        DateConstructor-->>Result: Date オブジェクト
    else deletedAt が null
        DateField-->>Result: null
    end
```

## サーバーサイドレンダリング最適化

```mermaid
flowchart TD
    A[HTTP Request] --> B[OrderListPage実行]
    B --> C[fetchOrders()]
    C --> D[データベースクエリ]
    D --> E{データ取得成功?}
    
    E -->|成功| F[データ変換処理]
    E -->|失敗| G[エラーログ出力]
    
    F --> H[OrderListClient作成]
    G --> I[空配列でClient作成]
    
    H --> J[SSRで完成HTML]
    I --> J
    
    J --> K[ブラウザに送信]
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style G fill:#ffcdd2
    style J fill:#c8e6c9
```

## 特徴

### 1. サーバーサイドレンダリング
- 初期データのサーバーサイド取得
- SEO対応と高速初期表示

### 2. 型安全性
- TypeScript型定義の活用
- Prisma生成型との連携

### 3. データ変換最適化
- API レスポンスの適切な変換
- フラット化による使いやすいデータ構造

### 4. エラーハンドリング
- 段階的なエラー処理
- ユーザーフレンドリーな表示

### 5. 店舗ベースアクセス制御
- 店舗選択状態の確認
- 適切なリダイレクト処理

## パフォーマンス考慮

### データベース最適化
- JOIN を使った効率的なクエリ
- 必要なフィールドのみ取得

### メモリ効率
- ストリーミング可能なデータ処理
- 大量データへの対応

### レンダリング最適化
- サーバーサイドでの事前処理
- クライアント初期化時間短縮

## 依存関係

### 外部依存
- `@/app/actions/orderActions` - データ取得
- `@/app/generated/prisma` - 型定義
- `@/app/utils/storeRedirect` - リダイレクト処理

### 内部依存
- `./components/OrderListClient` - UI コンポーネント
- データベース接続
- 店舗状態管理

## 拡張可能性

### フィルタリング機能
```typescript
interface OrderFilter {
  status?: string;
  dateRange?: { start: Date; end: Date };
  customerId?: string;
}
```

### ソート機能
```typescript
interface OrderSort {
  field: keyof OrderWithCustomer;
  direction: 'asc' | 'desc';
}
```

### ページネーション
```typescript
interface OrderPagination {
  page: number;
  limit: number;
  total: number;
}
```