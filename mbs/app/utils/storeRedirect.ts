import { redirect } from 'next/navigation';

/**
 * Server Action の結果をチェックし、店舗未選択の場合は店舗選択画面へリダイレクト
 * Server Component で使用
 */
export function checkStoreRequirement<T extends { status: string }>(
  result: T,
  defaultRedirectPath: string = '/stores'
): T {
  if ('status' in result && (result.status === 'store_required' || result.status === 'store_invalid')) {
    redirect(defaultRedirectPath);
  }
  return result;
}

/**
 * 統一的なエラーメッセージ
 */
export const STORE_ERROR_MESSAGES = {
  STORE_REQUIRED: '店舗を選択してください',
  STORE_INVALID: '選択された店舗が無効です',
} as const;