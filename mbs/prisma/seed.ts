import { PrismaClient } from '../app/generated/prisma';
import type { Order, Delivery, Customer } from '../app/generated/prisma';
import { logger } from '../lib/logger';

const prisma = new PrismaClient();

async function main() {
  // データベースの完全クリーンアップ - 外部キー制約を考慮した削除順序
  logger.info('Starting database cleanup...');

  // 1. 最も依存関係の多いテーブルから削除（多対多の関連テーブル）
  logger.info('Cleaning delivery allocations...');
  await prisma.deliveryAllocation.deleteMany({});

  // 2. 明細テーブル
  logger.info('Cleaning details tables...');
  await prisma.deliveryDetail.deleteMany({});
  await prisma.orderDetail.deleteMany({});

  // 3. 主要トランザクションテーブル
  logger.info('Cleaning transaction tables...');
  await prisma.delivery.deleteMany({});
  await prisma.order.deleteMany({});

  // 4. 統計テーブル
  logger.info('Cleaning statistics table...');
  await prisma.statistics.deleteMany({});

  // 5. 顧客テーブル
  logger.info('Cleaning customer table...');
  await prisma.customer.deleteMany({});

  // 6. 基本テーブル（依存されるテーブル）
  logger.info('Cleaning store table...');
  await prisma.store.deleteMany({});

  logger.info('Database cleanup completed successfully');

  // 店舗データ作成（3店舗）
  const stores = await Promise.all([
    prisma.store.create({
      data: {
        name: '今里店',
      },
    }),
    prisma.store.create({
      data: {
        name: '深江橋店',
      },
    }),
    prisma.store.create({
      data: {
        name: '緑橋本店',
      },
    }),
  ]);


  // 顧客データ作成（各店舗20件 × 3店舗 = 60件）
  // 今里店の顧客（20件：法人12件 + 個人8件）
  const imarisatoCustomers = [
    // 法人顧客（12件）
    {
      id: 'C-00001',
      name: '株式会社テクノロジーアドバンス',
      contactPerson: '田中一郎',
      address: '大阪府大阪市東成区今里1-1-1',
      phone: '06-1111-1111',
      deliveryCondition: '平日9:00-18:00',
      note: '教育機関、教材・参考書の大口取引先',
    },
    {
      id: 'C-00002',
      name: '有限会社クリエイティブソリューション',
      contactPerson: '佐藤花子',
      address: '大阪府大阪市東成区今里2-2-2',
      phone: '06-1111-2222',
      deliveryCondition: '当日配送可',
      note: 'デザイン会社、アート・デザイン書を多数発注',
    },
    {
      id: 'C-00003',
      name: '株式会社グローバルシステムズ',
      contactPerson: '鈴木太郎',
      address: '大阪府大阪市東成区今里3-3-3',
      phone: '06-1111-3333',
      deliveryCondition: '午前中指定',
      note: 'システム開発会社、技術書・ビジネス書中心',
    },
    {
      id: 'C-00004',
      name: '合同会社イノベーションラボ',
      contactPerson: '高橋美咲',
      address: '大阪府大阪市東成区大今里1-4-4',
      phone: '06-1111-4444',
      deliveryCondition: '時間指定なし',
      note: 'スタートアップ企業、自己啓発書・ビジネス書',
    },
    {
      id: 'C-00005',
      name: '株式会社ビジネスパートナー',
      contactPerson: '伊藤健一',
      address: '大阪府大阪市東成区大今里2-5-5',
      phone: '06-1111-5555',
      deliveryCondition: '平日午後希望',
      note: 'コンサルティング会社、経営・マネジメント書',
    },
    {
      id: 'C-00006',
      name: '有限会社デジタルワークス',
      contactPerson: '山田麻衣',
      address: '大阪府大阪市東成区大今里3-6-6',
      phone: '06-1111-6666',
      deliveryCondition: '事前連絡必須',
      note: 'Web制作会社、デザイン・技術書中心',
    },
    {
      id: 'C-00007',
      name: '株式会社フューチャーテック',
      contactPerson: '中村大輔',
      address: '大阪府大阪市東成区大今里西1-7-7',
      phone: '06-1111-7777',
      deliveryCondition: '平日のみ',
      note: 'AI研究企業、科学・技術書専門',
    },
    {
      id: 'C-00008',
      name: '合同会社スマートビジネス',
      contactPerson: '小林さくら',
      address: '大阪府大阪市東成区大今里西2-8-8',
      phone: '06-1111-8888',
      deliveryCondition: '午後14:00以降',
      note: 'eコマース運営、マーケティング・ビジネス書',
    },
    {
      id: 'C-00009',
      name: '株式会社プロフェッショナルサービス',
      contactPerson: '加藤雄二',
      address: '大阪府大阪市東成区大今里西3-9-9',
      phone: '06-1111-9999',
      deliveryCondition: '通常配送',
      note: '人材派遣会社、ビジネス書・自己啓発書中心',
    },
    {
      id: 'C-00010',
      name: '有限会社エンタープライズソリューション',
      contactPerson: '渡辺真理',
      address: '大阪府大阪市東成区大今里南1-10-10',
      phone: '06-1111-0000',
      deliveryCondition: '平日9:00-17:00',
      note: '研究機関、学術書・専門書を定期発注',
    },
    {
      id: 'C-00011',
      name: '株式会社教育サポート',
      contactPerson: '野村亮介',
      address: '大阪府大阪市東成区大今里南2-11-11',
      phone: '06-1111-1122',
      deliveryCondition: '午前中優先',
      note: '塾運営、学習参考書・問題集を大量発注',
    },
    {
      id: 'C-00012',
      name: '有限会社ライフスタイル企画',
      contactPerson: '池田美和',
      address: '大阪府大阪市東成区大今里南3-12-12',
      phone: '06-1111-1133',
      deliveryCondition: '平日15:00-19:00',
      note: 'ライフスタイル雑誌編集、料理・健康・美容書',
    },
    // 個人顧客（8件）
    {
      id: 'C-00013',
      name: '吉田慎一',
      contactPerson: '吉田慎一',
      address: '大阪府大阪市東成区玉津1-13-13',
      phone: '090-1111-2222',
      deliveryCondition: '土日祝可',
      note: 'フリーランスデザイナー、アート・デザイン書愛読',
    },
    {
      id: 'C-00014',
      name: '松本由美',
      contactPerson: '松本由美',
      address: '大阪府大阪市東成区玉津2-14-14',
      phone: '090-1111-3333',
      deliveryCondition: '平日午前中',
      note: '個人事業主、ビジネス書・自己啓発書好き',
    },
    {
      id: 'C-00015',
      name: '森田健太',
      contactPerson: '森田健太',
      address: '大阪府大阪市東成区玉津3-15-15',
      phone: '090-1111-4444',
      deliveryCondition: '時間指定なし',
      note: 'フリーエンジニア、技術書・SF小説愛好家',
    },
    {
      id: 'C-00016',
      name: '清水香織',
      contactPerson: '清水香織',
      address: '大阪府大阪市東成区中本1-16-16',
      phone: '090-1111-5555',
      deliveryCondition: '平日14:00-18:00',
      note: 'ネットショップ経営、料理本・ライフスタイル本',
    },
    {
      id: 'C-00017',
      name: '藤原誠',
      contactPerson: '藤原誠',
      address: '大阪府大阪市東成区中本2-17-17',
      phone: '090-1111-6666',
      deliveryCondition: '平日のみ',
      note: 'フリーライター、文学・エッセイ中心',
    },
    {
      id: 'C-00018',
      name: '岡田美穂',
      contactPerson: '岡田美穂',
      address: '大阪府大阪市東成区中本3-18-18',
      phone: '090-1111-7777',
      deliveryCondition: '午前中希望',
      note: '翻訳家、外国文学・語学書愛読',
    },
    {
      id: 'C-00019',
      name: '石川拓也',
      contactPerson: '石川拓也',
      address: '大阪府大阪市東成区東中本1-19-19',
      phone: '090-1111-8888',
      deliveryCondition: '土日可',
      note: 'フリープログラマー、技術書・推理小説好き',
    },
    {
      id: 'C-00020',
      name: '橋本優子',
      contactPerson: '橋本優子',
      address: '大阪府大阪市東成区東中本2-20-20',
      phone: '090-1111-9999',
      deliveryCondition: '平日午後',
      note: '英会話教室経営、語学書・児童書を購入',
    },
  ];

  // 深江橋店の顧客（20件：法人12件 + 個人8件）
  const fukaebashiCustomers = [
    // 法人顧客（12件）
    {
      id: 'C-00021',
      name: '株式会社マーケティングプロ',
      contactPerson: '竹内一夫',
      address: '大阪府大阪市東成区深江北1-21-21',
      phone: '06-2222-1111',
      deliveryCondition: '平日10:00-16:00',
      note: '広告代理店、マーケティング・企画書専門',
    },
    {
      id: 'C-00022',
      name: '有限会社フードサービス',
      contactPerson: '福田香子',
      address: '大阪府大阪市東成区深江北2-22-22',
      phone: '06-2222-2222',
      deliveryCondition: '営業時間内',
      note: 'レストラン経営、料理本・レシピ本多数購入',
    },
    {
      id: 'C-00023',
      name: '株式会社健康ライフ',
      contactPerson: '三浦正美',
      address: '大阪府大阪市東成区深江北3-23-23',
      phone: '06-2222-3333',
      deliveryCondition: '午前中のみ',
      note: 'フィットネス運営、健康・スポーツ書中心',
    },
    {
      id: 'C-00024',
      name: '合同会社アートクリエイト',
      contactPerson: '長谷川淳',
      address: '大阪府大阪市東成区深江南1-24-24',
      phone: '06-2222-4444',
      deliveryCondition: '平日午後',
      note: 'アート関連企業、美術・芸術書専門',
    },
    {
      id: 'C-00025',
      name: '株式会社エデュケーション',
      contactPerson: '原田恵美',
      address: '大阪府大阪市東成区深江南2-25-25',
      phone: '06-2222-5555',
      deliveryCondition: '平日9:00-18:00',
      note: '教育出版社、教育関連書籍を専門取扱',
    },
    {
      id: 'C-00026',
      name: '有限会社メディカルケア',
      contactPerson: '上田明彦',
      address: '大阪府大阪市東成区深江南3-26-26',
      phone: '06-2222-6666',
      deliveryCondition: '事前連絡要',
      note: '医療機関、医学・健康書を定期発注',
    },
    {
      id: 'C-00027',
      name: '株式会社ファイナンス・プラス',
      contactPerson: '木村雅子',
      address: '大阪府大阪市城東区今福東1-27-27',
      phone: '06-2222-7777',
      deliveryCondition: '平日11:00-17:00',
      note: '金融コンサル、経済・投資書を専門取扱',
    },
    {
      id: 'C-00028',
      name: '合同会社トラベルプランニング',
      contactPerson: '浅野康次',
      address: '大阪府大阪市城東区今福東2-28-28',
      phone: '06-2222-8888',
      deliveryCondition: '平日のみ',
      note: '旅行代理店、観光・旅行ガイドブック専門',
    },
    {
      id: 'C-00029',
      name: '株式会社ホームデザイン',
      contactPerson: '西村千恵',
      address: '大阪府大阪市城東区今福東3-29-29',
      phone: '06-2222-9999',
      deliveryCondition: '10:00-15:00',
      note: 'インテリア会社、住宅・デザイン書中心',
    },
    {
      id: 'C-00030',
      name: '有限会社子育てサポート',
      contactPerson: '井上直美',
      address: '大阪府大阪市城東区今福西1-30-30',
      phone: '06-2222-0000',
      deliveryCondition: '午前中限定',
      note: '保育園運営、育児・児童書を大量購入',
    },
    {
      id: 'C-00031',
      name: '株式会社ITソリューションズ',
      contactPerson: '古川博之',
      address: '大阪府大阪市城東区今福西2-31-31',
      phone: '06-2222-1122',
      deliveryCondition: '平日13:00-18:00',
      note: 'システム開発、最新技術書・プログラミング書',
    },
    {
      id: 'C-00032',
      name: '合同会社スポーツアカデミー',
      contactPerson: '金田真一',
      address: '大阪府大阪市城東区今福西3-32-32',
      phone: '06-2222-3344',
      deliveryCondition: '土日祝も可',
      note: 'スポーツ指導、トレーニング・運動理論書',
    },
    // 個人顧客（8件）
    {
      id: 'C-00033',
      name: '宮崎良太',
      contactPerson: '宮崎良太',
      address: '大阪府大阪市城東区今福南1-33-33',
      phone: '090-2222-0000',
      deliveryCondition: '通常配送',
      note: 'ITコンサルタント、ビジネス書・歴史書愛好',
    },
    {
      id: 'C-00034',
      name: '金子恵子',
      contactPerson: '金子恵子',
      address: '大阪府大阪市城東区今福南2-34-34',
      phone: '090-2222-1111',
      deliveryCondition: '平日9:00-15:00',
      note: 'グラフィックデザイナー、アート・写真集好き',
    },
    {
      id: 'C-00035',
      name: '村田健司',
      contactPerson: '村田健司',
      address: '大阪府大阪市城東区今福南3-35-35',
      phone: '090-2222-2222',
      deliveryCondition: '土日希望',
      note: '料理研究家、グルメ・料理本コレクター',
    },
    {
      id: 'C-00036',
      name: '坂本麻里',
      contactPerson: '坂本麻里',
      address: '大阪府大阪市城東区蒲生1-36-36',
      phone: '090-2222-3333',
      deliveryCondition: '平日午後のみ',
      note: 'ヨガインストラクター、健康・美容書愛読',
    },
    {
      id: 'C-00037',
      name: '大西隆志',
      contactPerson: '大西隆志',
      address: '大阪府大阪市城東区蒲生2-37-37',
      phone: '090-2222-4444',
      deliveryCondition: '平日18:00以降',
      note: 'サラリーマン、ビジネス書・自己啓発書',
    },
    {
      id: 'C-00038',
      name: '片山由紀',
      contactPerson: '片山由紀',
      address: '大阪府大阪市城東区蒲生3-38-38',
      phone: '090-2222-5555',
      deliveryCondition: '午前中のみ',
      note: '主婦、料理・育児・ライフスタイル本',
    },
    {
      id: 'C-00039',
      name: '内田洋平',
      contactPerson: '内田洋平',
      address: '大阪府大阪市城東区諏訪1-39-39',
      phone: '090-2222-6666',
      deliveryCondition: '夜間配送希望',
      note: '大学院生、学術書・専門書中心',
    },
    {
      id: 'C-00040',
      name: '中島美代子',
      contactPerson: '中島美代子',
      address: '大阪府大阪市城東区諏訪2-40-40',
      phone: '090-2222-7777',
      deliveryCondition: '平日10:00-16:00',
      note: '在宅ワーカー、ビジネス・実用書好き',
    },
  ];

  // 緑橋本店の顧客（20件：法人12件 + 個人8件）
  const midoribashiCustomers = [
    // 法人顧客（12件）
    {
      id: 'C-00041',
      name: '株式会社総合商社',
      contactPerson: '斎藤雅人',
      address: '大阪府大阪市東成区中道1-41-41',
      phone: '06-3333-1111',
      deliveryCondition: '平日9:00-17:00',
      note: '大手商社、経済・国際ビジネス書を大量発注',
    },
    {
      id: 'C-00042',
      name: '有限会社ブックカフェ',
      contactPerson: '田村香織',
      address: '大阪府大阪市東成区中道2-42-42',
      phone: '06-3333-2222',
      deliveryCondition: '営業前の早朝',
      note: 'カフェ併設書店、幅広いジャンルの書籍',
    },
    {
      id: 'C-00043',
      name: '株式会社クリエイティブエージェンシー',
      contactPerson: '小野寺智',
      address: '大阪府大阪市東成区中道3-43-43',
      phone: '06-3333-3333',
      deliveryCondition: '平日14:00-20:00',
      note: '広告制作、デザイン・クリエイティブ書専門',
    },
    {
      id: 'C-00044',
      name: '合同会社ウェルネス',
      contactPerson: '高野律子',
      address: '大阪府大阪市東成区東小橋1-44-44',
      phone: '06-3333-4444',
      deliveryCondition: '平日午前中',
      note: '健康食品販売、栄養・健康管理書を扱う',
    },
    {
      id: 'C-00045',
      name: '株式会社ファミリーサポート',
      contactPerson: '渋谷博子',
      address: '大阪府大阪市東成区東小橋2-45-45',
      phone: '06-3333-5555',
      deliveryCondition: '平日16:00-19:00',
      note: '家族向けサービス、育児・家庭の医学書',
    },
    {
      id: 'C-00046',
      name: '有限会社テクニカルライティング',
      contactPerson: '松井秀夫',
      address: '大阪府大阪市東成区東小橋3-46-46',
      phone: '06-3333-6666',
      deliveryCondition: '平日11:00-15:00',
      note: '技術文書作成、専門技術書・マニュアル書',
    },
    {
      id: 'C-00047',
      name: '株式会社ガーデニングプラス',
      contactPerson: '岩田和子',
      address: '大阪府大阪市東成区神路1-47-47',
      phone: '06-3333-7777',
      deliveryCondition: '土日祝可',
      note: '園芸店、ガーデニング・園芸書専門',
    },
    {
      id: 'C-00048',
      name: '合同会社アニマルケア',
      contactPerson: '森本直樹',
      address: '大阪府大阪市東成区神路2-48-48',
      phone: '06-3333-8888',
      deliveryCondition: '平日のみ',
      note: '動物病院、ペット・動物関連書籍',
    },
    {
      id: 'C-00049',
      name: '株式会社ミュージックスクール',
      contactPerson: '吉岡恵美',
      address: '大阪府大阪市東成区神路3-49-49',
      phone: '06-3333-9999',
      deliveryCondition: '夕方以降',
      note: '音楽教室、楽譜・音楽理論書を取扱',
    },
    {
      id: 'C-00050',
      name: '有限会社ローカルメディア',
      contactPerson: '大川誠治',
      address: '大阪府大阪市東成区大今里1-50-50',
      phone: '06-3333-0000',
      deliveryCondition: '平日13:00-17:00',
      note: '地域情報誌編集、地域・観光ガイド書',
    },
    {
      id: 'C-00051',
      name: '株式会社スタディサポート',
      contactPerson: '平田千春',
      address: '大阪府大阪市東成区大今里2-51-51',
      phone: '06-3333-1122',
      deliveryCondition: '平日午後のみ',
      note: '学習塾、受験参考書・問題集を大量購入',
    },
    {
      id: 'C-00052',
      name: '合同会社アウトドアライフ',
      contactPerson: '細川雄一',
      address: '大阪府大阪市東成区大今里3-52-52',
      phone: '06-3333-3344',
      deliveryCondition: '土日祝も可',
      note: 'アウトドア用品店、登山・キャンプ書籍',
    },
    // 個人顧客（8件）
    {
      id: 'C-00053',
      name: '杉本治男',
      contactPerson: '杉本治男',
      address: '大阪府大阪市東成区緑橋1-53-53',
      phone: '090-3333-0000',
      deliveryCondition: '平日夕方',
      note: '退職教師、教育・人文書コレクター',
    },
    {
      id: 'C-00054',
      name: '林美津子',
      contactPerson: '林美津子',
      address: '大阪府大阪市東成区緑橋2-54-54',
      phone: '090-3333-1111',
      deliveryCondition: '午前中限定',
      note: '主婦、料理・家事・節約術の書籍愛好',
    },
    {
      id: 'C-00055',
      name: '谷口健一',
      contactPerson: '谷口健一',
      address: '大阪府大阪市東成区緑橋3-55-55',
      phone: '090-3333-2222',
      deliveryCondition: '週末希望',
      note: 'エンジニア、最新技術・AI関連書籍',
    },
    {
      id: 'C-00056',
      name: '佐々木文子',
      contactPerson: '佐々木文子',
      address: '大阪府大阪市東成区緑橋4-56-56',
      phone: '090-3333-3333',
      deliveryCondition: '平日10:00-14:00',
      note: '看護師、医療・健康関連書籍専門',
    },
    {
      id: 'C-00057',
      name: '青木浩二',
      contactPerson: '青木浩二',
      address: '大阪府大阪市東成区緑橋5-57-57',
      phone: '090-3333-4444',
      deliveryCondition: '夜間配送',
      note: '会社員、投資・経済書を愛読',
    },
    {
      id: 'C-00058',
      name: '山口さとみ',
      contactPerson: '山口さとみ',
      address: '大阪府大阪市東成区森ノ宮1-58-58',
      phone: '090-3333-5555',
      deliveryCondition: '平日午後',
      note: 'フリーランス、ビジネス・自己啓発書',
    },
    {
      id: 'C-00059',
      name: '黒田雅史',
      contactPerson: '黒田雅史',
      address: '大阪府大阪市東成区森ノ宮2-59-59',
      phone: '090-3333-6666',
      deliveryCondition: '土日のみ',
      note: '歴史研究者、歴史・古典文学書愛好',
    },
    {
      id: 'C-00060',
      name: '永田優香',
      contactPerson: '永田優香',
      address: '大阪府大阪市東成区森ノ宮3-60-60',
      phone: '090-3333-7777',
      deliveryCondition: '平日午前中',
      note: 'アロマセラピスト、美容・癒し系書籍',
    },
  ];

  // 全顧客データを結合
  const customerData = [...imarisatoCustomers, ...fukaebashiCustomers, ...midoribashiCustomers];

  const customers = await Promise.all(
    customerData.map((data, index) => {
      // 各店舗に20件ずつ配置（0-19: 今里店, 20-39: 深江橋店, 40-59: 緑橋本店）
      const storeIndex = Math.floor(index / 20);
      return prisma.customer.create({
        data: {
          ...data,
          storeId: stores[storeIndex].id,
        },
      });
    }),
  );

  logger.info(`Created ${customers.length} customers distributed across stores`);
  logger.info(`- 今里店: ${customers.slice(0, 20).length} customers`);
  logger.info(`- 深江橋店: ${customers.slice(20, 40).length} customers`);
  logger.info(`- 緑橋本店: ${customers.slice(40, 60).length} customers`);

  // 統計データの作成
  await Promise.all(
    customers.map((customer: Customer) =>
      prisma.statistics.create({
        data: {
          customerId: customer.id,
          averageLeadTime: Math.floor(Math.random() * 10) + 2, // 2-12日のリードタイム
          totalSales: Math.floor(Math.random() * 5000000) + 1000000, // 100万円-600万円の売上
        },
      }),
    ),
  );

  // 注文データの作成（60件の顧客に対して各20件ずつ = 1200件）
  const orderStatuses = ['完了', '未完了'];
  const orders: Order[] = [];
  let orderCounter = 1;

  // 各顧客に対して20件の注文を作成（60顧客 × 20件 = 1200件の注文）
  for (const customer of customers) {
    for (let j = 1; j <= 20; j++) {
      const orderDate = new Date(
        2024 + Math.floor(Math.random() * 2), // 2024年または2025年
        Math.floor(Math.random() * 12), // 0-11月
        Math.floor(Math.random() * 28) + 1, // 1-28日
      );

      const order = await prisma.order.create({
        data: {
          id: `O${String(orderCounter).padStart(7, '0')}`,
          customerId: customer.id,
          orderDate,
          status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          note: `${customer.name}の注文${j}件目 - ${orderDate.toLocaleDateString('ja-JP')}`,
        },
      });

      orders.push(order);
      orderCounter++;
    }
  }

  logger.info(`Created ${orders.length} orders for ${customers.length} customers`);

  // 注文明細データの作成
  const products = [
    // 文学・小説
    { name: '夏目漱石全集（第1巻）こころ', price: 2800 },
    { name: '太宰治「人間失格」', price: 1200 },
    { name: '村上春樹「ノルウェイの森」', price: 1800 },
    { name: '東野圭吾「容疑者Xの献身」', price: 1600 },
    { name: '湊かなえ「告白」', price: 1400 },

    // ビジネス・経済
    { name: '7つの習慣 人格主義の回復', price: 2400 },
    { name: 'チーズはどこへ消えた？', price: 921 },
    { name: '金持ち父さん貧乏父さん', price: 1760 },
    { name: 'LIFE SHIFT（ライフ・シフト）', price: 1980 },
    { name: '嫌われる勇気', price: 1650 },

    // 実用書・ライフスタイル
    { name: '人生がときめく片づけの魔法', price: 1540 },
    { name: '医者が教える食事術 最強の教科書', price: 1650 },
    { name: '筋トレが最強のソリューションである', price: 1320 },
    { name: '世界一やさしい「やりたいこと」の見つけ方', price: 1540 },
    { name: 'スタンフォード式 最高の睡眠', price: 1650 },

    // 歴史・文化
    { name: '応仁の乱 - 戦国時代を生んだ大乱', price: 1045 },
    { name: '日本史の謎は「地形」で解ける', price: 1012 },
    { name: '世界史とつなげて学ぶ中国全史', price: 1980 },
    { name: 'サピエンス全史（上）', price: 2090 },
    { name: '銃・病原菌・鉄（上）', price: 2090 },

    // 科学・技術
    { name: 'ホモ・デウス テクノロジーとサピエンスの未来', price: 2640 },
    { name: 'ファクトフルネス', price: 1980 },
    { name: '宇宙はなぜこんなにうまくできているのか', price: 990 },
    { name: 'ゼロから学ぶPython プログラミング', price: 2680 },
    { name: '図解でわかる14歳からの気候変動', price: 1540 },

    // 料理・グルメ
    { name: '土井善晴の一汁一菜でよいという提案', price: 1430 },
    { name: 'きょうの料理ビギナーズ', price: 1210 },
    { name: '世界一美味しい手抜きごはん', price: 1430 },
    { name: '日本料理の基本', price: 1980 },
    { name: 'パンづくりの科学', price: 2200 },

    // 児童書・絵本
    { name: 'はらぺこあおむし', price: 1320 },
    { name: 'ぐりとぐら', price: 990 },
    { name: 'となりのトトロ', price: 1650 },
    { name: 'かいじゅうたちのいるところ', price: 1540 },
    { name: 'ハリー・ポッターと賢者の石', price: 2090 },

    // 健康・医学
    { name: '病気にならない生き方', price: 1540 },
    { name: '家庭の医学 最新版', price: 3300 },
    { name: 'ヨガの基本ポーズ完全ガイド', price: 1760 },
    { name: '認知症の人の心がわかる本', price: 1430 },
    { name: '腸活の教科書', price: 1540 },

    // 趣味・スポーツ
    { name: '大人の塗り絵 風景編', price: 1100 },
    { name: 'ゴルフ上達の科学', price: 1980 },
    { name: '釣り入門 完全ガイド', price: 1650 },
    { name: '写真撮影の教科書', price: 2200 },
    { name: '園芸大百科', price: 2750 },

    // エッセイ・随筆
    { name: '吉本ばなな「キッチン」', price: 660 },
    { name: '森見登美彦「有頂天家族」', price: 770 },
    { name: '又吉直樹「火花」', price: 1430 },
    { name: 'さくらももこ「ももこの話」', price: 1320 },
    { name: '糸井重里「ほぼ日刊イトイ新聞の本」', price: 1540 },
  ];

  const orderDetails = [];

  for (const order of orders) {
    // 各注文に1-5個の商品を追加（平均3個）
    const itemCount = Math.floor(Math.random() * 5) + 1;

    // 同じ商品を重複して選ばないようにする
    const selectedProducts: typeof products = [];
    for (let j = 1; j <= itemCount; j++) {
      let product: (typeof products)[0];
      do {
        product = products[Math.floor(Math.random() * products.length)];
      } while (selectedProducts.some((p) => p.name === product.name));
      selectedProducts.push(product);

      const quantity = Math.floor(Math.random() * 10) + 1;

      const orderDetail = await prisma.orderDetail.create({
        data: {
          id: `${order.id}-${String(j).padStart(2, '0')}`,
          orderId: order.id,
          productName: product.name,
          unitPrice: product.price,
          quantity,
          description: `${product.name} - 数量: ${quantity}個`,
        },
      });

      orderDetails.push(orderDetail);
    }
  }

  console.log(`Created ${orderDetails.length} order details`);

  // 正しいビジネスフローに従った納品データの作成
  logger.info('Creating deliveries following correct business flow...');
  
  const deliveries: Delivery[] = [];
  const deliveryDetails = [];
  let deliveryCounter = 1;
  let allocationCount = 0;

  // 顧客ごとに処理（注文に基づいて納品を作成）
  for (const customer of customers) {
    // 該当顧客の注文明細を取得
    const customerOrderDetails = orderDetails.filter((od) => {
      const order = orders.find((o) => o.id === od.orderId);
      return order?.customerId === customer.id;
    });

    // 顧客の注文明細を商品名ごとにグループ化
    const orderDetailsByProduct = new Map<string, typeof customerOrderDetails>();
    customerOrderDetails.forEach((od) => {
      if (!orderDetailsByProduct.has(od.productName)) {
        orderDetailsByProduct.set(od.productName, []);
      }
      orderDetailsByProduct.get(od.productName)!.push(od);
    });

    // 顧客に対して複数回の納品を作成（10-15回の納品）
    const deliveryCount = Math.floor(Math.random() * 6) + 10; // 10-15回
    
    for (let j = 1; j <= deliveryCount; j++) {
      // 3. 納品を作成
      const deliveryDate = new Date(
        2024 + Math.floor(Math.random() * 2), // 2024年または2025年
        Math.floor(Math.random() * 12), // 0-11月
        Math.floor(Math.random() * 28) + 1, // 1-28日
      );

      const delivery = await prisma.delivery.create({
        data: {
          id: `D${String(deliveryCounter).padStart(7, '0')}`,
          customerId: customer.id,
          deliveryDate: deliveryDate,
          note: `${customer.name}への納品${j}件目 - ${deliveryDate.toLocaleDateString('ja-JP')}`,
          totalAmount: 0, // 後で更新
          totalQuantity: 0, // 後で更新
        },
      });

      deliveries.push(delivery);

      // 4. 納品明細を作成（未納品の注文明細のみを対象）
      let deliveryTotalAmount = 0;
      let deliveryTotalQuantity = 0;
      let deliveryDetailCounter = 1;

      // 1-5個の異なる商品を納品対象として選択
      const productNames = Array.from(orderDetailsByProduct.keys())
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 5) + 1);

      for (const productName of productNames) {
        const orderDetsForProduct = orderDetailsByProduct.get(productName)!;

        // この商品の未納品数量を計算
        let totalUndeliveredQuantity = 0;
        const availableOrderDetails = [];

        for (const orderDetail of orderDetsForProduct) {
          // 既に納品済みの数量を計算（allocationから）
          const existingAllocations = await prisma.deliveryAllocation.findMany({
            where: {
              orderDetailId: orderDetail.id,
            },
            select: {
              allocatedQuantity: true,
            },
          });

          const totalAllocated = existingAllocations.reduce(
            (sum: number, alloc) => sum + alloc.allocatedQuantity,
            0,
          );

          const remainingQuantity = orderDetail.quantity - totalAllocated;

          if (remainingQuantity > 0) {
            availableOrderDetails.push({
              orderDetail,
              remainingQuantity,
            });
            totalUndeliveredQuantity += remainingQuantity;
          }
        }

        // 未納品がある場合のみ納品明細を作成
        if (totalUndeliveredQuantity > 0 && availableOrderDetails.length > 0) {
          // 納品数量を決定（未納品数量の一部または全部）
          const maxDeliveryQuantity = Math.min(totalUndeliveredQuantity, Math.floor(Math.random() * 8) + 1);
          
          if (maxDeliveryQuantity > 0) {
            const product = products.find(p => p.name === productName)!;

            // 納品明細を作成
            const deliveryDetail = await prisma.deliveryDetail.create({
              data: {
                id: `${delivery.id}-${String(deliveryDetailCounter).padStart(2, '0')}`,
                deliveryId: delivery.id,
                productName: productName,
                unitPrice: product.price,
                quantity: maxDeliveryQuantity,
              },
            });

            deliveryDetails.push(deliveryDetail);
            deliveryDetailCounter++;

            deliveryTotalAmount += product.price * maxDeliveryQuantity;
            deliveryTotalQuantity += maxDeliveryQuantity;

            // 5. 納品明細の数量を対応する注文明細に割り当て
            let remainingDeliveryQuantity = maxDeliveryQuantity;

            for (const { orderDetail, remainingQuantity } of availableOrderDetails) {
              if (remainingDeliveryQuantity <= 0) break;

              // 配分可能な数量を決定
              const allocatedQuantity = Math.min(remainingDeliveryQuantity, remainingQuantity);

              if (allocatedQuantity > 0) {
                await prisma.deliveryAllocation.create({
                  data: {
                    orderDetailId: orderDetail.id,
                    deliveryDetailId: deliveryDetail.id,
                    allocatedQuantity: allocatedQuantity,
                  },
                });

                remainingDeliveryQuantity -= allocatedQuantity;
                allocationCount++;
              }
            }

            // すべての納品数量が配分されたかチェック
            if (remainingDeliveryQuantity > 0) {
              logger.warn(
                `Warning: DeliveryDetail ${deliveryDetail.id} has ${remainingDeliveryQuantity} unallocated items for product ${productName}`,
              );
            }
          }
        }
      }

      // 納品の合計金額と数量を更新
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: { 
          totalAmount: deliveryTotalAmount, 
          totalQuantity: deliveryTotalQuantity 
        },
      });

      deliveryCounter++;
    }
  }

  logger.info(`Created ${allocationCount} delivery allocations`);

  logger.info('=== Seed Data Summary ===');
  logger.info(`Stores: ${stores.length}`);
  logger.info(`Customers: ${customers.length} (20 per store)`);
  logger.info(`  - 今里店: 20 customers (C-00001 ~ C-00020)`);
  logger.info(`  - 深江橋店: 20 customers (C-00021 ~ C-00040)`);
  logger.info(`  - 緑橋本店: 20 customers (C-00041 ~ C-00060)`);
  logger.info(`Orders: ${orders.length} (${orders.length / customers.length} per customer)`);
  logger.info(`Order Details: ${orderDetails.length}`);
  logger.info(
    `Deliveries: ${deliveries.length} (${deliveries.length / customers.length} per customer)`,
  );
  logger.info(`Delivery Details: ${deliveryDetails.length}`);
  logger.info(`Delivery Allocations: ${allocationCount} (same customer & product matching)`);
  logger.info(`Products: ${products.length} book titles (bookstore inventory)`);
  logger.info('Seed data created successfully for all tables with expanded dataset');
}

main()
  .catch((e) => {
    logger.error('Seed script failed', { error: e instanceof Error ? e.message : String(e) });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
