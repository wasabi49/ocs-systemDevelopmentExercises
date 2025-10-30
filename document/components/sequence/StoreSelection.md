# StoreSelection.tsx - シーケンス図

## 概要
店舗選択コンポーネント (Client Component) の処理フローを示すシーケンス図です。

## 1. コンポーネント初期化

```mermaid
sequenceDiagram
    participant Page as StoreSelectionPage
    participant Component as StoreSelection
    participant Context as useStore
    participant Router as useRouter
    participant State as React State

    Page->>Component: <StoreSelection initialStores={stores} initialError={error} />
    Component->>Context: useStore()
    Context-->>Component: { setSelectedStore, setStores, isLoading, setIsLoading }
    Component->>Router: useRouter()
    Router-->>Component: router
    Component->>State: useState 初期化
    State-->>Component: storeList, selectedStoreId, error の状態
```

## 2. 初期データ処理 (useEffect)

```mermaid
sequenceDiagram
    participant Component as StoreSelection
    participant UseEffect as useEffect
    participant Context as StoreContext
    participant Action as getAllStores

    Component->>UseEffect: useEffect([initialStores, setStores, setIsLoading])
    UseEffect->>UseEffect: initialStores.length チェック
    
    alt initialStores.length > 0
        UseEffect->>Component: setStoreList(initialStores)
        UseEffect->>Context: setStores(initialStores)
        UseEffect->>Context: setIsLoading(false)
    else initialStores.length === 0
        UseEffect->>Context: setIsLoading(true)
        UseEffect->>Component: setError('')
        UseEffect->>Action: getAllStores()
        
        alt データ取得成功
            Action-->>UseEffect: stores
            UseEffect->>Component: setStoreList(stores)
            UseEffect->>Context: setStores(stores)
        else データ取得失敗
            Action-->>UseEffect: Error
            UseEffect->>Component: setError('店舗データの取得に失敗しました')
        end
        
        UseEffect->>Context: setIsLoading(false)
    end
```

## 3. 店舗選択処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Component as StoreSelection
    participant Logger as logger
    participant Context as StoreContext
    participant Router as Next.js Router

    User->>Component: 店舗カードクリック
    Component->>Component: handleStoreSelect(store)
    Component->>Logger: logger.info('店舗選択', { store })
    Component->>Component: setSelectedStoreId(store.id)
    Component->>Context: setSelectedStore(store)
    Note over Context: "Cookie に店舗情報保存"
    Component->>Logger: logger.info('Cookie保存完了、画面遷移開始')
    
    Component->>Component: setTimeout(() => {...}, 600)
    Note over Component: "選択アニメーション表示のための遅延"
    Component->>Router: router.push('/Home')
    Router-->>User: /Home ページにリダイレクト
```

## 4. ローディング状態の表示

```mermaid
sequenceDiagram
    participant Component as StoreSelection
    participant Context as StoreContext
    participant LoadingComp as Loading Components

    Component->>Context: isLoading 確認
    
    alt isLoading === true
        Component->>LoadingComp: <Loader2 className="animate-spin" />
        Component->>LoadingComp: <LoadingWithIcon size="lg" />
        Component->>LoadingComp: <Loading variant="dots" />
        LoadingComp-->>Component: ローディングUI表示
    else isLoading === false
        Component->>Component: 通常のUI表示
    end
```

## 5. エラー状態の表示

```mermaid
sequenceDiagram
    participant Component as StoreSelection
    participant State as error state
    participant User as ユーザー

    Component->>State: error 確認
    
    alt error が存在する
        Component->>Component: エラーUI構築
        Note over Component: "エラーアイコン、メッセージ、再読み込みボタン"
        Component-->>User: エラー画面表示
        
        User->>Component: 再読み込みボタンクリック
        Component->>Component: window.location.reload()
    else error が存在しない
        Component->>Component: 通常のUI表示
    end
```

## 6. 店舗リスト表示

```mermaid
sequenceDiagram
    participant Component as StoreSelection
    participant State as storeList
    participant User as ユーザー

    Component->>State: storeList.length チェック
    
    alt storeList.length === 0
        Component->>Component: 空状態UI構築
        Note over Component: ""店舗データがありません" メッセージ"
        Component-->>User: 空状態表示
    else storeList.length > 0
        Component->>Component: 店舗カードリスト構築
        
        loop 各店舗に対して
            Component->>Component: 店舗カード生成
            Note over Component: "アニメーション付きカード<br/>選択状態の視覚的フィードバック"
        end
        
        Component-->>User: 店舗選択UI表示
    end
```

## 7. アニメーションとUI効果

**店舗選択 UI アニメーションフロー**
1. 店舗カード表示 → fadeInUp アニメーション → インデックス * 100ms 遅延 → カード順次表示
2. ユーザーホバー → transform: translateY(-1px) → shadow-xl 効果
3. 店舗選択 → 選択インジケーター表示
   - チェックアイコン表示
   - ring-2 ring-blue-500 ボーダー効果
4. 選択完了 → 600ms 遅延 → router.push('/Home')

これらのアニメーションにより、ユーザーに心地よい操作体験を提供します。

## Props とデータフロー

**StoreSelection コンポーネントデータ構造**
- StoreSelectionProps: initialStores（Store[]）、initialError（string）のオプションプロパティ
- Store: id、name フィールドを持つ店舗データ
- ComponentState: storeList、selectedStoreId、error のローカル状態
- ContextState: selectedStore、stores、isLoading のグローバル状態

これらのデータ構造により、店舗選択機能が実現されます。
    
    StoreSelectionProps --> Store : contains
    ComponentState --> Store : manages
    ContextState --> Store : stores
```

## 使用パターン

### Server Component からの初期化
```typescript
// stores/page.tsx
const stores = await getAllStores();
return <StoreSelection initialStores={stores} />;
```

### エラー時の初期化
```typescript
// stores/page.tsx (catch block)
return <StoreSelection initialStores={[]} initialError="エラーメッセージ" />;
```

### Context との連携
```typescript
// StoreSelection内
const { setSelectedStore, setStores, isLoading } = useStore();
setSelectedStore(store); // Cookie自動保存
setStores(stores); // グローバル状態更新
```

## 特徴

### 1. ハイブリッドデータ取得
- 初期データ（Server Component）優先
- フォールバック時のClient側取得

### 2. 豊富なUI状態管理
- ローディング状態
- エラー状態
- 空状態
- 選択状態

### 3. アニメーション効果
- 店舗カードの順次表示
- ホバー効果
- 選択フィードバック

### 4. アクセシビリティ
- キーボードナビゲーション対応
- aria-label 設定
- 視覚的フィードバック

### 5. レスポンシブデザイン
- グリッドレイアウト
- モバイル対応
- 柔軟なカードサイズ

## パフォーマンス考慮

### 初期化の最適化
- Server Component からの初期データ活用
- 不要なAPI呼び出しの回避

### アニメーションの最適化
- CSS transform 使用
- GPU加速対応
- 60fps のスムーズな動作