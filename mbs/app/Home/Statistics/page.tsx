import React from 'react';
import { redirect } from 'next/navigation';
import { fetchStatistics } from '@/app/actions/statisticsActions';
import StatisticsListClient from './components/StatisticsListClient';

// cookieを使用するため動的レンダリングを指定
export const dynamic = 'force-dynamic';

interface StatisticsData {
  customerId: string;
  customerName: string;
  averageLeadTime: number;
  totalSales: number;
  updatedAt: string;
}

// Server Component
export default async function StatisticsPage() {
  // 統計データを取得
  const statisticsResult = await fetchStatistics();

  // 店舗選択が必要な場合はリダイレクト
  if (statisticsResult.status === 'store_required') {
    redirect('/stores');
  }

  let statisticsData: StatisticsData[] = [];

  if (statisticsResult.status === 'success') {
    statisticsData = statisticsResult.data || [];
  } else {
    console.error('統計データの取得に失敗:', statisticsResult.error);
    // エラー時は空配列を渡す
    statisticsData = [];
  }

  return <StatisticsListClient statisticsData={statisticsData} />;
}
