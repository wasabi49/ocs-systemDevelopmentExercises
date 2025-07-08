# 注文追加ページのシーケンス図

```mermaid
sequenceDiagram
    participant User
    participant Component as OrderCreatePage
    participant Store as StoreContext
    participant CustomerActions as customerActions
    participant OrderActions as orderActions
    participant Validation
    participant Dropdown as CustomerDropdown
    participant Modal as SuccessModal
    participant Logger

    User->>Component: ページアクセス
    Component->>Store: useStore()で店舗情報取得
    Store-->>Component: selectedStore

    Component->>Component: useEffect(顧客データ取得)
    Component->>CustomerActions: fetchAllCustomers()
    CustomerActions-->>Component: 顧客リスト
    Component->>Component: setCustomers(customerData)

    Component->>Component: 初期フォーム状態設定
    Note over Component: 初期状態: 1行の空明細

    Note over Component: 商品明細編集
    User->>Component: 商品情報入力
    Component->>Component: handleEditOrderDetail(index, field, value)
    Component->>Component: リアルタイム状態更新

    User->>Component: 単価入力完了（onBlur）
    Component->>Component: parseJPYString(value)
    Component->>Component: 数値変換＆フォーマット適用

    User->>Component: 行追加ボタンクリック
    Component->>Component: handleAddOrderDetail()
    alt 最大行数チェック
        Component->>Component: MAX_PRODUCTS(20)チェック
        Component->>Component: setErrorModal(商品追加エラー)
    else 追加可能
        Component->>Component: generateTempOrderDetailId()
        Component->>Component: 新しいOrderDetailCreate追加
    end

    User->>Component: 行削除ボタンクリック
    Component->>Component: handleDeleteOrderDetail(index)
    alt 最小行数チェック
        Component->>Component: 最低1つ必要チェック
        Component->>Component: setErrorModal(削除エラー)
    else 削除可能
        Component->>Component: DeleteConfirmModal表示
        User->>Component: 削除確認
        Component->>Component: handleConfirmDelete()
    end

    Note over Component: 顧客選択システム
    User->>Component: 顧客検索入力
    Component->>Component: handleCustomerSearchChange()
    Component->>Component: filteredCustomersを動的更新
    Component->>Dropdown: CustomerDropdown表示
    User->>Dropdown: 顧客選択
    Dropdown->>Component: handleSelectCustomer(customer)
    Component->>Component: 選択顧客を状態に設定

    Note over Component: 注文作成処理
    User->>Component: 「注文を追加」ボタンクリック
    Component->>Validation: validateOrderData()
    Validation-->>Component: バリデーション結果
    
    alt バリデーション失敗
        Component->>Component: handleShowValidationErrors()
        Component->>Component: setErrorModal(入力エラー)
    else バリデーション成功
        Component->>Component: setIsSubmitting(true)
        Component->>Component: OrderDetailCreateからAPI型に変換
        Component->>Logger: logger.info('送信する注文データ')
        Component->>OrderActions: createOrder(apiData)
        OrderActions-->>Component: 作成結果
        
        alt 作成成功
            Component->>Logger: logger.info('注文が正常に作成されました')
            Component->>Component: successOrderDataを設定
            Component->>Component: フォームリセット
            Component->>Modal: SuccessModal表示
        else 作成失敗
            Component->>Logger: logger.error('注文作成中にエラーが発生')
            Component->>Component: setErrorModal(注文追加エラー)
        end
        Component->>Component: setIsSubmitting(false)
    end

    User->>Modal: 成功モーダルのOK
    Modal->>Component: handleCloseSuccessModal()
    Component->>Component: router.push('/Home/OrderList')
```

## 概要

注文追加ページ (`mbs/app/Home/OrderList/Add/page.tsx`) は、新しい注文を作成するための包括的なフォームコンポーネントです。店舗コンテキストと連携し、直感的な注文作成体験を提供します。

## 主要機能

### 1. 店舗連携システム
- **StoreContext統合**: 現在選択中の店舗情報を表示
- **店舗フィルタリング**: 選択店舗の顧客のみ表示
- **視覚的フィードバック**: 店舗情報バナーで現在状態を明示

### 2. 動的商品明細管理
- **動的行操作**: 1〜20行まで自由に追加・削除
- **テンポラリID**: TEMP-XX形式での一時的ID管理
- **リアルタイム計算**: 合計金額の自動更新

### 3. 高度な顧客選択システム
- **リアルタイム検索**: 顧客名・担当者名での瞬時フィルタリング
- **useMemo最適化**: 検索パフォーマンスの向上
- **ドロップダウンUI**: クリック外し検知による直感的操作

### 4. インテリジェントな入力制御
- **通貨入力**: 入力中は自由文字列、確定時に数値変換
- **バリデーション**: リアルタイム検証とエラー表示
- **必須項目制御**: 商品名または摘要いずれか必須

### 5. 成功体験の向上
- **成功モーダル**: 作成された注文の詳細表示
- **フォームリセット**: 成功後の自動クリア
- **シームレス遷移**: 注文一覧への自動遷移

## 技術的特徴

### 1. パフォーマンス最適化
```typescript
const filteredCustomers = useMemo(() => {
  return customers.filter(c => 
    c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    (c.contactPerson || '').toLowerCase().includes(customerSearchTerm.toLowerCase())
  );
}, [customerSearchTerm, customers]);
```

### 2. リアルタイムバリデーション
```typescript
const validationResult = useMemo(() => {
  return validateOrderData(orderData);
}, [orderDetails, orderDate, selectedCustomer, note]);
```

### 3. 型安全なデータ変換
```typescript
interface OrderDetailCreate {
  id: string; // TEMP-XX形式
  productName: string;
  unitPrice: number | string; // 入力中は文字列
  quantity: number | '';
  description: string;
}
```

### 4. API統合の最適化
- **実際のServer Action**: createOrderとの統合
- **エラー処理**: 詳細なエラーログとユーザーフィードバック
- **データ変換**: フォーム状態からAPI形式への変換

## 使用技術

- **Next.js**: App Router、Client Component
- **React Hooks**: useState、useEffect、useCallback、useMemo
- **Context API**: StoreContextとの連携
- **Server Actions**: fetchAllCustomers、createOrder
- **ログ**: @/lib/loggerによる詳細ログ
- **UI**: TailwindCSS、レスポンシブデザイン

## バリデーション規則

1. **商品明細**: 最低1つ、最大20個
2. **必須項目**: 商品名または摘要（いずれか必須）
3. **顧客選択**: 必須
4. **注文日**: 必須

## エラーハンドリング

1. **入力エラー**: リアルタイムバリデーションと詳細メッセージ
2. **API エラー**: 作成失敗時の適切なフィードバック
3. **ネットワークエラー**: 予期しないエラーへの対応

## ユーティリティ関数

- **formatJPY**: 金額フォーマット
- **parseJPYString**: 文字列から数値変換
- **generateTempOrderDetailId**: 一時ID生成
- **validateOrderData**: 包括的バリデーション

## ファイルパス
`mbs/app/Home/OrderList/Add/page.tsx`