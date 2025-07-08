# CustomerListClient Component - シーケンス図

## 概要
顧客一覧クライアントコンポーネントの処理フローを示すシーケンス図です。

## 1. コンポーネント初期化

```mermaid
sequenceDiagram
    participant Parent as 親コンポーネント
    participant Client as CustomerListClient
    participant State as React State
    participant Hooks as React Hooks

    Parent->>Client: <CustomerListClient initialCustomers={customers} />
    Client->>State: useState フック初期化
    Note over State: customers: Customer[]<br/>searchKeyword: string<br/>searchField: string<br/>currentPage: number<br/>isOpen: boolean
    
    Client->>Hooks: useTransition フック初期化
    Note over Hooks: isPending: boolean<br/>startTransition: function
    
    State-->>Client: 初期状態設定完了
    Hooks-->>Client: パフォーマンス最適化準備
```

## 2. データ検索とフィルタリング

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Search as Search コンポーネント
    participant Filter as フィルタリング
    participant Display as 表示更新

    User->>Search: 検索キーワード入力
    Search->>Filter: searchKeyword, searchField 更新
    
    Filter->>Filter: filteredCustomers 計算
    Note over Filter: 選択フィールドに基づく検索<br/>- 顧客ID<br/>- 顧客名<br/>- 担当者<br/>- すべて（全フィールド）
    
    Filter->>Display: フィルタリング結果反映
    Display->>Display: currentPage リセット
    Display-->>User: 検索結果表示
```

## 3. ページネーション処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Pagination as Pagination コンポーネント
    participant Calculation as ページ計算
    participant Display as 表示更新

    User->>Pagination: ページ番号クリック
    Pagination->>Calculation: handlePageChange(page) 実行
    
    Calculation->>Calculation: ページ範囲計算
    Note over Calculation: totalPages = Math.ceil(length / itemsPerPage)<br/>startIndex = (page - 1) * itemsPerPage<br/>endIndex = startIndex + itemsPerPage
    
    Calculation->>Display: paginatedCustomers 更新
    Display->>Display: 空行追加（15行固定表示）
    Display-->>User: 新しいページ表示
```

## 4. サーバーアクション呼び出し

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Client as CustomerListClient
    participant Transition as useTransition
    participant ServerAction as fetchCustomers
    parameter StoreCheck as useServerActionStoreCheck

    User->>Client: データ再読み込み要求
    Client->>Transition: startTransition() 実行
    Transition->>ServerAction: fetchCustomers() 呼び出し
    
    ServerAction-->>Client: Server Action 結果
    Client->>StoreCheck: checkStoreRequirement(result)
    
    alt 店舗チェック通過
        StoreCheck-->>Client: 処理続行
        Client->>Client: setCustomers(result.data)
        Client->>Client: setCurrentPage(1)
    else 店舗選択必要
        StoreCheck->>Browser: リダイレクト実行
    end
```

## 5. CSVインポート統合

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Client as CustomerListClient
    participant Modal as CSVインポートモーダル
    participant ImportAPI as importCustomersFromCSV
    participant Refresh as データ再読み込み

    User->>Client: CSVインポートボタンクリック
    Client->>Modal: setIsOpen(true)
    Modal->>Modal: CSVファイル選択・処理
    
    Modal->>ImportAPI: importCustomersFromCSV() 実行
    ImportAPI-->>Modal: インポート結果
    
    Modal->>Client: handleImportSuccess() 呼び出し
    Client->>Refresh: loadCustomers() 実行
    Refresh-->>Client: 最新データで更新
```

## 6. ローディング状態管理

```mermaid
sequenceDiagram
    participant Client as CustomerListClient
    participant Transition as useTransition
    participant Loading as Loading コンポーネント
    participant UI as ユーザーインターフェース

    Client->>Transition: startTransition() 開始
    Transition->>Loading: isPending = true
    Loading->>UI: ローディング表示
    
    Transition->>Transition: 非同期処理実行
    Note over Transition: fetchCustomers()<br/>データ処理<br/>状態更新
    
    Transition->>Loading: isPending = false
    Loading->>UI: ローディング終了
    UI-->>Client: 通常表示に戻る
```

## コンポーネント構造

```mermaid
classDiagram
    class CustomerListClient {
        +initialCustomers: Customer[]
        +useState hooks
        +useTransition hook
        +useServerActionStoreCheck hook
        -loadCustomers()
        -handleImportSuccess()
        -handlePageChange()
    }
    
    class Customer {
        +string id
        +string customerName
        +string managerName
        +string storeName
    }
    
    class Search {
        +searchKeyword: string
        +searchField: string
        +onSearchChange: function
        +onFieldChange: function
    }
    
    class Pagination {
        +currentPage: number
        +totalPages: number
        +itemsPerPage: number
        +onPageChange: function
    }
    
    class Modal {
        +open: boolean
        +onCancel: function
        +onSuccess: function
    }
    
    CustomerListClient --> Customer : displays
    CustomerListClient --> Search : uses
    CustomerListClient --> Pagination : uses
    CustomerListClient --> Modal : renders
```

