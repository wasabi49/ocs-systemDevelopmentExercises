# 書店管理システム - 本番環境構築手順

## 前提条件

- Docker
- Docker Compose

## 構築手順

### 1. 環境変数の設定

`.env.example`を`.env`にコピーし、必要に応じて編集：

```bash
cp .env.example .env
```

### 2. 本番環境の起動

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 基本操作

### 停止・再起動

```bash
# 停止
docker-compose -f docker-compose.prod.yml down

# 再起動
docker-compose -f docker-compose.prod.yml restart
```

### ログ確認

```bash
# 全ログ
docker-compose -f docker-compose.prod.yml logs -f

# アプリケーションのみ
docker-compose -f docker-compose.prod.yml logs -f mbs
```

### データベース接続

```bash
docker-compose -f docker-compose.prod.yml exec db psql -U postgres -d postgres
```

### 完全リセット

```bash
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

## アクセス

- アプリケーション: http://localhost:3000