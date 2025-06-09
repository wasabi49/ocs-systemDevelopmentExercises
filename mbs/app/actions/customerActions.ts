'use server';

import prisma from '@/lib/prisma';

/**
 * 顧客一覧データを取得するServer Action
 * @param storeId 店舗ID（指定されている場合は該当店舗の顧客のみ取得）
 * @returns 顧客データの配列
 */
export async function fetchCustomers(storeId?: string) {
  try {
    // 条件を設定
    const whereCondition: {
      isDeleted: boolean;
      storeId?: string;
    } = {
      isDeleted: false, // 削除されていないデータのみ
    };

    // 店舗IDが指定されている場合は追加
    if (storeId) {
      whereCondition.storeId = storeId;
    }

    // Prismaを使って顧客データを取得
    const customers = await prisma.customer.findMany({
      where: whereCondition,
      include: {
        store: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        id: 'asc', // IDで昇順ソート
      },
    });

    // 取得データをフロントエンド用にシリアライズ
    return {
      status: 'success' as const,
      data: customers.map((customer) => ({
        id: customer.id,
        customerName: customer.name,
        managerName: customer.contactPerson || '',
        storeName: customer.store.name,
      })),
    };
  } catch (error) {
    console.error('顧客データの取得に失敗しました:', error);
    return {
      status: 'error' as const,
      error: '顧客データの取得に失敗しました',
    };
  }
}

/**
 * 指定されたIDの顧客を取得するServer Action
 * @param id 顧客ID
 * @returns 顧客情報を含むデータ
 */
export async function fetchCustomerById(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: {
        id: id,
        isDeleted: false, // 削除されていないデータのみ
      },
    });

    if (!customer) {
      return {
        status: 'error' as const,
        error: '顧客が見つかりませんでした',
      };
    }

    // 取得データをフロントエンド用にシリアライズ
    return {
      status: 'success' as const,
      data: {
        id: customer.id,
        customerName: customer.name,
        managerName: customer.contactPerson || '',
      },
    };
  } catch (error) {
    console.error('顧客データの取得に失敗しました:', error);
    return {
      status: 'error' as const,
      error: '顧客データの取得に失敗しました',
    };
  }
}

/**
 * CSVデータから顧客を一括作成するServer Action
 * @param csvData CSVデータの2次元配列
 * @param storeId 店舗ID
 * @returns 作成結果
 */
export async function importCustomersFromCSV(csvData: string[][], storeId?: string) {
  try {
    // ヘッダー行をスキップし、データ行のみを処理
    const dataRows = csvData.slice(1);
    const validRows = dataRows.filter(
      (row) => row.length >= 3 && row[0] && row[1], // ID、顧客名は必須
    );

    if (validRows.length === 0) {
      return {
        status: 'error' as const,
        error: 'インポートできる有効なデータがありません',
      };
    }

    // 店舗IDの決定（指定されている場合はそれを使用、されていない場合はデフォルトの店舗を取得）
    let targetStoreId = storeId;
    if (!targetStoreId) {
      const defaultStore = await prisma.store.findFirst();
      if (!defaultStore) {
        return {
          status: 'error' as const,
          error: '店舗データが見つかりません',
        };
      }
      targetStoreId = defaultStore.id;
    }

    // 重複チェック用に既存の顧客IDを取得
    const existingIds = await prisma.customer.findMany({
      select: { id: true },
      where: { isDeleted: false },
    });
    const existingIdSet = new Set(existingIds.map((c) => c.id));

    // 新規データのみをフィルタリング
    const newCustomers = validRows
      .filter((row) => !existingIdSet.has(row[0]))
      .map((row) => ({
        id: row[0],
        storeId: targetStoreId,
        name: row[1],
        contactPerson: row[2] || null,
        address: row[3] || null,
        phone: row[4] || null,
        deliveryCondition: row[5] || null,
        note: row[6] || null,
      }));

    if (newCustomers.length === 0) {
      return {
        status: 'error' as const,
        error: 'すべてのデータが既に存在します',
      };
    }

    // 一括作成
    const result = await prisma.customer.createMany({
      data: newCustomers,
      skipDuplicates: true,
    });

    return {
      status: 'success' as const,
      data: {
        importedCount: result.count,
        skippedCount: validRows.length - newCustomers.length,
      },
    };
  } catch (error) {
    console.error('顧客データのインポートに失敗しました:', error);
    return {
      status: 'error' as const,
      error: 'データのインポートに失敗しました',
    };
  }
}
