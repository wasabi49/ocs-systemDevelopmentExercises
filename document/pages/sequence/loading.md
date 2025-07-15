# Loading Page - シーケンス図

## 概要
グローバルローディングページの処理フローを示すシーケンス図です。

## 1. ローディングページ初期化

```mermaid
sequenceDiagram
    participant NextJS as Next.js Router
    participant LoadingPage as LoadingPage
    participant LoadingComp as Loading Component
    participant Props as コンポーネントプロパティ

    NextJS->>LoadingPage: ページ遷移中にローディング表示要求
    LoadingPage->>Props: Loading コンポーネントのプロパティ設定
    Note over Props: "variant: "spinner"<br/>size: "lg"<br/>text: "データを読み込み中です"<br/>fullScreen: true"
    
    Props->>LoadingComp: <Loading {...props} /> レンダリング
    LoadingComp->>LoadingComp: プロパティに基づくUI構築
    LoadingComp-->>LoadingPage: ローディングUI表示
```

## 2. Loading コンポーネント呼び出し

```mermaid
sequenceDiagram
    participant LoadingPage as LoadingPage
    participant Import as インポート
    participant LoadingComp as Loading Component

    LoadingPage->>Import: './components/Loading' からインポート
    Import-->>LoadingPage: Loading コンポーネント
    
    LoadingPage->>LoadingComp: コンポーネント呼び出し
    Note over LoadingComp: "variant="spinner"<br/>size="lg"<br/>text="データを読み込み中です"<br/>fullScreen={true}"
    
    LoadingComp-->>LoadingPage: レンダリング結果
```

## 3. プロパティ設定処理

```mermaid
sequenceDiagram
    participant LoadingPage as LoadingPage
    participant PropsConfig as プロパティ設定
    participant LoadingVariants as ローディングバリアント

    LoadingPage->>PropsConfig: Loading プロパティ定義
    
    PropsConfig->>LoadingVariants: variant: "spinner"
    Note over LoadingVariants: "スピナーアニメーション選択"
    
    PropsConfig->>LoadingVariants: size: "lg"
    Note over LoadingVariants: "大きいサイズ指定"
    
    PropsConfig->>LoadingVariants: text: "データを読み込み中です"
    Note over LoadingVariants: "日本語メッセージ"
    
    PropsConfig->>LoadingVariants: fullScreen: true
    Note over LoadingVariants: "全画面表示モード"
    
    LoadingVariants-->>LoadingPage: 設定完了
```

## 4. Next.js ローディング統合

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant NextRouter as Next.js Router
    participant LoadingPage as loading.tsx
    parameter TargetPage as 目的ページ

    User->>NextRouter: ページ遷移開始
    NextRouter->>LoadingPage: 自動ローディング表示
    LoadingPage->>LoadingPage: Loading コンポーネント表示
    
    NextRouter->>NextRouter: ページデータ取得処理
    Note over NextRouter: "サーバーコンポーネント実行<br/>データフェッチ<br/>レンダリング準備"
    
    NextRouter->>TargetPage: ページ準備完了
    TargetPage-->>User: 新しいページ表示
    Note over LoadingPage: "ローディング画面終了"
```

## 5. フルスクリーンローディング表示

```mermaid
sequenceDiagram
    participant LoadingPage as LoadingPage
    participant LoadingComp as Loading Component
    participant FullScreen as fullScreen処理
    participant UI as ユーザーインターフェース

    LoadingPage->>LoadingComp: fullScreen={true} 渡し
    LoadingComp->>FullScreen: 全画面モード処理
    
    FullScreen->>UI: 画面全体をカバー
    Note over UI: "position: fixed<br/>inset: 0<br/>z-index: 高い値"
    
    FullScreen->>UI: 中央配置
    Note over UI: "flex items-center justify-center"
    
    FullScreen->>UI: 背景オーバーレイ
    Note over UI: "半透明背景で既存UI隠蔽"
    
    UI-->>LoadingPage: 没入的ローディング体験
```

## 6. ローディング状態管理

**ローディング状態の流れ**
1. ページ遷移開始 → loading.tsx 表示
2. Loading Component レンダリング
   - Spinner Animation: 回転アニメーション表示
   - Loading Text: 「データを読み込み中です」表示
   - Full Screen Overlay: 全画面オーバーレイ表示
3. データ取得完了待機
4. 新しいページ準備完了 → Loading 画面終了 → 目的ページ表示

このプロセスにより、ユーザーに明確な読み込み状態を提供します。

## コンポーネント構造

**LoadingPage コンポーネント構造**
- LoadingPage: function LoadingPage() と JSX を返却
- LoadingComponent: variant「spinner」、size「lg」、text、fullScreen プロパティを持つ
- LoadingProps: variant、size、text、fullScreen の文字列およびブール型

LoadingPage は LoadingComponent をレンダリングし、LoadingComponent は LoadingProps を受け取ります。

## 表示パターン

```mermaid
sequenceDiagram
    participant Router as Next.js Router
    participant Loading as loading.tsx
    participant Display as 表示状態

    Router->>Loading: 表示開始
    Loading->>Display: スピナー表示
    Note over Display: "回転アニメーション"
    
    Loading->>Display: テキスト表示
    Note over Display: "データを読み込み中です"
    
    Loading->>Display: 全画面オーバーレイ
    Note over Display: "背景の非活性化"
    
    Router->>Router: バックグラウンド処理
    Note over Router: "データ取得<br/>ページ準備"
    
    Router->>Loading: 表示終了
    Loading->>Display: フェードアウト
```

## アニメーション処理

```mermaid
sequenceDiagram
    participant LoadingPage as LoadingPage
    participant LoadingComp as Loading Component
    participant SpinnerAnim as Spinner Animation
    participant CSS as CSS Transitions

    LoadingPage->>LoadingComp: variant="spinner" 指定
    LoadingComp->>SpinnerAnim: スピナーアニメーション開始
    
    SpinnerAnim->>CSS: rotation キーフレーム実行
    CSS->>CSS: 360度回転ループ
    Note over CSS: "animation: spin 1s linear infinite"
    
    CSS->>SpinnerAnim: 滑らかな回転表示
    SpinnerAnim-->>LoadingPage: 視覚的フィードバック
```

## 特徴

### 1. Next.js 統合
- App Router の loading.tsx ファイル
- 自動的なローディング状態管理

### 2. ユーザー体験最適化
- 明確な読み込み状態表示
- 日本語でのわかりやすいメッセージ

### 3. 全画面対応
- fullScreen プロパティによる没入体験
- 既存UIの非活性化

### 4. 再利用可能なコンポーネント
- Loading コンポーネントの活用
- 設定可能なプロパティ

### 5. アニメーション最適化
- スムーズなスピナーアニメーション
- パフォーマンス重視の実装

## 使用シナリオ

### 1. ページ遷移時
- 重いページコンポーネントの読み込み
- サーバーサイドデータ取得待機

### 2. データフェッチ中
- API呼び出し処理中
- データベースクエリ実行中

### 3. レンダリング処理中
- 複雑なコンポーネントの初期化
- 大量データの処理

## パフォーマンス考慮

### 軽量実装
- 最小限のコンポーネント構造
- 効率的なプロパティ渡し

### アニメーション最適化
- CSS transform の活用
- GPU アクセラレーション対応

### メモリ効率
- 不要な状態管理の回避
- シンプルなライフサイクル