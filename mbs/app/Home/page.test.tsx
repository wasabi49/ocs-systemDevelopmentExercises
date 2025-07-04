import { render, screen } from '@testing-library/react';
import HomePage from './page';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// next/link をモック化
vi.mock('next/link', () => ({
  default: function Link({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Lucideアイコンをモック化
vi.mock('lucide-react', () => ({
  User: () => <span data-testid="user-icon" />,
  ShoppingCart: () => <span data-testid="cart-icon" />,
  Truck: () => <span data-testid="truck-icon" />,
  BarChart3: () => <span data-testid="chart-icon" />,
}));

describe('HomePage', () => {
  it('renders the main heading and description', () => {
    render(<HomePage />);

    // 「管理メニュー」のh1タグが表示されていることを確認
    expect(screen.getByRole('heading', { level: 1, name: '管理メニュー' })).toBeInTheDocument();

    // 「管理したい項目を選択してください」のpタグが表示されていることを確認
    expect(screen.getByText('管理したい項目を選択してください')).toBeInTheDocument();
  });

  it('renders all navigation buttons with correct labels and links', () => {
    render(<HomePage />);

    // 各ボタンのラベルとリンクを検証
    const buttonsData = [
      { label: '顧客管理', path: '/Home/CustomerList', iconTestId: 'user-icon' },
      { label: '注文管理', path: '/Home/OrderList', iconTestId: 'cart-icon' },
      { label: '納品管理', path: '/Home/DeliveryList', iconTestId: 'truck-icon' },
      { label: '統計情報', path: '/Home/Statistics', iconTestId: 'chart-icon' },
    ];

    buttonsData.forEach(({ label, path, iconTestId }) => {
      // リンク要素を取得
      const linkElement = screen.getByRole('link', { name: new RegExp(label) });

      // リンクが正しいhref属性を持っていることを確認
      expect(linkElement).toHaveAttribute('href', path);

      // リンクのテキストが表示されていることを確認
      expect(linkElement).toHaveTextContent(label);

      // アイコンが存在することを確認
      expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
    });
  });
});
