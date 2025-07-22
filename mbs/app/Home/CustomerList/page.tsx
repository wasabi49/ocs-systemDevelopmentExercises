import React from 'react';
import { redirect } from 'next/navigation';
import { fetchCustomers } from '@/app/actions/customerActions';
import CustomerListClient from './components/CustomerListClient';

// cookieを使用するため動的レンダリングを指定
export const dynamic = 'force-dynamic';

// 顧客データの型定義
type Customer = {
  id: string;
  customerName: string;
  managerName: string;
  storeName: string;
};

// Server Component
export default async function CustomerListPage() {
  // サーバーサイドでデータ取得（storeIdはCookieから自動取得）
  const result = await fetchCustomers();

  // 店舗選択が必要な場合はリダイレクト
  if (result.status === 'store_required' || result.status === 'store_invalid') {
    redirect('/stores');
  }

  let customers: Customer[] = [];

  if (result.status === 'success') {
    customers = result.data;
  } else {
    console.error('初期データの取得に失敗:', result.error);
    // エラー時は空配列を渡す
    customers = [];
  }

  return <CustomerListClient initialCustomers={customers} />;
}
