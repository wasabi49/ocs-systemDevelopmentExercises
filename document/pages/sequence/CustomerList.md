# CustomerList Page - シーケンス図

## 概要
顧客一覧ページの処理フローを示すシーケンス図です。

## 1. ページ初期化とデータ取得

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant Page as CustomerListPage
    participant Actions as fetchCustomers
    participant Cookie as Cookie
    participant Database as データベース
    participant Client as CustomerListClient

    Browser->>Page: /Home/CustomerList アクセス
    Page->>Actions: fetchCustomers() 実行
    Actions->>Cookie: storeId取得
    Cookie-->>Actions: storeId
    
    alt storeIdが存在
        Actions->>Database: 顧客データ取得クエリ
        Database-->>Actions: 顧客データ配列
        Actions-->>Page: { status: 'success', data: customers }
    else storeIdが無効
        Actions-->>Page: { status: 'store_required' }
    end
```

## 2. 店舗選択チェック処理

```mermaid
sequenceDiagram
    participant Page as CustomerListPage
    participant Navigation as next/navigation
    participant Result as fetchResult

    Page->>Result: result.status チェック
    
    alt store_required または store_invalid
        Page->>Navigation: redirect('/stores')
        Navigation-->>Browser: 店舗選択ページへリダイレクト
    else success
        Page->>Page: customers配列設定
    else error
        Page->>Page: console.error() 実行
        Page->>Page: customers = [] 設定
    end
```

## 3. データ変換と型定義

```mermaid
sequenceDiagram
    participant Page as CustomerListPage
    participant TypeDef as Customer型
    participant ClientData as 変換済みデータ

    Page->>TypeDef: Customer型定義確認
    Note over TypeDef: "id: string<br/>customerName: string<br/>managerName: string<br/>storeName: string"
    
    Page->>ClientData: データ配列変換
    Note over ClientData: "データベース結果を<br/>Customer型配列に変換"
    
    ClientData-->>Page: 型安全な顧客データ
```

## 4. クライアントコンポーネント呼び出し

```mermaid
sequenceDiagram
    participant Page as CustomerListPage
    participant Client as CustomerListClient
    participant Props as initialCustomers

    Page->>Props: initialCustomers準備
    Props->>Client: CustomerListClient呼び出し (initialCustomers={customers})
    Client->>Client: クライアントサイド初期化
    Client-->>Page: レンダリング完了
```

## 5. エラーハンドリング

```mermaid
sequenceDiagram
    participant Page as CustomerListPage
    participant Console as console
    participant Client as CustomerListClient
    participant ErrorState as エラー状態

    Page->>Page: result.status === 'error' チェック
    
    alt データ取得エラー
        Page->>Console: console.error('初期データの取得に失敗:', result.error)
        Page->>ErrorState: customers = [] 設定
        ErrorState->>Client: 空配列で初期化
        Client-->>Page: エラー時のUI表示
    end
```

## 6. サーバーサイドレンダリングフロー

```mermaid
sequenceDiagram
    participant Request as HTTPリクエスト
    participant Server as Next.js Server
    participant Page as CustomerListPage
    participant SSR as Server Rendering
    participant Response as HTTPレスポンス

    Request->>Server: GET /Home/CustomerList
    Server->>Page: async function実行
    Page->>Page: await fetchCustomers()
    Page->>SSR: JSXレンダリング
    SSR->>Response: 完成したHTMLレスポンス
    Response-->>Request: ページ表示
```

## データフロー構造

**CustomerList ページコンポーネント構造**
- CustomerListPage: 非同期関数、fetchCustomers()、redirect()、Customer[] customers を持つ
- Customer: id、customerName、managerName、storeName フィールドを持つ
- FetchResult: status、data、error フィールドで API レスポンスを表現

CustomerListPage は Customer を使用し、FetchResult を受け取ります。

## ページ遷移パターン

**顧客一覧ページアクセスフロー**
1. "/Home/CustomerList" アクセス → Cookie 確認
2. storeId 存在チェック：
   - 存在する: 顧客データ取得へ進む
   - 存在しない: "/stores" へリダイレクト
3. データ取得結果による分岐：
   - 成功: CustomerListClient 表示
   - 失敗: エラーログ出力 → 空のリスト表示

このフローにより、適切なアクセス制御とエラーハンドリングが実現されます。

## 特徴

### 1. サーバーサイドレンダリング
- ページロード時にサーバーでデータ取得
- 初期表示の高速化

### 2. 店舗ベースアクセス制御
- Cookie経由でstoreId確認
- 未選択時は自動リダイレクト

### 3. 型安全性
- TypeScript型定義の活用
- コンパイル時エラー検出

### 4. エラーハンドリング
- 複数レベルでのエラー対応
- ユーザーフレンドリーな表示

### 5. パフォーマンス最適化
- サーバーサイドでの事前データ取得
- クライアントの初期化時間短縮

## 依存関係

### 外部依存
- `next/navigation` - リダイレクト機能
- `@/app/actions/customerActions` - データ取得
- `./components/CustomerListClient` - UI表示

### 内部依存
- Cookie経由の店舗情報
- データベース接続
- 型定義システム