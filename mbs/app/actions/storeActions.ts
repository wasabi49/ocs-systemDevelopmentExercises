'use server';

import prisma from '@/lib/prisma';

export interface Store {
  id: string;
  name: string;
}

/**
 * 全店舗データを取得
 */
export async function getAllStores(): Promise<Store[]> {
  try {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return stores;
  } catch (error) {
    console.error('Failed to fetch stores:', error);
    throw new Error('店舗データの取得に失敗しました');
  }
}

/**
 * 店舗IDで店舗データを取得
 */
export async function getStoreById(id: string): Promise<Store | null> {
  try {
    const store = await prisma.store.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
      },
    });

    return store;
  } catch (error) {
    console.error('Failed to fetch store by ID:', error);
    throw new Error('店舗データの取得に失敗しました');
  }
}
