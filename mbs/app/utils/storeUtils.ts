import { cookies } from 'next/headers';
import type { Store } from '@/app/contexts/StoreContext';

/**
 * サーバーサイドでCookieから店舗情報を取得する
 */
export async function getStoreFromCookie(): Promise<Store | null> {
  try {
    const cookieStore = await cookies();
    const storeIdCookie = cookieStore.get('selectedStoreId');
    const storeNameCookie = cookieStore.get('selectedStoreName');

    if (!storeIdCookie?.value) {
      return null;
    }

    // IDと名前から店舗オブジェクトを復元
    return {
      id: storeIdCookie.value,
      name: storeNameCookie?.value || '', // 名前がない場合は空文字
    };
  } catch (error) {
    console.error('Failed to parse store cookie:', error);
    return null;
  }
}

/**
 * 店舗IDのみを取得する（Server Action等で使用）
 */
export async function getStoreIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const storeIdCookie = cookieStore.get('selectedStoreId');
    return storeIdCookie?.value || null;
  } catch (error) {
    console.error('Failed to get store ID from cookie:', error);
    return null;
  }
}
