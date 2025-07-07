# storeUtils.ts - シーケンス図

## 概要
店舗情報のCookie操作に関するユーティリティ関数の処理フローを示すシーケンス図です。

## 1. 店舗情報取得 (getStoreFromCookie)

```mermaid
sequenceDiagram
    participant Component as コンポーネント
    participant Utils as getStoreFromCookie
    participant NextCookies as next/headers cookies
    participant Browser as ブラウザCookie

    Component->>Utils: getStoreFromCookie()
    Utils->>NextCookies: cookies()
    NextCookies-->>Utils: cookieStore
    
    Utils->>Browser: cookieStore.get('selectedStoreId')
    Browser-->>Utils: storeIdCookie
    
    Utils->>Browser: cookieStore.get('selectedStoreName')
    Browser-->>Utils: storeNameCookie
    
    alt storeIdCookie.value が存在しない
        Utils-->>Component: null
    else storeIdCookie.value が存在する
        Utils->>Utils: Store オブジェクト構築
        Note over Utils: {<br/>  id: storeIdCookie.value,<br/>  name: storeNameCookie?.value || ''<br/>}
        Utils-->>Component: Store オブジェクト
    end
```

## 2. 店舗ID取得 (getStoreIdFromCookie)

```mermaid
sequenceDiagram
    participant ServerAction as Server Action
    participant Utils as getStoreIdFromCookie
    participant NextCookies as next/headers cookies
    participant Browser as ブラウザCookie

    ServerAction->>Utils: getStoreIdFromCookie()
    Utils->>NextCookies: cookies()
    NextCookies-->>Utils: cookieStore
    
    Utils->>Browser: cookieStore.get('selectedStoreId')
    Browser-->>Utils: storeIdCookie
    
    alt storeIdCookie?.value が存在する
        Utils-->>ServerAction: storeIdCookie.value
    else storeIdCookie?.value が存在しない
        Utils-->>ServerAction: null
    end
```

## 3. エラーハンドリング

```mermaid
sequenceDiagram
    participant Caller as 呼び出し元
    participant Utils as Utility Function
    participant NextCookies as next/headers cookies
    participant Console as console

    Caller->>Utils: getStoreFromCookie() or getStoreIdFromCookie()
    
    Utils->>NextCookies: cookies()
    
    alt 正常処理
        NextCookies-->>Utils: cookieStore
        Utils->>Utils: Cookie操作
        Utils-->>Caller: 結果 (Store | string | null)
    else エラー発生
        NextCookies-->>Utils: Error
        Utils->>Console: console.error('Failed to parse store cookie:', error)
        Utils-->>Caller: null
    end
```

## 4. Cookie構造とデータ復元

```mermaid
flowchart TD
    A[Cookie から値取得] --> B{selectedStoreId 存在？}
    B -->|No| C[null を返却]
    B -->|Yes| D[selectedStoreName 取得]
    D --> E{storeName 存在？}
    E -->|Yes| F[Store オブジェクト作成]
    E -->|No| G[Store オブジェクト作成 (name: '')]
    F --> H[結果返却]
    G --> H
    
    style A fill:#e1f5fe
    style C fill:#ffcdd2
    style H fill:#c8e6c9
```

## 5. 使用パターン比較

```mermaid
sequenceDiagram
    participant ServerComp as Server Component
    participant ServerAction as Server Action
    participant GetStore as getStoreFromCookie
    participant GetId as getStoreIdFromCookie

    Note over ServerComp,ServerAction: 異なる使用場面

    ServerComp->>GetStore: getStoreFromCookie()
    Note over ServerComp,GetStore: 完全な店舗情報が必要
    GetStore-->>ServerComp: Store | null

    ServerAction->>GetId: getStoreIdFromCookie()
    Note over ServerAction,GetId: IDのみが必要（効率的）
    GetId-->>ServerAction: string | null
```

## データ型定義

```mermaid
classDiagram
    class Store {
        +string id
        +string name
    }
    
    class CookieStructure {
        +string selectedStoreId
        +string selectedStoreName
    }
    
    Store <-- CookieStructure : restores to
```

## 関数の特徴

### getStoreFromCookie
- **用途**: Server Componentでの初期化時
- **戻り値**: `Store | null`
- **処理**: IDと名前の両方を取得してオブジェクト化
- **フォールバック**: 名前が無い場合は空文字

### getStoreIdFromCookie  
- **用途**: Server Actionでの権限チェック
- **戻り値**: `string | null`
- **処理**: IDのみを効率的に取得
- **パフォーマンス**: 軽量で高速

## エラー処理戦略

### 失敗時の動作
1. Cookie読み取りエラー → `null` 返却
2. パースエラー → `null` 返却  
3. 値が存在しない → `null` 返却

### ログ出力
- エラー詳細をコンソールに出力
- アプリケーションの動作は継続

## セキュリティ考慮

### Cookie値の検証
- 存在チェックのみ実施
- 値の内容検証は呼び出し側で実施

### エラー情報
- 詳細なエラーはサーバーログのみ
- クライアントには `null` のみ返却