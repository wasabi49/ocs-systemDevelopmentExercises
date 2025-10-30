import { fetchDeliveries } from '@/app/actions/deliveryActions';
import DeliveryListClient, { Delivery } from './components/DeliveryListClient';
import { checkStoreRequirement } from '@/app/utils/storeRedirect';

// cookieを使用するため動的レンダリングを指定
export const dynamic = 'force-dynamic';

export default async function DeliveryListPage() {
  // サーバーサイドで初期データを取得
  const result = await fetchDeliveries();
  
  // 店舗未選択の場合はリダイレクト
  checkStoreRequirement(result);
  
  const initialDeliveries: Delivery[] = result.status === 'success' ? result.data : [];

  // エラーがある場合のログ出力
  if (result.status === 'error') {
    console.error('納品データの取得に失敗しました:', result.error);
  }

  return <DeliveryListClient initialDeliveries={initialDeliveries} />;

}
