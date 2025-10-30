# Layout (Root Layout) - シーケンス図

## 概要
アプリケーションのルートレイアウトの処理フローを示すシーケンス図です。

## 1. レイアウト初期化とフォント設定

```mermaid
sequenceDiagram
    participant App as アプリケーション
    participant Layout as RootLayout
    participant Fonts as Google Fonts
    participant Geist as Geist Font
    participant GeistMono as Geist_Mono Font

    App->>Layout: RootLayout({ children }) 実行
    Layout->>Fonts: next/font/google からフォントインポート
    
    Fonts->>Geist: Geist フォント初期化
    Note over Geist: "variable: '--font-geist-sans'<br/>subsets: ['latin']"
    
    Fonts->>GeistMono: Geist_Mono フォント初期化
    Note over GeistMono: "variable: '--font-geist-mono'<br/>subsets: ['latin']"
    
    Geist-->>Layout: geistSans オブジェクト
    GeistMono-->>Layout: geistMono オブジェクト
```

## 2. 店舗情報の取得

```mermaid
sequenceDiagram
    participant Layout as RootLayout
    participant StoreUtils as getStoreFromCookie
    participant Cookie as Cookie
    participant Database as データベース

    Layout->>StoreUtils: await getStoreFromCookie() 実行
    StoreUtils->>Cookie: Cookieから storeId 読み取り
    Cookie-->>StoreUtils: storeId
    
    alt storeIdが存在
        StoreUtils->>Database: 店舗情報取得クエリ
        Database-->>StoreUtils: 店舗データ
        StoreUtils-->>Layout: initialStore オブジェクト
    else storeIdが無効/存在しない
        StoreUtils-->>Layout: null
    end
```

## 3. コンポーネント階層構築

```mermaid
sequenceDiagram
    participant Layout as RootLayout
    participant HTML as HTML要素
    participant Body as Body要素
    participant StoreProvider as StoreProvider
    participant StoreGuard as StoreGuard
    participant Components as 子コンポーネント

    Layout->>HTML: <html lang="ja"> 作成
    HTML->>Body: <body> 作成 + フォントクラス適用
    Note over Body: "${geistSans.variable} ${geistMono.variable} antialiased"
    
    Body->>StoreProvider: <StoreProvider initialStore={initialStore}>
    StoreProvider->>StoreGuard: <StoreGuard>
    StoreGuard->>Components: 子コンポーネント配置
    
    Components->>Components: <Header />
    Components->>Components: <Breadcrumbs />
    Components->>Components: {children}
```

## 4. プロバイダーチェーン

```mermaid
sequenceDiagram
    participant Layout as RootLayout
    participant StoreProvider as StoreProvider
    participant Context as StoreContext
    participant StoreGuard as StoreGuard
    participant Children as children

    Layout->>StoreProvider: initialStore 渡し
    StoreProvider->>Context: Context.Provider 作成
    Context->>Context: 初期状態設定
    Note over Context: "selectedStore: initialStore<br/>setSelectedStore関数"
    
    StoreProvider->>StoreGuard: プロバイダー内でレンダリング
    StoreGuard->>StoreGuard: 店舗チェック実行
    
    alt 店舗が選択済み
        StoreGuard->>Children: 通常のレンダリング
    else 店舗未選択
        StoreGuard->>StoreGuard: リダイレクト処理
    end
```

## 5. CSS とフォント適用

```mermaid
sequenceDiagram
    participant Layout as RootLayout
    participant GlobalCSS as globals.css
    participant FontVars as CSS Variables
    participant Body as Body Element

    Layout->>GlobalCSS: './globals.css' インポート
    GlobalCSS->>GlobalCSS: グローバルスタイル読み込み
    
    Layout->>FontVars: フォント変数設定
    FontVars->>FontVars: --font-geist-sans 定義
    FontVars->>FontVars: --font-geist-mono 定義
    
    FontVars->>Body: className で変数適用
    Note over Body: "geistSans.variable<br/>geistMono.variable<br/>antialiased"
    
    Body->>Body: フォントレンダリング最適化
```

## 6. サーバーサイドレンダリング

```mermaid
sequenceDiagram
    participant Request as HTTPリクエスト
    participant NextJS as Next.js Server
    participant Layout as RootLayout
    participant StoreUtils as Store Utils
    participant HTML as 生成HTML

    Request->>NextJS: ページリクエスト
    NextJS->>Layout: async RootLayout 実行
    Layout->>StoreUtils: サーバーサイドで店舗情報取得
    StoreUtils-->>Layout: 初期店舗データ
    
    Layout->>HTML: 完全なHTML構造生成
    Note over HTML: "フォント、CSS、初期データを<br/>含む完成されたマークアップ"
    
    HTML-->>Request: ハイドレーション対応のHTML
```

