# Not Found Page - シーケンス図

## 概要
404エラーページの処理フローを示すシーケンス図です。

## 1. 404エラー発生とページ表示

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Browser as ブラウザ
    participant NextJS as Next.js Router
    participant NotFound as NotFoundPage

    User->>Browser: 存在しないURLにアクセス
    Browser->>NextJS: HTTP リクエスト
    NextJS->>NextJS: ルート解決試行
    
    NextJS->>NextJS: 該当ページが見つからない
    Note over NextJS: "404 ステータス判定"
    
    NextJS->>NotFound: not-found.tsx 実行
    NotFound->>NotFound: エラーページレンダリング
    NotFound-->>Browser: 404エラーページ表示
    Browser-->>User: "お探しのページは見つかりませんでした"
```

## 2. クライアントサイドコンポーネント初期化

```mermaid
sequenceDiagram
    participant NextJS as Next.js
    participant NotFound as NotFound Component
    participant ClientSide as Client Side
    participant JSX as JSX レンダリング

    NextJS->>NotFound: 'use client' ディレクティブ確認
    NotFound->>ClientSide: クライアントサイド実行
    
    ClientSide->>JSX: return 文実行
    JSX->>JSX: エラーメッセージ構築
    Note over JSX: "お探しのページは見つかりませんでした"<br/>"404 - not found"
    
    JSX->>JSX: レイアウト構築
    Note over JSX: "flex h-screen flex-col<br/>items-center justify-center<br/>bg-gray-100"
    
    JSX-->>NotFound: 完成したエラーページ
```

## 3. レイアウトとスタイリング

```mermaid
sequenceDiagram
    participant NotFound as NotFound Component
    participant Container as メインコンテナ
    participant TailwindCSS as Tailwind Classes
    participant Typography as タイポグラフィ

    NotFound->>Container: div 要素作成
    Container->>TailwindCSS: CSS クラス適用
    
    TailwindCSS->>TailwindCSS: レイアウトクラス
    Note over TailwindCSS: "flex h-screen flex-col<br/>items-center justify-center"
    
    TailwindCSS->>TailwindCSS: 背景色設定
    Note over TailwindCSS: "bg-gray-100"
    
    Container->>Typography: h1 要素作成
    Typography->>Typography: メインメッセージ
    Note over Typography: "お探しのページは見つかりませんでした"
    
    Container->>Typography: h2 要素作成
    Typography->>Typography: ステータスコード
    Note over Typography: "404 - not found"
```

## 4. エラーハンドリングフロー

404エラーハンドリングの流れ：

1. **URLアクセス** → Next.js Router
2. **ページ存在確認**
   - 存在する → 通常ページ表示
   - 存在しない → 404判定
3. **not-found.tsx実行** → クライアントサイド処理
4. **エラーページ表示** → ユーザーへのフィードバック

## 5. レスポンシブ表示処理

```mermaid
sequenceDiagram
    participant NotFound as NotFound Component
    participant Responsive as レスポンシブ設計
    participant Mobile as モバイル表示
    participant Desktop as デスクトップ表示

    NotFound->>Responsive: レスポンシブクラス適用
    
    Responsive->>Mobile: モバイル対応
    Note over Mobile: "縦配置レイアウト<br/>全画面高さ使用<br/>中央揃え"
    
    Responsive->>Desktop: デスクトップ対応
    Note over Desktop: "同じレイアウト適用<br/>画面サイズに応じた調整"
    
    Mobile-->>NotFound: モバイル最適化表示
    Desktop-->>NotFound: デスクトップ最適化表示
```

## 6. ユーザーインタラクション処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant NotFound as NotFound Page
    participant Browser as ブラウザ
    participant Navigation as ナビゲーション

    User->>NotFound: 404ページ閲覧
    NotFound->>User: エラーメッセージ表示
    
    User->>Browser: ブラウザの戻るボタン
    Browser->>Navigation: 前のページに戻る
    
    Note over User: "または手動でURLを修正"
    User->>Browser: 正しいURL入力
    Browser->>Navigation: 新しいページへ遷移
```

## コンポーネント構造

### NotFound
- `"use client"` - クライアントコンポーネント
- `function NotFound()` - メイン関数
- JSXを返却

### ErrorLayout
- `div container` - コンテナ要素
- `h1 mainMessage` - メインメッセージ
- `h2 statusCode` - ステータスコード

### Styling（Tailwind CSS）
- `flex layout` - フレックスレイアウト
- `h-screen height` - 画面フル高さ
- `flex-col direction` - 縦方向配置
- `items-center` - 中央揃え
- `justify-center` - 縦中央揃え
- `bg-gray-100` - 背景色

## CSS クラス構造

```mermaid
sequenceDiagram
    participant Component as NotFound Component
    participant FlexLayout as Flexbox Layout
    participant Positioning as 位置調整
    participant Styling as スタイリング

    Component->>FlexLayout: flex クラス適用
    FlexLayout->>FlexLayout: display: flex 設定
    
    FlexLayout->>Positioning: レイアウト調整
    Note over Positioning: "h-screen: height: 100vh<br/>flex-col: flex-direction: column<br/>items-center: align-items: center<br/>justify-center: justify-content: center"
    
    Positioning->>Styling: 背景とスタイル
    Note over Styling: "bg-gray-100: background-color: #f3f4f6"
    
    Styling-->>Component: 完成したレイアウト
```

## 多言語対応

```mermaid
sequenceDiagram
    participant NotFound as NotFound Component
    participant Messages as メッセージ
    participant Japanese as 日本語表示
    participant English as 英語表示

    NotFound->>Messages: エラーメッセージ表示
    
    Messages->>Japanese: メインメッセージ
    Note over Japanese: "お探しのページは見つかりませんでした"
    
    Messages->>English: ステータスメッセージ
    Note over English: "404 - not found"
    
    Japanese-->>NotFound: ユーザーフレンドリーな日本語
    English-->>NotFound: 技術的なステータス情報
```

## 特徴

### 1. クライアントサイドコンポーネント
- "use client" による最適化
- ブラウザでの高速レンダリング

### 2. ユーザーフレンドリー
- 分かりやすい日本語メッセージ
- 技術的情報も併記

### 3. レスポンシブデザイン
- 全デバイス対応
- 画面サイズに応じた最適表示

### 4. 中央配置レイアウト
- 視覚的に分かりやすい配置
- プロフェッショナルな外観

### 5. 軽量実装
- 最小限の依存関係
- 高速な読み込み

## ユーザー体験最適化

### 視覚的明確性
- コントラストの高い表示
- 読みやすいタイポグラフィ

### エラー理解促進
- 明確なエラー説明
- 次のアクション示唆

### アクセシビリティ
- セマンティックHTML構造
- スクリーンリーダー対応

## パフォーマンス考慮

### 最小リソース使用
- 軽量なコンポーネント
- 外部依存の回避

### 高速表示
- シンプルなDOM構造
- 効率的なCSS適用

### メモリ効率
- 状態管理なし
- 静的コンテンツ

## 拡張可能性

### カスタマイズポイント
```typescript
// メッセージのカスタマイズ
const customMessage = "ページが見つかりません";

// スタイルの調整
const customStyles = "bg-blue-50 text-blue-900";

// 追加機能
const addHomeLink = true;
```

### 国際化対応
```typescript
// 多言語メッセージ
const messages = {
  ja: "お探しのページは見つかりませんでした",
  en: "Page not found"
};
```