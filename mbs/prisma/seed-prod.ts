import { PrismaClient } from '../app/generated/prisma';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

async function main() {
  // データベースの完全クリーンアップ - 外部キー制約を考慮した削除順序
  logger.info('Starting database cleanup...');

  // 1. 最も依存関係の多いテーブルから削除（多対多の関連テーブル）
  logger.info('Cleaning delivery allocations...');
  await prisma.deliveryAllocation.deleteMany({});

  // 2. 明細テーブル
  logger.info('Cleaning details tables...');
  await prisma.deliveryDetail.deleteMany({});
  await prisma.orderDetail.deleteMany({});

  // 3. 主要トランザクションテーブル
  logger.info('Cleaning transaction tables...');
  await prisma.delivery.deleteMany({});
  await prisma.order.deleteMany({});

  // 4. 統計テーブル
  logger.info('Cleaning statistics table...');
  await prisma.statistics.deleteMany({});

  // 5. 顧客テーブル
  logger.info('Cleaning customer table...');
  await prisma.customer.deleteMany({});

  // 6. 基本テーブル（依存されるテーブル）
  logger.info('Cleaning store table...');
  await prisma.store.deleteMany({});

  logger.info('Database cleanup completed successfully');

  // 店舗データ作成（3店舗）
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        name: '今里店',
      },
    }),
    prisma.store.create({
      data: {
        name: '深江橋店',
      },
    }),
    prisma.store.create({
      data: {
        name: '緑橋本店',
      },
    }),
  ]);

  logger.info('=== Seed Data Summary for Production ===');
  logger.info(`Stores: ${stores.length}`);
  logger.info(`  - 今里店: ID ${stores[0].id}`);
  logger.info(`  - 深江橋店: ID ${stores[1].id}`);
  logger.info(`  - 緑橋本店: ID ${stores[2].id}`);
  logger.info('Production seed data created successfully');
}

main()
  .catch((e) => {
    logger.error('Production seed script failed', { error: e instanceof Error ? e.message : String(e) });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });