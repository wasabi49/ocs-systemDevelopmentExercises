# Root Page - シーケンス図

## 概要
ルートページ（リダイレクト処理）の処理フローを示すシーケンス図です。

## 1. ページ初期化と依存関係読み込み

```mermaid
sequenceDiagram
    participant Browser as ブラウザ
    participant Page as HomePage
    participant Router as useRouter
    participant Store as useStore
    participant React as useEffect

    Browser->>Page: / (ルート) アクセス
    Page->>Router: useRouter() フック実行
    Router-->>Page: router オブジェクト
    
    Page->>Store: useStore() フック実行
    Store-->>Page: { selectedStore } 取得
    
    Page->>React: useEffect フック準備
    React-->>Page: 副作用関数登録
```

## 2. 店舗選択状態チェック

```mermaid
sequenceDiagram
    participant Page as HomePage
    participant useEffect as useEffect Hook
    participant StoreContext as Store Context
    participant RouterPush as router.push

    Page->>useEffect: useEffect実行
    useEffect->>StoreContext: selectedStore 確認
    
    alt selectedStore が存在
        StoreContext-->>useEffect: 店舗データあり
        useEffect->>RouterPush: router.push('/Home')
        RouterPush-->>Browser: /Home へリダイレクト
    else selectedStore が null/undefined
        StoreContext-->>useEffect: 店舗データなし
        useEffect->>RouterPush: router.push('/stores')
        RouterPush-->>Browser: /stores へリダイレクト
    end
```

## 3. リダイレクト処理フロー

**リダイレクト処理の流れ**
1. ルートアクセス (/) → HomePage コンポーネント
2. useStore() で店舗状態取得
3. selectedStore 存在確認
   - 存在する場合: router.push('/Home') → ホームページ表示
   - 存在しない場合: router.push('/stores') → 店舗選択ページ表示

この処理により、ユーザーは店舗選択状態に応じて適切なページに自動的にリダイレクトされます。

## 4. useEffect依存関係管理

```mermaid
sequenceDiagram
    participant Page as HomePage
    participant useEffect as useEffect
    participant Dependencies as 依存配列
    participant ReRender as 再レンダリング

    Page->>useEffect: useEffect定義
    useEffect->>Dependencies: [selectedStore, router] 依存配列設定
    
    Page->>Page: 初回レンダリング
    useEffect->>useEffect: 初回実行
    
    alt selectedStore変更
        Dependencies->>ReRender: 状態変更検知
        ReRender->>useEffect: useEffect再実行
        useEffect->>useEffect: 新しい状態で処理
    end
    
    alt router変更
        Dependencies->>ReRender: router変更検知
        ReRender->>useEffect: useEffect再実行
    end
```

## 5. ローディング表示処理

```mermaid
sequenceDiagram
    participant Page as HomePage
    participant LoadingComp as Loading Component
    participant UI as ユーザーインターフェース
    participant Redirect as リダイレクト処理

    Page->>LoadingComp: Loading コンポーネント表示
    LoadingComp->>UI: ローディングスピナー表示
    Note over UI: "variant="spinner"<br/>size="md"<br/>text="読み込み中...""
    
    Page->>Redirect: バックグラウンドでリダイレクト処理
    Redirect->>Redirect: 非同期処理実行
    
    Redirect->>UI: リダイレクト完了
    UI->>UI: ローディング画面終了
```

## 6. クライアントサイドナビゲーション

```mermaid
sequenceDiagram
    participant Page as HomePage
    participant NextRouter as Next.js Router
    participant ClientSide as Client Side
    participant NewPage as 新しいページ

    Page->>NextRouter: router.push() 実行
    NextRouter->>ClientSide: クライアントサイドルーティング
    
    ClientSide->>ClientSide: ページ遷移準備
    Note over ClientSide: "プリフェッチ<br/>データ準備<br/>レンダリング準備"
    
    ClientSide->>NewPage: 新しいページ表示
    NewPage-->>Page: 遷移完了
```

