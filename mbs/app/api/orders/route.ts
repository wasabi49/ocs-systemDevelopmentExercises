// 注文一覧取得APIの修正版（GETメソッド部分のみ）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      where: { isDeleted: false },
      include: {
        customer: true, // whereを削除
        orderDetails: {
          where: { isDeleted: false },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: {
        orderDate: 'desc'
      },
      skip,
      take: limit
    });

    // 削除された顧客の注文を除外（フィルタリング）
    const filteredOrders = orders.filter(order => 
      order.customer && !order.customer.isDeleted
    );

    const total = await prisma.order.count({
      where: { isDeleted: false }
    });

    return NextResponse.json({
      success: true,
      orders: filteredOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('注文取得エラー:', error);
    
    return NextResponse.json(
      { error: '注文の取得に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}