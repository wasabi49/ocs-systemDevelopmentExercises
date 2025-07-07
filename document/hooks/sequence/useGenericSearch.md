# useGenericSearch.ts - シーケンス図

## 概要
汎用的な検索機能を提供するカスタムフックの処理フローを示すシーケンス図です。

## 1. useGenericSearch フック

```mermaid
sequenceDiagram
    participant Component as コンポーネント
    participant Hook as useGenericSearch
    participant UseMemo as useMemo

    Component->>Hook: useGenericSearch(items, searchTerm, searchFields, caseSensitive?)
    Hook->>UseMemo: useMemo(() => {...}, [items, searchTerm, searchFields, caseSensitive])
    UseMemo->>UseMemo: 依存関係チェック
    
    alt 依存関係に変更あり
        UseMemo->>Hook: 検索処理実行
    else 依存関係に変更なし
        UseMemo->>Hook: キャッシュされた結果返却
    end
    
    Hook-->>Component: フィルタリング済み配列
```

## 2. 検索前処理とキーワード正規化

```mermaid
sequenceDiagram
    participant Hook as useGenericSearch
    participant Preprocessing as 前処理

    Hook->>Preprocessing: searchTerm.trim() チェック
    
    alt searchTerm が空
        Preprocessing-->>Hook: items (元の配列)
    else searchTerm が存在
        Preprocessing->>Preprocessing: キーワード正規化
        
        alt caseSensitive === true
            Preprocessing->>Preprocessing: keyword = searchTerm
        else caseSensitive === false (デフォルト)
            Preprocessing->>Preprocessing: keyword = searchTerm.toLowerCase()
        end
        
        Preprocessing-->>Hook: 正規化済みキーワード
    end
```

## 3. 全フィールド検索 (searchFields === 'all')

```mermaid
sequenceDiagram
    participant Hook as useGenericSearch
    participant AllFields as 全フィールド検索
    participant Item as アイテム

    Hook->>AllFields: searchFields === 'all'
    
    loop 各アイテムに対して
        AllFields->>Item: Object.values(item)
        Item-->>AllFields: 全プロパティ値の配列
        
        loop 各プロパティ値
            AllFields->>AllFields: value != null チェック
            
            alt value が null/undefined
                AllFields->>AllFields: スキップ
            else value が存在
                AllFields->>AllFields: 文字列変換と正規化
                
                alt caseSensitive === true
                    AllFields->>AllFields: stringValue = String(value)
                else caseSensitive === false
                    AllFields->>AllFields: stringValue = String(value).toLowerCase()
                end
                
                AllFields->>AllFields: stringValue.includes(keyword)
                
                alt マッチした
                    AllFields-->>Hook: true (アイテムを結果に含める)
                end
            end
        end
    end
```

## 4. 指定フィールド検索

```mermaid
sequenceDiagram
    participant Hook as useGenericSearch
    participant FieldSearch as 指定フィールド検索
    participant Item as アイテム

    Hook->>FieldSearch: searchFields が配列
    
    loop 各アイテムに対して
        FieldSearch->>FieldSearch: searchFields.some() 実行
        
        loop 各指定フィールド
            FieldSearch->>Item: item[field] 取得
            Item-->>FieldSearch: フィールド値
            
            FieldSearch->>FieldSearch: value != null チェック
            
            alt value が null/undefined
                FieldSearch->>FieldSearch: false 返却
            else value が存在
                FieldSearch->>FieldSearch: 文字列変換と正規化
                
                alt caseSensitive === true
                    FieldSearch->>FieldSearch: stringValue = String(value)
                else caseSensitive === false
                    FieldSearch->>FieldSearch: stringValue = String(value).toLowerCase()
                end
                
                FieldSearch->>FieldSearch: stringValue.includes(keyword)
                
                alt マッチした
                    FieldSearch-->>Hook: true (アイテムを結果に含める)
                end
            end
        end
    end
```

## 5. useSimpleSearch フック

