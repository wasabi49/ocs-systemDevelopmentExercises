import { fetchDeliveries } from '@/app/actions/deliveryActions';
import DeliveryListClient, { Delivery } from './components/DeliveryListClient';


export default async function DeliveryListPage() {
  // サーバーサイドで初期データを取得
  const result = await fetchDeliveries();
  const initialDeliveries: Delivery[] = result.status === 'success' ? result.data : [];


  // エラーがある場合のログ出力
  if (result.status === 'error') {
    console.error('納品データの取得に失敗しました:', result.error);
  }

  return <DeliveryListClient initialDeliveries={initialDeliveries} />;v
}
