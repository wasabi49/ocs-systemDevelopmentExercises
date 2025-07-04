// app/api/stores/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma';

const prisma = new PrismaClient();

// 型定義
interface StoreCreateRequest {
  name: string;
}

// 店舗一覧取得
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      stores
    });

  } catch (error) {
    console.error('店舗一覧取得エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '店舗一覧の取得に失敗しました' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// 店舗作成（管理者用）
export async function POST(request: NextRequest) {
  try {
    const body: StoreCreateRequest = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { 
          success: false,
          error: '店舗名は必須です' 
        },
        { status: 400 }
      );
    }

    const store = await prisma.store.create({
      data: {
        name: body.name
      }
    });

    return NextResponse.json({
      success: true,
      data: store,
      message: '店舗が正常に作成されました'
    });

  } catch (error) {
    console.error('店舗作成エラー:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: '店舗の作成に失敗しました' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}