import StoreSelection from '@/app/components/StoreSelection';
import { getAllStores } from '@/app/actions/storeActions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '店舗選択 | 書店管理システム',
  description: 'ご利用する店舗を選択してください',
};

export default async function StoreSelectionPage() {
  try {
    const initialStores = await getAllStores();
    return <StoreSelection initialStores={initialStores} />;
  } catch (error) {
    console.error('Failed to load stores:', error);
    return <StoreSelection initialStores={[]} initialError="店舗データの取得に失敗しました。" />;
  }
}
