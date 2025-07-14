# Statistics Page - シーケンス図

## 概要
統計情報ページの処理フローを示すシーケンス図です。

## 1. ページ初期化とデータ取得

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant Page as StatisticsPage
    participant Actions as fetchStatistics
    participant Database as データベース
    participant Calculation as 統計計算

    Browser->>Page: /Home/Statistics アクセス
    Page->>Actions: fetchStatistics() 実行
    Actions->>Database: 統計データ取得クエリ
    
    Database->>Calculation: 顧客別データ集計
    Note over Calculation: "平均リードタイム計算<br/>総売上計算<br/>更新日時取得"
    
    Calculation-->>Actions: 統計結果配列
    Actions-->>Page: { status: 'success', data: statistics }
```

## 2. 店舗選択チェック処理

```mermaid
sequenceDiagram
    participant Page as StatisticsPage
    participant Result as fetchResult
    participant Navigation as redirect
    participant Browser as ブラウザ

    Page->>Result: statisticsResult.status 確認
    
    alt store_required
        Result-->>Navigation: redirect('/stores') 実行
        Navigation->>Browser: 店舗選択ページへリダイレクト
    else success
        Result-->>Page: 正常処理続行
    else error  
        Result-->>Page: エラーハンドリング
    end
```

## 3. データ型定義と変換

```mermaid
sequenceDiagram
    participant Page as StatisticsPage
    participant Interface as StatisticsData
    participant DataValidation as データ検証
    participant TypeSafety as 型安全性

    Page->>Interface: StatisticsData インターフェース確認
    Note over Interface: "customerId: string<br/>customerName: string<br/>averageLeadTime: number<br/>totalSales: number<br/>updatedAt: string"
    
    Interface->>DataValidation: データ構造検証
    DataValidation->>TypeSafety: TypeScript型チェック
    TypeSafety-->>Page: 型安全なデータ構造
```

## 4. 統計データ処理

```mermaid
sequenceDiagram
    participant Page as StatisticsPage
    participant Result as statisticsResult
    participant DataArray as statisticsData
    participant Client as StatisticsListClient

    Page->>Result: statisticsResult.status チェック
    
    alt success
        Result->>DataArray: statisticsResult.data || []
        Note over DataArray: "データが null の場合は空配列"
    else error
        Result->>DataArray: []（空配列）
        Result->>Console: console.error() 実行
        Note over Console: "'統計データの取得に失敗:', result.error"
    end
    
    DataArray->>Client: <StatisticsListClient statisticsData={statisticsData} />
    Client-->>Page: 統計画面表示
```

## 5. エラーハンドリング

```mermaid
sequenceDiagram
    participant Page as StatisticsPage
    participant ErrorCheck as エラーチェック
    participant Console as console.error
    participant FallbackData as フォールバックデータ

    Page->>ErrorCheck: result.status === 'error' 確認
    
    alt データ取得エラー
        ErrorCheck->>Console: エラーログ出力
        Note over Console: "'統計データの取得に失敗:', result.error"
        ErrorCheck->>FallbackData: statisticsData = []
        FallbackData->>Client: 空のリストで表示
    else 正常処理
        ErrorCheck->>Client: 取得データで表示
    end
```

## 6. クライアントコンポーネント統合

```mermaid
sequenceDiagram
    participant Page as StatisticsPage
    participant Props as statisticsData
    participant Client as StatisticsListClient
    participant UI as ユーザーインターフェース

    Page->>Props: StatisticsData[] 準備
    Props->>Client: プロパティ渡し
    Client->>UI: クライアントサイド初期化
    
    UI->>UI: 統計表示
    UI->>UI: ソート機能
    UI->>UI: 検索機能
    UI->>UI: 詳細表示
    
    UI-->>Page: インタラクティブな統計画面
```

## データフロー構造

```mermaid
classDiagram
    class StatisticsPage {
        +async function()
        -fetchStatistics()
        -redirect()
        +StatisticsData[] statisticsData
    }
    
    class StatisticsData {
        +string customerId
        +string customerName
        +number averageLeadTime
        +number totalSales
        +string updatedAt
    }
    
    class FetchResult {
        +string status
        +StatisticsData[] data
        +string error
    }
    
    StatisticsPage --> StatisticsData : processes
    StatisticsPage --> FetchResult : receives
