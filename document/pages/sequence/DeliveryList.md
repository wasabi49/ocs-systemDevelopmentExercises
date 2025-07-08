# DeliveryList Page - シーケンス図

## 概要
納品一覧ページの処理フローを示すシーケンス図です。

## 1. ページ初期化とデータ取得

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant Page as DeliveryListPage
    participant Actions as fetchDeliveries
    participant Database as データベース
    participant StoreCheck as checkStoreRequirement

    Browser->>Page: /Home/DeliveryList アクセス
    Page->>Actions: fetchDeliveries() 実行
    Actions->>Database: 納品データ取得クエリ
    Note over Database: JOIN customer, order テーブル<br/>store条件でフィルタ
    
    Database-->>Actions: 納品データ + 関連情報
    Actions-->>Page: { status: 'success', data: deliveries }
    
    Page->>StoreCheck: checkStoreRequirement(result)
    StoreCheck->>StoreCheck: 店舗選択状態確認
```

## 2. 店舗要件チェック処理

```mermaid
sequenceDiagram
    participant Page as DeliveryListPage
    participant StoreCheck as checkStoreRequirement
    participant Navigation as redirect
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

## 3. 初期データ設定

```mermaid
sequenceDiagram
    participant Page as DeliveryListPage
    participant Result as fetchResult
    participant DataArray as initialDeliveries
    participant TypeDef as Delivery型

    Page->>Result: result.status チェック
    
    alt success
        Result->>DataArray: result.data 設定
        Note over DataArray: 取得された納品データ配列
    else error または その他
        Result->>DataArray: [] (空配列) 設定
        Note over DataArray: フォールバック処理
    end
    
    DataArray->>TypeDef: Delivery[] 型保証
    TypeDef-->>Page: 型安全な初期データ
```

## 4. エラーハンドリング

```mermaid
sequenceDiagram
    participant Page as DeliveryListPage
    participant ErrorCheck as エラーチェック
    participant Console as console.error
    participant Client as DeliveryListClient

    Page->>ErrorCheck: result.status === 'error' 確認
    
    alt データ取得エラー
        ErrorCheck->>Console: console.error('納品データの取得に失敗しました:', result.error)
        ErrorCheck->>Client: 空配列で初期化
        Client->>Client: エラー状態表示準備
    else 正常処理
        ErrorCheck->>Client: 正常データで初期化
        Client->>Client: 通常表示準備
    end
    
    Client-->>Page: UIレンダリング
```

## 5. クライアントコンポーネント連携

```mermaid
sequenceDiagram
    participant Page as DeliveryListPage
    participant Props as initialDeliveries
    participant Client as DeliveryListClient
    participant UI as ユーザーインターフェース

    Page->>Props: Delivery[] 準備
    Props->>Client: <DeliveryListClient initialDeliveries={initialDeliveries} />
    Client->>UI: クライアントサイド初期化
    
    UI->>UI: 納品一覧表示
    UI->>UI: 検索フィルタ
    UI->>UI: ソート機能
    UI->>UI: 詳細表示
    UI->>UI: 編集・削除操作
    
    UI-->>Page: インタラクティブな納品管理画面
```

## 6. 型定義統合

```mermaid
sequenceDiagram
    participant Page as DeliveryListPage
    participant Import as インポート
    participant TypeDef as Delivery型
    participant Client as DeliveryListClient

    Page->>Import: DeliveryListClient, { Delivery } インポート
    Import->>TypeDef: Delivery型定義取得
    Note over TypeDef: クライアントコンポーネントから<br/>型定義をインポート
    
    TypeDef->>Page: 型安全性確保
    Page->>Client: 同じ型定義でデータ渡し
    Client-->>Page: 型整合性保証
```

## データフロー構造

```mermaid
classDiagram
    class DeliveryListPage {
        +async function()
        -fetchDeliveries()
        -checkStoreRequirement()
        +Delivery[] initialDeliveries
    }
    
    class Delivery {
        <<imported from Client>>
        +string id
        +string customerId
        +Date deliveryDate
        +string status
        +related fields
    }
    
    class FetchResult {
        +string status
        +Delivery[] data
        +string error
    }
    
    DeliveryListPage --> Delivery : uses
    DeliveryListPage --> FetchResult : receives
```

## API レスポンス処理

