'use client';

import React, { useState } from 'react';
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
  deliveryAllocations?: {
    deliveryDetailId: string;
    deliveryDate: string;
    allocatedQuantity: number;
    deliveryId: string;
  }[];
  totalDelivered?: number;
  deliveryStatus?: string;
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

// 削除確認モーダルコンポーネント
const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  orderData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderData: OrderWithRelations | null;
}) => {
  if (!isOpen || !orderData) return null;

  const totalAmount = orderData.orderDetails.reduce(
    (sum, detail) => sum + detail.unitPrice * detail.quantity,
    0,
  );
  const productCount = orderData.orderDetails.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-brightness-50">
      <div className="w-full max-w-md scale-100 transform rounded-2xl bg-white shadow-xl transition-all duration-50">
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

          <p className="mb-4 text-sm text-gray-600">以下の注文を削除してもよろしいですか？</p>

          {/* 削除対象注文の情報表示 */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <div className="space-y-3 text-left">
              <div>
                <div className="mb-1 flex items-center">
                  <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
                  <span className="text-sm font-medium text-gray-800">注文ID</span>
                </div>
                <p className="ml-4 font-mono text-sm font-semibold text-gray-900">{orderData.id}</p>
              </div>

              <div>
                <div className="mb-1 flex items-center">
                  <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></span>
                  <span className="text-sm font-medium text-gray-800">顧客名</span>
                </div>
                <p className="ml-4 text-sm font-semibold text-gray-900">
                  {orderData.customer.name}
                </p>
              </div>

              <div>
                <div className="mb-1 flex items-center">
                  <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-purple-500"></span>
                  <span className="text-sm font-medium text-gray-800">注文日</span>
                </div>
                <p className="ml-4 text-sm font-semibold text-gray-900">
                  {formatDate(orderData.orderDate)}
                </p>
              </div>

              <div className="flex justify-between">
                <div className="w-1/2 pr-2">
                  <div className="mb-1 flex items-center">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-orange-500"></span>
                    <span className="text-sm font-medium text-gray-800">商品数</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-900">{productCount}点</p>
                </div>

                <div className="w-1/2 pl-2">
                  <div className="mb-1 flex items-center">
                    <span className="mr-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500"></span>
                    <span className="text-sm font-medium text-gray-800">合計金額</span>
                  </div>
                  <p className="ml-4 text-sm font-semibold text-gray-900">
                    {formatJPY(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mb-6 text-xs text-red-600">この操作は取り消すことができません。</p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              キャンセル
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-red-700"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = (params?.id as string) || '';

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // ダミーデータを生成する関数
  const generateOrderData = (): OrderWithRelations => {
    console.log('=== 注文明細ダミーデータを使用します ===', orderId);

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

    return fallbackOrderData;
  };

  // 注文データを直接生成（useEffectを使用しない）
  const orderData = generateOrderData();

  // 納品情報を取得する関数（複数納品対応）
  const getDeliveryInfo = (orderDetailId: string, orderQuantity: number) => {
    // 注文明細IDに基づいて納品情報を生成（ダミーロジック）
    const seed = parseInt(orderDetailId.slice(-1)) || 0;
    const deliveryCount = Math.floor(seed / 2) + 1; // 1-4個の納品
    const allocations = [];
    let totalDelivered = 0;

    // 実際の注文数量を基準に納品を生成
    const maxDeliverable = orderQuantity;

    for (let i = 0; i < deliveryCount && totalDelivered < maxDeliverable; i++) {
      const deliveryDate = new Date(2025, 0, 1 + i * 7); // 7日間隔

      const allocatedQuantity = Math.floor((seed + i) * 1.5) + 5; // 5-15個程度
      const deliveryId = `D${String(seed + i + 1).padStart(6, '0')}`;
      const deliveryDetailId = `${deliveryId}-${String(i + 1).padStart(2, '0')}`;

      allocations.push({
        deliveryDetailId,
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        allocatedQuantity,
        deliveryId,
      });
      totalDelivered += allocatedQuantity;
    }

    // ステータス判定を実際の数量で行う
    let status = '未納品';
    if (totalDelivered >= orderQuantity) {
      status = '完了';
    } else if (totalDelivered > 0) {
      status = '一部納品';
    }

    // 一定確率で未納品状態を作る
    if (seed % 4 === 0) {
      // 25%の確率で未納品
      return {
        deliveryAllocations: [],
        totalDelivered: 0,
        deliveryStatus: '未納品'
      };
    } else if (seed % 4 === 1) {
      // 25%の確率で一部納品（最後の配送を未完了にする）
      if (allocations.length > 1) {
        // 最後の配送を削除して一部納品状態にする
        const partialAllocations = allocations.slice(0, -1);
        const partialTotal = partialAllocations.reduce((sum, alloc) => sum + alloc.allocatedQuantity, 0);
        
        return {
          deliveryAllocations: partialAllocations,
          totalDelivered: partialTotal,
          deliveryStatus: '一部納品'
        };
      } else {
        // 配送が1つしかない場合は、その配送を部分的にする
        const partialQuantity = Math.floor(allocations[0].allocatedQuantity * 0.7);
        const partialAllocations = [{
          ...allocations[0],
          allocatedQuantity: partialQuantity
        }];
        
        return {
          deliveryAllocations: partialAllocations,
          totalDelivered: partialQuantity,
          deliveryStatus: '一部納品'
        };
      }
    }

    return {
      deliveryAllocations: allocations,
      totalDelivered,
      deliveryStatus: status,
    };
  };

  
  const displayOrderDetails: OrderDetailWithDelivery[] = orderData.orderDetails.map((detail) => {
    const deliveryInfo = getDeliveryInfo(detail.id, detail.quantity);
    return {
      ...detail,
      ...deliveryInfo,
    };
  });


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
      deliveryAllocations: [],
      totalDelivered: 0,
      deliveryStatus: '',
    });
  }

  // 合計金額計算
  const totalAmount = orderData.orderDetails.reduce(
    (sum, detail) => sum + detail.unitPrice * detail.quantity,
    0,
  );

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

  // 行の展開/折りたたみハンドラー
  const toggleRowExpansion = (orderDetailId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderDetailId)) {
      newExpanded.delete(orderDetailId);
    } else {
      newExpanded.add(orderDetailId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <>
      <div
        className={`container mx-auto max-w-7xl px-2 py-4 transition-all sm:px-4 sm:py-6 lg:px-6`}
      >
        {/* ヘッダー */}
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800 sm:text-xl lg:text-2xl">
              注文明細 - {orderData.id}
            </h1>
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
                        納品状況
                      </th>
                      <th className="w-[25%] border border-gray-400 px-2 py-2 font-semibold sm:px-3 sm:py-3">
                        摘要
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayOrderDetails.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr
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
                          <td className="border border-gray-400 px-2 py-1 text-center sm:px-3 sm:py-2">
                            {item.deliveryStatus && (
                              <div className="flex items-center justify-center gap-2">
                                <span
                                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                    item.deliveryStatus === '完了'
                                      ? 'bg-green-100 text-green-800'
                                      : item.deliveryStatus === '一部納品'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : item.deliveryStatus === '未納品'
                                          ? 'bg-red-100 text-red-800'
                                          : ''
                                  }`}
                                >
                                  {item.deliveryStatus}
                                </span>
                                {item.deliveryAllocations &&
                                  item.deliveryAllocations.length > 0 && (
                                    <button
                                      onClick={() => toggleRowExpansion(item.id)}
                                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                                      title={
                                        expandedRows.has(item.id) ? '詳細を閉じる' : '詳細を表示'
                                      }
                                    >
                                      {expandedRows.has(item.id) ? '▲' : '▼'}
                                    </button>
                                  )}
                              </div>
                            )}
                          </td>
                          <td className="truncate border border-gray-400 px-2 py-1 text-left sm:px-3 sm:py-2">
                            {item.description}
                          </td>
                        </tr>

                        {/* 展開時の詳細情報 */}
                        {expandedRows.has(item.id) &&
                          item.deliveryAllocations &&
                          item.deliveryAllocations.length > 0 && (
                            <tr className="bg-gray-50">
                              <td colSpan={6} className="border border-gray-400 px-4 py-3">
                                <div className="text-sm">
                                  <div className="mb-2 font-medium text-gray-700">
                                    納品明細 ({item.totalDelivered || 0}/{item.quantity} 個)
                                  </div>
                                  <div className="space-y-1">
                                    {item.deliveryAllocations.map((allocation, allocIndex) => (
                                      <div
                                        key={allocIndex}
                                        className="flex items-center justify-between rounded bg-white px-3 py-2 text-xs"
                                      >
                                        <div className="flex gap-4">
                                          <span className="font-mono text-blue-600">
                                            {allocation.deliveryDetailId}
                                          </span>
                                          <span className="text-gray-600">
                                            {allocation.deliveryDate}
                                          </span>
                                          <span className="font-medium">
                                            {allocation.allocatedQuantity}個
                                          </span>
                                        </div>
                                        <span className="text-gray-500">
                                          納品ID: {allocation.deliveryId}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                      </React.Fragment>
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
                    <div className="w-3/5 p-3 font-mono break-all">{orderData.id}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">注文日</div>
                    <div className="w-3/5 p-3">{formatDate(orderData.orderDate)}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">状態</div>
                    <div className="w-3/5 p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          orderData.status === '完了'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {orderData.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">備考</div>
                    <div className="w-3/5 p-3 break-all">{orderData.note || '（なし）'}</div>
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
                    <div className="w-3/5 p-3 font-mono break-all">{orderData.customer.id}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">名義</div>
                    <div className="w-3/5 p-3 font-semibold break-all">
                      {orderData.customer.name}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">担当者</div>
                    <div className="w-3/5 p-3 break-all">{orderData.customer.contactPerson}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">電話番号</div>
                    <div className="w-3/5 p-3">{orderData.customer.phone}</div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">配達条件</div>
                    <div className="w-3/5 p-3 break-all">
                      {orderData.customer.deliveryCondition}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="w-2/5 bg-slate-100 p-3 font-medium text-gray-700">住所</div>
                    <div className="w-3/5 p-3 break-all">{orderData.customer.address}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-8 flex flex-row items-center justify-center gap-3 sm:justify-between sm:gap-4">
          <button
            onClick={handleDelete}
            className="w-32 rounded-lg border border-red-700 bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-red-700 sm:w-auto sm:px-6 sm:text-base"
            disabled={showDeleteModal}
          >
            削除
          </button>
          <button
            onClick={handlePdfExport}
            className="w-32 rounded-lg border border-blue-700 bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700 sm:w-auto sm:px-6 sm:text-base"
          >
            PDF出力
          </button>
        </div>
      </div>

      {/* 削除確認モーダル */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        orderData={orderData}
      />
    </>
  );
};

export default OrderDetailPage;
