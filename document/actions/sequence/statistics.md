# statisticsActions.ts - シーケンス図

## 概要
統計情報管理に関するServer Actionsの処理フローを示すシーケンス図です。

## 1. 統計情報取得 (fetchStatistics)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchStatistics
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: fetchStatistics()
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
            Action->>DB: statistics.findMany(include: customer)
            Note over Action,DB: "条件: isDeleted: false, customer.storeId: storeId"
            DB-->>Action: statistics
            Action-->>Client: { status: 'success', data: statistics }
        end
    end
```

## 2. 統計情報再計算 (recalculateStatistics)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as recalculateStatistics
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: recalculateStatistics()
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { status: 'store_required' }
    else storeId が存在する
        Action->>DB: customer.findMany(storeId, isDeleted: false)
        DB-->>Action: customers
        
        loop 各顧客
            Action->>DB: order.findMany(customerId, include: orderDetails)
            DB-->>Action: orders
            
            Action->>Action: 累計売上計算
            Note over Action: "orderDetails の unitPrice × quantity を合計"
            
            Action->>Action: 平均リードタイム計算開始
            Action->>Action: totalLeadTime = 0, completedOrders = 0
            
            loop 各注文
                Action->>DB: delivery.findFirst(最初の納品日)
                Note over Action,DB: "条件: customerId, deliveryDate >= orderDate"
                DB-->>Action: firstDelivery
                
                alt firstDelivery が存在する
                    Action->>Action: leadTimeDays計算
                    Note over Action: "(deliveryDate - orderDate) / (1000*60*60*24)"
                    Action->>Action: totalLeadTime += leadTimeDays
                    Action->>Action: completedOrders++
                end
            end
            
            Action->>Action: averageLeadTime計算
            Note over Action: "completedOrders > 0 ? totalLeadTime / completedOrders : 0"
            
            Action->>DB: statistics.upsert(customerId)
            Note over Action,DB: "update: { averageLeadTime, totalSales, isDeleted: false }<br/>create: { customerId, averageLeadTime, totalSales, isDeleted: false }"
        end
        
        Action-->>Client: { status: 'success', message: '統計情報を再計算しました' }
    end
```

## 詳細な統計計算処理

### 累計売上計算

```mermaid
sequenceDiagram
    participant Action as recalculateStatistics
    participant DB as Prisma Database

    Action->>DB: order.findMany(customerId, include: orderDetails)
    DB-->>Action: orders
    
    Action->>Action: totalSales = 0
    
    loop 各注文
        Action->>Action: orderTotal = 0
        
        loop 各注文明細 (isDeleted: false)
            Action->>Action: orderTotal += unitPrice × quantity
        end
        
        Action->>Action: totalSales += orderTotal
    end
    
    Action-->>Action: totalSales
```

### 平均リードタイム計算

```mermaid
sequenceDiagram
    participant Action as recalculateStatistics
    participant DB as Prisma Database

    Action->>Action: totalLeadTime = 0, completedOrders = 0
    
    loop 各注文
        Action->>DB: delivery.findFirst(最初の納品)
        Note over Action,DB: "条件:<br/>- customerId: customer.id<br/>- deliveryDate >= order.orderDate<br/>- isDeleted: false<br/>orderBy: deliveryDate asc"
        DB-->>Action: firstDelivery
        
        alt firstDelivery が存在する
            Action->>Action: leadTimeDays = Math.ceil((deliveryDate - orderDate) / (1000*60*60*24))
            Action->>Action: totalLeadTime += leadTimeDays
            Action->>Action: completedOrders++
        end
    end
    
    alt completedOrders > 0
        Action->>Action: averageLeadTime = totalLeadTime / completedOrders
    else completedOrders === 0
        Action->>Action: averageLeadTime = 0
    end
    
    Action-->>Action: averageLeadTime
```

### 統計データの更新・作成

```mermaid
sequenceDiagram
    participant Action as recalculateStatistics
    participant DB as Prisma Database

    Action->>DB: statistics.upsert()
    Note over Action,DB: "where: { customerId: customer.id }"
    
    alt 既存の統計データがある
        Action->>DB: statistics.update()
        Note over Action,DB: "data: {<br/>  averageLeadTime: averageLeadTime,<br/>  totalSales: totalSales,<br/>  isDeleted: false<br/>}"
        DB-->>Action: 更新された統計データ
    else 統計データが存在しない
        Action->>DB: statistics.create()
        Note over Action,DB: "data: {<br/>  customerId: customer.id,<br/>  averageLeadTime: averageLeadTime,<br/>  totalSales: totalSales,<br/>  isDeleted: false<br/>}"
        DB-->>Action: 新規作成された統計データ
    end
```

## データ取得時のフィルタリング

```mermaid
sequenceDiagram
    participant Action as fetchStatistics
    participant DB as Prisma Database

    Action->>DB: statistics.findMany()
    Note over Action,DB: "where条件:<br/>- isDeleted: false<br/>- customer: {<br/>    storeId: storeId,<br/>    isDeleted: false<br/>  }"
    
    Note over Action,DB: "include条件:<br/>- customer: {<br/>    select: { id: true, name: true }<br/>  }"
    
    Note over Action,DB: "orderBy条件:<br/>- customer: { id: 'asc' }"
    
    DB-->>Action: フィルタリングされた統計データ
    
    Action->>Action: データ変換
    Note over Action: "{<br/>  customerId: stat.customer.id,<br/>  customerName: stat.customer.name,<br/>  averageLeadTime: stat.averageLeadTime || 0,<br/>  totalSales: stat.totalSales || 0,<br/>  updatedAt: stat.updatedAt.toISOString()<br/>}"
    
    Action-->>Action: 変換されたデータ配列
```

## エラーハンドリング

```mermaid
sequenceDiagram
    participant Action as Any Statistics Action
    participant DB as Prisma Database
    participant Client as クライアント

    Action->>DB: データベース操作
    
    alt 正常処理
        DB-->>Action: 成功レスポンス
        Action-->>Client: { status: 'success', data/message: result }
    else エラー発生
        DB-->>Action: エラー
        Action->>Action: console.error('統計データの取得/再計算に失敗しました:', error)
        Action-->>Client: { status: 'error', error: 'エラーメッセージ' }
    end
```

## 統計計算の処理フロー概要

**統計情報再計算処理フロー**
1. 統計情報再計算開始 → 店舗IDチェック → 顧客一覧取得
2. 各顧客に対して繰り返し処理：
   - 注文データ取得
   - 累計売上計算
   - リードタイム計算
   - 平均リードタイム算出
   - 統計データ更新/作成
3. 次の顧客がある場合は繰り返し、ない場合は完了

このフローにより、各顧客の統計情報が正確に計算・更新されます。

## 共通処理パターン

### 店舗チェック
1. `getStoreIdFromCookie()` で店舗ID取得
2. 店舗IDの存在チェック
3. 店舗の有効性チェック

### データ整合性
1. 削除済みデータの除外
2. 店舗に属するデータのみ処理
3. NULL値の適切な処理（|| 0）

### 計算精度
1. 日数計算時の Math.ceil 使用
2. 0除算の防止
3. 小数点以下の適切な処理