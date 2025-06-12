import { fetchDeliveries } from '@/app/actions/deliveryActions';
import DeliveryListClient, { Delivery } from './components/DeliveryListClient';


export default async function DeliveryListPage() {
  // サーバーサイドで初期データを取得
  const result = await fetchDeliveries();
  const initialDeliveries: Delivery[] = result.status === 'success' ? result.data : [];


<<<<<<< HEAD
  const renderSortIcons = (field: keyof Delivery) => {
    return (
      <span className="ml-1 text-xs">
        <span
          className={sortField === field && sortOrder === 'asc' ? 'font-bold' : 'text-gray-400'}
        >
          ▲
        </span>
        <span
          className={sortField === field && sortOrder === 'desc' ? 'font-bold' : 'text-gray-400'}
        >
          ▼
        </span>
      </span>
    );
  };

  const handleSort = (field: keyof Delivery) => {
    const order = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    const sorted = [...deliveries].sort((a, b) => {
      if (a[field] === b[field]) return 0;
      return order === 'asc' ? (a[field] > b[field] ? 1 : -1) : a[field] < b[field] ? 1 : -1;
    });
    setSortField(field);
    setSortOrder(order);
    setDeliveries(sorted);
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (searchField === 'すべて') {
      return (
        delivery.id.includes(searchKeyword) ||
        delivery.date.includes(searchKeyword) ||
        delivery.customerName.includes(searchKeyword) ||
        delivery.note.includes(searchKeyword)
      );
    }
    return delivery[searchField as keyof Delivery].includes(searchKeyword);
  });

  // 15行確保
  const displayedDeliveries = [...filteredDeliveries];
  while (displayedDeliveries.length < 15) {
    displayedDeliveries.push({ id: '', date: '', customerName: '', note: '' });
=======
  // エラーがある場合のログ出力
  if (result.status === 'error') {
    console.error('納品データの取得に失敗しました:', result.error);
>>>>>>> 87be67ea1a9dd78d33917ac8ee5cefcdaa012847
  }

  return <DeliveryListClient initialDeliveries={initialDeliveries} />;v
}
