# stores/page.tsx - シーケンス図

## 概要
店舗選択ページ (Server Component) の処理フローを示すシーケンス図です。

## 1. ページレンダリング処理

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant Page as StoreSelectionPage
    participant Action as getAllStores
    participant DB as Prisma Database
    participant Component as StoreSelection

    Browser->>Page: GET /stores
    Page->>Action: getAllStores()
    Action->>DB: store.findMany()
    DB-->>Action: stores[]
    Action-->>Page: initialStores
    
    alt 正常処理
        Page->>Component: <StoreSelection initialStores={stores} />
        Component-->>Page: コンポーネントレンダリング
        Page-->>Browser: HTML レスポンス
    else エラー発生
        Page->>Page: console.error(error)
        Page->>Component: <StoreSelection initialStores={[]} initialError="..." />
        Component-->>Page: エラー表示付きレンダリング
        Page-->>Browser: HTML レスポンス
    end
```

## 2. エラーハンドリング詳細

```mermaid
sequenceDiagram
    participant Page as StoreSelectionPage
    participant Action as getAllStores
    participant Console as console
    participant Component as StoreSelection

    Page->>Action: getAllStores() 実行
    
    alt データ取得成功
        Action-->>Page: stores 配列
        Page->>Component: initialStores={stores}
    else データ取得失敗
        Action-->>Page: Error thrown
        Page->>Console: console.error('Failed to load stores:', error)
        Page->>Component: initialStores={[]}
        Page->>Component: initialError="店舗データの取得に失敗しました。"
    end
```

## 3. メタデータ設定

メタデータの設定内容：

- **title**: '店舗選択 | 書店管理システム'
- **description**: 'ご利用する店舗を選択してください'

これらのメタデータはHTMLヘッドに反映され、SEO最適化に寄与します。

## 4. Server Component の特性

```mermaid
sequenceDiagram
    participant Server as Next.js Server
    participant Page as StoreSelectionPage
    participant Client as Client Browser

    Note over Server,Page: "Server Component として実行"
    
    Server->>Page: async 関数実行
    Page->>Page: await getAllStores()
    Note over Page: "サーバーサイドでDB操作"
    Page->>Page: try-catch でエラーハンドリング
    Page->>Server: React コンポーネント返却
    Server->>Server: HTML にレンダリング
    Server->>Client: 完全な HTML 送信
    
    Note over Client: "JavaScript ハイドレーション<br/>StoreSelection は Client Component"
```

## 5. データフロー

Server Componentのデータフロー：

1. **/storesアクセス** → Server Component実行
2. **getAllStores()呼び出し** → データベースクエリ
3. **クエリ結果判定**：
   - 成功 → storesデータ取得 → StoreSelectionにprops渡し → 正常レンダリング
   - 失敗 → エラーキャッチ → エラーログ出力 → 空配列とエラーメッセージ渡し → エラー状態レンダリング
4. **HTMLレスポンス**生成

## 6. コンポーネント統合

```mermaid
sequenceDiagram
    participant Page as StoreSelectionPage (Server)
    participant Selection as StoreSelection (Client)
    participant Context as StoreContext
    participant Router as Next.js Router

    Page->>Selection: initialStores, initialError
    Selection->>Selection: Client Component として初期化
    Selection->>Context: 店舗リスト設定
    
    Note over Selection: "ユーザーが店舗選択"
    Selection->>Context: setSelectedStore(store)
    Context->>Context: Cookie に保存
    Selection->>Router: router.push('/Home')
```

## データ型とProps

### Store型
- `id: string` - 店舗ID
- `name: string` - 店舗名

### StoreSelectionPageProps型
- `initialStores: Store[]` - 初期店舗リスト
- `initialError?: string` - 初期エラーメッセージ

### Metadata型
- `title: string` - ページタイトル
- `description: string` - ページ説明

## 特徴

### 1. Server Component の利点
- サーバーサイドでのデータ取得
- クライアントへの JavaScript 送信量削減
- SEO 最適化

### 2. エラーハンドリング
- try-catch による安全なデータ取得
- エラー時のフォールバック表示
- ユーザーフレンドリーなエラーメッセージ

### 3. Props による初期化
- initialStores でデータ渡し
- initialError でエラー状態通知
- Client Component での状態管理

### 4. メタデータ管理
- Next.js 13+ の Metadata API 使用
- ページ固有のタイトルと説明

## 使用パターン

### 正常系フロー
1. ユーザーが `/stores` にアクセス
2. Server Component でデータ取得
3. StoreSelection コンポーネントに渡す
4. ユーザーが店舗選択
5. `/Home` へリダイレクト

### エラー系フロー
1. データ取得でエラー発生
2. エラーログ出力
3. 空の店舗リストとエラーメッセージ表示
4. ユーザーにエラー通知

## パフォーマンス考慮

### サーバーサイドレンダリング
- 初回表示の高速化
- データ取得の最適化
- クライアント負荷の軽減

### エラー時の処理
- 部分的な機能提供
- リトライ機能の提供（Client Component 側）