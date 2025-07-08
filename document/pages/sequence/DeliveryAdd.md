# DeliveryAdd Page - シーケンス図

## 概要
納品追加ページの処理フローを示すシーケンス図です。

## 1. ページ初期化とデータ取得

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant Page as DeliveryAddPage
    participant CustomerAPI as fetchAllCustomers
    participant State as React State
    participant UI as ユーザーインターフェース

    Browser->>Page: /Home/DeliveryList/Add アクセス
    Page->>State: useState フック初期化
    Note over State: customers, selectedCustomer<br/>deliveryDate, note<br/>orderDetails, modals
    
    Page->>CustomerAPI: fetchAllCustomers() 実行
    CustomerAPI-->>Page: { status: 'success', data: customers }
    
    Page->>State: setCustomers(result.data)
    State->>UI: 顧客リスト表示準備
    UI-->>Page: 初期画面レンダリング
```

## 2. 顧客検索と選択処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant SearchInput as 検索入力
    participant FilteredList as フィルタリング
    participant Dropdown as CustomerDropdown
    participant OrderAPI as fetchUndeliveredOrderDetails

    User->>SearchInput: 顧客名入力
    SearchInput->>FilteredList: customerSearchTerm 更新
    FilteredList->>Dropdown: フィルタされた顧客リスト表示
    
    User->>Dropdown: 顧客選択
    Dropdown->>OrderAPI: fetchUndeliveredOrderDetailsForCreate(customerId)
    OrderAPI-->>Dropdown: 未納品注文明細データ
    
    Dropdown->>State: setSelectedCustomer(customer)
    Dropdown->>State: setOrderDetails(orderDetails)
    State-->>UI: 選択された顧客と未納品情報表示
```

## 3. 未納品商品モーダル表示

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Page as DeliveryAddPage
    participant Modal as UndeliveredProductsModal
    participant Search as モーダル内検索
    participant Sort as ソート機能

    User->>Page: "納品商品を選択" ボタンクリック
    Page->>Modal: setShowProductModal(true)
    Modal->>Modal: orderDetails データ表示
    
    Modal->>Search: useSimpleSearch フック初期化
    Modal->>Sort: sortItems 機能準備
    
    User->>Search: 商品名で検索
    Search->>Search: filteredOrderDetails 更新
    
    User->>Sort: カラムヘッダークリック
    Sort->>Sort: ソート方向と対象フィールド更新
    Sort-->>Modal: ソート済みデータ表示
```

## 4. 数量割り当て処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Modal as UndeliveredProductsModal
    participant QuantityInput as 数量入力
    participant Validation as バリデーション
    participant Summary as 選択状況

    User->>QuantityInput: 納品数量入力
    QuantityInput->>Validation: min="0" max={remainingQuantity} チェック
    Validation->>State: setSelections() 更新
    
    State->>Summary: 選択状況計算
    Note over Summary: totalSelectedQuantity<br/>totalSelectedAmount
    
    Summary->>UI: 選択状況表示更新
    Note over UI: "選択状況: X個 / 合計金額: ¥X"
    
    UI-->>Modal: リアルタイム更新表示
```

## 5. 納品作成処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Modal as UndeliveredProductsModal
    participant Validation as バリデーション
    participant CreateAPI as createDelivery
    participant Success as 成功処理

    User->>Modal: "納品作成" ボタンクリック
    Modal->>Validation: 選択データ検証
    Note over Validation: selectedCustomer 存在確認<br/>allocations.length > 0 確認
    
    alt バリデーション成功
        Validation->>CreateAPI: createDelivery(deliveryData, allocations)
        CreateAPI-->>Modal: { success: true }
        Modal->>Success: setShowSuccessModal(true)
        Success-->>User: 成功メッセージ表示
    else バリデーション失敗
        Validation->>Modal: エラーモーダル表示
        Modal-->>User: エラーメッセージ表示
    end
```

## 6. エラーハンドリング

```mermaid
sequenceDiagram
    participant Page as DeliveryAddPage
    participant ErrorState as エラー状態
    participant ErrorModal as ErrorModal
    participant User as ユーザー

    Page->>ErrorState: try-catch エラーキャッチ
    ErrorState->>ErrorModal: setErrorModal({ isOpen: true, title, message })
    
    ErrorModal->>UI: エラーモーダル表示
    Note over UI: 赤いアイコンとエラーメッセージ<br/>ユーザーフレンドリーな説明
    
    User->>ErrorModal: "OK" ボタンクリック
    ErrorModal->>ErrorState: setErrorModal({ isOpen: false })
    ErrorState-->>Page: エラー状態クリア
```

## コンポーネント階層構造

```mermaid
classDiagram
    class DeliveryAddPage {
        +useState hooks
        +useEffect hooks
        +useCallback hooks
        +useMemo hooks
        -fetchCustomersData()
        -handleSelectCustomer()
        -handleSaveDelivery()
    }
    
    class CustomerDropdown {
        +customers: CustomerData[]
        +onSelect: function
        +onClose: function
        -handleClickOutside()
    }
    
    class UndeliveredProductsModal {
        +orderDetails: UndeliveredOrderDetail[]
        +onSave: function
        +useState selections
        +useSimpleSearch
        -handleQuantityChange()
        -handleSort()
    }
    
    class ErrorModal {
        +isOpen: boolean
        +title: string
        +message: string
        +onClose: function
    }
    
    class SuccessModal {
        +isOpen: boolean
        +onClose: function
    }
    
    DeliveryAddPage --> CustomerDropdown : renders
    DeliveryAddPage --> UndeliveredProductsModal : renders
    DeliveryAddPage --> ErrorModal : renders
    DeliveryAddPage --> SuccessModal : renders
