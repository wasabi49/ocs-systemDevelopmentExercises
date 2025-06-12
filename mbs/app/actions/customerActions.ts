'use server';

import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';

export async function fetchCustomers() {
  try {
    const storeId = await getStoreIdFromCookie();
    if (!storeId) {
      return {
        status: 'store_required' as const,
        error: '店舗を選択してください',
      };
    }

    const storeExists = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!storeExists) {
      return {
        status: 'store_invalid' as const,
        error: '指定された店舗が見つかりません',
      };
    }

    const whereCondition = {
      isDeleted: false,
      storeId: storeId,
    };

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
        id: 'asc',
      },
    });
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
        isDeleted: false,
      },
    });

    if (!customer) {
      return {
        status: 'error' as const,
        error: '顧客が見つかりませんでした',
      };
    }

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
    if (!storeId) {
      return {
        status: 'store_required' as const,
        error: '店舗を選択してください',
      };
    }

    const storeExists = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true },
    });

    if (!storeExists) {
      return {
        status: 'store_invalid' as const,
        error: '指定された店舗が見つかりません',
      };
    }

    const dataRows = csvData.slice(1);
    const validRows = dataRows.filter(
      (row) => row.length >= 3 && row[0] && row[1],
    );

    if (validRows.length === 0) {
      return {
        status: 'error' as const,
        error: 'インポートできる有効なデータがありません',
      };
    }

    const existingIds = await prisma.customer.findMany({
      select: { id: true },
      where: { isDeleted: false },
    });
    const existingIdSet = new Set(existingIds.map((c) => c.id));

    const newCustomers = validRows
      .filter((row) => !existingIdSet.has(row[0]))
      .map((row) => ({
        id: row[0],
        storeId: storeId,
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

/**
 * useActionState用の顧客一覧データ取得アクション
 * @returns 顧客データの状態
 */
export async function fetchCustomersAction() {
  try {
    const result = await fetchCustomers();

    return {
      loading: false,
      error: result.status !== 'success' ? result.error : null,
      data: result.status === 'success' ? result.data : [],
      needsStoreSelection: result.status === 'store_required' || result.status === 'store_invalid',
    };
  } catch (error) {
    console.error('顧客データの取得に失敗しました:', error);
    return {
      loading: false,
      error: '顧客データの取得中にエラーが発生しました',
      data: [],
      needsStoreSelection: false,
    };
  }
}
