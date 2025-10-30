# Search.tsx - シーケンス図

## 概要
汎用検索コンポーネントの処理フローを示すシーケンス図です。

## 1. コンポーネント初期化

```mermaid
sequenceDiagram
    participant Parent as 親コンポーネント
    participant Search as Search
    participant Props as Props

    Parent->>Search: <Search keyword={keyword} onKeywordChange={handler} ... />
    Search->>Props: プロパティ受け取り
    Note over Props: "keyword, searchField, searchFieldOptions, etc."
    Search->>Search: デフォルト値設定
    Note over Search: "placeholder="検索キーワードを入力""
    Search-->>Parent: 検索UIコンポーネント
```

## 2. 検索キーワード入力処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Input as 検索入力欄
    participant Search as Search
    participant Parent as 親コンポーネント

    User->>Input: キーワード入力
    Input->>Search: onChange イベント
    Search->>Parent: onKeywordChange(e.target.value)
    Parent->>Parent: keyword 状態更新
    Parent->>Search: 新しい keyword プロパティ
    Search->>Input: value 更新
    Input-->>User: 入力内容反映
```

## 3. 検索フィールド選択処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Select as フィールド選択
    participant Search as Search
    participant Parent as 親コンポーネント

    User->>Select: 検索フィールド選択
    Select->>Search: onChange イベント
    Search->>Parent: onSearchFieldChange(e.target.value)
    Parent->>Parent: searchField 状態更新
    Parent->>Search: 新しい searchField プロパティ
    Search->>Select: value 更新
    Select-->>User: 選択内容反映
```

## 4. アクションボタン処理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Button as アクションボタン
    participant Search as Search
    participant Parent as 親コンポーネント

    alt actionButtonLabel && onActionButtonClick が存在
        Search->>Button: ボタン表示
        User->>Button: ボタンクリック
        Button->>Search: onClick イベント
        Search->>Parent: onActionButtonClick()
        Parent->>Parent: アクション実行（例：新規作成画面へ）
    else アクションボタンなし
        Search->>Search: ボタン非表示
    end
```

## 5. コンポーネントレイアウト構築

```mermaid
sequenceDiagram
    participant Search as Search
    participant Container as コンテナ
    participant ActionBtn as アクションボタン
    participant SelectField as フィールド選択
    participant InputField as 検索入力

    Search->>Container: flex-row レイアウト作成
    
    alt actionButtonLabel 存在
        Container->>ActionBtn: 緑色ボタン配置
        Note over ActionBtn: "flex-shrink-0, h-[48px]"
    end
    
    Container->>SelectField: セレクトボックス配置
    Note over SelectField: "w-24 sm:w-32, border-black"
    
    Container->>InputField: 検索入力欄配置
    Note over InputField: "flex-1, 検索アイコン付き"
    
    Container-->>Search: 完成したレイアウト
```

## 6. レスポンシブ対応

**Search コンポーネントレスポンシブ設計**
1. Search コンポーネント → レスポンシブクラス適用
2. アクションボタン: px-3 sm:px-4、text-xs sm:text-sm
3. フィールド選択: w-24 sm:w-32、text-xs sm:text-sm
4. 検索入力: text-xs sm:text-sm、アイコン h-4 w-4 sm:h-5 sm:w-5

これらのクラスにより、モバイルからデスクトップまで適切に表示されます。

## データ型とProps

**Search コンポーネントデータ構造**
- SearchProps: keyword、onKeywordChange、searchField、onSearchFieldChange、searchFieldOptions とオプションプロパティ（placeholder、actionButtonLabel、onActionButtonClick、actionButtonDisabled）
- SearchFieldOption: value、label フィールドを持つ検索フィールドオプション

SearchProps は SearchFieldOption の配列を含み、柔軟な検索機能を実現します。

## 検索フィールドオプションの処理

```mermaid
sequenceDiagram
    participant Search as Search
    participant Options as searchFieldOptions
    participant Select as Select Element

    Search->>Options: searchFieldOptions 配列取得
    
    loop 各オプションに対して
        Options->>Select: <option key={option.value} value={option.value}>
        Select->>Select: {option.label} 表示テキスト設定
    end
    
    Select-->>Search: 完成したセレクトボックス
```

## 状態とイベントフロー

```mermaid
sequenceDiagram
    participant Parent as 親コンポーネント
    participant Search as Search
    participant User as ユーザー

    Note over Parent: "初期状態設定"
    Parent->>Search: keyword="", searchField="all"
    
    User->>Search: フィールド選択変更
    Search->>Parent: onSearchFieldChange("customerName")
    Parent->>Parent: searchField 更新
    
    User->>Search: キーワード入力
    Search->>Parent: onKeywordChange("田中")
    Parent->>Parent: keyword 更新
    
    Parent->>Parent: フィルタリング実行
    Note over Parent: "useFilteredOrders などのフック使用"
    
    Parent->>Parent: 検索結果表示更新
```

## アクセシビリティ対応

```mermaid
sequenceDiagram
    participant Search as Search
    participant Input as 検索入力
    participant Button as ボタン
    participant Select as セレクト

    Search->>Input: aria-label="検索フィールド" 設定
    Search->>Button: type="button" 設定
    Search->>Button: disabled 属性で状態管理
    
    Note over Input: "focus:border-orange-500"
    Note over Input: "focus:outline-none"
    
    Search->>Select: 適切な onChange ハンドラー
    Search->>Input: 適切な onChange ハンドラー
```

## 使用例とパターン

### 基本的な検索
```typescript
const [keyword, setKeyword] = useState('');
const [field, setField] = useState('all');

const searchFieldOptions = [
  { value: 'all', label: 'すべて' },
  { value: 'customerName', label: '顧客名' },
  { value: 'id', label: 'ID' },
];

<Search
  keyword={keyword}
  onKeywordChange={setKeyword}
  searchField={field}
  onSearchFieldChange={setField}
  searchFieldOptions={searchFieldOptions}
/>
```

### アクションボタン付き
```typescript
<Search
  keyword={keyword}
  onKeywordChange={setKeyword}
  searchField={field}
  onSearchFieldChange={setField}
  searchFieldOptions={options}
  actionButtonLabel="注文追加"
  onActionButtonClick={() => router.push('/orders/add')}
  actionButtonDisabled={loading}
/>
```

## 特徴

### 1. 汎用性
- 任意の検索フィールドに対応
- カスタマイズ可能なオプション

### 2. レスポンシブデザイン
- モバイル/デスクトップ対応
- 適応的なサイズ調整

### 3. UX最適化
- 検索アイコンによる視覚的ガイド
- 直感的なレイアウト

### 4. 統合性
- 他のフィルタリングフックとの連携
- 状態管理の外部化

### 5. アクセシビリティ
- キーボードナビゲーション
- スクリーンリーダー対応
- 適切なフォーカス管理