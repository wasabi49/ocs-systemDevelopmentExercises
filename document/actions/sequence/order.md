# orderActions.ts - シーケンス図

## 概要
注文管理に関するServer Actionsの処理フローを示すシーケンス図です。

## 1. 注文一覧取得 (fetchOrders)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchOrders
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: fetchOrders()
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { status: 'store_required' }
    else storeId が存在する
        Action->>DB: store.findUnique(storeId)
        DB-->>Action: store
        
        alt store が存在しない
            Action-->>Client: { status: 'store_invalid' }
        else store が存在する
            Action->>DB: order.findMany(include: customer)
            DB-->>Action: orders
            Action-->>Client: { status: 'success', data: orders }
        end
    end
```

## 2. 注文ID別取得 (fetchOrderById)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchOrderById
    participant DB as Prisma Database

    Client->>Action: fetchOrderById(id)
    Action->>DB: order.findFirst(id, include: customer, orderDetails)
    DB-->>Action: order
    
    alt order が存在しない
        Action-->>Client: { success: false, error: '注文が見つかりませんでした' }
    else order.customer が削除済み
        Action-->>Client: { success: false, error: '関連する顧客データが削除されています' }
    else order が存在する
        Action-->>Client: { success: true, order: order }
    end
```

## 3. 注文作成 (createOrder)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as createOrder
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: createOrder(orderData)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { success: false, error: '店舗を選択してください' }
    else
        Action->>Action: 入力値検証
        
        alt 検証エラー
            Action-->>Client: { success: false, error: 'エラー詳細' }
        else 検証成功
            Action->>DB: customer.findFirst(customerId, storeId)
            DB-->>Action: customer
            
            alt customer が存在しない
                Action-->>Client: { success: false, error: '顧客が見つかりません' }
            else customer が存在する
                Action->>DB: order.findFirst(最新ID取得)
                DB-->>Action: lastOrder
                Action->>Action: 新しい注文ID生成 (OXXXXXXX)
                
                Action->>DB: $transaction開始
                Action->>DB: order.create()
                DB-->>Action: order
                
                loop 各注文明細
                    Action->>DB: orderDetail.create()
                end
                
                Action->>DB: $transaction完了
                DB-->>Action: 処理結果
                Action-->>Client: { success: true, data: result }
            end
        end
    end
```

## 4. 注文更新 (updateOrder)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as updateOrder
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: updateOrder(orderId, updateData)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { success: false, error: '店舗を選択してください' }
    else
        Action->>DB: order.findFirst(orderId, customer.storeId)
        DB-->>Action: existingOrder
        
        alt order が存在しない
            Action-->>Client: { success: false, error: '注文が見つかりません' }
        else
            Action->>DB: customer.findFirst(customerId, storeId)
            DB-->>Action: customer
            
            alt customer が存在しない
                Action-->>Client: { success: false, error: '顧客が見つかりません' }
            else
                Action->>DB: $transaction開始
                Action->>DB: order.update(注文情報)
                
                Action->>DB: orderDetail.updateMany(既存明細を削除)
                Action->>DB: orderDetail.findMany(既存ID取得)
                DB-->>Action: existingIds
                
                loop 新しい注文明細
                    Action->>Action: 重複しないID生成
                    Action->>DB: orderDetail.create()
                end
                
                Action->>DB: $transaction完了
                DB-->>Action: 処理結果
                Action-->>Client: { success: true, data: result }
            end
        end
    end
```

## 5. 注文削除 (deleteOrder)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as deleteOrder
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: deleteOrder(orderId)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { success: false, error: '店舗を選択してください' }
    else
        Action->>DB: order.findFirst(orderId, customer.storeId)
        DB-->>Action: order
        
        alt order が存在しない
            Action-->>Client: { success: false, error: '注文が見つかりません' }
        else
            Action->>DB: $transaction開始
            Action->>DB: orderDetail.updateMany(論理削除)
            Action->>DB: order.update(論理削除)
            Action->>DB: $transaction完了
            DB-->>Action: 処理結果
            Action-->>Client: { success: true, message: '注文が削除されました' }
        end
    end
```

## 6. useActionState用取得 (fetchOrdersAction)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchOrdersAction
    participant FetchAction as fetchOrders

    Client->>Action: fetchOrdersAction()
    Action->>FetchAction: fetchOrders()
    FetchAction-->>Action: result
    
    alt result.status === 'success'
        Action-->>Client: { loading: false, error: null, data: result.data }
    else
        Action-->>Client: { loading: false, error: result.error, data: [] }
    end
```

## 注文ID生成パターン

```mermaid
sequenceDiagram
    participant Action as createOrder
    participant DB as Prisma Database

    Action->>DB: order.findFirst(最新ID取得, startsWith: 'O')
    DB-->>Action: lastOrder
    
    alt lastOrder が存在しない
        Action->>Action: nextNumber = 1
    else lastOrder が存在する
        Action->>Action: numberPart = lastOrder.id.substring(1)
        Action->>Action: nextNumber = parseInt(numberPart) + 1
    end
    
    Action->>Action: orderId = 'O' + nextNumber.padStart(7, '0')
    Action-->>Action: orderId (例: O0000001)
```

## 注文明細ID生成パターン

```mermaid
sequenceDiagram
    participant Action as createOrder/updateOrder
    participant DB as Prisma Database

    loop 各注文明細
        Action->>Action: detailId = orderId + '-' + (index + 1).padStart(2, '0')
        Action->>DB: orderDetail.create(detailId)
    end
    
    Note over Action: 例: O0000001-01, O0000001-02, ...
```

## エラーハンドリング共通パターン

```mermaid
sequenceDiagram
    participant Action as Any Order Action
    participant Logger as logger
    participant DB as Prisma Database
    participant Client as クライアント

    Action->>DB: データベース操作
    
    alt 正常処理
        DB-->>Action: 成功レスポンス
        Action-->>Client: { success: true, data: result }
    else エラー発生
        DB-->>Action: エラー
        Action->>Logger: logger.error(エラー詳細)
        Action-->>Client: { success: false, error: 'エラーメッセージ' }
    end
```

## 共通処理パターン

### 店舗・権限チェック
1. `getStoreIdFromCookie()` で店舗ID取得
2. 店舗IDの存在チェック
3. 注文が指定店舗に属するかチェック

### データ検証
1. 入力データの基本検証（customerId、orderDetails等）
2. 関連データの存在チェック（customer、store）
3. 削除済みデータの除外

### トランザクション処理
1. 注文と注文明細の同時操作
2. 失敗時は全体ロールバック
3. 論理削除による安全なデータ管理