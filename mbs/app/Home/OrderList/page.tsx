import React from 'react';
import OrderListClient from './components/OrderListClient';
import { fetchOrders } from '@/app/actions/orderActions';
import type { Order } from '@/app/generated/prisma';
import { checkStoreRequirement } from '@/app/utils/storeRedirect';

// 表示用の注文データ型（seed.tsのOrder + フラット化された顧客情報）
interface OrderWithCustomer extends Order {
  customerName: string;
  customerContactPerson: string;
}

// Server Component - default export
export default async function OrderListPage() {
  // サーバーサイドでデータ取得
  const result = await fetchOrders();
  
  // 店舗未選択の場合はリダイレクト
  checkStoreRequirement(result);

  let orders: OrderWithCustomer[] = [];

  if (result.status === 'success') {
    // API応答データを表示用の型に変換
    orders = result.data.map((orderData) => ({
      id: orderData.id,
      customerId: orderData.customerId,
      orderDate: new Date(orderData.orderDate),
      note: orderData.note,
      status: orderData.status,
      updatedAt: new Date(orderData.updatedAt),
      isDeleted: orderData.isDeleted,
      deletedAt: orderData.deletedAt ? new Date(orderData.deletedAt) : null,
      customerName: orderData.customer.name,
      customerContactPerson: orderData.customer.contactPerson || '',
    }));
  } else {
    console.error('初期データの取得に失敗:', result.error);
    // エラー時は空配列を渡す
    orders = [];
  }

  return <OrderListClient initialOrders={orders} />;
}
