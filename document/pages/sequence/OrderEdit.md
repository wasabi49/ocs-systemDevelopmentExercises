# 注文編集ページのシーケンス図

```mermaid
sequenceDiagram
    participant User
    participant Component as OrderEditPage
    participant Router
    participant CustomerActions as customerActions
    participant OrderActions as orderActions
    participant Validation
    participant Dropdown as CustomerDropdown
    participant Logger

    User->>Component: ページアクセス
    Component->>Router: useParams()で注文IDを取得
    Router-->>Component: orderId

    Component->>Component: useEffect(データ取得)
    par 並行データ取得
        Component->>OrderActions: fetchOrderById(orderId)
        OrderActions-->>Component: 注文データ
    and
        Component->>CustomerActions: fetchAllCustomers()
        CustomerActions-->>Component: 顧客リスト
    end

    Component->>Component: フォーム状態を初期化
    Component->>Component: 注文明細を編集可能形式に変換

    Note over Component: "フォーム編集操作"
    User->>Component: 商品明細を編集
    Component->>Component: handleOrderDetailChange(index, field, value)
    Component->>Component: リアルタイムバリデーション

    User->>Component: 単価フィールドからフォーカス離脱
    Component->>Component: handleUnitPriceBlur()
    Component->>Component: parseJPYString → 数値変換・フォーマット

    User->>Component: 商品行追加ボタン
    Component->>Component: handleAddOrderDetail()
    alt 最大商品数チェック
        Component->>Component: MAX_PRODUCTS(20)チェック
        Component->>Component: エラーモーダル表示
    else 追加可能
        Component->>Component: 新しいOrderDetailEdit追加
    end

    User->>Component: 商品行削除ボタン
    Component->>Component: handleRemoveOrderDetail(index)
    alt 最小商品数チェック
        Component->>Component: 最低1つ必要チェック
        Component->>Component: エラーモーダル表示
    else 削除可能
        Component->>Component: DeleteConfirmModal表示
        User->>Component: 削除確認
        Component->>Component: handleConfirmDelete()
    end

    Note over Component: "顧客選択"
    User->>Component: 顧客検索フィールド入力
    Component->>Component: handleCustomerSearchChange()
    Component->>Component: setShowCustomerDropdown(true)
    Component->>Dropdown: CustomerDropdown表示
    User->>Dropdown: 顧客選択
    Dropdown->>Component: handleSelectCustomer(customer)
    Component->>Component: 選択顧客を状態に設定

    Note over Component: "注文更新"
    User->>Component: 「注文を更新」ボタンクリック
    Component->>Validation: validateOrderData()
    Validation-->>Component: バリデーション結果
    alt バリデーション失敗
        Component->>Component: setErrorModal(入力エラー)
    else バリデーション成功
        Component->>Component: startUpdateTransition開始
        Component->>Component: OrderUpdateRequestデータ作成
        Component->>OrderActions: updateOrder(orderId, updateData)
        OrderActions-->>Component: 更新結果
        alt 更新成功
            Component->>Component: setSuccessModal(true)
        else 更新失敗
            Component->>Logger: logger.error('注文更新エラー')
            Component->>Component: setErrorModal(更新エラー)
        end
    end

    User->>Component: 成功モーダルのOK
    Component->>Router: router.push('/Home/OrderList')
```

## 概要

注文編集ページ (`mbs/app/Home/OrderList/[id]/Edit/page.tsx`) は、既存注文のすべての情報を編集可能な高機能フォームコンポーネントです。

## 主要機能

### 1. 包括的な注文編集
- **注文基本情報**: 注文日、顧客、ステータス、備考
- **注文明細**: 商品名、数量、単価、摘要の完全編集
- **動的行操作**: 最大20行まで追加・削除可能

### 2. 高度な顧客選択システム
- **リアルタイム検索**: 顧客名・担当者名での絞り込み
- **ドロップダウンUI**: クリック外し検知による自動クローズ
- **選択状態管理**: 検索文字列変更時の選択クリア

### 3. インテリジェントな入力制御
- **通貨フォーマット**: 入力中は生文字列、フォーカス離脱時に数値変換
- **バリデーション**: リアルタイム検証とエラー表示
- **データ型変換**: parseJPYStringによる柔軟な金額入力

### 4. 納品状況の保持
- **既存データ保護**: 編集中も納品ステータスを表示
- **getDeliveryInfo**: IDベースの納品状況シミュレーション

### 5. 高度なUX設計
- **レスポンシブ**: モバイル・デスクトップ完全対応
- **プログレッシブ強化**: バリデーション結果に応じたボタン状態
- **エラーフィードバック**: 詳細なエラーメッセージとガイダンス

## 技術的特徴

### 1. 状態管理の最適化
- **useCallback**: イベントハンドラーの最適化
- **useMemo**: バリデーション結果・合計金額の計算最適化
- **useTransition**: 更新処理の非同期状態管理

### 2. 型安全な編集システム
```typescript
interface OrderDetailEdit {
  id: string;
  productName: string;
  unitPrice: number | string; // 入力中は文字列、表示時は数値
  quantity: number | '';
  description: string;
  deliveryStatus?: string;
}
```

### 3. バリデーション統合
```typescript
const validateOrderData = (orderDetails: OrderDetailEdit[], orderDate: string, customerId: string): ValidationResult
```

### 4. 差分更新システム
- 変更検知によるAPI最適化
- 元データとの比較表示

## 使用技術

- **Next.js**: App Router、Client Component
- **React Hooks**: useState、useEffect、useTransition、useCallback、useMemo
- **Server Actions**: fetchOrderById、fetchAllCustomers、updateOrder
- **カスタムフック**: なし（直接実装）
- **ログ**: @/lib/logger
- **UI**: TailwindCSS、レスポンシブグリッドシステム

## エラーハンドリング

1. **バリデーションエラー**: リアルタイム検証と詳細メッセージ
2. **API エラー**: 更新失敗時の適切なフィードバック
3. **データ不整合**: 存在しない注文IDへの対応

## 定数・制約

- **MAX_PRODUCTS**: 20（最大商品数）
- **最小商品数**: 1（削除制限）
- **必須項目**: 商品名または摘要（いずれか必須）

## ファイルパス
`mbs/app/Home/OrderList/[id]/Edit/page.tsx`