// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const customers = await prisma.customer.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      customers
    });

  } catch (error) {
    console.error('顧客データ取得エラー:', error);
    
    return NextResponse.json(
      { error: '顧客データの取得に失敗しました' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}