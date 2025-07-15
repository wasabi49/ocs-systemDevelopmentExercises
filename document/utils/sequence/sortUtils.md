# sortUtils.tsx - シーケンス図

## 概要
汎用的なソート機能に関するユーティリティ関数とコンポーネントの処理フローを示すシーケンス図です。

## 1. ソート実行 (sortItems)

```mermaid
sequenceDiagram
    participant Component as テーブルコンポーネント
    participant SortUtils as sortItems
    participant State as setSortConfig

    Component->>SortUtils: sortItems(items, field, sortConfig, setSortConfig)
    SortUtils->>SortUtils: ソート方向決定
    
    alt 同じフィールド & 昇順
        SortUtils->>SortUtils: direction = 'desc'
    else その他
        SortUtils->>SortUtils: direction = 'asc'
    end
    
    SortUtils->>SortUtils: 配列をコピー
    SortUtils->>SortUtils: ソート処理実行
    
    loop 各要素ペア比較
        SortUtils->>SortUtils: aValue, bValue 取得
        
        alt Date オブジェクト
            SortUtils->>SortUtils: Date 比較処理
        else 文字列
            SortUtils->>SortUtils: 文字列比較処理
        end
    end
    
    SortUtils->>State: setSortConfig({ key: field, direction })
    SortUtils-->>Component: ソート済み配列
```

## 2. ソートアイコン表示 (SortIcon)

```mermaid
sequenceDiagram
    participant TableHeader as テーブルヘッダー
    participant SortIcon as SortIcon コンポーネント
    participant Lucide as lucide-react

    TableHeader->>SortIcon: SortIcon({ field, sortConfig })
    SortIcon->>SortIcon: isActive = sortConfig?.key === field
    SortIcon->>SortIcon: direction = sortConfig?.direction
    
    SortIcon->>Lucide: ChevronUp({ className })
    Note over SortIcon,Lucide: "active && direction === 'asc' ? 'text-gray-800' : 'text-gray-400'"
    
    SortIcon->>Lucide: ChevronDown({ className })
    Note over SortIcon,Lucide: "active && direction === 'desc' ? 'text-gray-800' : 'text-gray-400'"
    
    SortIcon-->>TableHeader: ソートアイコン JSX
```

## 3. 日付ソートの詳細処理

```mermaid
sequenceDiagram
    participant SortUtils as sortItems
    participant DateCheck as Date判定
    participant DateSort as Date比較

    SortUtils->>DateCheck: aValue instanceof Date || bValue instanceof Date
    
    alt どちらかがDate型
        DateCheck->>DateSort: Date変換処理
        
        alt aValue が Date型
            DateSort->>DateSort: aDate = aValue
        else aValue が Date型でない
            DateSort->>DateSort: aDate = new Date(aValue as string)
        end
        
        alt bValue が Date型
            DateSort->>DateSort: bDate = bValue
        else bValue が Date型でない
            DateSort->>DateSort: bDate = new Date(bValue as string)
        end
        
        DateSort->>DateSort: getTime() で数値比較
        DateSort-->>SortUtils: 比較結果 (-1, 0, 1)
    else 文字列として処理
        SortUtils->>SortUtils: String(aValue || '') で比較
        SortUtils-->>SortUtils: 比較結果
    end
```

## 4. ソート方向の決定ロジック

**sortItems ソート方向決定フロー**
1. sortItems 呼び出し → 現在のソート設定確認
2. ソート設定状態による方向決定：
   - sortConfig が null: direction = 'asc'
   - 異なるフィールド: direction = 'asc'
   - 同じフィールド & asc: direction = 'desc'
   - 同じフィールド & desc: direction = 'asc'
3. ソート実行：
   - 昇順 (direction = 'asc'): 昇順ソート実行
   - 降順 (direction = 'desc'): 降順ソート実行
4. ソート設定更新 → ソート済み配列返却

このロジックにより、直感的なソート操作が可能です。

## 5. 型安全なソート処理

**ソートユーティリティデータ構造**
- SortConfig<T>: key（keyof T）、direction フィールドでソート設定を管理
- SortIconProps<T>: field（keyof T）、sortConfig プロパティでソートアイコンを制御
- SortItemsFunction<T>: items、field、sortConfig、setSortConfig パラメータでソート機能を提供し、T[] を返却

SortIconProps と SortItemsFunction は SortConfig を参照し、型安全なソート機能を実現します。

## 6. コンポーネント統合使用例

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Header as テーブルヘッダー
    participant SortIcon as SortIcon
    participant SortUtils as sortItems
    participant Table as テーブル表示

    User->>Header: ヘッダークリック
    Header->>SortUtils: sortItems(data, 'customerName', sortConfig, setSortConfig)
    SortUtils->>SortUtils: ソート処理実行
    SortUtils-->>Header: ソート済みデータ
    
    Header->>Table: 状態更新でテーブル再描画
    Table->>SortIcon: SortIcon({ field: 'customerName', sortConfig })
    SortIcon-->>Table: 更新されたソートアイコン
    
    Table-->>User: ソート済みテーブル表示
```

## 使用例

### 基本的なテーブルソート
```typescript
const [sortConfig, setSortConfig] = useState<SortConfig<Customer> | null>(null);
const [customers, setCustomers] = useState<Customer[]>(initialData);

const handleSort = (field: keyof Customer) => {
  const sorted = sortItems(customers, field, sortConfig, setSortConfig);
  setCustomers(sorted);
};

// テーブルヘッダー
<th onClick={() => handleSort('name')}>
  顧客名
  <SortIcon field="name" sortConfig={sortConfig} />
</th>
```

### 日付フィールドのソート
```typescript
// Date型、文字列型の両方に対応
const handleDateSort = () => {
  const sorted = sortItems(orders, 'orderDate', sortConfig, setSortConfig);
  setOrders(sorted);
};
```

## 特徴

### 1. 型安全性
- ジェネリクスによる型推論
- フィールド名のタイプセーフティ

### 2. 柔軟性
- Date型と文字列型の自動判別
- カスタム比較ロジック

### 3. UI統合
- ソートアイコンコンポーネント
- 視覚的なフィードバック

### 4. 状態管理
- React state との統合
- ソート設定の永続化

### 5. パフォーマンス
- 元配列の変更を避ける（コピー作成）
- 効率的な比較処理