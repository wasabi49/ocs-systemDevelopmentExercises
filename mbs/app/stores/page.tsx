import StoreSelection from '@/app/components/StoreSelection';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '店舗選択 | 受注管理システム',
  description: 'ご利用する店舗を選択してください',
};

export default function StoreSelectionPage() {
  return <StoreSelection />;
}
