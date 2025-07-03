import React from 'react';
import { render, screen, fireEvent, waitFor} from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderDetailPage from './page';
import{vi} from 'vitest';

// useRouter, useParamsのモック
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({ id: 'O000001' }),
}));

describe('OrderDetailPage', () => {
  test('初期レンダリングで納品明細タイトルが表示される', async () => {
    render(<OrderDetailPage />);
    expect(await screen.findByText(/納品明細 - O000001/)).toBeInTheDocument();
  });

  test('合計金額が表示される', async () => {
    render(<OrderDetailPage />);
    // 「合計金額」が2つ以上ある場合のテスト例
    const elements = await screen.findAllByText(/合計金額/);
    expect(elements.length).toBeGreaterThan(1);
  });

  test('削除ボタンを押すとモーダルが表示される', async () => {
    render(<OrderDetailPage />);
    const deleteBtn = await screen.findByRole('button', { name: '削除' });
    fireEvent.click(deleteBtn);
    expect(await screen.findByText('納品削除')).toBeInTheDocument();
    expect(screen.getByText('この操作は取り消すことができません。')).toBeInTheDocument();
  });

  test('モーダルのキャンセルボタンで閉じる', async () => {
    render(<OrderDetailPage />);
    fireEvent.click(await screen.findByRole('button', { name: '削除' }));
    const cancelBtn = await screen.findByRole('button', { name: 'キャンセル' });
    fireEvent.click(cancelBtn);
    await waitFor(() => {
      expect(screen.queryByText('納品削除')).not.toBeInTheDocument();
    });
  });
});
