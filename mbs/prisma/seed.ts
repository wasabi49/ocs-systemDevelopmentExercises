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

  // 店舗データ作成 - 3つの指定された店舗を使用
  const stores = await Promise.all([
    prisma.store.create({
      data: { name: '今里店' },
    }),
    prisma.store.create({
      data: { name: '深江橋店' },
    }),
    prisma.store.create({
      data: { name: '緑橋本店' },
    }),
  ]);

  // 顧客データ作成 - 顧客を3つの店舗に分散させる
  // 既存の4顧客 + 新規16顧客 = 合計20顧客
  const customerData = [
    // 既存の顧客4件
    {
      id: 'C-00001',
      name: '大阪情報専門学校',
      storeId: stores[0].id,
      contactPerson: '山田太郎',
      address: '大阪府大阪市北区',
      phone: '06-1234-5678',
      deliveryCondition: '通常2-3営業日以内',
      note: '学校関連の納品は事前に連絡が必要',
    },
    {
      id: 'C-00002',
      name: '株式会社スマートソリューションズ',
      storeId: stores[1].id,
      contactPerson: '佐藤次郎',
      address: '大阪府大阪市中央区',
      phone: '06-2345-6789',
      deliveryCondition: '当日納品対応可',
      note: '重要顧客、優先対応',
    },
    {
      id: 'C-00003',
      name: '株式会社SCC',
      storeId: stores[2].id,
      contactPerson: '田中三郎',
      address: '大阪府吹田市',
      phone: '06-3456-7890',
      deliveryCondition: '午前中指定',
      note: '大口顧客',
    },
    {
      id: 'C-00004',
      name: '株式会社くら寿司',
      storeId: stores[0].id,
      contactPerson: '鈴木四郎',
      address: '大阪府堺市',
      phone: '072-456-7890',
      deliveryCondition: '食品関連は温度管理必須',
      note: '衛生管理に特に注意',
    },
    // 新規追加する顧客16件
    {
      id: 'C-00005',
      name: '株式会社大阪テクノロジー',
      storeId: stores[1].id,
      contactPerson: '伊藤五郎',
      address: '大阪府大阪市西区',
      phone: '06-5678-9012',
      deliveryCondition: '営業時間内のみ',
      note: 'IT関連書籍が多い',
    },
    {
      id: 'C-00006',
      name: '関西医科大学',
      storeId: stores[2].id,
      contactPerson: '高橋六郎',
      address: '大阪府枚方市',
      phone: '072-567-8901',
      deliveryCondition: '学期前に大量納品あり',
      note: '医学書専門',
    },
    {
      id: 'C-00007',
      name: 'グローバル貿易株式会社',
      storeId: stores[0].id,
      contactPerson: '中村七海',
      address: '大阪府大阪市中央区',
      phone: '06-6789-0123',
      deliveryCondition: '時間指定あり',
      note: '外国語書籍が主',
    },
    {
      id: 'C-00008',
      name: '大阪市立図書館',
      storeId: stores[1].id,
      contactPerson: '小林八雲',
      address: '大阪府大阪市北区',
      phone: '06-7890-1234',
      deliveryCondition: '開館前納品希望',
      note: '定期購読多数',
    },
    {
      id: 'C-00009',
      name: '近畿大学',
      storeId: stores[2].id,
      contactPerson: '松本九十',
      address: '大阪府東大阪市',
      phone: '06-8901-2345',
      deliveryCondition: '学部ごとに分けて納品',
      note: '研究書が多い',
    },
    {
      id: 'C-00010',
      name: '株式会社関西出版',
      storeId: stores[0].id,
      contactPerson: '渡辺十郎',
      address: '大阪府大阪市淀川区',
      phone: '06-9012-3456',
      deliveryCondition: '即日納品対応',
      note: '出版関連の専門書',
    },
    {
      id: 'C-00011',
      name: 'さくら幼稚園',
      storeId: stores[1].id,
      contactPerson: '斎藤春子',
      address: '大阪府豊中市',
      phone: '06-0123-4567',
      deliveryCondition: '園児不在時に納品',
      note: '絵本が中心',
    },
    {
      id: 'C-00012',
      name: '大阪府立高校',
      storeId: stores[2].id,
      contactPerson: '加藤夏子',
      address: '大阪府茨木市',
      phone: '072-123-4567',
      deliveryCondition: '休校日指定',
      note: '教科書中心',
    },
    {
      id: 'C-00013',
      name: '株式会社大阪エンジニアリング',
      storeId: stores[0].id,
      contactPerson: '山本秋雄',
      address: '大阪府大阪市此花区',
      phone: '06-2345-6789',
      deliveryCondition: '工場直送',
      note: '技術書が多い',
    },
    {
      id: 'C-00014',
      name: '関西料理学校',
      storeId: stores[1].id,
      contactPerson: '木村冬彦',
      address: '大阪府大阪市阿倍野区',
      phone: '06-3456-7890',
      deliveryCondition: '授業開始前納品',
      note: '料理本専門',
    },
    {
      id: 'C-00015',
      name: '大阪アート美術館',
      storeId: stores[2].id,
      contactPerson: '井上春夫',
      address: '大阪府大阪市天王寺区',
      phone: '06-4567-8901',
      deliveryCondition: '美術品扱い厳重注意',
      note: '美術書専門',
    },
    {
      id: 'C-00016',
      name: '関西経済研究所',
      storeId: stores[0].id,
      contactPerson: '佐々木夏子',
      address: '大阪府大阪市福島区',
      phone: '06-5678-9012',
      deliveryCondition: '平日午後指定',
      note: '経済誌定期購読',
    },
    {
      id: 'C-00017',
      name: '大阪音楽院',
      storeId: stores[1].id,
      contactPerson: '山下秋男',
      address: '大阪府大阪市西区',
      phone: '06-6789-0123',
      deliveryCondition: 'コンサート日除く',
      note: '楽譜中心',
    },
    {
      id: 'C-00018',
      name: '関西健康センター',
      storeId: stores[2].id,
      contactPerson: '中島冬美',
      address: '大阪府大阪市住之江区',
      phone: '06-7890-1234',
      deliveryCondition: '営業時間内',
      note: '健康関連書籍',
    },
    {
      id: 'C-00019',
      name: '大阪ITスクール',
      storeId: stores[0].id,
      contactPerson: '田村春樹',
      address: '大阪府大阪市港区',
      phone: '06-8901-2345',
      deliveryCondition: '授業に影響しない時間',
      note: 'プログラミング書籍中心',
    },
    {
      id: 'C-00020',
      name: '関西メディカルセンター',
      storeId: stores[1].id,
      contactPerson: '小川夏菜',
      address: '大阪府高槻市',
      phone: '072-901-2345',
      deliveryCondition: '診療時間外',
      note: '医療専門書',
    },
  ];

  const customers = await Promise.all(
    customerData.map((customer) =>
      prisma.customer.create({
        data: customer,
      }),
    ),
  );

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
  const totalOrders = customers.length * 20; // 各顧客に最低20件の注文を確保（合計400件）

  for (let i = 1; i <= totalOrders; i++) {
    // 顧客IDを決定（各顧客に均等に注文を割り当てる）
    const customerIndex = Math.floor((i - 1) / 20);
    const customerId = customers[customerIndex].id;

    // 注文日をランダムに生成（2025年内）
    const orderDate = new Date(
      2025,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1,
    );

    // 注文ステータスをランダムに選択
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
  // 商品のバリエーションを増やす
  const products = [
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

  const orderDetails = [];

  for (const order of orders) {
    // 各注文に1-5個の商品を追加（より多くのバリエーション）
    const itemCount = Math.floor(Math.random() * 5) + 1;

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
          description: `${product.name}・${quantity}冊セット`,
        },
      });

      orderDetails.push(orderDetail);
    }
  }

  // 納品データの作成
  // 顧客ごとに少なくとも20件の納品データを作成（合計400件）
  const deliveries = [];

  // すべての顧客に対してループ
  for (let customerIndex = 0; customerIndex < customers.length; customerIndex++) {
    const customer = customers[customerIndex];

    // 各顧客に20件の納品を作成
    for (let i = 1; i <= 20; i++) {
      // 納品IDの生成（一意になるように顧客インデックスと納品番号を組み合わせる）
      const deliveryNumber = customerIndex * 20 + i;
      const deliveryId = `D${String(deliveryNumber).padStart(5, '0')}`;

      // 納品日をランダムに生成（2025年内）
      const deliveryDate = new Date(
        2025,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1,
      );

      // 数量と金額を初期設定
      const totalQuantity = Math.floor(Math.random() * 100) + 10;
      const totalAmount = Math.floor(Math.random() * 100000) + 10000;

      // 納品の説明文を生成
      const noteOptions = [
        '定期納品',
        '緊急対応',
        '追加注文',
        '特別納品',
        '期間限定',
        '季節商品',
        '新刊対応',
        '在庫補充',
        '特別版',
        '限定版',
        'セット商品',
        '予約商品',
        '教材用',
        '研究用',
        '参考書',
        '専門書',
        '一般書籍',
        '雑誌類',
        'イベント用',
        '展示用',
      ];
      const note = `${customer.name}向け${noteOptions[Math.floor(Math.random() * noteOptions.length)]}`;

      // 納品データを作成
      const createdDelivery = await prisma.delivery.create({
        data: {
          id: deliveryId,
          customerId: customer.id,
          deliveryDate: deliveryDate,
          note: note,
          totalAmount: totalAmount,
          totalQuantity: totalQuantity,
        },
      });

      deliveries.push(createdDelivery);
    }
  }

  // 納品明細データの作成
  const deliveryDetails = [];
  for (const delivery of deliveries) {
    // 各納品に2-5個の商品を追加（より多くの商品バリエーション）
    const itemCount = Math.floor(Math.random() * 4) + 2;
    let totalAmount = 0;
    let totalQuantity = 0;

    for (let j = 1; j <= itemCount; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;
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
  // 割り当て数を増やす（元の15から50に増加）
  for (let i = 0; i < 50; i++) {
    // ランダムに注文明細と納品明細を選択
    const orderDetail = orderDetails[Math.floor(Math.random() * orderDetails.length)];
    const deliveryDetail = deliveryDetails[Math.floor(Math.random() * deliveryDetails.length)];

    try {
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
    } catch (error) {
      // エラーが発生した場合はスキップして次の割り当てを試行
      console.warn(`割り当て作成中にエラーが発生しました: ${error.message}`);
      continue;
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
