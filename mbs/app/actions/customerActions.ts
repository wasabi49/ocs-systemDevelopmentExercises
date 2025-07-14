'use server';

import prisma from '@/lib/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';

/**
 * CSVの5桁数字からC-XXXXX形式の顧客IDを生成・検証する関数
 * @param csvCustomerNumber CSVから取得した5桁数字（必須）
 * @param usedIds 既に使用予定のIDセット（トランザクション内で重複を避けるため）
 * @returns 検証結果
 */
async function validateAndFormatCustomerId(
  csvCustomerNumber: string | null,
  usedIds: Set<string> = new Set(),
): Promise<{ id: string; isValid: boolean; error?: string }> {
  // CSVに顧客番号が指定されていない場合
  if (!csvCustomerNumber || csvCustomerNumber.trim() === '') {
    return {
      id: '',
      isValid: false,
      error: '顧客番号が入力されていません',
    };
  }

  const trimmedNumber = csvCustomerNumber.trim();
  
  // 1-5桁の数字かチェック
  const numberPattern = /^\d{1,5}$/;
  if (!numberPattern.test(trimmedNumber)) {
    return {
      id: trimmedNumber,
      isValid: false,
      error: `顧客番号「${trimmedNumber}」が正しい形式ではありません（1-5桁の数字である必要があります）`,
    };
  }
  
  // 5桁の0埋めでC-XXXXX形式に変換
  const paddedNumber = trimmedNumber.padStart(5, '0');
  const formattedId = `C-${paddedNumber}`;
  
  // 既存データベースでの重複チェック
  const existingCustomer = await prisma.customer.findUnique({
    where: { id: formattedId },
    select: { id: true },
  });
  
  if (existingCustomer) {
    return {
      id: formattedId,
      isValid: false,
      error: `顧客ID「${formattedId}」は既に使用されています`,
    };
  }
  
  // 同一CSVファイル内での重複チェック
  if (usedIds.has(formattedId)) {
    return {
      id: formattedId,
      isValid: false,
      error: `顧客ID「${formattedId}」がCSVファイル内で重複しています`,
    };
  }
  
  usedIds.add(formattedId);
  return { id: formattedId, isValid: true };
}

/**
 * 新しい顧客IDを生成する
 * 形式: C-NNNNN (C-00001)
 * @param storeId 店舗ID
 * @param usedIds 既に使用予定のIDセット（トランザクション内で重複を避けるため）
 * @returns 新しい顧客ID
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateCustomerId(
  storeId: string,
  usedIds: Set<string> = new Set(),
): Promise<string> {
  // 指定店舗の最後の顧客番号を取得
  const lastCustomer = await prisma.customer.findFirst({
    where: {
      storeId: storeId,
      id: {
        startsWith: 'C-',
      },
    },
    orderBy: {
      id: 'desc',
    },
    select: {
      id: true,
    },
  });

  let nextNumber = 1;
  if (lastCustomer) {
    // IDから番号部分を抽出 (C-00001 → 00001)
    const numberPart = lastCustomer.id.substring(2);
    const lastNumber = parseInt(numberPart, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // 重複チェックを行いながら使用可能なIDを生成
  let attempts = 0;
  while (attempts < 1000) {
    // 無限ループを防ぐ
    const candidateId = `C-${nextNumber.toString().padStart(5, '0')}`;

    // IDが既に存在するか、または既に使用予定かチェック
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: candidateId },
      select: { id: true },
    });

    if (!existingCustomer && !usedIds.has(candidateId)) {
      usedIds.add(candidateId); // 使用予定として記録
      return candidateId;
    }

    nextNumber++;
    attempts++;
  }

  throw new Error('顧客IDの生成に失敗しました');
}

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
    const customer = await prisma.customer.findFirst({
      where: {
        id: id,
        isDeleted: false,
        statistics: {
          isDeleted: false,
        },
      },
      include: {
        statistics: true,
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
        statistics: customer.statistics
          ? {
              averageLeadTime: customer.statistics.averageLeadTime || 0,
              totalSales: customer.statistics.totalSales || 0,
              updatedAt: customer.statistics.updatedAt.toISOString(),
            }
          : null,
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
 * CSVデータから顧客を一括インポートするServer Action
 * CSVファイルとDBの内容をインポートします：
 * - CSVにあってDBにないもの → 追加
 * - DBにあってCSVにないもの → 論理削除
 * - 両方にあるもの → 更新
 * @param csvData CSVデータの2次元配列
 * @param storeId 店舗ID
 * @returns インポート結果
 */
