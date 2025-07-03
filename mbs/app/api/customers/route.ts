// app/api/customers/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';
import { getStoreIdFromCookie } from '@/app/utils/storeUtils';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Cookieから現在の店舗IDを取得
    const currentStoreId = await getStoreIdFromCookie();
    
    if (!currentStoreId) {
      return NextResponse.json(
        { 
          success: false,
          error: '店舗が選択されていません。店舗を選択してからやり直してください。' 
        },
        { status: 400 }
      );
    }

    // 現在の店舗の顧客のみを取得
    const customers = await prisma.customer.findMany({
      where: { 
        isDeleted: false,
        storeId: currentStoreId  // 店舗IDでフィルタ
      },
      orderBy: { name: 'asc' }
    });

    console.log(`店舗ID: ${currentStoreId} の顧客数: ${customers.length}`);

    return NextResponse.json({
      success: true,
      customers,
      storeId: currentStoreId  // デバッグ用に店舗IDも返す
    });

  } catch (error) {
    console.error('顧客データ取得エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '顧客データの取得に失敗しました' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}