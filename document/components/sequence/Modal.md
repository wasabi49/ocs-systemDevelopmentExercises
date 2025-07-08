# Modal (CSVImportModal) Component - シーケンス図

## 概要
CSVインポートモーダルコンポーネントの処理フローを示すシーケンス図です。

## 1. モーダル初期化と表示

```mermaid
sequenceDiagram
    participant Parent as 親コンポーネント
    participant Modal as CSVImportModal
    participant State as React State
    participant UI as ユーザーインターフェース

    Parent->>Modal: <Modal open={true} onCancel={fn} onSuccess={fn} />
    Modal->>State: useState フック初期化
    Note over State: csvFile: File | null<br/>isProcessing: boolean<br/>validationResult: CSVValidationResult<br/>importResult: ImportResult<br/>step: 'upload' | 'validate' | 'import' | 'result'
    
    State->>UI: モーダル表示
    UI-->>Parent: CSVインポート画面表示
```

## 2. CSVファイル選択と検証

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant FileInput as ファイル入力
    participant Validation as CSV検証
    participant PapaParse as Papa Parse
    participant Result as 検証結果

    User->>FileInput: CSVファイル選択
    FileInput->>Validation: validateCSV(file) 実行
    
    Validation->>PapaParse: Papa.parse(file) 実行
    Note over PapaParse: header: true<br/>skipEmptyLines: true<br/>encoding: 'UTF-8'
    
    PapaParse-->>Validation: パース結果
    Validation->>Validation: データ検証実行
    Note over Validation: ヘッダー確認<br/>必須フィールドチェック<br/>データ形式確認
    
    Validation->>Result: CSVValidationResult 生成
    Result-->>User: 検証結果表示
```

## 3. CSV検証処理詳細

```mermaid
sequenceDiagram
    participant Validation as CSV検証
    participant HeaderCheck as ヘッダーチェック
    participant DataCheck as データチェック
    participant ErrorCollect as エラー収集

    Validation->>HeaderCheck: 必須ヘッダー確認
    Note over HeaderCheck: - customerId<br/>- customerName<br/>- managerName<br/>- storeId
    
    HeaderCheck->>DataCheck: 各行データ検証
    loop 各データ行
        DataCheck->>DataCheck: 必須フィールド存在確認
        DataCheck->>DataCheck: データ形式検証
        DataCheck->>ErrorCollect: エラー情報収集
    end
    
    ErrorCollect->>Validation: 検証結果集計
    Note over Validation: isValid: boolean<br/>error?: string<br/>warnings?: string[]<br/>details: 詳細情報
```

## 4. インポート実行処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Modal as CSVImportModal
    participant StoreContext as useStore
    participant ImportAPI as importCustomersFromCSV
    participant Logger as logger

    User->>Modal: "インポート実行" ボタンクリック
    Modal->>StoreContext: selectedStore 取得
    Modal->>ImportAPI: importCustomersFromCSV() 実行
    Note over ImportAPI: csvData, selectedStore.id 渡し
    
    ImportAPI->>ImportAPI: サーバーサイド処理
    Note over ImportAPI: データベース操作<br/>顧客データ追加/更新<br/>トランザクション処理
    
    ImportAPI-->>Modal: ImportResult 返却
    Modal->>Logger: 結果ログ出力
    Logger-->>Modal: ログ記録完了
```

## 5. 結果表示処理

```mermaid
sequenceDiagram
    participant Modal as CSVImportModal
    participant ResultDisplay as ImportResultDisplay
    participant SuccessUI as 成功UI
    participant ErrorUI as エラーUI

    Modal->>ResultDisplay: ImportResult 渡し
    ResultDisplay->>ResultDisplay: result.status チェック
    
    alt status === 'success'
        ResultDisplay->>SuccessUI: 成功表示コンポーネント
        Note over SuccessUI: 緑のアイコン<br/>処理件数表示<br/>- 追加: X件<br/>- 更新: Y件<br/>- 削除: Z件
    else status === 'error'
        ResultDisplay->>ErrorUI: エラー表示コンポーネント
        Note over ErrorUI: 赤いアイコン<br/>エラーメッセージ<br/>無効な顧客情報<br/>店舗不一致など
    end
    
    ResultDisplay-->>Modal: 結果表示完了
```

## 6. 成功時のコールバック処理

```mermaid
sequenceDiagram
    participant Modal as CSVImportModal
    participant ResultDisplay as ImportResultDisplay
    participant Parent as 親コンポーネント
    participant DataRefresh as データ更新

    ResultDisplay->>Modal: "閉じる" ボタンクリック
    Modal->>Parent: onSuccess() コールバック実行
    Parent->>DataRefresh: データ再読み込み処理
    Note over DataRefresh: loadCustomers()<br/>最新データ取得
    
    DataRefresh-->>Parent: 更新されたデータ表示
    Modal->>Modal: モーダル状態リセット
    Modal-->>Parent: モーダル非表示
```

## コンポーネント構造