export async function importCustomersFromCSV(csvData: string[][], storeId?: string) {
  try {
    if (!storeId) {
      return {
        status: 'store_required' as const,
        error: '店舗を選択してください',
      };
    }

    // 店舗存在確認
    const currentStore = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true },
    });

    if (!currentStore) {
      return {
        status: 'store_invalid' as const,
        error: '指定された店舗が見つかりません',
      };
    }

    // CSVデータの基本検証
    if (!csvData || csvData.length < 2) {
      return {
        status: 'error' as const,
        error: 'CSVファイルが空か、データ行がありません',
      };
    }

    const dataRows = csvData.slice(1); // ヘッダー行を除く

    // 有効行の判定：最低限、店舗名と顧客名が必要
    // かつ、ヘッダー行のような文字列を除外
    const validRows = dataRows.filter((row) => {
      if (row.length < 3) return false;

      const storeName = row[1]?.toString().trim();
      const customerName = row[2]?.toString().trim();

      // 空の値をチェック
      if (!storeName || !customerName) return false;

      // ヘッダー行のような値を除外
      if (
        storeName === '店舗名' ||
        customerName === '顧客名' ||
        storeName === 'storeName' ||
        customerName === 'customerName'
      ) {
        return false;
      }

      return true;
    });

    if (validRows.length === 0) {
      return {
        status: 'error' as const,
        error: 'インポートできる有効なデータがありません',
      };
    }

    // 店舗名の検証
    const invalidStoreRows = validRows.filter(
      (row) => row[1]?.toString().trim() !== currentStore.name,
    );

    if (invalidStoreRows.length > 0) {
      const errorDetails = invalidStoreRows.slice(0, 5).map((row) => ({
        customerId: row[0]?.toString() || '',
        storeName: row[1]?.toString() || '',
      }));

      const moreCount = invalidStoreRows.length > 5 ? invalidStoreRows.length - 5 : 0;

      return {
        status: 'error' as const,
        error: 'CSVファイルに異なる店舗のデータが含まれています。',
        errorData: {
          currentStoreName: currentStore.name,
          invalidCustomers: errorDetails,
          moreCount: moreCount,
        },
      };
    }

    // CSV内の顧客ID重複チェック
    const csvCustomerIds = new Set<string>();
    const duplicateIds: string[] = [];
    
    for (const row of validRows) {
      const customerId = row[0]?.toString().trim();
      if (customerId) {
        if (csvCustomerIds.has(customerId)) {
          duplicateIds.push(customerId);
        } else {
          csvCustomerIds.add(customerId);
        }
      }
    }
    
    if (duplicateIds.length > 0) {
      return {
        status: 'error' as const,
        error: `CSVファイル内で重複している顧客IDがあります: ${duplicateIds.join(', ')}`,
      };
    }

    // CSVデータを顧客名をキーとしてマップ化
    const csvCustomersMap = new Map();
    for (const row of validRows) {
      const customerName = row[2]?.toString().trim();
      const customerId = row[0]?.toString().trim();
      csvCustomersMap.set(customerName, {
        id: customerId || null, // CSVの顧客IDを保存
        name: customerName,
        contactPerson: row[3]?.toString().trim() || null,
        address: row[4]?.toString().trim() || null,
        phone: row[5]?.toString().trim() || null,
        deliveryCondition: row[6]?.toString().trim() || null,
        note: row[7]?.toString().trim() || null,
      });
    }

    // 既存の顧客データを取得（指定店舗の非削除データのみ）
    const existingCustomers = await prisma.customer.findMany({
      where: {
        storeId: storeId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        address: true,
        phone: true,
        deliveryCondition: true,
        note: true,
      },
    });

    // 既存顧客を顧客名でマップ化
    const existingCustomersMap = new Map();
    for (const customer of existingCustomers) {
      existingCustomersMap.set(customer.name, customer);
    }

    // 処理データの分類
    const csvCustomerNames = new Set(csvCustomersMap.keys());
    const existingCustomerNames = new Set(existingCustomersMap.keys());

    // 新規追加：CSVにあってDBにない
    const toAdd = Array.from(csvCustomerNames).filter((name) => !existingCustomerNames.has(name));

    // 削除：DBにあってCSVにない
    const toDelete = Array.from(existingCustomerNames).filter(
      (name) => !csvCustomerNames.has(name),
    );

    // 更新：両方にあって内容が異なる
    const toUpdate = Array.from(csvCustomerNames).filter((name) => {
      if (!existingCustomerNames.has(name)) return false;

      const csvCustomer = csvCustomersMap.get(name);
      const existingCustomer = existingCustomersMap.get(name);

      // データの差分をチェック
      return (
        csvCustomer.contactPerson !== existingCustomer.contactPerson ||
        csvCustomer.address !== existingCustomer.address ||
        csvCustomer.phone !== existingCustomer.phone ||
        csvCustomer.deliveryCondition !== existingCustomer.deliveryCondition ||
        csvCustomer.note !== existingCustomer.note
      );
    });

    let addedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    // 事前に必要なIDを検証・生成（重複を避けるため）
    const usedIds = new Set<string>();
    const newCustomerIds: { [customerName: string]: string } = {};
    const idValidationErrors: string[] = [];

    for (const customerName of toAdd) {
      const csvCustomer = csvCustomersMap.get(customerName);
      const idResult = await validateAndFormatCustomerId(csvCustomer.id, usedIds);
      
      if (!idResult.isValid) {
        idValidationErrors.push(`顧客「${customerName}」: ${idResult.error}`);
      } else {
        newCustomerIds[customerName] = idResult.id;
      }
    }
    
    // ID検証エラーがある場合はエラーを返す
    if (idValidationErrors.length > 0) {
      return {
        status: 'error' as const,
        error: `顧客IDの検証エラー:\n${idValidationErrors.join('\n')}`,
      };
    }

    // トランザクションで実行
    await prisma.$transaction(async (tx) => {
      // 新規追加
      for (const customerName of toAdd) {
        const csvCustomer = csvCustomersMap.get(customerName);
        const newId = newCustomerIds[customerName];

        await tx.customer.create({
          data: {
            id: newId,
            storeId: storeId,
            name: csvCustomer.name,
            contactPerson: csvCustomer.contactPerson,
            address: csvCustomer.address,
            phone: csvCustomer.phone,
            deliveryCondition: csvCustomer.deliveryCondition,
            note: csvCustomer.note,
          },
        });
        addedCount++;
      }

      // 更新
      for (const customerName of toUpdate) {
        const csvCustomer = csvCustomersMap.get(customerName);
        const existingCustomer = existingCustomersMap.get(customerName);

        await tx.customer.update({
          where: { id: existingCustomer.id },
          data: {
            contactPerson: csvCustomer.contactPerson,
            address: csvCustomer.address,
            phone: csvCustomer.phone,
            deliveryCondition: csvCustomer.deliveryCondition,
            note: csvCustomer.note,
          },
        });
        updatedCount++;
      }

      // 論理削除
      if (toDelete.length > 0) {
        const deleteIds = toDelete.map((name) => existingCustomersMap.get(name).id);
        const result = await tx.customer.updateMany({
          where: {
            id: { in: deleteIds },
            storeId: storeId,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
        deletedCount = result.count;
      }
    });

    return {
      status: 'success' as const,
      data: {
        addedCount,
        updatedCount,
        deletedCount,
        totalProcessed: validRows.length,
      },
    };
  } catch (error) {
    console.error('顧客データのインポートに失敗しました:', error);

    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case 'P2002':
          return {
            status: 'error' as const,
            error: '重複するデータが検出されました。',
          };
        default:
          return {
            status: 'error' as const,
            error: `データベースエラー（${error.code}）`,
          };
      }
    }

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

/**
 * 店舗の全顧客を取得（納品編集画面用）
 * @returns 顧客一覧
 */
export async function fetchAllCustomers() {
  try {
    const storeId = await getStoreIdFromCookie();

    if (!storeId) {
      return {
        status: 'store_required' as const,
        error: '店舗を選択してください',
      };
    }

    const customers = await prisma.customer.findMany({
      where: {
        storeId: storeId,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        address: true,
        phone: true,
        deliveryCondition: true,
        note: true,
        updatedAt: true,
        storeId: true,
        isDeleted: true,
        deletedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      status: 'success' as const,
      data: customers.map((customer) => ({
        id: customer.id,
        storeId: customer.storeId,
        name: customer.name,
        contactPerson: customer.contactPerson,
        address: customer.address,
        phone: customer.phone,
        deliveryCondition: customer.deliveryCondition,
        note: customer.note,
        updatedAt: customer.updatedAt.toISOString(),
        isDeleted: customer.isDeleted,
        deletedAt: customer.deletedAt?.toISOString() || null,
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