```mermaid
sequenceDiagram
    participant Page as DeliveryListPage
    participant API as fetchDeliveries API
    participant Response as APIレスポンス
    participant Processing as レスポンス処理

    Page->>API: fetchDeliveries() 呼び出し
    API-->>Response: APIレスポンス受信
    
    Response->>Processing: レスポンス構造確認
    Note over Processing: {<br/>  status: 'success' | 'error' | 'store_required',<br/>  data?: Delivery[],<br/>  error?: string<br/>}
    
    Processing->>Processing: 条件分岐処理
    Processing-->>Page: 処理済みデータ
```

## サーバーサイドレンダリング

```mermaid
flowchart TD
    A[HTTP Request] --> B[DeliveryListPage実行]
    B --> C[fetchDeliveries()]
    C --> D[データベースクエリ]
    D --> E{データ取得成功?}
    
    E -->|成功| F[initialDeliveries設定]
    E -->|失敗| G[エラーログ + 空配列]
    
    F --> H[checkStoreRequirement()]
    G --> H
    
    H --> I{店舗チェック}
    I -->|OK| J[DeliveryListClient作成]
    I -->|NG| K[リダイレクト実行]
    
    J --> L[SSRで完成HTML]
    L --> M[ブラウザに送信]
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style G fill:#ffcdd2
    style J fill:#c8e6c9
    style K fill:#ffecb3
```

## エラーログ出力パターン

```mermaid
sequenceDiagram
    participant Page as DeliveryListPage
    participant ErrorCondition as エラー条件
    participant Logger as console.error
    participant ErrorMessage as エラーメッセージ

    Page->>ErrorCondition: result.status === 'error' チェック
    
    ErrorCondition->>Logger: console.error() 実行
    Logger->>ErrorMessage: '納品データの取得に失敗しました:'
    ErrorMessage->>ErrorMessage: result.error 詳細追加
    
    Note over ErrorMessage: 開発者向けデバッグ情報<br/>本番環境での問題特定に使用
    
    ErrorMessage-->>Page: ログ出力完了
```

## 店舗ベースデータフィルタリング

```mermaid
sequenceDiagram
    participant Page as DeliveryListPage
    participant StoreContext as 店舗コンテキスト
    participant Database as データベース
    participant Filter as フィルタ処理

    Page->>StoreContext: 現在の店舗ID取得
    StoreContext-->>Database: storeId でフィルタリング
    
    Database->>Filter: WHERE store_id = ? 条件
    Filter->>Filter: 店舗固有の納品データのみ取得
    Note over Filter: セキュリティとデータ分離
    
    Filter-->>Page: 店舗専用納品リスト
```

## 特徴

### 1. シンプルな構造
- 最小限のロジック
- 明確な責任分離

### 2. 型安全性
- クライアントコンポーネントからの型インポート
- 一貫した型定義の使用

### 3. エラー耐性
- 段階的なエラーハンドリング
- フォールバック処理の充実

### 4. パフォーマンス最適化
- サーバーサイドでの初期データ取得
- 効率的なデータベースクエリ

### 5. 店舗ベースアクセス制御
- セキュアなデータアクセス
- 適切なリダイレクト処理

## パフォーマンス考慮

### データベース最適化
- 効率的な JOIN クエリ
- インデックスの活用

### メモリ効率
- 最小限のサーバーサイド処理
- ストリーミング可能な設計

### レンダリング最適化
- 軽量なサーバーコンポーネント
- クライアントでの詳細処理

## 依存関係

### 外部依存
- `@/app/actions/deliveryActions` - データ取得
- `@/app/utils/storeRedirect` - リダイレクト処理

### 内部依存
- `./components/DeliveryListClient` - UI コンポーネント
- 店舗状態管理
- データベース接続

## 拡張可能性

### フィルタリング機能
```typescript
interface DeliveryFilter {
  status?: string;
  dateRange?: { start: Date; end: Date };
  customerId?: string;
}
```

### ソート機能
```typescript
interface DeliverySort {
  field: keyof Delivery;
  direction: 'asc' | 'desc';
}
```

### バッチ操作
```typescript
interface BatchOperation {
  action: 'delete' | 'updateStatus';
  deliveryIds: string[];
  newStatus?: string;
}
```

## セキュリティ考慮

### データアクセス制御
- 店舗レベルでのデータ分離
- 権限ベースのフィルタリング

### エラー情報保護
- ユーザーに機密情報を露出しない
- 開発者向けログの適切な管理

## 監視とログ

### エラー監視
- データ取得失敗の追跡
- パフォーマンス問題の検出

### 利用統計
- ページアクセス頻度
- データ量の監視