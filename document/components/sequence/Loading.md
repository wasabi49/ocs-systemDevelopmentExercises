# Loading.tsx - シーケンス図

## 概要
汎用ローディングコンポーネントの処理フローを示すシーケンス図です。

## 1. Loading コンポーネントの初期化

```mermaid
sequenceDiagram
    participant Parent as 親コンポーネント
    participant Loading as Loading
    participant Renderer as renderLoader

    Parent->>Loading: <Loading variant="spinner" size="md" text="読み込み中..." />
    Loading->>Loading: Props デフォルト値設定
    Note over Loading: "variant='spinner', size='md', fullScreen=false"
    Loading->>Loading: containerClasses 計算
    Loading->>Renderer: renderLoader() 呼び出し
    Renderer-->>Loading: ローダーコンポーネント
    Loading-->>Parent: 完成したUIコンポーネント
```

## 2. バリアント別レンダリング

```mermaid
sequenceDiagram
    participant Loading as Loading
    participant Spinner as Spinner
    participant Dots as Dots
    participant Text as Text
    participant Button as Button

    Loading->>Loading: switch(variant)
    
    alt variant === 'spinner'
        Loading->>Spinner: スピナー生成
        Note over Spinner: "animate-spin, border-b-2, border-blue-600"
        Spinner-->>Loading: <div className="animate-spin..." />
    else variant === 'dots'
        Loading->>Dots: ドットアニメーション生成
        Note over Dots: "3つのドット、順次bounce"
        loop 3つのドット
            Dots->>Dots: animationDelay 設定
            Note over Dots: "0ms, 150ms, 300ms"
        end
        Dots-->>Loading: <div className="flex space-x-1">...</div>
    else variant === 'text'
        Loading->>Text: テキストのみ生成
        Text-->>Loading: <div className="font-medium text-gray-600">...</div>
    else variant === 'button'
        Loading->>Button: ボタン用ローダー生成
        Note over Button: "白いスピナー + テキスト"
        Button-->>Loading: <div className="flex items-center gap-2">...</div>
    end
```

## 3. サイズ別スタイル適用

```mermaid
sequenceDiagram
    participant Loading as Loading
    participant SizeClasses as sizeClasses
    participant Element as 要素

    Loading->>SizeClasses: sizeClasses[size] 取得
    
    alt size === 'sm'
        SizeClasses-->>Loading: { spinner: 'h-4 w-4', dots: 'h-1.5 w-1.5', text: 'text-sm' }
    else size === 'md'
        SizeClasses-->>Loading: { spinner: 'h-8 w-8', dots: 'h-2 w-2', text: 'text-base' }
    else size === 'lg'
        SizeClasses-->>Loading: { spinner: 'h-12 w-12', dots: 'h-3 w-3', text: 'text-lg' }
    end
    
    Loading->>Element: クラス名適用
    Element-->>Loading: サイズ調整されたコンポーネント
```

## 4. LoadingWithIcon コンポーネント

```mermaid
sequenceDiagram
    participant Parent as 親コンポーネント
    participant WithIcon as LoadingWithIcon
    participant Loader2 as Lucide Loader2

    Parent->>WithIcon: <LoadingWithIcon size="md" text="処理中" />
    WithIcon->>WithIcon: iconSizeClasses 計算
    
    alt icon === true (デフォルト)
        WithIcon->>Loader2: <Loader2 className="animate-spin" />
        Loader2-->>WithIcon: アニメーションアイコン
    else icon === false
        WithIcon->>WithIcon: アイコンなし
    end
    
    WithIcon->>WithIcon: テキスト表示
    WithIcon-->>Parent: アイコン + テキスト
```

## 5. LoadingOverlay コンポーネント

```mermaid
sequenceDiagram
    participant Parent as 親コンポーネント
    participant Overlay as LoadingOverlay
    participant Loading as Loading

    Parent->>Overlay: <LoadingOverlay variant="spinner" />
    Overlay->>Overlay: 背景オーバーレイ生成
    Note over Overlay: "fixed inset-0 z-40 bg-black bg-opacity-50"
    Overlay->>Overlay: モーダルコンテナ生成
    Note over Overlay: "fixed inset-0 z-50 flex items-center justify-center"
    Overlay->>Loading: <Loading {...props} />
    Loading-->>Overlay: ローディングコンポーネント
    Overlay-->>Parent: 全画面オーバーレイ
```

## 6. フルスクリーンモード

**Loading コンポーネントフルスクリーン処理**
1. Loading コンポーネント → fullScreen プロパティチェック
2. fullScreen 状態による分岐：
   - true: fixed inset-0 クラス適用 → 全画面中央配置 → 背景 bg-gray-50
   - false: 通常コンテナクラス適用 → 相対配置 → パディング適用
3. 最終レンダリング

この機能により、状況に応じた適切なローディング表示が可能です。

## データ型とProps

**Loading コンポーネントデータ構造**
- LoadingProps: variant、size、text、className、fullScreen のオプションプロパティ
- LoadingVariant: spinner、dots、text、button のローディングバリアント
- LoadingSize: sm、md、lg のサイズオプション
- LoadingWithIconProps: icon、size、text、className のアイコン付きローディングプロパティ

LoadingProps は LoadingVariant と LoadingSize を参照し、LoadingWithIconProps は LoadingSize を参照します。

## アニメーション詳細

```mermaid
sequenceDiagram
    participant CSS as CSS Engine
    participant Spinner as Spinner
    participant Dots as Dots Animation

    Note over CSS: "スピナーアニメーション"
    CSS->>Spinner: animate-spin クラス適用
    Spinner->>Spinner: 360度回転 (1秒周期)
    
    Note over CSS: "ドットアニメーション"
    CSS->>Dots: animate-bounce クラス適用
    Dots->>Dots: Dot 1: 0ms 遅延
    Dots->>Dots: Dot 2: 150ms 遅延
    Dots->>Dots: Dot 3: 300ms 遅延
    
    loop 無限リピート
        Dots->>Dots: 上下バウンス
    end
```

## 使用例とパターン

### 基本的な使用方法
```typescript
// シンプルなスピナー
<Loading variant="spinner" size="md" />

// テキスト付きローディング
<Loading variant="dots" size="lg" text="データを読み込み中..." />

// ボタン内での使用
<Loading variant="button" size="sm" text="送信中..." />
```

### アイコン付きローディング
```typescript
// アイコン + テキスト
<LoadingWithIcon size="md" text="処理中..." />

// アイコンなし（テキストのみ）
<LoadingWithIcon icon={false} text="完了" />
```

### オーバーレイ表示
```typescript
// 全画面オーバーレイ
<LoadingOverlay variant="spinner" text="しばらくお待ちください" />

// フルスクリーンモード
<Loading variant="dots" fullScreen={true} />
```

## 特徴

### 1. 多様なバリアント
- spinner: 回転するスピナー
- dots: バウンスするドット
- text: テキストのみ
- button: ボタン用（白いスピナー）

### 2. レスポンシブサイズ
- sm/md/lg の3段階
- 要素ごとに最適化されたサイズ

### 3. 柔軟な表示モード
- インライン表示
- フルスクリーン表示
- オーバーレイ表示

### 4. カスタマイズ性
- カスタムクラス名対応
- テキストメッセージ対応
- アイコンの表示/非表示制御

### 5. アクセシビリティ
- 適切なコントラスト
- 視覚的フィードバック
- スクリーンリーダー対応