```mermaid
sequenceDiagram
    participant Component as コンポーネント
    participant SimpleHook as useSimpleSearch
    participant GenericHook as useGenericSearch

    Component->>SimpleHook: useSimpleSearch(items, searchTerm, searchField, caseSensitive?)
    SimpleHook->>GenericHook: useGenericSearch(items, searchTerm, [searchField], caseSensitive)
    GenericHook-->>SimpleHook: フィルタリング結果
    SimpleHook-->>Component: フィルタリング結果
```

## 6. 大文字小文字の処理比較

```mermaid
flowchart TD
    A[検索実行] --> B{caseSensitive?}
    B -->|true| C[元の文字列で比較]
    B -->|false| D[toLowerCase() で正規化]
    
    C --> E[keyword = searchTerm]
    D --> F[keyword = searchTerm.toLowerCase()]
    
    E --> G[String(value).includes(keyword)]
    F --> H[String(value).toLowerCase().includes(keyword)]
    
    G --> I[大文字小文字を区別した検索]
    H --> J[大文字小文字を区別しない検索]
    
    style A fill:#e1f5fe
    style I fill:#c8e6c9
    style J fill:#c8e6c9
```

## データ型とジェネリクス

```mermaid
classDiagram
    class useGenericSearch~T~ {
        +T[] items
        +string searchTerm
        +keyof T[] | 'all' searchFields
        +boolean caseSensitive
        +T[] return
    }
    
    class useSimpleSearch~T~ {
        +T[] items
        +string searchTerm
        +keyof T searchField
        +boolean caseSensitive
        +T[] return
    }
    
    useSimpleSearch --> useGenericSearch : delegates to
```

## 使用例

### 全フィールド検索
```typescript
function ProductSearch() {
  const [products] = useState(productData);
  const [query, setQuery] = useState('');
  
  const searchResults = useGenericSearch(
    products,
    query,
    'all', // 全フィールドを検索
    false  // 大文字小文字を区別しない
  );
  
  return (
    <div>
      <SearchInput value={query} onChange={setQuery} />
      <ProductList products={searchResults} />
    </div>
  );
}
```

### 特定フィールド検索
```typescript
function CustomerSearch() {
  const [customers] = useState(customerData);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCustomers = useGenericSearch(
    customers,
    searchTerm,
    ['name', 'email', 'phone'], // 特定フィールドのみ
    false
  );
  
  return <CustomerTable customers={filteredCustomers} />;
}
```

### 単一フィールド検索（シンプル版）
```typescript
function OrderIdSearch() {
  const [orders] = useState(orderData);
  const [orderId, setOrderId] = useState('');
  
  const matchingOrders = useSimpleSearch(
    orders,
    orderId,
    'id', // IDフィールドのみ
    true  // 大文字小文字を区別
  );
  
  return <OrderResults orders={matchingOrders} />;
}
```

### 大文字小文字を区別する検索
```typescript
function CodeSearch() {
  const [items] = useState(itemData);
  const [code, setCode] = useState('');
  
  const results = useGenericSearch(
    items,
    code,
    ['productCode', 'barcode'],
    true // 大文字小文字を区別する
  );
  
  return <ItemList items={results} />;
}
```

## フックの特徴

### 1. 汎用性
- 任意の型のオブジェクト配列に対応
- 型安全なフィールド指定

### 2. 柔軟な検索対象
- 全フィールド検索
- 特定フィールド群検索
- 単一フィールド検索

### 3. カスタマイズ可能
- 大文字小文字の区別設定
- 検索対象フィールドの動的指定

### 4. パフォーマンス最適化
- `useMemo` による結果キャッシュ
- 不要な再計算の防止

### 5. null安全性
- null/undefined値の適切な処理
- 型安全な値アクセス

## パフォーマンス考慮事項

### メモ化の効果
- 依存関係未変更時はO(1)
- データ変更時のみO(n×m)の計算

### 検索アルゴリズム
- 線形検索による実装
- 大量データでは検索インデックス推奨

### 文字列操作の最適化
- `toLowerCase()` の呼び出し最小化
- 不要な文字列変換の回避