```

## 統計データ計算フロー

```mermaid
sequenceDiagram
    participant Database as データベース
    participant Orders as 注文テーブル
    participant Deliveries as 納品テーブル
    participant Customers as 顧客テーブル
    participant Statistics as 統計計算

    Database->>Orders: 注文データ取得
    Database->>Deliveries: 納品データ取得
    Database->>Customers: 顧客データ取得
    
    Statistics->>Statistics: リードタイム計算
    Note over Statistics: "注文日 ～ 納品日の日数計算<br/>顧客別平均値算出"
    
    Statistics->>Statistics: 売上計算
    Note over Statistics: "納品済み注文の金額合計<br/>顧客別集計"
    
    Statistics->>Statistics: 更新日時設定
    Note over Statistics: "最新の更新日時を取得"
    
    Statistics-->>Database: 統計結果配列
```

## サーバーサイドレンダリング

```mermaid
flowchart TD
    A[HTTP Request] --> B[StatisticsPage実行]
    B --> C[fetchStatistics()]
    C --> D[統計データ計算]
    D --> E{データ取得成功?}
    
    E -->|成功| F[データ配列設定]
    E -->|店舗要求| G[/stores リダイレクト]
    E -->|エラー| H[エラーログ + 空配列]
    
    F --> I[StatisticsListClient作成]
    H --> I
    
    I --> J[SSRで完成HTML]
    J --> K[ブラウザに送信]
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style G fill:#ffecb3
    style H fill:#ffcdd2
    style J fill:#c8e6c9
```

## 統計メトリクス定義

```mermaid
sequenceDiagram
    participant Page as StatisticsPage
    participant Metrics as 統計指標
    participant LeadTime as リードタイム
    participant Sales as 売上統計

    Page->>Metrics: 統計指標定義
    
    Metrics->>LeadTime: 平均リードタイム
    Note over LeadTime: "(納品日 - 注文日) の平均<br/>顧客別に計算<br/>単位: 日数"
    
    Metrics->>Sales: 総売上金額
    Note over Sales: "納品済み注文の合計金額<br/>顧客別に集計<br/>単位: 円"
    
    LeadTime-->>Page: averageLeadTime: number
    Sales-->>Page: totalSales: number
```

## データ整合性チェック

```mermaid
sequenceDiagram
    participant Page as StatisticsPage
    parameter Validation as データ検証
    participant NullCheck as null チェック
    participant TypeCheck as 型チェック

    Page->>Validation: データ検証開始
    
    Validation->>NullCheck: statisticsResult.data || []
    Note over NullCheck: "データが null/undefined の場合<br/>空配列で初期化"
    
    Validation->>TypeCheck: TypeScript型チェック
    Note over TypeCheck: "StatisticsData インターフェース準拠<br/>各フィールドの型検証"
    
    NullCheck-->>Page: 安全なデータ配列
    TypeCheck-->>Page: 型安全性保証
```

## 特徴

### 1. サーバーサイド統計処理
- データベースレベルでの集計処理
- 効率的な統計計算

### 2. 店舗ベースフィルタリング
- 選択店舗に基づくデータ絞り込み
- アクセス制御との連携

### 3. 型安全な統計データ
- TypeScript インターフェースの活用
- 数値データの適切な型定義

### 4. リアルタイム統計
- 最新データに基づく統計
- 更新日時の追跡

### 5. エラー耐性
- データ取得失敗時の適切な処理
- ユーザー体験の維持

## パフォーマンス最適化

### データベース最適化
```sql
-- 効率的な統計クエリ
SELECT 
  customer_id,
  customer_name,
  AVG(lead_time) as average_lead_time,
  SUM(total_amount) as total_sales,
  MAX(updated_at) as updated_at
FROM statistics_view
WHERE store_id = ?
GROUP BY customer_id, customer_name
```

### メモリ効率
- ストリーミング可能なデータ処理
- 大量統計データへの対応

### キャッシング戦略
- 統計データのキャッシング
- 定期的な再計算とキャッシュ更新

## 依存関係

### 外部依存
- `next/navigation` - リダイレクト機能
- `@/app/actions/statisticsActions` - 統計データ取得

### 内部依存
- `./components/StatisticsListClient` - UI コンポーネント
- データベース接続
- 店舗状態管理

## 拡張可能性

### 追加統計指標
```typescript
interface ExtendedStatistics extends StatisticsData {
  orderCount: number;
  averageOrderValue: number;
  lastOrderDate: string;
  customerRank: number;
}
```

### 期間フィルタリング
```typescript
interface StatisticsFilter {
  startDate?: string;
  endDate?: string;
  customerId?: string;
}
```

### エクスポート機能
```typescript
interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeCharts: boolean;
  dateRange: DateRange;
}
```

## セキュリティ考慮

### データアクセス制御
- 店舗レベルでのデータ分離
- 権限に基づくアクセス制限

### 統計データ保護
- 機密性の高い売上データの適切な処理
- ログ出力時の個人情報除去