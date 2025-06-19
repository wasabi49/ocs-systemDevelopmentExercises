import React from 'react';
import { fetchOrderWithDetails } from '@/app/actions/orderActions';
import OrderDetailClient from './components/OrderDetailClient';

// Props型定義
interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

// Server Component
export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id: orderId } = await params;

  // サーバーサイドでデータ取得
  const result = await fetchOrderWithDetails(orderId);

  if (!result.success) {
    return <OrderDetailClient orderId={orderId} initialOrderData={null} error={result.error} />;
  }

  return <OrderDetailClient orderId={orderId} initialOrderData={result.data} />;
}
