import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // データベースの完全クリーンアップ - 外部キー制約を考慮した削除順序
  console.log('Starting database cleanup...');

  // 1. 最も依存関係の多いテーブルから削除（多対多の関連テーブル）
  console.log('Cleaning delivery allocations...');
  await prisma.deliveryAllocation.deleteMany({});

  // 2. 明細テーブル
  console.log('Cleaning details tables...');
  await prisma.deliveryDetail.deleteMany({});
  await prisma.orderDetail.deleteMany({});

  // 3. 主要トランザクションテーブル
  console.log('Cleaning transaction tables...');
  await prisma.delivery.deleteMany({});
  await prisma.order.deleteMany({});

  // 4. 統計テーブル
  console.log('Cleaning statistics table...');
  await prisma.statistics.deleteMany({});

  // 5. 顧客テーブル
  console.log('Cleaning customer table...');
  await prisma.customer.deleteMany({});

  // 6. 基本テーブル（依存されるテーブル）
  console.log('Cleaning store table...');
  await prisma.store.deleteMany({});

  console.log('Database cleanup completed successfully');

  // 店舗データ作成
  const store = await prisma.store.create({
    data: {
      name: '本社',
    },
  });

  // 顧客データ作成
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: 'C-00001',
        name: '大阪情報専門学校',
        storeId: store.id,
        contactPerson: '山田太郎',
        address: '大阪府大阪市北区',
        phone: '06-1234-5678',
        deliveryCondition: '通常2-3営業日以内',
        note: '学校関連の納品は事前に連絡が必要',
      },
    }),
    prisma.customer.create({
      data: {
        id: 'C-00002',
        name: '株式会社スマートソリューションズ',
        storeId: store.id,
        contactPerson: '佐藤次郎',
        address: '大阪府大阪市中央区',
        phone: '06-2345-6789',
        deliveryCondition: '当日納品対応可',
        note: '重要顧客、優先対応',
      },
    }),
    prisma.customer.create({
      data: {
        id: 'C-00003',
        name: '株式会社SCC',
        storeId: store.id,
        contactPerson: '田中三郎',
        address: '大阪府吹田市',
        phone: '06-3456-7890',
        deliveryCondition: '午前中指定',
        note: '大口顧客',
      },
    }),
    prisma.customer.create({
      data: {
        id: 'C-00004',
        name: '株式会社くら寿司',
        storeId: store.id,
        contactPerson: '鈴木四郎',
        address: '大阪府堺市',
        phone: '072-456-7890',
        deliveryCondition: '食品関連は温度管理必須',
        note: '衛生管理に特に注意',
      },
    }),
  ]);

  // 統計データの作成
  await Promise.all(
    customers.map((customer) =>
      prisma.statistics.create({
        data: {
          customerId: customer.id,
          averageLeadTime: Math.floor(Math.random() * 10) + 2, // 2-12日のリードタイム
          totalSales: Math.floor(Math.random() * 5000000) + 1000000, // 100万円-600万円の売上
        },
      }),
    ),
  );

  // 注文データの作成
  const orderStatuses = ['完了', '未完了'];
  const orders = [];

  for (let i = 1; i <= 20; i++) {
    const customerId = customers[Math.floor(Math.random() * customers.length)].id;
    const orderDate = new Date(
      2025,
      Math.floor(Math.random() * 6),
      Math.floor(Math.random() * 28) + 1,
    );

    const order = await prisma.order.create({
      data: {
        id: `O${String(i).padStart(6, '0')}`,
        customerId,
        orderDate,
        status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        note: `注文${i}の備考`,
      },
    });

    orders.push(order);
  }

  // 注文明細データの作成
  const products = [
    { name: 'ノートパソコン', price: 120000 },
    { name: 'デスクトップPC', price: 150000 },
    { name: 'タブレット', price: 50000 },
    { name: 'プリンタ', price: 30000 },
    { name: 'モニター', price: 25000 },
    { name: 'キーボード', price: 5000 },
    { name: 'マウス', price: 3000 },
    { name: 'ソフトウェアライセンス', price: 80000 },
    { name: 'サーバー', price: 300000 },
    { name: 'ネットワーク機器', price: 50000 },
  ];

  const orderDetails = [];

  for (const order of orders) {
    // 各注文に1-3個の商品を追加
    const itemCount = Math.floor(Math.random() * 3) + 1;

    for (let j = 1; j <= itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;

      const orderDetail = await prisma.orderDetail.create({
        data: {
          id: `${order.id}-${String(j).padStart(2, '0')}`,
          orderId: order.id,
          productName: product.name,
          unitPrice: product.price,
          quantity,
          description: `${product.name}の詳細説明`,
        },
      });

      orderDetails.push(orderDetail);
    }
  }

  // 納品データの作成
  const deliveryData = [
    { id: 'D00001', date: '2025/05/01', customerName: '大阪情報専門学校', note: '初回納品' },
    {
      id: 'D00002',
      date: '2025/05/03',
      customerName: '株式会社スマートソリューションズ',
      note: '追加納品',
    },
    { id: 'D00003', date: '2025/05/05', customerName: '株式会社SCC', note: '緊急納品' },
    { id: 'D00004', date: '2025/05/07', customerName: '株式会社くら寿司', note: '定期納品' },
    { id: 'D00005', date: '2025/05/10', customerName: '大阪情報専門学校', note: '教材納品' },
    {
      id: 'D00006',
      date: '2025/05/12',
      customerName: '株式会社スマートソリューションズ',
      note: '機材納品',
    },
    { id: 'D00007', date: '2025/05/15', customerName: '株式会社SCC', note: '追加注文対応' },
    { id: 'D00008', date: '2025/05/18', customerName: '株式会社くら寿司', note: '新メニュー対応' },
    { id: 'D00009', date: '2025/05/20', customerName: '大阪情報専門学校', note: 'イベント用納品' },
    {
      id: 'D00010',
      date: '2025/05/22',
      customerName: '株式会社スマートソリューションズ',
      note: '展示会用納品',
    },
    { id: 'D00011', date: '2025/05/25', customerName: '株式会社SCC', note: '特別納品' },
    { id: 'D00012', date: '2025/05/28', customerName: '株式会社くら寿司', note: '季節限定商品' },
    { id: 'D00013', date: '2025/06/01', customerName: '大阪情報専門学校', note: '追加教材納品' },
    {
      id: 'D00014',
      date: '2025/06/03',
      customerName: '株式会社スマートソリューションズ',
      note: '新規プロジェクト対応',
    },
    { id: 'D00015', date: '2025/06/05', customerName: '株式会社SCC', note: '定期納品' },
    { id: 'D00016', date: '2025/06/07', customerName: '株式会社くら寿司', note: '新店舗対応' },
    { id: 'D00017', date: '2025/06/10', customerName: '大阪情報専門学校', note: '夏季講習用納品' },
    {
      id: 'D00018',
      date: '2025/06/12',
      customerName: '株式会社スマートソリューションズ',
      note: '追加機材納品',
    },
    { id: 'D00019', date: '2025/06/15', customerName: '株式会社SCC', note: '緊急対応' },
    { id: 'D00020', date: '2025/06/18', customerName: '株式会社くら寿司', note: '新商品テスト' },
    { id: 'D00021', date: '2025/06/20', customerName: '大阪情報専門学校', note: '卒業式用納品' },
    {
      id: 'D00022',
      date: '2025/06/22',
      customerName: '株式会社スマートソリューションズ',
      note: '展示会追加納品',
    },
    { id: 'D00023', date: '2025/06/25', customerName: '株式会社SCC', note: '特別対応' },
    { id: 'D00024', date: '2025/06/28', customerName: '株式会社くら寿司', note: '夏季限定商品' },
    { id: 'D00025', date: '2025/07/01', customerName: '大阪情報専門学校', note: '新学期準備' },
    {
      id: 'D00026',
      date: '2025/07/03',
      customerName: '株式会社スマートソリューションズ',
      note: '新規案件対応',
    },
    { id: 'D00027', date: '2025/07/05', customerName: '株式会社SCC', note: '追加納品' },
    {
      id: 'D00028',
      date: '2025/07/07',
      customerName: '株式会社くら寿司',
      note: '新規店舗オープン',
    },
    {
      id: 'D00029',
      date: '2025/07/10',
      customerName: '大阪情報専門学校',
      note: '夏季講習追加納品',
    },
    {
      id: 'D00030',
      date: '2025/07/12',
      customerName: '株式会社スマートソリューションズ',
      note: '展示会終了後対応',
    },
  ];

  // 顧客名からIDを取得するヘルパー関数
  const getCustomerIdByName = (name: string) => {
    const customer = customers.find((c) => c.name === name);
    if (!customer) {
      throw new Error(`Customer with name ${name} not found`);
    }
    return customer.id;
  };

  // 納品データをDBに登録
  const deliveries = [];
  for (const delivery of deliveryData) {
    const [year, month, day] = delivery.date.split('/').map(Number);
    const deliveryDate = new Date(year, month - 1, day);
    const totalQuantity = Math.floor(Math.random() * 100);
    const totalAmount = Math.floor(Math.random() * 100000);

    const createdDelivery = await prisma.delivery.create({
      data: {
        id: delivery.id,
        customerId: getCustomerIdByName(delivery.customerName),
        deliveryDate: deliveryDate,
        note: delivery.note,
        totalAmount: totalAmount,
        totalQuantity: totalQuantity,
      },
    });

    deliveries.push(createdDelivery);
  }

  // 納品明細データの作成
  const deliveryDetails = [];
  for (const delivery of deliveries) {
    // 各納品に1-4個の商品を追加
    const itemCount = Math.floor(Math.random() * 4) + 1;
    let totalAmount = 0;
    let totalQuantity = 0;

    for (let j = 1; j <= itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const amount = product.price * quantity;

      totalAmount += amount;
      totalQuantity += quantity;

      const deliveryDetail = await prisma.deliveryDetail.create({
        data: {
          id: `${delivery.id}-${String(j).padStart(2, '0')}`,
          deliveryId: delivery.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: quantity,
        },
      });

      deliveryDetails.push(deliveryDetail);
    }

    // 納品の合計金額と数量を更新
    await prisma.delivery.update({
      where: { id: delivery.id },
      data: { totalAmount, totalQuantity },
    });
  }

  // 納品割当データの作成（注文明細と納品明細の関連付け）
  for (let i = 0; i < 15; i++) {
    const orderDetail = orderDetails[Math.floor(Math.random() * orderDetails.length)];
    const deliveryDetail = deliveryDetails[Math.floor(Math.random() * deliveryDetails.length)];

    // 既に割り当てが存在するか確認
    const existingAllocation = await prisma.deliveryAllocation.findUnique({
      where: {
        orderDetailId_deliveryDetailId: {
          orderDetailId: orderDetail.id,
          deliveryDetailId: deliveryDetail.id,
        },
      },
    });

    if (!existingAllocation) {
      const allocatedQuantity = Math.min(
        orderDetail.quantity,
        deliveryDetail.quantity,
        Math.floor(Math.random() * 5) + 1,
      );

      await prisma.deliveryAllocation.create({
        data: {
          orderDetailId: orderDetail.id,
          deliveryDetailId: deliveryDetail.id,
          allocatedQuantity,
        },
      });
    }
  }

  console.log('Seed data created successfully for all tables');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
