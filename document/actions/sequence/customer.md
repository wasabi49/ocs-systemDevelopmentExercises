# customerActions.ts - シーケンス図

## 概要
顧客管理に関するServer Actionsの処理フローを示すシーケンス図です。

## 1. 顧客一覧取得 (fetchCustomers)

```mermaid
sequenceDiagram
    participant Client as クライアントsequenceDiagram
    participant Breadcrumbs as BreadcrumbssequenceDiagram
    participant Breadcrumbs as Breadcrumbs
    participant Segments as pathSegments
    participant Link as Link
    participant ChevronRight as ChevronRight

    Breadcrumbs->>Breadcrumbs: pathSegments.length チェック
    
    alt pathSegments.length <= 1
        Breadcrumbs->>Breadcrumbs: 空の span 返却
        Note over Breadcrumbs: "ホームページなど"
    else pathSegments.length > 1
        loop 各セグメントに対して
            Breadcrumbs->>Breadcrumbs: index < pathSegments.length - 1 チェック
            
            alt 最後のセグメントでない
                Breadcrumbs->>Link: Link コンポーネント生成
                Note over Link: "href: /${pathSegments.slice(0, index + 1).join('/')}"
                Link->>Link: "pathNames[segment] でラベル設定"
                Breadcrumbs->>ChevronRight: 区切り矢印追加
            else 最後のセグメント
                Breadcrumbs->>Breadcrumbs: span でテキスト表示
                Note over Breadcrumbs: "pathNames[segment] (リンクなし)"
            end
        end
    end
    participant Segments as pathSegments
    participant Link as Link
    participant ChevronRight as ChevronRight

    Breadcrumbs->>Breadcrumbs: pathSegments.length チェック
    
    alt pathSegments.length <= 1
        Breadcrumbs->>Breadcrumbs: 空の span 返却
        Note over Breadcrumbs: "ホームページなど"
    else pathSegments.length > 1
        loop 各セグメントに対して
            Breadcrumbs->>Breadcrumbs: index < pathSegments.length - 1 チェック
            
            alt 最後のセグメントでない
                Breadcrumbs->>Link: Link コンポーネント生成
                Note over Link: "href: /${pathSegments.slice(0, index + 1).join('/')}"
                Link->>Link: "pathNames[segment] でラベル設定"
                Breadcrumbs->>ChevronRight: 区切り矢印追加
            else 最後のセグメント
                Breadcrumbs->>Breadcrumbs: span でテキスト表示
                Note over Breadcrumbs: "pathNames[segment] (リンクなし)"
            end
        end
    end
    participant Action as fetchCustomers
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: fetchCustomers()
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
            Action->>DB: customer.findMany(whereCondition)
            DB-->>Action: customers
            Action-->>Client: { status: 'success', data: customers }
        end
    end
```

## 2. 顧客ID別取得 (fetchCustomerById)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchCustomerById
    participant DB as Prisma Database

    Client->>Action: fetchCustomerById(id)
    Action->>DB: customer.findFirst(id, isDeleted: false)
    DB-->>Action: customer
    
    alt customer が存在しない
        Action-->>Client: { status: 'error', error: '顧客が見つかりませんでした' }
    else customer が存在する
        Action-->>Client: { status: 'success', data: customer }
    end
```

## 3. CSVインポート (importCustomersFromCSV)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as importCustomersFromCSV
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: importCustomersFromCSV(csvData, storeId)
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { status: 'store_required' }
    else
        Action->>DB: store.findUnique(storeId)
        DB-->>Action: store
        
        alt store が存在しない
            Action-->>Client: { status: 'store_invalid' }
        else
            Action->>Action: CSVデータ基本検証
            Action->>Action: 有効行フィルタリング
            Action->>Action: 店舗名検証
            
            alt 検証エラー
                Action-->>Client: { status: 'error', error: 'エラー詳細' }
            else 検証成功
                Action->>DB: customer.findMany(storeId)
                DB-->>Action: existingCustomers
                
                Action->>Action: 差分分析（追加・更新・削除）
                
                loop 新規顧客分
                    Action->>DB: generateCustomerId(storeId)
                    DB-->>Action: newCustomerId
                end
                
                Action->>DB: $transaction開始
                
                loop 新規追加顧客
                    Action->>DB: customer.create(newCustomer)
                end
                
                loop 更新顧客
                    Action->>DB: customer.update(existingCustomer)
                end
                
                loop 削除顧客
                    Action->>DB: customer.updateMany(isDeleted: true)
                end
                
                Action->>DB: $transaction完了
                DB-->>Action: 処理結果
                Action-->>Client: { status: 'success', data: { counts } }
            end
        end
    end
```

## 4. 顧客ID生成 (generateCustomerId)

```mermaid
sequenceDiagram
    participant Action as generateCustomerId
    participant DB as Prisma Database

    Action->>DB: customer.findFirst(最新ID取得)
    DB-->>Action: lastCustomer
    
    Action->>Action: 次の番号を計算
    
    loop 重複チェック（最大1000回）
        Action->>Action: 候補ID生成 (C-NNNNN)
        Action->>DB: customer.findUnique(candidateId)
        DB-->>Action: existingCustomer
        
        alt 重複なし & 使用予定なし
            Action->>Action: usedIds.add(candidateId)
            Action-->>Action: candidateId
        else 重複あり
            Action->>Action: nextNumber++
        end
    end
    
    alt 1000回試行後も生成失敗
        Action-->>Action: Error('顧客IDの生成に失敗しました')
    end
```

## 5. 全顧客取得 (fetchAllCustomers)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchAllCustomers
    participant Store as getStoreIdFromCookie
    participant DB as Prisma Database

    Client->>Action: fetchAllCustomers()
    Action->>Store: getStoreIdFromCookie()
    Store-->>Action: storeId
    
    alt storeId が存在しない
        Action-->>Client: { status: 'store_required' }
    else
        Action->>DB: customer.findMany(storeId, isDeleted: false)
        DB-->>Action: customers
        Action-->>Client: { status: 'success', data: customers }
    end
```

## 6. useActionState用取得 (fetchCustomersAction)

```mermaid
sequenceDiagram
    participant Client as クライアント
    participant Action as fetchCustomersAction
    participant FetchAction as fetchCustomers

    Client->>Action: fetchCustomersAction()
    Action->>FetchAction: fetchCustomers()
    FetchAction-->>Action: result
    
    alt result.status === 'success'
        Action-->>Client: { loading: false, error: null, data: result.data }
    else
        Action-->>Client: { loading: false, error: result.error, data: [] }
    end
```

## エラーハンドリング共通パターン

```mermaid
sequenceDiagram
    participant Action as Any Action
    participant DB as Prisma Database
    participant Client as クライアント

    Action->>DB: データベース操作
    
    alt 正常処理
        DB-->>Action: 成功レスポンス
        Action-->>Client: { status: 'success', data: result }
    else エラー発生
        DB-->>Action: エラー
        Action->>Action: console.error(エラー詳細)
        Action-->>Client: { status: 'error', error: 'エラーメッセージ' }
    end
```

## 共通処理パターン

### 店舗チェック
1. `getStoreIdFromCookie()` で店舗ID取得
2. 店舗IDの存在チェック
3. 店舗の有効性チェック

### データ検証
1. 入力データの基本検証
2. 関連データの存在チェック
3. 権限チェック（店舗に属するデータのみ）

### トランザクション処理
1. 複数テーブル操作時は `$transaction` 使用
2. 失敗時は全体ロールバック
3. 成功時はコミット