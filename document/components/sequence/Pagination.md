# Pagination.tsx - シーケンス図

## 概要
汎用ページネーションコンポーネントの処理フローを示すシーケンス図です。

## 1. コンポーネント初期化

```mermaid
sequenceDiagram
    participant Parent as 親コンポーネント
    participant Pagination as Pagination
    participant Props as Props

    Parent->>Pagination: <Pagination currentPage={1} totalPages={10} onPageChange={handler} />
    Pagination->>Props: プロパティ受け取り
    Note over Props: "currentPage, totalPages, onPageChange, itemsInfo?, maxVisiblePages=5"
    Pagination->>Pagination: getPageNumbers() 実行
    Pagination-->>Parent: ページネーションUI
```

## 2. ページ番号配列生成 (getPageNumbers)

```mermaid
sequenceDiagram
    participant Pagination as Pagination
    participant GetPages as getPageNumbers
    participant Array as pages配列

    Pagination->>GetPages: getPageNumbers() 呼び出し
    GetPages->>GetPages: totalPages <= maxVisiblePages チェック
    
    alt totalPages <= maxVisiblePages
        GetPages->>Array: 1 から totalPages まで全て追加
        Note over Array: "[1, 2, 3, 4, 5]"
    else currentPage <= 3 (先頭付近)
        GetPages->>Array: 1 から maxVisiblePages まで追加
        Note over Array: "[1, 2, 3, 4, 5]"
    else currentPage >= totalPages - 2 (末尾付近)
        GetPages->>Array: (totalPages - maxVisiblePages + 1) から totalPages まで
        Note over Array: "[6, 7, 8, 9, 10]"
    else 中央位置
        GetPages->>Array: (currentPage - 2) から (currentPage + 2) まで
        Note over Array: "[3, 4, 5, 6, 7]"
    end
    
    GetPages-->>Pagination: pages配列
```

## 3. ページ変更処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Button as ページボタン
    participant Pagination as Pagination
    participant Parent as 親コンポーネント

    User->>Button: ページボタンクリック
    Button->>Pagination: handlePageChange(page)
    Pagination->>Pagination: ページ範囲チェック (1 <= page <= totalPages)
    
    alt 有効なページ番号
        Pagination->>Parent: onPageChange(page)
        Parent->>Parent: currentPage 状態更新
        Parent->>Pagination: 新しい currentPage プロパティ
        Pagination->>Pagination: UI更新
    else 無効なページ番号
        Pagination->>Pagination: 何もしない
    end
```

## 4. ナビゲーションボタン処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant NavBtn as ナビゲーションボタン
    participant Pagination as Pagination

    alt 最初のページボタン
        User->>NavBtn: 最初のページクリック
        NavBtn->>Pagination: handlePageChange(1)
    else 前のページボタン
        User->>NavBtn: 前のページクリック
        NavBtn->>Pagination: handlePageChange(currentPage - 1)
    else 次のページボタン
        User->>NavBtn: 次のページクリック
        NavBtn->>Pagination: handlePageChange(currentPage + 1)
    else 最後のページボタン
        User->>NavBtn: 最後のページクリック
        NavBtn->>Pagination: handlePageChange(totalPages)
    end
```

## 5. ボタン無効化制御

**Pagination ボタン無効化制御フロー**
1. ページネーションレンダリング → ボタン無効化判定
2. 現在ページチェック：
   - currentPage === 1: 最初・前ページボタン無効化 → disabled クラス適用
   - その他: 最初・前ページボタン有効 → 有効状態スタイル
3. 最終ページチェック：
   - currentPage === totalPages: 次・最後ページボタン無効化 → disabled クラス適用
   - その他: 次・最後ページボタン有効 → 有効状態スタイル
4. スタイル適用：
   - disabled: cursor-not-allowed, opacity-50
   - 有効: hover:bg-gray-100

この制御により、適切なユーザーインターフェースが提供されます。

## 6. アイテム情報表示

