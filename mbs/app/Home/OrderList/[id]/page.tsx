'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { OrderDetail, Prisma } from '@/app/generated/prisma';

// APIレスポンス用の型（Prismaのinclude結果）
type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    orderDetails: true;
  };
}>;

// 表示用の拡張型
interface OrderDetailWithDelivery extends OrderDetail {
  deliveryDetailId?: string;
}

// 日本円のフォーマット関数
const formatJPY = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount);
};

// 日付フォーマット関数
const formatDate = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD形式
};

const OrderDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || '';

  const [orderData, setOrderData] = useState<OrderWithRelations | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // ダミーデータを使用してデータを生成する関数
  const fetchOrderDetail = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      console.log('=== 注文明細ダミーデータを使用します ===', orderId);

      // APIを使用せず、直接ダミーデータを生成

      // seed.tsの20顧客データ
      const fallbackCustomers = [
        { id: 'C-00001', name: '大阪情報専門学校', contactPerson: '山田太郎' },
        { id: 'C-00002', name: '株式会社スマートソリューションズ', contactPerson: '佐藤次郎' },
        { id: 'C-00003', name: '株式会社SCC', contactPerson: '田中三郎' },
        { id: 'C-00004', name: '株式会社くら寿司', contactPerson: '鈴木四郎' },
        { id: 'C-00005', name: '株式会社大阪テクノロジー', contactPerson: '伊藤五郎' },
        { id: 'C-00006', name: '関西医科大学', contactPerson: '高橋六郎' },
        { id: 'C-00007', name: 'グローバル貿易株式会社', contactPerson: '中村七海' },
        { id: 'C-00008', name: '大阪市立図書館', contactPerson: '小林八雲' },
        { id: 'C-00009', name: '近畿大学', contactPerson: '松本九十' },
        { id: 'C-00010', name: '株式会社関西出版', contactPerson: '渡辺十郎' },
        { id: 'C-00011', name: 'さくら幼稚園', contactPerson: '斎藤春子' },
        { id: 'C-00012', name: '大阪府立高校', contactPerson: '加藤夏子' },
        { id: 'C-00013', name: '株式会社大阪エンジニアリング', contactPerson: '山本秋雄' },
        { id: 'C-00014', name: '関西料理学校', contactPerson: '木村冬彦' },
        { id: 'C-00015', name: '大阪アート美術館', contactPerson: '井上春夫' },
        { id: 'C-00016', name: '関西経済研究所', contactPerson: '佐々木夏子' },
        { id: 'C-00017', name: '大阪音楽院', contactPerson: '山下秋男' },
        { id: 'C-00018', name: '関西健康センター', contactPerson: '中島冬美' },
        { id: 'C-00019', name: '大阪ITスクール', contactPerson: '田村春樹' },
        { id: 'C-00020', name: '関西メディカルセンター', contactPerson: '小川夏菜' },
      ];

      // 注文IDから顧客を決定（O000001→C-00001のようにマッピング）
      const getCustomerByOrderId = (orderIdParam: string) => {
        // 注文IDから数値部分を抽出（O000001 → 1）
        const orderNumber = parseInt(orderIdParam.replace(/^O0*/, '')) || 1;
        // 顧客インデックスを計算（1-20の範囲で循環）
        const customerIndex = (orderNumber - 1) % 20;
        const selectedCustomer = fallbackCustomers[customerIndex];

        return {
          id: selectedCustomer.id,
          storeId: 'store-001',
          name: selectedCustomer.name,
          contactPerson: selectedCustomer.contactPerson,
          address: '大阪府大阪市内',
          phone: `06-${1000 + customerIndex}-${5678 + customerIndex}`,
          deliveryCondition: '営業時間内配送',
          note: `${selectedCustomer.name}向け配送`,
          updatedAt: new Date(),
          isDeleted: false,
          deletedAt: null,
        };
      };

      // seed.tsの商品データ（全30種類）
      const fallbackProducts = [
        // 既存の商品
        { name: '世界の名著シリーズ', price: 12000 },
        { name: '現代文学全集', price: 15000 },
        { name: 'プログラミング入門書', price: 5000 },
        { name: 'ビジネス戦略ガイド', price: 3000 },
        { name: '英語学習教材セット', price: 8500 },
        { name: '日本の歴史図鑑', price: 5000 },
        { name: '子供向け絵本セット', price: 3000 },
        { name: 'デザイン年鑑', price: 8000 },
        { name: '美術全集', price: 30000 },
        { name: '専門用語辞典', price: 5000 },
        // 新しい商品
        { name: 'AI入門ガイド', price: 6500 },
        { name: 'データサイエンス実践書', price: 7800 },
        { name: '世界経済年鑑', price: 9200 },
        { name: '健康医学事典', price: 11000 },
        { name: '料理レシピ大全', price: 4500 },
        { name: '建築デザイン集', price: 15800 },
        { name: '写真集・日本の風景', price: 12500 },
        { name: 'クラシック名曲解説', price: 6800 },
        { name: '現代アート図録', price: 18000 },
        { name: '日本文学選集', price: 9800 },
        { name: '科学実験図鑑', price: 7200 },
        { name: '世界遺産ガイド', price: 5600 },
        { name: 'プログラミング言語辞典', price: 8900 },
        { name: 'ビジネスマナー教本', price: 3200 },
        { name: '子育てハンドブック', price: 4100 },
        { name: '心理学入門', price: 5300 },
        { name: '環境問題資料集', price: 6700 },
        { name: '宇宙科学図鑑', price: 9500 },
        { name: 'スポーツトレーニング指南', price: 4800 },
        { name: '日本の伝統工芸', price: 11200 },
      ];

      // 注文IDベースのシード値を生成（一貫したデータ生成のため）
      const getSeededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      // 注文IDから数値シードを生成
      const orderSeed = parseInt(orderId.replace(/\D/g, '')) || 1;

      // 選択された顧客
      const selectedCustomer = getCustomerByOrderId(orderId);

      // 注文明細を決定的に生成（Math.randomの代わりにシード値を使用）
      const generateOrderDetails = () => {
        const details = [];
        const detailCount = Math.floor(getSeededRandom(orderSeed) * 3) + 2; // 2-4個の商品

        for (let i = 1; i <= detailCount; i++) {
          const productIndex = Math.floor(getSeededRandom(orderSeed + i) * fallbackProducts.length);
          const product = fallbackProducts[productIndex];
          const quantity = Math.floor(getSeededRandom(orderSeed + i + 100) * 10) + 1;

          details.push({
            id: `${orderId}-${String(i).padStart(2, '0')}`,
            orderId: orderId,
            productName: product.name,
            unitPrice: product.price,
            quantity: quantity,
            description: `${selectedCustomer.name}向け商品`,
            updatedAt: new Date(),
            isDeleted: false,
            deletedAt: null,
          });
        }

        return details;
      };

      const fallbackOrderData: OrderWithRelations = {
        id: orderId,
        customerId: selectedCustomer.id,
        orderDate: new Date('2025-01-01'),
        note: `${selectedCustomer.name}からの注文`,
        status: getSeededRandom(orderSeed + 1000) > 0.5 ? '完了' : '未完了',
        updatedAt: new Date(),
        isDeleted: false,
        deletedAt: null,
        customer: selectedCustomer,
        orderDetails: generateOrderDetails(),
      };

      setOrderData(fallbackOrderData);
    } finally {
      setLoading(false);
    }
  }, [orderId]); // orderIdを依存関係に追加

  // コンポーネントマウント時にデータを取得
  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId, fetchOrderDetail]); // fetchOrderDetailを依存関係に追加

  // 納品明細IDを取得する関数（簡易実装）
  const getDeliveryDetailId = (orderDetailId: string): string => {
    // 注文明細IDを納品明細IDに変換（O→D）
    return orderDetailId.replace(/^O/, 'D');
  };

  // 表示用データに納品明細IDを追加
  const displayOrderDetails: OrderDetailWithDelivery[] = orderData?.orderDetails
    ? orderData.orderDetails.map((detail) => ({
        ...detail,
        deliveryDetailId: getDeliveryDetailId(detail.id),
      }))
    : [];

  // 空行を追加（合計10行になるよう調整）
  while (displayOrderDetails.length < 10) {
    displayOrderDetails.push({
      id: '',
      orderId: '',
      productName: '',
      unitPrice: 0,
      quantity: 0,
      description: '',
      updatedAt: new Date(),
      isDeleted: false,
      deletedAt: null,
      deliveryDetailId: '',
    });
  }

  // 合計金額計算
  const totalAmount = orderData?.orderDetails
    ? orderData.orderDetails.reduce((sum, detail) => sum + detail.unitPrice * detail.quantity, 0)
    : 0;

  // ハンドラー関数
  const handleEdit = () => {
    router.push(`/Home/OrderList/${orderId}/Edit`);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    alert('注文を削除しました（デモのため実際の削除は行われていません）');
    router.push('/Home/OrderList');
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handlePdfExport = () => {
    alert('PDFを出力しています（デモのため実際の出力は行われていません）');
  };


  return (
    <>
      <div
        className={`container mx-auto max-w-7xl px-2 py-4 transition-all  sm:px-4 sm:py-6 lg:px-6`}
      >
        {/* ヘッダー */}
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800 sm:text-xl lg:text-2xl">
              注文明細 - {orderData?.id || 'ID不明'}
            </h1>
            {orderData && (
              <p className="mt-1 text-sm text-gray-600">
                注文日: {formatDate(orderData.orderDate)} | 状態:
                <span
                  className={`ml-1 rounded-full px-2 py-1 text-xs font-semibold ${
                    orderData.status === '完了'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {orderData.status}
                </span>
              </p>
            )}
          </div>
          <div>
            <button
              onClick={handleEdit}
              className="rounded-lg border border-yellow-600 bg-yellow-400 px-4 py-2 text-sm font-bold text-black shadow-sm transition-colors hover:bg-yellow-500 sm:text-base"
              disabled={showDeleteModal}
            >
              編集
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 xl:flex-row">
          {/* 注文明細テーブル（左側・メイン） */}
          <div className="w-full xl:w-2/3">
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="bg-blue-500 p-3 text-white">
                <h2 className="text-base font-semibold sm:text-lg">注文明細一覧</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] border-collapse text-center text-xs sm:text-sm">
                  <thead className="bg-blue-300">
                    <tr>
                      <th className="w-[15%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        注文明細ID
                      </th>
                      <th className="w-[25%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        商品名
                      </th>
                      <th className="w-[12%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        単価
                      </th>
                      <th className="w-[8%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        数量
                      </th>
                      <th className="w-[15%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        納品明細ID
                      </th>
                      <th className="w-[25%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        摘要
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayOrderDetails.map((item, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? 'bg-blue-50' : 'bg-white'
                        } h-10 transition-colors hover:bg-blue-100 sm:h-12`}
                      >
                        <td className="truncate border border-gray-400 px-2 py-1 font-mono text-xs sm:px-3 sm:py-2">
                          {item.id}
                        </td>
                        <td className="truncate border border-gray-400 px-2 py-1 text-left sm:px-3 sm:py-2">
                          {item.productName}
                        </td>
                        <td className="border border-gray-400 px-2 py-1 text-right font-medium sm:px-3 sm:py-2">
                          {item.unitPrice > 0 ? formatJPY(item.unitPrice) : ''}
                        </td>
                        <td className="border border-gray-400 px-2 py-1 text-right font-medium sm:px-3 sm:py-2">
                          {item.quantity > 0 ? item.quantity.toLocaleString() : ''}
                        </td>
                        <td className="truncate border border-gray-400 px-2 py-1 font-mono text-xs sm:px-3 sm:py-2">
                          {item.deliveryDetailId}
                        </td>
                        <td className="truncate border border-gray-400 px-2 py-1 text-left sm:px-3 sm:py-2">
                          {item.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 合計金額表示 */}
              <div className="border-t bg-gray-50 p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 sm:text-base">合計金額:</span>
                  <span className="text-lg font-bold text-blue-600 sm:text-xl">
                    {formatJPY(totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 注文情報と顧客情報（右側） */}
          <div className="flex w-full flex-col gap-6 xl:w-1/3">
            {/* 注文情報 */}
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="bg-slate-700 p-3 text-white">
                <h2 className="text-base font-semibold sm:text-lg">注文情報</h2>
              </div>
              <div className="text-xs sm:text-sm">
                <div className="divide-y divide-gray-200">
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">注文ID</div>
                    <div className="w-3/5 p-3 font-mono break-all">{orderData?.id || 'N/A'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">注文日</div>
                    <div className="w-3/5 p-3">
                      {orderData ? formatDate(orderData.orderDate) : 'N/A'}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">状態</div>
                    <div className="w-3/5 p-3">
                      {orderData?.status && (
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            orderData.status === '完了'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {orderData.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">備考</div>
                    <div className="w-3/5 p-3 break-all">{orderData?.note || '（なし）'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 顧客情報 */}
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <div className="bg-slate-700 p-3 text-white">
                <h2 className="text-base font-semibold sm:text-lg">顧客情報</h2>
              </div>
              <div className="text-xs sm:text-sm">
                <div className="divide-y divide-gray-200">
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">顧客ID</div>
                    <div className="w-3/5 p-3 font-mono break-all">
                      {orderData?.customer?.id || 'N/A'}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">名義</div>
                    <div className="w-3/5 p-3 font-semibold break-all">
                      {orderData?.customer?.name || 'N/A'}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">担当者</div>
                    <div className="w-3/5 p-3 break-all">
                      {orderData?.customer?.contactPerson || 'N/A'}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">電話番号</div>
                    <div className="w-3/5 p-3">{orderData?.customer?.phone || 'N/A'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">配達条件</div>
                    <div className="w-3/5 p-3 break-all">
                      {orderData?.customer?.deliveryCondition || 'N/A'}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">住所</div>
                    <div className="w-3/5 p-3 break-all">
                      {orderData?.customer?.address || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:gap-4">
          <button
            onClick={handleDelete}
            className="order-2 rounded-lg border border-red-700 bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 sm:order-1 sm:text-base"
            disabled={showDeleteModal}
          >
            削除
          </button>
          <button
            onClick={handlePdfExport}
            className="order-1 rounded-lg border border-blue-700 bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 sm:order-2 sm:text-base"
          >
            PDF出力
          </button>
        </div>
      </div>

      {/* 削除確認モーダル - 完全に独立したコンポーネント */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-brightness-50">
          <div className="w-full max-w-sm scale-100 transform rounded-2xl bg-white shadow-xl transition-all duration-50">
            <div className="p-6 text-center">
              {/* 警告アイコン */}
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-8 w-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h3 className="mb-2 text-xl font-bold text-gray-900">注文削除</h3>

              <p className="mb-4 text-sm text-gray-600">削除すると以下の情報が全て失われます</p>

              {/* 削除される情報のリスト */}
              <div className="mb-6 rounded-lg bg-gray-50 p-4 text-left">
                <ul className="space-y-2 text-sm text-gray-800">
                  <li className="flex items-center">
                    <span className="mr-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500"></span>
                    <span className="font-medium">注文明細情報</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500"></span>
                    <span className="font-medium">商品データ</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500"></span>
                    <span className="font-medium">金額情報</span>
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500"></span>
                    <span className="font-medium">配送履歴</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderDetailPage;
