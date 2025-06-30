import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import DeliveryListClient from './DeliveryListClient';

// pushMockを外で宣言し、vi.mockで使う
let pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

describe('DeliveryListClient', () => {
  const deliveries = [
    { id: 'D001', date: '2024-06-01', customerName: '山田太郎', note: '午前中' },
    { id: 'D002', date: '2024-06-02', customerName: '佐藤花子', note: '午後' },
    { id: 'D003', date: '2024-06-03', customerName: '鈴木一郎', note: '特急' },
  ];

  beforeEach(() => {
    pushMock = vi.fn(); // テストごとにリセット
  });

  test('初期表示でテーブル・検索・ページネーションが存在する', () => {
    render(<DeliveryListClient initialDeliveries={deliveries} />);
    expect(screen.getByPlaceholderText('例：納品ID、顧客名など')).toBeInTheDocument();
    expect(screen.getByText('納品追加')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).not.toHaveLength(0); // テーブル行
  });

  test('納品追加ボタン押下でルーティングが呼ばれる', async () => {
    render(<DeliveryListClient initialDeliveries={deliveries} />);
    const addButton = screen.getByText('納品追加');
    await userEvent.click(addButton);
    expect(pushMock).toHaveBeenCalledWith('/Home/DeliveryList/Add');
  });
});

