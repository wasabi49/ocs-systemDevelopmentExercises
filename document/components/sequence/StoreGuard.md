# StoreGuard.tsx - シーケンス図

## 概要
店舗選択状態を監視し、必要に応じてリダイレクトを行うガードコンポーネントの処理フローを示すシーケンス図です。

## 1. コンポーネント初期化と状態取得

```mermaid
sequenceDiagram
    participant Parent as 親コンポーネント
    participant Guard as StoreGuard
    participant Context as useStore
    participant Pathname as usePathname
    participant Hook as useStoreRedirect

    Parent->>Guard: <StoreGuard>{children}</StoreGuard>
    Guard->>Context: useStore()
    Context-->>Guard: { selectedStore }
    Guard->>Pathname: usePathname()
    Pathname-->>Guard: pathname
    Guard->>Hook: useStoreRedirect()
    Note over Hook: "自動リダイレクト処理開始"
```

## 2. ページ判定とレンダリング制御

```mermaid
sequenceDiagram
    participant Guard as StoreGuard
    participant Children as children

    Guard->>Guard: isStoreSelectionPage 判定
    Note over Guard: "pathname === '/stores' || pathname === '/'"
    
    alt isStoreSelectionPage === true
        Guard->>Children: そのまま children を返却
        Children-->>Guard: <>{children}</>
    else isStoreSelectionPage === false
        Guard->>Guard: selectedStore チェック
        
        alt selectedStore が存在しない
            Guard->>Guard: リダイレクト中UI生成
            Note over Guard: "ローディングスピナー表示"
            Guard-->>Guard: リダイレクト中画面
        else selectedStore が存在する
            Guard->>Children: children を返却
            Children-->>Guard: <>{children}</>
        end
    end
```

## 3. useStoreRedirect フックとの連携

```mermaid
sequenceDiagram
    participant Guard as StoreGuard
    participant Hook as useStoreRedirect
    participant Router as Next.js Router

    Guard->>Hook: useStoreRedirect()
    Hook->>Hook: 店舗選択状態監視
    
    alt !selectedStore && !isStoreSelectionPage
        Hook->>Router: router.push('/stores')
        Note over Guard: "リダイレクト中UIを表示"
    else selectedStore 存在 or 店舗選択ページ
        Note over Guard: "通常のレンダリング継続"
    end
```

## 4. 条件分岐の詳細フロー

```mermaid
flowchart TD
    A[StoreGuard レンダリング] --> B{pathname チェック}
    B -->|/stores or /| C[isStoreSelectionPage = true]
    B -->|その他| D[isStoreSelectionPage = false]
    
    C --> E[children をそのまま表示]
    
    D --> F{selectedStore 存在？}
    F -->|Yes| G[children を表示]
    F -->|No| H[リダイレクト中UI表示]
    
    H --> I[useStoreRedirect が動作]
    I --> J[/stores へリダイレクト]
    
    style A fill:#e1f5fe
    style E fill:#c8e6c9
    style G fill:#c8e6c9
    style J fill:#ffcdd2
```

## 5. リダイレクト中UI

```mermaid
sequenceDiagram
    participant Guard as StoreGuard
    participant UI as UI Components

    Guard->>Guard: selectedStore が null
    Guard->>UI: リダイレクト中UI構築
    
    UI->>UI: div (min-h-screen flex)
    UI->>UI: div (text-center)
    UI->>UI: div (animate-spin スピナー)
    Note over UI: "border-b-2 border-blue-600"
    UI->>UI: p "店舗選択画面にリダイレクト中..."
    
    UI-->>Guard: リダイレクト中画面
```

## 6. 使用場面による動作

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as アプリケーション
    participant Guard as StoreGuard
    participant Router as Router

    alt 初回アクセス（店舗未選択）
        User->>App: /Home/CustomerList アクセス
        App->>Guard: StoreGuard チェック
        Guard->>Guard: selectedStore = null
        Guard->>Guard: リダイレクト中UI表示
        Guard->>Router: /stores へリダイレクト
    else 店舗選択済み
        User->>App: /Home/CustomerList アクセス
        App->>Guard: StoreGuard チェック
        Guard->>Guard: selectedStore 存在
        Guard->>App: 通常のページ表示
    else 店舗選択ページアクセス
        User->>App: /stores アクセス
        App->>Guard: StoreGuard チェック
        Guard->>Guard: isStoreSelectionPage = true
        Guard->>App: 店舗選択ページ表示
    end
```

## データ型とProps

```mermaid
classDiagram
    class StoreGuardProps {
        +ReactNode children
    }
    
    class StoreGuardState {
        +Store|null selectedStore
        +string pathname
        +boolean isStoreSelectionPage
    }
    
    class Store {
        +string id
        +string name
    }
    
    StoreGuardState --> Store : uses
```

## 統合パターン

### Layout.tsx での使用
```typescript
export default function RootLayout({ children }) {
  return (
    <StoreProvider>
      <StoreGuard>
        <Header />
        {children}
      </StoreGuard>
    </StoreProvider>
  );
}
```

### 特定ページでの使用
```typescript
export default function ProtectedPage() {
  return (
    <StoreGuard>
      <PageContent />
    </StoreGuard>
  );
}
```

## 特徴

### 1. 自動保護機能
- 店舗未選択時の自動リダイレクト
- アクセス制御の一元化

### 2. UX最適化
- リダイレクト中の視覚的フィードバック
- スムーズな画面遷移

### 3. 柔軟な制御
- 店舗選択ページは除外
- ホームページも除外

### 4. シンプルな実装
- children パターン使用
- 透過的なラッピング

### 5. パフォーマンス
- 不要な再レンダリング防止
- 効率的な状態チェック

## エッジケース対応

### Cookie 削除時
1. selectedStore が null になる
2. StoreGuard がリダイレクトUI表示
3. useStoreRedirect が /stores へリダイレクト

### 直接URL入力
1. 保護されたページへの直接アクセス
2. StoreGuard が即座にチェック
3. 必要に応じてリダイレクト

### ブラウザバック
1. 履歴を戻った時も再チェック
2. 店舗状態に応じた適切な処理