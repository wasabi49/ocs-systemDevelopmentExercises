'use server';

import prisma from '@/lib/prisma';
import { Customer } from '@/app/generated/prisma';

/**
 * 顧客一覧データを取得するServer Action
 * @returns 顧客データの配列
 */
export async function fetchCustomers() {
  try {
    // Prismaを使って顧客データを取得
    const customers = await prisma.customer.findMany({
      where: {
        isDeleted: false, // 削除されていないデータのみ
      },
      orderBy: {
        id: 'asc', // IDで昇順ソート
      },
    });

    // 取得データをフロントエンド用にシリアライズ
    return {
      status: 'success' as const,
      data: customers.map((customer: Customer) => ({
        id: customer.id,
        customerName: customer.name,
        managerName: customer.contactPerson || '',
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