## Context統合パターン

**コンポーネント関係構造**
- HomePage: "use client"、useRouter()、useStore()、useEffect() を使用
- StoreContext: selectedStore と setSelectedStore() を提供
- NextRouter: push()、replace()、back() メソッドを提供
- LoadingComponent: variant「spinner」、size「md」、text プロパティを持つ

HomePage は StoreContext を使用し、NextRouter を利用して LoadingComponent をレンダリングします。

## 状態管理フロー

```mermaid
sequenceDiagram
    participant Initial as 初期状態
    participant Context as StoreContext
    participant Page as HomePage
    participant Router as Router

    Initial->>Context: アプリケーション初期化
    Context->>Context: selectedStore初期値設定
    
    Page->>Context: useStore()でコンテキスト購読
    Context-->>Page: 現在の selectedStore 状態
    
    Page->>Router: 状態に基づくリダイレクト実行
    Router->>Router: ページ遷移処理
```

## エラーハンドリング

```mermaid
sequenceDiagram
    participant Page as HomePage
    participant ErrorBoundary as Error Boundary
    participant Router as Router
    participant FallbackUI as フォールバック UI

    Page->>Router: router.push() 実行
    
    alt ルーティングエラー
        Router-->>ErrorBoundary: エラー発生
        ErrorBoundary->>FallbackUI: エラー表示
        FallbackUI-->>Page: エラー状態表示
    else 正常処理
        Router-->>Page: 遷移成功
    end
```

## レンダリングライフサイクル

```mermaid
sequenceDiagram
    participant Mount as コンポーネントマウント
    participant Page as HomePage
    participant Effects as useEffect
    participant Unmount as アンマウント

    Mount->>Page: 初期レンダリング
    Page->>Effects: useEffect 実行
    Effects->>Effects: リダイレクト処理
    
    Effects->>Unmount: 遷移によるアンマウント
    Note over Unmount: "クリーンアップ処理<br/>メモリ解放"
```

## 特徴

### 1. 自動リダイレクト
- 店舗選択状態による自動分岐
- ユーザーアクション不要

### 2. クライアントサイドルーティング
- SPA的な高速遷移
- サーバーラウンドトリップ不要

### 3. 状態管理統合
- Context APIとの連携
- リアクティブな状態反映

### 4. ローディング体験
- 遷移中の視覚的フィードバック
- ユーザー待機時間の軽減

### 5. 依存関係最適化
- useEffect依存配列の適切な管理
- 不要な再実行の防止

## パフォーマンス最適化

### React Hook最適化
```typescript
// 適切な依存配列
useEffect(() => {
  // リダイレクト処理
}, [selectedStore, router]);

// メモ化による最適化
const redirectLogic = useMemo(() => {
  // 処理ロジック
}, [selectedStore]);
```

### メモリ効率
- 軽量なコンポーネント設計
- 最小限の状態管理

### レンダリング最適化
- 条件分岐による最適なレンダリング
- 不要なDOM操作の回避

## 使用パターン

### アプリケーション入り口
```typescript
// ユーザーの初回アクセス
// ブックマークからのアクセス
// 直接URL入力
```

### 認証後リダイレクト
```typescript
// ログイン成功後
// セッション復元後
// 権限確認後
```

### 状態復元
```typescript
// ページリロード後
// ブラウザ戻る/進む
// タブ切り替え後
```

## セキュリティ考慮

### クライアントサイド制御
- サーバーサイド認証の補完
- UI/UXの向上のみ

### 状態検証
- Context経由の信頼できる状態
- 適切なフォールバック処理

## 拡張可能性

### 条件分岐拡張
```typescript
// 追加の条件チェック
if (selectedStore && userRole === 'admin') {
  router.push('/admin');
} else if (selectedStore) {
  router.push('/Home');
}
```

### アニメーション追加
```typescript
// ページ遷移アニメーション
// ローディング効果の強化
// 視覚的フィードバック向上
```