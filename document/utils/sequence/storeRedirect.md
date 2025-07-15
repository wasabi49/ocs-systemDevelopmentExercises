# storeRedirect.ts - シーケンス図

## 概要
Server Actionの結果チェックとリダイレクトに関するユーティリティ関数の処理フローを示すシーケンス図です。

## 1. 店舗要件チェック (checkStoreRequirement)

```mermaid
sequenceDiagram
    participant ServerComp as Server Component
    participant Utils as checkStoreRequirement
    participant NextRedirect as next/navigation redirect

    ServerComp->>Utils: checkStoreRequirement(result, defaultRedirectPath?)
    Utils->>Utils: result.status チェック
    
    alt result.status === 'store_required'
        Utils->>NextRedirect: redirect('/stores')
        Note over NextRedirect: "デフォルトリダイレクト先"
        NextRedirect-->>Utils: リダイレクト実行
    else result.status === 'store_invalid'
        Utils->>NextRedirect: redirect('/stores')
        NextRedirect-->>Utils: リダイレクト実行
    else その他のstatus
        Utils-->>ServerComp: result (そのまま返却)
    end
```

## 2. カスタムリダイレクト先指定

```mermaid
sequenceDiagram
    participant ServerComp as Server Component
    participant Utils as checkStoreRequirement
    participant NextRedirect as next/navigation redirect

    ServerComp->>Utils: checkStoreRequirement(result, '/custom-path')
    Utils->>Utils: result.status チェック
    
    alt 店舗関連エラー
        Utils->>NextRedirect: redirect('/custom-path')
        Note over Utils,NextRedirect: "カスタムパス使用"
        NextRedirect-->>Utils: リダイレクト実行
    else 正常
        Utils-->>ServerComp: result
    end
```

## 3. エラーメッセージ定数の使用

**エラーメッセージ管理構造**
1. STORE_ERROR_MESSAGES 定数からエラーメッセージを取得：
   - STORE_REQUIRED: '店舗を選択してください'
   - STORE_INVALID: '選択された店舗が無効です'
2. アプリケーション全体で統一的なエラーメッセージを使用

この構造により、一貫したユーザー体験を提供します。

## 4. 関数の使用パターン

```mermaid
sequenceDiagram
    participant Page as Server Page
    participant Action as Server Action
    participant Utils as checkStoreRequirement

    Page->>Action: fetchCustomers()
    Action-->>Page: { status: 'store_required', error: '...' }
    
    Page->>Utils: checkStoreRequirement(result)
    Utils->>Utils: status チェック
    
    alt 店舗要件エラー
        Utils->>Utils: redirect('/stores') 実行
        Note over Page: "ページは描画されない（リダイレクト）"
    else 成功
        Utils-->>Page: result
        Note over Page: "通常の描画継続"
    end
```

## 5. 型安全性の確保

**リダイレクトユーティリティ結果型構造**
- GenericResult<T>: status とジェネリックな T 型を持つ基本結果型
- StoreRequiredResult: status = 'store_required'、error フィールドを持つ店舗選択要求結果
- StoreInvalidResult: status = 'store_invalid'、error フィールドを持つ店舗無効結果
- SuccessResult: status = 'success'、data フィールドを持つ成功結果

StoreRequiredResult、StoreInvalidResult、SuccessResult はすべて GenericResult を継承し、型安全な結果処理を実現します。

## 6. リダイレクト処理の詳細

```mermaid
sequenceDiagram
    participant Utils as checkStoreRequirement
    participant NextJS as Next.js Router
    participant Browser as ブラウザ

    Utils->>NextJS: redirect(path)
    NextJS->>Browser: HTTP 302 レスポンス
    Note over NextJS,Browser: "Location: /stores"
    Browser->>Browser: ページ遷移実行
    
    Note over Utils: "関数の実行はここで終了"
    Note over Utils: "後続のコードは実行されない"
```

## 使用例

### 基本的な使用方法
```typescript
// Server Component内で
const result = await fetchCustomers();
checkStoreRequirement(result); // 必要に応じてリダイレクト

// 結果を使用（リダイレクトされなかった場合のみ実行される）
return <CustomerList customers={result.data} />;
```

### カスタムリダイレクト先
```typescript
// 特定のページにリダイレクトしたい場合
const result = await fetchOrders();
checkStoreRequirement(result, '/dashboard');
```

### エラーメッセージの統一
```typescript
import { STORE_ERROR_MESSAGES } from '@/app/utils/storeRedirect';

// 一貫したエラーメッセージ
const errorMessage = STORE_ERROR_MESSAGES.STORE_REQUIRED;
```

## 利点

### 1. コードの簡素化
- Server Componentでの定型的なチェック処理を削減
- if文の繰り返しを防止

### 2. 一貫性の確保
- 全てのページで同じリダイレクト動作
- エラーメッセージの統一

### 3. 型安全性
- ジェネリクスによる型の保持
- TypeScriptでの型チェック

### 4. 保守性
- リダイレクト先の一元管理
- エラーメッセージの一元管理