```mermaid
sequenceDiagram
    participant Pagination as Pagination
    participant ItemsInfo as itemsInfo
    participant Display as アイテム情報表示

    alt itemsInfo が存在する
        Pagination->>ItemsInfo: itemsInfo プロパティ確認
        ItemsInfo->>ItemsInfo: totalItems > 0 チェック
        
        alt totalItems > 0
            ItemsInfo->>Display: "{startIndex + 1}-{endIndex} / {totalItems}件"
            Note over Display: "例: "1-10 / 25件""
        else totalItems === 0
            ItemsInfo->>Display: "0件"
        end
        
        Display-->>Pagination: アイテム数表示
    else itemsInfo が存在しない
        Pagination->>Pagination: アイテム情報表示なし
    end
```

## 7. レスポンシブレイアウト

```mermaid
sequenceDiagram
    participant Pagination as Pagination
    participant Layout as レイアウト
    participant Mobile as モバイル表示
    participant Desktop as デスクトップ表示

    Pagination->>Layout: レスポンシブクラス適用
    
    Layout->>Mobile: モバイル時
    Note over Mobile: "flex-col, gap-2, text-xs, px-2 py-1"
    
    Layout->>Desktop: デスクトップ時 (sm:)
    Note over Desktop: "flex-row, gap-4, text-sm, px-3 py-2"
    
    Layout->>Layout: アイテム情報位置調整
    Note over Layout: "mb-2 sm:mb-0 (モバイル下マージン)"
```

## データ型とProps

**Pagination コンポーネントデータ構造**
- PaginationProps: currentPage、totalPages、onPageChange の必須プロパティと itemsInfo、maxVisiblePages のオプションプロパティ
- ItemsInfo: startIndex、endIndex、totalItems フィールドでアイテム情報を表現

PaginationProps は ItemsInfo を含み、詳細なページ情報を提供します。

## ページ番号生成ロジックの詳細

**getPageNumbers ロジックフロー**
1. getPageNumbers 開始 → totalPages と maxVisiblePages 比較
2. ページ表示ロジック：
   - totalPages <= maxVisiblePages: 全ページ表示 (1 to totalPages)
   - その他: currentPage 位置で分岐
     - currentPage <= 3: 先頭付近表示 (1 to maxVisiblePages)
     - currentPage >= totalPages - 2: 末尾付近表示 (totalPages-maxVisiblePages+1 to totalPages)
     - その他: 中央付近表示 (currentPage-2 to currentPage+2)
3. pages 配列返却

このロジックにより、常に適切な数のページボタンが表示されます。

## アクセシビリティ対応

```mermaid
sequenceDiagram
    participant Pagination as Pagination
    participant Button as ボタン要素
    participant AriaLabel as aria-label

    Pagination->>Button: ナビゲーションボタン生成
    Button->>AriaLabel: aria-label 設定
    
    Note over AriaLabel: "最初のページ"
    Note over AriaLabel: "前のページ"
    Note over AriaLabel: "次のページ"
    Note over AriaLabel: "最後のページ"
    
    Pagination->>Button: type="button" 設定
    Pagination->>Button: disabled 属性設定
    
    Button-->>Pagination: アクセシブルなボタン
```

## 使用例とパターン

### 基本的なページネーション
```typescript
const [currentPage, setCurrentPage] = useState(1);
const totalPages = Math.ceil(totalItems / itemsPerPage);

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
```

### アイテム情報付き
```typescript
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  itemsInfo={{
    startIndex,
    endIndex,
    totalItems
  }}
/>
```

### カスタム表示ページ数
```typescript
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  maxVisiblePages={7}
/>
```

## 特徴

### 1. 動的ページ表示
- 現在位置に応じたページ番号表示
- 大量ページでもコンパクトな表示

### 2. 完全なナビゲーション
- 最初/最後ページへのジャンプ
- 前/次ページへの移動
- 直接ページ指定

### 3. レスポンシブデザイン
- モバイル/デスクトップ対応
- 適応的なサイズとレイアウト

### 4. UX最適化
- ボタンの適切な無効化
- 現在ページの視覚的強調
- アイテム数情報の表示

### 5. アクセシビリティ
- キーボードナビゲーション対応
- スクリーンリーダー対応
- 適切なボタンラベル