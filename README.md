# Next.js & Prisma 開発環境

Docker、Next.js、Prisma を使用した開発環境のセットアップガイドです。

## 必要条件

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Git

## 環境構築手順

### 1. リポジトリのクローン

```bash
git clone <リポジトリURL>
cd <プロジェクト名>
```

### 2. 環境変数の設定

`.env.example`ファイルを`.env`にコピーし、必要に応じて設定を編集します：

```bash
cp .env.example .env
```

### 3. Docker コンテナの起動

```bash
docker-compose up -d
```

### 4. データベースのマイグレーション

```bash
docker-compose exec mbs npx prisma migrate dev
```

これにより、Prisma の定義に基づいてデータベーステーブルが作成されます。

### 5. (初回のみ) Prisma クライアントの生成

```bash
docker-compose exec mbs npx prisma generate
```

## 開発ワークフロー

### アプリケーションの確認

- フロントエンド: http://localhost:3000
- PostgreSQL: localhost:5432
  - ユーザー名: postgres
  - パスワード: postgres
  - データベース名: postgres

### コマンド一覧

- コンテナ起動: `docker-compose up -d`
- コンテナ停止: `docker-compose down`
- ログ確認: `docker-compose logs -f`
- マイグレーション実行: `docker-compose exec mbs npx prisma migrate dev --name <変更名>`
- Prisma Studio (DB GUI): `docker-compose exec mbs npx prisma studio`

### データベース操作

PostgreSQL に直接接続：

```bash
docker-compose exec db psql -U postgres -d postgres
```

## データの永続性について

**注意**: 現在の設定では、データベースのデータは Docker コンテナ内部に保存され、外部にマウントされていません。そのため：

- `docker-compose down`を実行するとデータは保持されます
- `docker-compose down -v`や`docker-compose down --volumes`を実行するとデータは消失します
- Docker コンテナを削除するとデータは消失します

## スキーマ変更手順

1. `prisma/schema.prisma`ファイルを編集
2. マイグレーションを実行
   ```bash
   docker-compose exec mbs npx prisma migrate dev --name <変更内容>
   ```
3. 生成された Prisma クライアントを使用してアプリケーションコードを書く

## トラブルシューティング

### データベースのリセット

データベースをリセットする必要がある場合：

```bash
# コンテナを停止しボリュームを削除
docker-compose down -v

# コンテナを再起動
docker-compose up -d

# マイグレーションを再実行
docker-compose exec mbs npx prisma migrate dev
```

### Prisma クライアント生成エラー

パスの問題で Prisma クライアントが生成されない場合：

```bash
docker-compose exec mbs npx prisma generate
```

## 参考リンク

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Prisma ドキュメント](https://www.prisma.io/docs)
- [Docker Compose ドキュメント](https://docs.docker.com/compose/)
