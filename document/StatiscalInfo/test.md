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
    State-->>UI: 統計一覧情報の表示 (StatisticalInfoDate)
    
    Note over User,UI: CSVエクスポート
    User->>UI: CSVエクスポートボタンクリック
    UI->>Data: exportToCSV呼び出し
    Data->>Data: CSVデータ生成 (BOM付き)
    Data->>Browser: Blobオブジェクト作成
    Data->>Browser: URL.createObjectURL
    Data->>Browser: ダウンロードリンク作成
    Browser->>User: ファイルダウンロード

```
