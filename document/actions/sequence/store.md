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

```mermaid
classDiagram
    class Store {
        +string id
        +string name
    }
    
    class StoreActionState {
        +Store[] stores
        +string|null error
        +boolean isLoading
    }
    
    Store --> StoreActionState : contains
```

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

```mermaid
flowchart TD
    A[getAllStores 開始] --> B[prisma.store.findMany 実行]
    B --> C{データベース操作}
    C -->|成功| D[stores データ取得]
    C -->|失敗| E[エラーログ出力]
    E --> F[Error をスロー]
    D --> G[stores を返却]
    
    style A fill:#e1f5fe
    style G fill:#c8e6c9
    style F fill:#ffcdd2
    style E fill:#ffcdd2
```

## getStoreById の詳細処理

```mermaid
flowchart TD
    A[getStoreById 開始] --> B[prisma.store.findUnique 実行]
    B --> C{データベース操作}
    C -->|成功| D[store データ取得]
    C -->|失敗| E[エラーログ出力]
    E --> F[Error をスロー]
    D --> G{store が存在？}
    G -->|存在| H[store を返却]
    G -->|存在しない| I[null を返却]
    
    style A fill:#e1f5fe
    style H fill:#c8e6c9
    style I fill:#fff3e0
    style F fill:#ffcdd2
    style E fill:#ffcdd2
```

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