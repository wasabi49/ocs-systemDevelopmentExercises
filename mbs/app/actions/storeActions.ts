'use server';

import prisma from '@/lib/prisma';

export interface Store {
  id: string;
  name: string;
}

export interface StoreActionState {
  stores: Store[];
  error: string | null;
  isLoading: boolean;
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
 * useActionState用の店舗データ取得アクション
 */
export async function fetchStoresAction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: StoreActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData?: FormData,
): Promise<StoreActionState> {
  try {
    const stores = await getAllStores();
    return {
      stores,
      error: null,
      isLoading: false,
    };
  } catch (error) {
    return {
      stores: [],
      error: error instanceof Error ? error.message : '店舗データの取得に失敗しました',
      isLoading: false,
    };
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
