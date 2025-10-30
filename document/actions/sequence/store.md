# storeActions.ts - シーケンス図

## 概要
店舗管理に関するServer Actionsの処理フローを示すシーケンス図です。

## 1. 全店舗取得 (getAllStores)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as getAllStores
    participant DB as Prisma Database

    Client->>Action: getAllStores()
    Action->>DB: store.findMany()
    Note over Action,DB: "select: { id: true, name: true }<br/>orderBy: { name: 'asc' }"
    DB-->>Action: stores
    Action-->>Client: stores: Store[]
```

## 2. useActionState用店舗取得 (fetchStoresAction)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchStoresAction
    participant GetStores as getAllStores
    participant DB as Prisma Database

    Client->>Action: fetchStoresAction(prevState, formData?)
    Action->>GetStores: getAllStores()
    GetStores->>DB: store.findMany()
    DB-->>GetStores: stores
    GetStores-->>Action: stores
    
    alt 正常処理
        Action-->>Client: { stores: stores, error: null, isLoading: false }
    else エラー発生
        Action-->>Client: { stores: [], error: errorMessage, isLoading: false }
    end
```

## 3. 店舗ID別取得 (getStoreById)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as getStoreById
    participant DB as Prisma Database

    Client->>Action: getStoreById(id)
    Action->>DB: store.findUnique(id)
    Note over Action,DB: "where: { id }<br/>select: { id: true, name: true }"
    DB-->>Action: store
    
    alt store が存在する
        Action-->>Client: store: Store
    else store が存在しない
        Action-->>Client: null
    end
```

## データ型定義

**Store Actions データ構造**
- Store: id、name フィールドを持つ店舗データ
- StoreActionState: stores、error、isLoading フィールドで useActionState 用の状態を管理

StoreActionState は Store の配列を含み、React の状態管理と連携します。

## エラーハンドリングパターン

```mermaid
sequenceDiagram
    participant Action as Any Store Action
    participant DB as Prisma Database
    participant Client as クライアント

    Action->>DB: データベース操作
    
    alt 正常処理
        DB-->>Action: 成功レスポンス
        Action-->>Client: 正常なレスポンス
    else エラー発生
        DB-->>Action: エラー
        Action->>Action: console.error('Failed to fetch stores:', error)
        Action->>Action: throw new Error('店舗データの取得に失敗しました')
        Action-->>Client: エラーレスポンス
    end
```

## fetchStoresAction の詳細フロー

```mermaid
sequenceDiagram
    participant Client as クライアント (useActionState)
    participant Action as fetchStoresAction
    participant GetStores as getAllStores
    participant DB as Prisma Database

    Note over Client: "useActionState で呼び出し"
    Client->>Action: fetchStoresAction(prevState, formData)
    
    Note over Action: "パラメータは使用されない"
    Note over Action: "_prevState, _formData (未使用)"
    
    Action->>GetStores: getAllStores()
    
    GetStores->>DB: prisma.store.findMany()
    Note over GetStores,DB: "{<br/>  select: { id: true, name: true },<br/>  orderBy: { name: 'asc' }<br/>}"
    
    alt データベース操作成功
        DB-->>GetStores: stores: Store[]
        GetStores-->>Action: stores: Store[]
        
        Action->>Action: StoreActionState 構築
        Note over Action: "{<br/>  stores: stores,<br/>  error: null,<br/>  isLoading: false<br/>}"
        
        Action-->>Client: StoreActionState
        
    else データベース操作失敗
        DB-->>GetStores: Error
        GetStores->>GetStores: console.error()
        GetStores->>GetStores: throw new Error('店舗データの取得に失敗しました')
        GetStores-->>Action: Error
        
        Action->>Action: StoreActionState 構築 (エラー)
        Note over Action: "{<br/>  stores: [],<br/>  error: error.message,<br/>  isLoading: false<br/>}"
        
        Action-->>Client: StoreActionState (エラー)
    end
```

## getAllStores の詳細処理

**getAllStores 処理フロー**
1. getAllStores 開始 → prisma.store.findMany 実行
2. データベース操作結果による分岐：
   - 成功: stores データ取得 → stores を返却
   - 失敗: エラーログ出力 → Error をスロー

この処理により、安全に店舗データを取得できます。

## getStoreById の詳細処理

**getStoreById 処理フロー**
1. getStoreById 開始 → prisma.store.findUnique 実行
2. データベース操作結果による分岐：
   - 成功: store データ取得 → store 存在チェック
     - 存在する: store を返却
     - 存在しない: null を返却
   - 失敗: エラーログ出力 → Error をスロー

この処理により、安全に特定店舗のデータを取得できます。

## 共通処理パターン

### シンプルなデータ取得
1. 直接的なPrismaクエリ実行
2. 最小限のデータ選択 (id, name のみ)
3. 名前順でのソート

### エラーハンドリング
1. try-catch による例外処理
2. 詳細なエラーログ出力
3. ユーザーフレンドリーなエラーメッセージ

### 型安全性
1. TypeScript インターフェースの活用
2. Store, StoreActionState 型の定義
3. 明確な戻り値の型指定

## 使用場面

### getAllStores
- 店舗選択コンポーネントでの店舗一覧表示
- システム管理画面での店舗情報表示

### fetchStoresAction  
- React の useActionState フックとの連携
- フォーム送信後の店舗データ再取得

### getStoreById
- 特定店舗の詳細情報取得
- 店舗存在確認処理