## レイアウト構造

RootLayoutコンポーネントは以下の構造で構成されています：

### RootLayoutクラス
- **async function**: 非同期関数として定義され、サーバーサイドで店舗情報を取得
- **children**: ReactNodeとして子コンポーネントを受け取り
- **getStoreFromCookie()**: 内部メソッドでCookieから店舗情報を取得
- **Geist fonts**: Google Fontsからのフォント設定を管理

### FontConfig設定
- **Geist geistSans**: メインテキスト用のGeistフォント
- **Geist_Mono geistMono**: モノスペース用のGeist_Monoフォント
- **variable**: CSS変数名を定義
- **subsets**: 'latin'サブセットを指定

### LayoutHierarchy構造
- **html[lang="ja"]**: 日本語指定のHTML要素
- **body[className]**: フォントクラスが適用されたbody要素
- **StoreProvider**: 店舗状態管理プロバイダー
- **StoreGuard**: 店舗選択状態を監視するガード
- **Header**: アプリケーションヘッダー
- **Breadcrumbs**: パンくずナビゲーション
- **children**: 各ページのコンテンツ

RootLayoutはFontConfigを使用してフォント設定を行い、LayoutHierarchyの構造でコンポーネントをレンダリングします。

## コンポーネント配置図

コンポーネントの階層構造は以下の通りです：

### メイン階層
1. **html[lang="ja"]** - 日本語指定のルート要素
2. **body + font classes** - フォントクラスが適用されたbody要素
3. **StoreProvider** - 店舗状態管理の最上位プロバイダー
4. **StoreGuard** - アクセス制御を行うガードコンポーネント
5. **Header** - アプリケーションのヘッダー部分
6. **Breadcrumbs** - ナビゲーション用パンくずリスト
7. **children** - 各ページの動的コンテンツ

### 外部依存関係
- **initialStore** → StoreProviderに店舗の初期データを提供
- **geistSans** → bodyにメインフォントのCSS変数を設定
- **geistMono** → bodyにモノスペースフォントのCSS変数を設定
- **globals.css** → bodyにグローバルスタイルを適用

この構造により、フォント設定、状態管理、アクセス制御が統合された安定したレイアウトシステムが構築されています。

## データフロー

```mermaid
sequenceDiagram
    participant Server as サーバー
    participant Cookie as Cookie
    participant Layout as RootLayout
    participant Provider as StoreProvider
    participant Client as クライアント

    Server->>Cookie: 店舗情報読み取り
    Cookie-->>Layout: initialStore
    Layout->>Provider: 初期データ渡し
    Provider->>Client: Context経由でデータ提供
    Client->>Client: 店舗状態管理
```

## フォント最適化

```mermaid
sequenceDiagram
    participant Layout as RootLayout
    participant NextFont as next/font/google
    participant Browser as ブラウザ
    participant FontDisplay as フォント表示

    Layout->>NextFont: フォント設定定義
    NextFont->>NextFont: 最適化処理
    Note over NextFont: "プリロード最適化<br/>FOUT/FOIT対策<br/>サブセット指定"
    
    NextFont->>Browser: 最適化されたフォント配信
    Browser->>FontDisplay: antialiased レンダリング
    FontDisplay-->>Layout: 美しいタイポグラフィ表示
```

## 特徴

### 1. サーバーサイド初期化
- レイアウト時に店舗情報取得
- 初期レンダリングの最適化

### 2. フォント最適化
- Google Fontsの最適な読み込み
- antialiased による美しい表示

### 3. グローバル状態管理
- StoreProvider による状態提供
- アプリケーション全体での店舗情報共有

### 4. セキュリティガード
- StoreGuard による保護
- 未認証時の自動リダイレクト

### 5. 多言語対応基盤
- html lang="ja" による日本語設定
- 国際化対応の基礎構造

## 依存関係

### 外部依存
- `next/font/google` - フォント最適化
- `./globals.css` - グローバルスタイル

### 内部依存
- `./components/Header` - ヘッダーコンポーネント
- `./components/Breadcrumbs` - パンくずリスト
- `./components/StoreGuard` - アクセス保護
- `./contexts/StoreContext` - 状態管理
- `./utils/storeUtils` - 店舗ユーティリティ

### パフォーマンス最適化
- フォントのプリロード
- サーバーサイドでの初期データ取得
- CSS変数による効率的なスタイル適用