```

## 状態管理フロー

```mermaid
sequenceDiagram
    participant Initial as 初期状態
    participant CustomerSelect as 顧客選択
    participant OrderFetch as 注文取得
    participant ProductSelect as 商品選択
    participant DeliveryCreate as 納品作成

    Initial->>CustomerSelect: 顧客検索・選択
    CustomerSelect->>OrderFetch: 未納品注文明細取得
    OrderFetch->>ProductSelect: 商品選択モーダル
    ProductSelect->>DeliveryCreate: 納品データ作成
    DeliveryCreate-->>Initial: 成功後リセット
```

## データフロー詳細

```mermaid
flowchart TD
    A[ページ読み込み] --> B[顧客データ取得]
    B --> C[顧客検索・選択]
    C --> D[未納品注文明細取得]
    D --> E[商品選択モーダル]
    E --> F[数量割り当て]
    F --> G[バリデーション]
    G --> H{検証結果}
    
    H -->|成功| I[納品作成API呼び出し]
    H -->|失敗| J[エラー表示]
    
    I --> K{API結果}
    K -->|成功| L[成功モーダル表示]
    K -->|失敗| J
    
    L --> M[納品一覧ページへ遷移]
    J --> N[エラー修正待ち]
    
    style A fill:#e1f5fe
    style I fill:#fff3e0
    style L fill:#c8e6c9
    style J fill:#ffcdd2
    style M fill:#c8e6c9
```

## 検索・フィルタリング機能

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Search as useSimpleSearch
    participant Filter as フィルタリング
    participant Display as 表示

    User->>Search: 検索キーワード入力
    Search->>Filter: フィルタリング実行
    Note over Filter: productName フィールドで検索<br/>大小文字区別なし
    
    Filter->>Display: フィルタ結果表示
    Display->>Display: 検索結果件数表示
    Note over Display: "検索結果: X件 / 全Y件"
    
    Display-->>User: リアルタイム検索結果
```

## ソート機能実装

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant SortHeader as ソートヘッダー
    participant SortLogic as ソートロジック
    participant Display as 表示更新

    User->>SortHeader: カラムヘッダークリック
    SortHeader->>SortLogic: handleSort(field) 実行
    
    SortLogic->>SortLogic: sortConfig 状態更新
    Note over SortLogic: field, direction (asc/desc)
    
    SortLogic->>SortLogic: データソート実行
    Note over SortLogic: 日付: Date比較<br/>数値: 数値比較<br/>文字列: 文字列比較
    
    SortLogic->>Display: ソート済みデータ表示
    Display->>Display: SortIcon 方向表示
    Display-->>User: ソート結果反映
```

## モーダル管理

```mermaid
sequenceDiagram
    participant Page as メインページ
    participant Modal as モーダル
    participant Backdrop as 背景
    participant Outside as 外部クリック

    Page->>Modal: モーダル表示 (isOpen=true)
    Modal->>Backdrop: 背景オーバーレイ表示
    Backdrop->>Backdrop: クリックイベント監視
    
    Outside->>Backdrop: 背景クリック
    Backdrop->>Modal: onClose() 実行
    Modal->>Page: モーダル非表示 (isOpen=false)
    
    Modal->>Modal: stopPropagation() でバブリング停止
    Note over Modal: モーダル内クリックは閉じない
```

## 特徴

### 1. 複雑な状態管理
- 複数の useState フック
- useCallback によるパフォーマンス最適化
- useMemo による計算最適化

### 2. リアルタイム検索・フィルタリング
- 顧客検索の即座反映
- 商品検索の動的フィルタリング

### 3. 高度なソート機能
- 複数フィールド対応
- データ型別ソートロジック

### 4. 包括的エラーハンドリング
- 段階的エラー処理
- ユーザーフレンドリーなエラーメッセージ

### 5. レスポンシブデザイン
- モバイル対応のモーダル
- 適応的なレイアウト

## パフォーマンス最適化

### React Hook最適化
```typescript
// useCallback によるメモ化
const handleSelectCustomer = useCallback(async (customer) => {
  // 処理ロジック
}, []);

// useMemo による計算最適化
const filteredCustomers = useMemo(() => {
  return customers.filter(/* 条件 */);
}, [customers, customerSearchTerm]);
```

### レンダリング最適化
- 条件分岐による不要なレンダリング回避
- 大きなリストの効率的な表示

### API呼び出し最適化
- 適切なローディング状態管理
- エラー時の適切なフォールバック

## セキュリティ考慮

### データバリデーション
- クライアントサイドバリデーション
- 数量制限の適切な実装

### エラー情報保護
- 技術的詳細の非表示
- ユーザーフレンドリーなメッセージ

## アクセシビリティ

### キーボードナビゲーション
- Tab順序の適切な設定
- Enter/Escapeキー対応

### スクリーンリーダー対応
- 適切なラベル設定
- aria属性の活用

### 視覚的フィードバック
- ローディング状態の明確な表示
- 成功/エラー状態の色分け