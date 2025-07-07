# deliveryActions.ts - シーケンス図

## 概要
納品管理に関するServer Actionsの処理フローを示すシーケンス図です。

## 1. 納品一覧取得 (fetchDeliveries)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchDeliveries
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: fetchDeliveries()
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
            Action->>DB: delivery.findMany(include: customer)
            DB-->>Action: deliveries
            Action-->>Client: { status: 'success', data: deliveries }
        end
    end
```

## 2. 納品ID別取得 (fetchDeliveryById)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchDeliveryById
    participant DB as Prisma Database

    Client->>Action: fetchDeliveryById(id)
    Action->>DB: delivery.findFirst(id, include: customer, deliveryDetails)
    DB-->>Action: delivery
    
    alt delivery が存在しない
        Action-->>Client: { success: false, error: '納品が見つかりませんでした' }
    else delivery.customer が削除済み
        Action-->>Client: { success: false, error: '関連する顧客データが削除されています' }
    else delivery が存在する
        Action-->>Client: { success: true, delivery: delivery }
    end
```

## 3. 納品作成 (createDelivery)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as createDelivery
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: createDelivery(deliveryData, allocations)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { success: false, error: '店舗を選択してください' }
    else
        Action->>DB: customer.findUnique(customerId)
        DB-->>Action: customer
        
        alt customer が存在しない or 権限なし
            Action-->>Client: { success: false, error: 'アクセス権限がありません' }
        else allocations が空
            Action-->>Client: { success: false, error: '納品する商品を選択してください' }
        else
            Action->>Action: generateDeliveryId(storeId)
            Action->>Action: 合計金額・数量計算
            
            Action->>DB: $transaction開始
            Action->>DB: delivery.create()
            DB-->>Action: delivery
            
            loop 各割り当て
                Action->>Action: deliveryDetailId生成
                Action->>DB: deliveryDetail.create()
                Action->>DB: deliveryAllocation.create()
            end
            
            Action->>DB: $transaction完了
            DB-->>Action: 処理結果
            Action-->>Client: { success: true, deliveryId: result.id }
        end
    end
```

## 4. 納品割り当て更新 (updateDeliveryAllocations)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as updateDeliveryAllocations
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: updateDeliveryAllocations(deliveryId, allocations)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { success: false, error: '店舗を選択してください' }
    else
        Action->>DB: delivery.findUnique(deliveryId, include: customer)
        DB-->>Action: delivery
        
        alt delivery が存在しない or 権限なし
            Action-->>Client: { success: false, error: 'アクセス権限がありません' }
        else
            Action->>DB: $transaction開始
            
            loop 各割り当て
                Action->>DB: deliveryAllocation.findFirst(既存チェック)
                DB-->>Action: existingAllocation
                
                alt 既存割り当てあり
                    alt 数量が0
                        Action->>DB: deliveryAllocation.update(削除)
                        Action->>DB: deliveryDetail.update(削除)
                    else 数量変更
                        Action->>DB: deliveryAllocation.update(数量更新)
                        Action->>DB: deliveryDetail.update(商品情報更新)
                    end
                else 新規割り当て & 数量 > 0
                    Action->>Action: deliveryDetailId生成
                    Action->>DB: deliveryDetail.create()
                    Action->>DB: deliveryAllocation.create()
                end
            end
            
            Action->>DB: deliveryDetail.findMany(合計再計算)
            DB-->>Action: currentDetails
            Action->>DB: delivery.update(合計金額・数量更新)
            
            Action->>DB: $transaction完了
            DB-->>Action: 処理結果
            Action-->>Client: { success: true }
        end
    end
```

## 5. 未納品注文明細取得 (fetchUndeliveredOrderDetails)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchUndeliveredOrderDetails
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: fetchUndeliveredOrderDetails(customerId, deliveryId)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { success: false, error: '店舗を選択してください' }
    else
        Action->>DB: orderDetail.findMany(未完了注文, include: deliveryAllocations)
        DB-->>Action: orderDetails
        
        Action->>Action: 各注文明細の未納品数量を計算
        
        loop 各注文明細
            Action->>Action: 他の納品での割り当て数量計算
            Action->>Action: 現在の納品での割り当て数量計算
            Action->>Action: 残り数量計算
            
            alt 残り数量 > 0
                Action->>Action: enrichedOrderDetails.add()
            end
        end
        
        Action-->>Client: { success: true, orderDetails: enrichedOrderDetails }
    end
