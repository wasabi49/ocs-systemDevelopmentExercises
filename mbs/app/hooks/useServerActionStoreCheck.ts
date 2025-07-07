'use client';

import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

interface ServerActionResult {
  status?: string;
  needsStoreSelection?: boolean;
}

/**
 * Server Actionの結果を監視し、店舗選択が必要な場合にリダイレクトするカスタムフック
 */
export const useServerActionStoreCheck = () => {
  const router = useRouter();

  /**
   * Server Actionの結果をチェックし、店舗選択が必要な場合はリダイレクト
   * @param result Server Actionの結果
   * @returns 店舗選択が必要かどうか
   */
  const checkStoreRequirement = (result: ServerActionResult) => {
    if (result?.status === 'store_required' || result?.status === 'store_invalid') {
      logger.info('店舗選択が必要です。店舗選択ページにリダイレクトします。');
      router.push('/stores');
      return true;
    }

    if (result?.needsStoreSelection) {
      logger.info('店舗選択が必要です。店舗選択ページにリダイレクトします。');
      router.push('/stores');
      return true;
    }

    return false;
  };

  return { checkStoreRequirement };
};
