# Home Page - シーケンス図

## 概要
ホームページ（メニュー画面）の処理フローを示すシーケンス図です。

## 1. ページ初期化とメニュー設定

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant Page as HomePage
    participant ButtonsConfig as buttons設定
    participant Icons as Lucide Icons

    Browser->>Page: /Home アクセス
    Page->>ButtonsConfig: メニューボタン配列作成
    ButtonsConfig->>Icons: アイコンコンポーネント取得
    Note over Icons: "User, ShoppingCart, Truck, BarChart3"
    Icons-->>ButtonsConfig: アイコンコンポーネント
    ButtonsConfig-->>Page: 完成したボタン設定
```

## 2. メニューボタン構成

```mermaid
sequenceDiagram
    participant Page as HomePage
    participant ButtonConfig as ボタン設定
    participant MenuItems as メニューアイテム

    Page->>ButtonConfig: buttons配列定義
    
    ButtonConfig->>MenuItems: 顧客管理ボタン
    Note over MenuItems: "label: "顧客管理"<br/>path: "/Home/CustomerList"<br/>icon: User<br/>color: "text-blue-500""
    
    ButtonConfig->>MenuItems: 注文管理ボタン
    Note over MenuItems: "label: "注文管理"<br/>path: "/Home/OrderList"<br/>icon: ShoppingCart<br/>color: "text-blue-500""
    
    ButtonConfig->>MenuItems: 納品管理ボタン
    Note over MenuItems: "label: "納品管理"<br/>path: "/Home/DeliveryList"<br/>icon: Truck<br/>color: "text-blue-500""
    
    ButtonConfig->>MenuItems: 統計情報ボタン
    Note over MenuItems: "label: "統計情報"<br/>path: "/Home/Statistics"<br/>icon: BarChart3<br/>color: "text-blue-500""
```

## 3. レンダリング処理

```mermaid
sequenceDiagram
    participant Page as HomePage
    participant JSX as JSXレンダリング
    participant Grid as Grid Layout
    participant NextNextLink as Next.js NextLink

    Page->>JSX: return文実行
    JSX->>JSX: ヘッダーセクション作成
    Note over JSX: "タイトル: "管理メニュー"<br/>説明: "管理したい項目を選択してください""
    
    JSX->>Grid: グリッドレイアウト初期化
    Note over Grid: "grid-cols-1 sm:grid-cols-2<br/>レスポンシブ対応"
    
    loop 各ボタンアイテム
        Grid->>NextLink: NextLink コンポーネント作成
        NextLink->>NextLink: href={btn.path} 設定
        NextLink->>NextLink: アイコンとラベル配置
    end
    
    Grid-->>JSX: 完成したメニューグリッド
    JSX-->>Page: レンダリング完了
```

## 4. ボタンマッピング処理

```mermaid
sequenceDiagram
    participant Page as HomePage
    participant MapFunction as buttons.map()
    participant ButtonItem as 個別ボタン
    participant IconComponent as アイコン

    Page->>MapFunction: buttons.map((btn, idx) => {...}) 実行
    
    loop 各ボタンに対して
        MapFunction->>ButtonItem: ボタン要素作成
        ButtonItem->>IconComponent: const IconComponent = btn.icon
        IconComponent->>IconComponent: 動的アイコン設定
        ButtonItem->>ButtonItem: スタイル適用
        Note over ButtonItem: "hover効果、レスポンシブサイズ<br/>shadow-sm → shadow-md"
        ButtonItem->>ButtonItem: key={idx} 設定
    end
    
    MapFunction-->>Page: 完成したボタン配列
```

## 5. レスポンシブデザイン処理

```mermaid
sequenceDiagram
    participant Page as HomePage
    participant TailwindCSS as Tailwind Classes
    participant Breakpoints as ブレークポイント
    participant Layout as レイアウト

    Page->>TailwindCSS: レスポンシブクラス適用
    
    TailwindCSS->>Breakpoints: モバイル設定
    Note over Breakpoints: "grid-cols-1<br/>h-24, text-base<br/>h-6 w-6 アイコン"
    
    TailwindCSS->>Breakpoints: デスクトップ設定 (sm:)
    Note over Breakpoints: "grid-cols-2<br/>h-48, text-xl<br/>h-12 w-12 アイコン"
    
    Breakpoints->>Layout: 適応的レイアウト
    Layout-->>Page: デバイス対応表示
```

## 6. ナビゲーション処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Button as メニューボタン
    participant NextNextLink as Next.js NextLink
    participant Router as Next.js Router
    participant TargetPage as 目的ページ

    User->>Button: ボタンクリック
    Button->>NextLink: href属性確認
    NextLink->>Router: ページ遷移実行
    Router->>TargetPage: 対応するページへナビゲート
    
    Note over TargetPage: "/Home/CustomerList<br/>/Home/OrderList<br/>/Home/DeliveryList<br/>/Home/Statistics"
    
    TargetPage-->>User: 新しいページ表示
```

## データ構造

**ホームページコンポーネント構造**
- HomePage: メインのホームページコンポーネント（"use client"、buttons配列、render機能）
- ButtonConfig: ボタン設定（label、path、icon、color）
- MenuButton: 実際のメニューボタン（IconComponent、href、className、hover効果）

HomePage は ButtonConfig を含み、ButtonConfig は MenuButton としてレンダリングされます。

## メニュー構造マップ

**ホームページナビゲーション構造**
- ホームページ (/Home) から4つの主要機能へ分岐：
  - 顧客管理 → /Home/CustomerList
  - 注文管理 → /Home/OrderList
  - 納品管理 → /Home/DeliveryList
  - 統計情報 → /Home/Statistics

各機能ボタンをクリックすると、対応する管理画面へ直接遷移します。

## スタイリング階層

```mermaid
sequenceDiagram
    participant Container as メインコンテナ
    participant Header as ヘッダーセクション
    participant Grid as グリッドコンテナ
    participant Button as 個別ボタン

    Container->>Container: 絶対配置 + 背景色設定
    Note over Container: "absolute inset-0 top-16<br/>bg-sky-50"
    
    Container->>Header: ヘッダーセクション
    Note over Header: "text-center<br/>タイトル + 説明"
    
    Container->>Grid: フレックスレイアウト
    Note over Grid: "flex-1 items-center justify-center"
    
    Grid->>Button: ボタンスタイル
    Note over Button: "rounded-lg border<br/>bg-white shadow-sm<br/>hover:shadow-md"
```

## 特徴

### 1. クライアントサイドコンポーネント
- "use client" ディレクティブ
- ブラウザでのインタラクティブ機能

### 2. レスポンシブデザイン
- モバイルファースト設計
- スマートフォン〜デスクトップ対応

### 3. アイコン統合
- Lucide React アイコンライブラリ
- 意味的で直感的なアイコン選択

### 4. ナビゲーション最適化
- Next.js NextLink コンポーネント
- 高速なクライアントサイド遷移

### 5. 一貫したデザインシステム
- 統一されたカラーパレット
- 再利用可能なスタイリングパターン

## 使用パターン

### メニューボタン追加
```typescript
const newButton = {
  label: "新機能",
  path: "/Home/NewFeature",
  icon: NewIcon,
  color: "text-blue-500",
};
```

### レスポンシブ調整
```css
/* モバイル */
h-24 text-base h-6 w-6

/* デスクトップ */
sm:h-48 sm:text-xl sm:h-12 sm:w-12
```