```

## 6. 編集用納品データ取得 (fetchDeliveryForEdit)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchDeliveryForEdit
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: fetchDeliveryForEdit(deliveryId)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { success: false, error: '店舗を選択してください' }
    else
        Action->>DB: delivery.findUnique(complex include)
        DB-->>Action: delivery
        
        alt delivery が存在しない or 権限なし
            Action-->>Client: { success: false, error: 'アクセス権限がありません' }
        else
            Action->>Action: フロントエンド用データ変換
            Action-->>Client: { success: true, delivery: serializedDelivery }
        end
    end
```

## 7. 納品削除 (deleteDelivery)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as deleteDelivery
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: deleteDelivery(deliveryId)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { success: false, error: '店舗を選択してください' }
    else
        Action->>DB: delivery.findUnique(include: customer, deliveryDetails)
        DB-->>Action: delivery
        
        alt delivery が存在しない or 権限なし
            Action-->>Client: { success: false, error: 'アクセス権限がありません' }
        else
            Action->>DB: $transaction開始
            
            loop 各納品明細
                loop 各割り当て
                    Action->>DB: deliveryAllocation.update(論理削除)
                end
                Action->>DB: deliveryDetail.update(論理削除)
            end
            
            Action->>DB: delivery.update(論理削除)
            Action->>DB: $transaction完了
            DB-->>Action: 処理結果
            Action-->>Client: { success: true, message: '納品を削除しました' }
        end
    end
```

## 8. 納品ID生成 (generateDeliveryId)

```mermaid
sequenceDiagram
    participant Action as generateDeliveryId
    participant DB as Prisma Database

    Action->>DB: delivery.findFirst(最新ID取得, startsWith: 'D')
    DB-->>Action: lastDelivery
    
    alt lastDelivery が存在しない
        Action->>Action: nextNumber = 1
    else lastDelivery が存在する
        Action->>Action: numberPart = lastDelivery.id.substring(1)
        Action->>Action: nextNumber = parseInt(numberPart) + 1
    end
    
    loop 重複チェック（最大1000回）
        Action->>Action: candidateId = 'D' + nextNumber.padStart(7, '0')
        Action->>DB: delivery.findUnique(candidateId)
        DB-->>Action: existingDelivery
        
        alt 重複なし
            Action-->>Action: candidateId
        else 重複あり
            Action->>Action: nextNumber++
        end
    end
    
    alt 1000回試行後も生成失敗
        Action-->>Action: Error('納品IDの生成に失敗しました')
    end
```

## 9. 新規作成用未納品明細取得 (fetchUndeliveredOrderDetailsForCreate)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchUndeliveredOrderDetailsForCreate
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: fetchUndeliveredOrderDetailsForCreate(customerId)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { success: false, error: '店舗を選択してください' }
    else
        Action->>DB: orderDetail.findMany(未完了注文, include: deliveryAllocations)
        DB-->>Action: orderDetails
        
        loop 各注文明細
            Action->>Action: 既に割り当てられた総数量計算
            Action->>Action: 残り数量計算
            
            alt 残り数量 > 0
                Action->>Action: enrichedOrderDetails.add(currentAllocation: 0)
            end
        end
        
        Action-->>Client: { success: true, orderDetails: enrichedOrderDetails }
    end
```

## 納品明細ID生成パターン

```mermaid
sequenceDiagram
    participant Action as createDelivery/updateDeliveryAllocations
    participant DB as Prisma Database

    Action->>DB: deliveryDetail.findFirst(最新ID取得)
    DB-->>Action: lastDeliveryDetail
    
    alt lastDeliveryDetail が存在しない
        Action->>Action: detailSequence = 1
    else lastDeliveryDetail が存在する
        Action->>Action: detailSequence = 既存最大番号 + 1
    end
    
    Action->>Action: deliveryDetailId = deliveryId + '-' + detailSequence.padStart(2, '0')
    Action-->>Action: deliveryDetailId (例: D0000001-01)
```

## エラーハンドリング共通パターン

```mermaid
sequenceDiagram
    participant Action as Any Delivery Action
    participant DB as Prisma Database
    participant Client as クライアント

    Action->>DB: データベース操作
    
    alt 正常処理
        DB-->>Action: 成功レスポンス
        Action-->>Client: { success: true, data: result }
    else エラー発生
        DB-->>Action: エラー
        Action->>Action: console.error(エラー詳細)
        Action-->>Client: { success: false, error: 'エラーメッセージ' }
    end
```

## 共通処理パターン

### 店舗・権限チェック
1. `getStoreIdFromCookie()` で店舗ID取得
2. 店舗IDの存在チェック
3. 納品が指定店舗に属するかチェック

### 複雑なデータ構造処理
1. 納品と注文明細の関係管理
2. 割り当て数量の計算
3. 未納品数量の追跡

### トランザクション処理
1. 納品、納品明細、割り当ての同時操作
2. 複雑な更新処理の整合性保証
3. 論理削除による安全なデータ管理