## 検索ロジック詳細

```mermaid
sequenceDiagram
    participant Input as 検索入力
    participant Logic as 検索ロジック
    participant Fields as フィールド検索
    participant Result as 検索結果

    Input->>Logic: searchKeyword, searchField 受信
    Logic->>Logic: lowerKeyword = keyword.toLowerCase()
    
    alt searchField === '顧客ID'
        Logic->>Fields: customer.id.includes(lowerKeyword)
    else searchField === '顧客名'
        Logic->>Fields: customer.customerName.includes(lowerKeyword)
    else searchField === '担当者'
        Logic->>Fields: customer.managerName.includes(lowerKeyword)
    else searchField === 'すべて'
        Logic->>Fields: 全フィールドOR検索
        Note over Fields: id OR customerName OR managerName
    end
    
    Fields->>Result: フィルタリング済み配列
    Result-->>Input: 検索結果表示
```

## ページネーション計算

```mermaid
sequenceDiagram
    participant Data as フィルタ済みデータ
    participant Calc as ページ計算
    participant Display as 表示処理
    participant EmptyRows as 空行処理

    Data->>Calc: filteredCustomers.length
    Calc->>Calc: totalPages計算
    Note over Calc: Math.ceil(length / itemsPerPage)
    
    Calc->>Display: startIndex, endIndex計算
    Note over Display: startIndex = (page - 1) * itemsPerPage<br/>endIndex = startIndex + itemsPerPage
    
    Display->>Display: slice(startIndex, endIndex)
    Display->>EmptyRows: 空行追加処理
    Note over EmptyRows: while (length < itemsPerPage)<br/>  push(emptyCustomer)
    
    EmptyRows-->>Data: 15行固定の表示データ
```

## 状態更新フロー

```mermaid
flowchart TD
    A[初期データ受信] --> B[useState初期化]
    B --> C[検索入力]
    C --> D[フィルタリング実行]
    D --> E[ページネーション計算]
    E --> F[表示データ生成]
    
    G[サーバーアクション] --> H[useTransition開始]
    H --> I[ローディング表示]
    I --> J[API呼び出し]
    J --> K[店舗チェック]
    K --> L{チェック結果}
    
    L -->|成功| M[データ更新]
    L -->|失敗| N[リダイレクト]
    
    M --> O[ページリセット]
    O --> F
    
    style A fill:#e1f5fe
    style G fill:#fff3e0
    style I fill:#ffecb3
    style M fill:#c8e6c9
    style N fill:#ffcdd2
```

## エラーハンドリング

```mermaid
sequenceDiagram
    participant Client as CustomerListClient
    participant ServerAction as fetchCustomers
    participant Error as エラー処理
    participant Console as console.error

    Client->>ServerAction: fetchCustomers() 実行
    ServerAction-->>Client: エラーレスポンス
    
    Client->>Error: result.status !== 'success' チェック
    Error->>Console: console.error() 実行
    Note over Console: 'データの取得に失敗しました:', result.error
    
    Error->>Client: setCustomers([]) 空配列設定
    Client-->>UI: エラー状態表示
```

## 特徴

### 1. パフォーマンス最適化
- useTransition による非ブロッキング更新
- 適切な状態管理

### 2. リアルタイム検索
- 入力に応じた即座のフィルタリング
- 複数フィールド対応

### 3. 固定レイアウト
- 15行固定表示による安定したUI
- 空行自動補完

### 4. サーバー統合
- Server Actions との連携
- 店舗要件チェック

### 5. CSVインポート対応
- モーダルとの統合
- 成功時の自動データ更新

## パフォーマンス考慮

### React最適化
- useTransition による優先度付きレンダリング
- 不要な再レンダリングの回避

### メモリ効率
- 効率的なフィルタリング処理
- 適切なページング実装

### ユーザー体験
- スムーズなローディング表示
- レスポンシブな検索機能

## 拡張可能性

### ソート機能追加
```typescript
const [sortConfig, setSortConfig] = useState<{
  field: keyof Customer;
  direction: 'asc' | 'desc';
} | null>(null);
```

### バッチ操作
```typescript
const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
const handleBatchDelete = async (customerIds: string[]) => {
  // バッチ削除処理
};
```

### フィルタ保存
```typescript
const [savedFilters, setSavedFilters] = useState<SearchFilter[]>([]);
const saveCurrentFilter = () => {
  // フィルタ保存処理
};
```