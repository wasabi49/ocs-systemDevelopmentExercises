# StoreContext.tsx - シーケンス図

## 概要
店舗選択状態管理に関するReact Contextの処理フローを示すシーケンス図です。

## 1. StoreProvider 初期化

```mermaid
sequenceDiagram
    participant App as アプリケーション
    participant Provider as StoreProvider
    participant State as React State
    participant Context as StoreContext

    App->>Provider: StoreProvider({ children, initialStore })
    Provider->>State: useState(initialStore)
    State-->>Provider: [selectedStore, setSelectedStoreState]
    Provider->>State: useState([])
    State-->>Provider: [stores, setStores]
    Provider->>State: useState(false)
    State-->>Provider: [isLoading, setIsLoading]
    Provider->>Context: Context.Provider({ value })
    Context-->>App: レンダリング開始
```

## 2. 店舗選択処理 (setSelectedStore)

```mermaid
sequenceDiagram
    participant Component as コンポーネント
    participant Context as useStore
    participant Provider as StoreProvider
    participant State as React State
    participant Cookie as Cookie Store

    Component->>Context: setSelectedStore(store)
    Context->>Provider: setSelectedStore(store)
    Provider->>State: setSelectedStoreState(store)
    
    alt store が存在する
        Provider->>Cookie: setCookie('selectedStoreId', store.id)
        Note over Provider,Cookie: maxAge: 30日, sameSite: 'lax'
        Provider->>Cookie: setCookie('selectedStoreName', store.name)
        Note over Provider,Cookie: maxAge: 30日, sameSite: 'lax'
    else store が null
        Provider->>Cookie: deleteCookie('selectedStoreId')
        Provider->>Cookie: deleteCookie('selectedStoreName')
    end
    
    State-->>Component: 再レンダリング
```

## 3. useStore フック使用

```mermaid
sequenceDiagram
    participant Component as コンポーネント
    participant Hook as useStore
    participant Context as useContext
    participant Provider as StoreProvider

    Component->>Hook: useStore()
    Hook->>Context: useContext(StoreContext)
    Context-->>Hook: context
    
    alt context が存在する
        Hook-->>Component: context (StoreContextType)
    else context が undefined
        Hook-->>Component: Error('useStore must be used within a StoreProvider')
    end
```

## 4. Cookie設定詳細

```mermaid
sequenceDiagram
    participant Provider as StoreProvider
    participant CookieNext as cookies-next
    participant Browser as ブラウザ

    Provider->>CookieNext: setCookie('selectedStoreId', store.id, options)
    Note over Provider,CookieNext: options: {<br/>  maxAge: 30 * 24 * 60 * 60,<br/>  sameSite: 'lax',<br/>  secure: NODE_ENV === 'production',<br/>  path: '/'<br/>}
    CookieNext->>Browser: Set-Cookie ヘッダー送信
    
    Provider->>CookieNext: setCookie('selectedStoreName', store.name, options)
    CookieNext->>Browser: Set-Cookie ヘッダー送信
```

## 5. Context値の構造

```mermaid
classDiagram
    class StoreContextType {
        +Store|null selectedStore
        +function setSelectedStore
        +Store[] stores
        +function setStores
        +boolean isLoading
        +function setIsLoading
    }
    
    class Store {
        +string id
        +string name
    }
    
    class StoreProviderProps {
        +ReactNode children
        +Store|null initialStore?
    }
    
    StoreContextType --> Store : contains
    StoreProviderProps --> Store : accepts
```

## 6. 状態更新フロー

```mermaid
flowchart TD
    A[コンポーネントから店舗選択] --> B[setSelectedStore 呼び出し]
    B --> C{店舗が選択された？}
    C -->|Yes| D[React State 更新]
    C -->|No| E[React State をnullに]
    D --> F[店舗IDをCookieに保存]
    D --> G[店舗名をCookieに保存]
    E --> H[Cookieを削除]
    F --> I[コンポーネント再レンダリング]
    G --> I
    H --> I
    
    style A fill:#e1f5fe
    style I fill:#c8e6c9
    style C fill:#fff3e0
```

## 7. エラーハンドリング

```mermaid
sequenceDiagram
    participant Component as コンポーネント
    participant Hook as useStore
    participant Context as React Context

    Component->>Hook: useStore()
    Hook->>Context: useContext(StoreContext)
    Context-->>Hook: undefined
    
    Hook->>Hook: context チェック
    
    alt context が undefined
        Hook-->>Component: throw Error('useStore must be used within a StoreProvider')
        Note over Component: エラー境界でキャッチされる
    else context が存在
        Hook-->>Component: context 返却
    end
```

## 使用パターン

### 基本的な使用方法
```typescript
// Provider でアプリを包む
<StoreProvider initialStore={serverStore}>
  <App />
</StoreProvider>

// コンポーネント内で使用
const { selectedStore, setSelectedStore, stores, setStores } = useStore();
```

### 店舗選択
```typescript
const handleStoreSelect = (store: Store) => {
  setSelectedStore(store); // 自動的にCookieに保存
};
```

### 店舗解除
```typescript
const handleStoreDeselect = () => {
  setSelectedStore(null); // Cookieも削除される
};
```

## セキュリティ考慮事項

### Cookie設定
- `sameSite: 'lax'` - CSRF攻撃防止
- `secure: production` - HTTPS環境でのみセキュア
- `path: '/'` - アプリ全体でアクセス可能
- `maxAge: 30日` - 適切な有効期限

### データ最小化
- 店舗IDと名前のみ保存
- 機密情報は含まない

## パフォーマンス考慮事項

### 状態の分離
- 選択店舗、店舗一覧、ローディング状態を分離
- 必要な部分のみ更新

### Cookie操作の最適化
- ID と名前を別々に保存
- フォールバック用の名前保存