```mermaid
classDiagram
    class CSVImportModal {
        +open: boolean
        +onCancel: function
        +onSuccess: function
        +useState hooks
        +useStore hook
        -validateCSV()
        -handleFileChange()
        -handleImport()
    }
    
    class ImportResultDisplay {
        +result: ImportResult
        +onClose: function
        -renderSuccessContent()
        -renderErrorContent()
    }
    
    class CSVValidationResult {
        +boolean isValid
        +string error
        +string[] warnings
        +object details
    }
    
    class ImportResult {
        +string status
        +object data
        +string error
        +object errorData
    }
    
    CSVImportModal --> ImportResultDisplay : renders
    CSVImportModal --> CSVValidationResult : creates
    CSVImportModal --> ImportResult : receives
```

## CSV検証フロー

```mermaid
flowchart TD
    A[ファイル選択] --> B[Papa Parse実行]
    B --> C[ヘッダー検証]
    C --> D{必須ヘッダー存在?}
    
    D -->|Yes| E[データ行検証]
    D -->|No| F[ヘッダーエラー]
    
    E --> G[必須フィールドチェック]
    G --> H[データ形式チェック]
    H --> I{全データ有効?}
    
    I -->|Yes| J[検証成功]
    I -->|No| K[検証失敗 + 詳細]
    
    F --> L[エラー表示]
    K --> L
    J --> M[インポート実行可能]
    
    style A fill:#e1f5fe
    style J fill:#c8e6c9
    style F fill:#ffcdd2
    style K fill:#ffcdd2
    style M fill:#fff3e0
```

## インポート処理フロー

```mermaid
sequenceDiagram
    participant Modal as CSVImportModal
    participant Processing as 処理状態
    participant API as importCustomersFromCSV
    participant Database as データベース
    participant Result as 結果処理

    Modal->>Processing: setIsProcessing(true)
    Processing->>API: Server Action実行
    
    API->>Database: データベース操作開始
    Note over Database: トランザクション開始<br/>既存データチェック<br/>追加/更新/削除処理
    
    Database-->>API: 操作結果
    API->>Result: ImportResult生成
    Note over Result: status: 'success' | 'error'<br/>data: 処理統計<br/>error: エラー情報
    
    Result-->>Modal: 最終結果
    Modal->>Processing: setIsProcessing(false)
```

## エラーハンドリング詳細

```mermaid
sequenceDiagram
    participant Modal as CSVImportModal
    participant ErrorType as エラー種別
    participant ErrorDisplay as エラー表示
    participant UserAction as ユーザーアクション

    Modal->>ErrorType: エラー判定
    
    alt ファイル形式エラー
        ErrorType->>ErrorDisplay: "CSVファイルを選択してください"
    else ヘッダーエラー
        ErrorType->>ErrorDisplay: "必須ヘッダーが不足しています"
    else データエラー
        ErrorType->>ErrorDisplay: "無効なデータが含まれています"
        Note over ErrorDisplay: 行番号と具体的なエラー内容
    else 店舗不一致エラー
        ErrorType->>ErrorDisplay: "異なる店舗の顧客が含まれています"
        Note over ErrorDisplay: 現在の店舗と不一致データの詳細
    else APIエラー
        ErrorType->>ErrorDisplay: "インポート処理中にエラーが発生しました"
    end
    
    ErrorDisplay->>UserAction: 修正方法の提示
    UserAction-->>Modal: エラー修正後再実行
```

## UI状態遷移

```mermaid
stateDiagram-v2
    [*] --> Upload : モーダル表示
    Upload --> Validate : ファイル選択
    Validate --> Upload : 検証失敗
    Validate --> Import : 検証成功 + 実行
    Import --> Result : 処理完了
    Result --> [*] : モーダル閉じる
    
    Upload : ファイル選択画面
    Validate : 検証結果表示
    Import : インポート実行中
    Result : 結果表示
```

## 特徴

### 1. 段階的処理
- ファイル選択 → 検証 → 実行 → 結果
- 各段階でのエラーハンドリング

### 2. リアルタイム検証
- ファイル選択時の即座検証
- 詳細なエラー情報提供

### 3. 視覚的フィードバック
- グラデーションアイコン
- 色分けによる状態表示

### 4. 包括的エラー処理
- 複数種類のエラー対応
- ユーザーフレンドリーなメッセージ

### 5. データ整合性確保
- 店舗レベルでのデータ分離
- トランザクション処理

## パフォーマンス最適化

### ファイル処理
- ストリーミング可能なCSV処理
- 大容量ファイル対応

### メモリ効率
- 段階的メモリ解放
- 不要データの即座削除

### ユーザー体験
- 非ブロッキング処理
- 進行状況の可視化

## セキュリティ考慮

### データ検証
- 厳密なCSV形式チェック
- 悪意のあるデータの排除

### 店舗分離
- 店舗IDによるアクセス制御
- 他店舗データの混入防止

### エラー情報保護
- 機密情報の非表示
- 適切なログレベル設定

## 拡張可能性

### 対応フォーマット拡張
```typescript
// Excel対応
const handleExcelFile = (file: File) => {
  // Excel処理ロジック
};

// JSON対応
const handleJsonFile = (file: File) => {
  // JSON処理ロジック
};
```

### バッチ処理機能
```typescript
// 複数ファイル同時処理
const handleMultipleFiles = (files: FileList) => {
  // 複数ファイル処理ロジック
};
```

### インポート履歴
```typescript
// インポート履歴管理
const [importHistory, setImportHistory] = useState<ImportRecord[]>([]);
```