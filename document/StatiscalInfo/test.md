```mermaid
sequenceDiagram
    participant User as ユーザー
    participant UI as UIコンポーネント
    participant State as 状態管理
    participant Data as データ処理
    participant Browser as ブラウザAPI
    
    Note over User,Browser: StatisticalInfoコンポーネントの操作フロー
    
    User->>UI: ページにアクセス
    UI->>State: 初期状態設定
    State-->>UI: 初期データ表示 (dummyOrders)
    
    Note over User,UI: CSVエクスポート
    User->>UI: CSVエクスポートボタンクリック
    UI->>Data: exportToCSV呼び出し
    Data->>Data: CSVデータ生成 (BOM付き)
    Data->>Browser: Blobオブジェクト作成
    Data->>Browser: URL.createObjectURL
    Data->>Browser: ダウンロードリンク作成
    Browser->>User: ファイルダウンロード

```
```mermaid
classDiagram
    class List {
        <<interface>>
        +string customerId
        +string customerName
        +number leadTime
        +number sales
    }
    
    class StatisticalInfo {
        -string searchField
        -string searchKeyword
        -List[] orders
        -List[] filteredOrders
        -List[] displayedOrders
        +useState() 状態管理
        +handleSort(field) 並び替え処理
        +handleSearch() 検索処理
        +exportToCSV() CSV出力処理
        +render() UI表示
    }
    
    StatisticalInfo --> List : uses
    ```