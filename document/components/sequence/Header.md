# Header.tsx - シーケンス図

## 概要
アプリケーションヘッダーコンポーネントの処理フローを示すシーケンス図です。

## 1. コンポーネント初期化

```mermaid
sequenceDiagram
    participant App as アプリケーション
    participant Header as Header
    participant Context as useStore
    participant Pathname as usePathname
    participant State as React State

    App->>Header: <Header />
    Header->>State: useState(false) - isOpen
    Header->>Pathname: usePathname()
    Pathname-->>Header: pathname
    Header->>Context: useStore()
    Context-->>Header: { selectedStore }
    Header->>Header: isStoreSelectionPage 判定
```

## 2. モバイルメニュー制御

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Header as Header
    participant Body as document.body
    participant EventListener as addEventListener

    User->>Header: ハンバーガーメニュークリック
    Header->>Header: setIsOpen(!isOpen)
    
    alt isOpen === true
        Header->>Body: document.body.style.overflow = 'hidden'
        Note over Body: "スクロール防止"
    else isOpen === false
        Header->>Body: document.body.style.overflow = 'unset'
        Note over Body: "スクロール復元"
    end
    
    Header->>EventListener: keydown イベント監視
    Note over EventListener: "Escape キーでメニューを閉じる"
```

## 3. キーボードイベント処理

```mermaid
sequenceDiagram
    participant Header as Header
    participant UseEffect as useEffect
    participant EventListener as Event Listener

    Header->>UseEffect: useEffect([isOpen]) 実行
    UseEffect->>EventListener: addEventListener('keydown', handler)
    
    loop キーボード入力
        EventListener->>EventListener: handleKeyDown(e)
        
        alt e.key === 'Escape' && isOpen
            EventListener->>Header: setIsOpen(false)
        else その他のキー
            EventListener->>EventListener: 何もしない
        end
    end
    
    UseEffect->>EventListener: removeEventListener (クリーンアップ)
```

## 4. メニューアイテム表示制御

```mermaid
sequenceDiagram
    participant Header as Header
    participant MenuItems as menuItems
    participant Context as StoreContext

    Header->>Header: isStoreSelectionPage チェック
    Header->>MenuItems: menuItems 配列
    Note over MenuItems: "[CustomerList, OrderList, DeliveryList, Statistics, stores]"
    
    alt isStoreSelectionPage === true
        Header->>MenuItems: filter(item.href === '/stores')
        MenuItems-->>Header: [stores] のみ
    else isStoreSelectionPage === false
        Header->>MenuItems: 全メニューアイテム
        MenuItems-->>Header: 全アイテム
    end
    
    Header->>Context: selectedStore チェック
    
    alt !selectedStore && !isStoreSelectionPage
        Note over Header: "選択中店舗表示なし"
    else selectedStore 存在
        Note over Header: "選択中店舗表示"
    end
```

## 5. レスポンシブ表示制御

```mermaid
sequenceDiagram
    participant Header as Header
    participant Desktop as デスクトップ表示
    participant Mobile as モバイル表示

    Header->>Header: 画面サイズ判定
    
    alt 画面幅 >= md (768px)
        Header->>Desktop: デスクトップナビゲーション表示
        Desktop->>Desktop: インライン店舗表示
        Desktop->>Desktop: 水平メニュー表示
        Header->>Mobile: モバイル要素非表示
    else 画面幅 < md
        Header->>Mobile: ハンバーガーメニューボタン表示
        Header->>Mobile: コンパクト店舗表示
        Header->>Desktop: デスクトップナビゲーション非表示
        
        alt isOpen === true
            Header->>Mobile: サイドメニュー表示
            Header->>Mobile: オーバーレイ表示
        end
    end
```

## 6. モバイルメニューの開閉

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Header as Header
    participant SideMenu as サイドメニュー
    participant Overlay as オーバーレイ

    User->>Header: メニューボタンクリック
    Header->>Header: setIsOpen(true)
    Header->>SideMenu: transform: translateX(0)
    Note over SideMenu: "右から左にスライドイン"
    Header->>Overlay: 背景オーバーレイ表示
    
    alt ユーザーがメニュー項目クリック
        User->>SideMenu: メニュー項目選択
        SideMenu->>Header: setIsOpen(false)
        Header->>Header: ページ遷移
    else ユーザーがオーバーレイクリック
        User->>Overlay: 背景クリック
        Overlay->>Header: setIsOpen(false)
    else ユーザーが×ボタンクリック
        User->>SideMenu: 閉じるボタンクリック
        SideMenu->>Header: setIsOpen(false)
    end
    
    Header->>SideMenu: transform: translateX(full)
    Header->>Overlay: オーバーレイ非表示
```

## 7. 店舗表示の動的制御

**Header 店舗表示制御フロー**
1. Header レンダリング → selectedStore 存在チェック
2. selectedStore 存在状態による分岐：
   - 存在しない: 店舗表示なし
   - 存在する: isStoreSelectionPage チェック
     - 店舗選択ページ: 店舗表示なし
     - その他: 店舗表示あり
3. 店舗表示時の画面サイズ対応：
   - デスクトップ: フル店舗名表示 → アイコン + 店舗名
   - モバイル: 省略店舗名表示 → 最大20文字で truncate → アイコン + 店舗名

この制御により、適切なタイミングで店舗情報が表示されます。

## データ型とProps

**Header コンポーネントデータ構造**
- HeaderState: isOpen、pathname、selectedStore、isStoreSelectionPage の状態を管理
- MenuItem: href、label、icon フィールドを持つメニューアイテム
- Store: id、name フィールドを持つ店舗データ

HeaderState は Store を表示し、MenuItem を管理します。

## useEffect によるクリーンアップ

```mermaid
sequenceDiagram
    participant Header as Header
    participant Effect1 as useEffect(スクロール制御)
    participant Effect2 as useEffect(キーボード)
    participant DOM as DOM

    Header->>Effect1: isOpen 変更監視
    Effect1->>DOM: body.style.overflow 設定
    Effect1->>Effect1: クリーンアップ関数登録
    
    Header->>Effect2: isOpen 変更監視
    Effect2->>DOM: keydown イベントリスナー追加
    Effect2->>Effect2: クリーンアップ関数登録
    
    Note over Header: "コンポーネントアンマウント時"
    Effect1->>DOM: body.style.overflow = 'unset'
    Effect2->>DOM: removeEventListener('keydown')
```

## 特徴

### 1. レスポンシブデザイン
- デスクトップ/モバイル自動切り替え
- 柔軟なレイアウト調整

### 2. アクセシビリティ
- キーボードナビゲーション対応
- aria-label 適切な設定
- フォーカス管理

### 3. UX最適化
- スムーズなアニメーション
- 直感的な操作性
- 視覚的フィードバック

### 4. 状態管理
- モバイルメニューの開閉状態
- 店舗選択状態の表示
- ページ状態に応じた表示制御

### 5. パフォーマンス
- 効率的な再レンダリング
- イベントリスナーの適切な管理
- CSS transform によるスムーズなアニメーション

## 使用パターン

### Layout での統合
```typescript
export default function Layout({ children }) {
  return (
    <div>
      <Header />
      <main>{children}</main>
    </div>
  );
}
```

### 条件付き表示
- 店舗選択ページでは簡素化表示
- 通常ページでは完全なナビゲーション