import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Breadcrumbs from './Breadcrumbs';

// react-lucideのChevronRightアイコンをモック
vi.mock('lucide-react', () => ({
  ChevronRight: () => <span data-testid="chevron-right-icon">›</span>,
}));

// Next.jsのuseParamsとusePathnameのモック関数を作成
const mockUseParams = vi.fn();
const mockUsePathname = vi.fn();

// Next.jsのuseParamsとusePathnameをモック
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
  usePathname: () => mockUsePathname(),
}));

describe('Breadcrumbsコンポーネント', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    vi.clearAllMocks();
    // デフォルトの値を設定
    mockUseParams.mockReturnValue({ id: '123' });
    mockUsePathname.mockReturnValue('/Home/CustomerList');
  });

  test('Breadcrumbsが正常にレンダリングされる', () => {
    render(<Breadcrumbs />);
    // navエレメントが存在することを確認
    expect(document.querySelector('nav')).toBeTruthy();
  });

  test('navigation roleが設定されている', () => {
    render(<Breadcrumbs />);
    expect(screen.getByRole('navigation')).toBeTruthy();
  });

  test('パンくずリストの項目が正しく表示される', () => {
    render(<Breadcrumbs />);

    // ホームリンクが表示されることを確認
    expect(screen.getByText('ホーム')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'ホーム' })).toBeTruthy();

    // 現在のページ（顧客一覧）が表示されることを確認
    expect(screen.getByText('顧客一覧')).toBeTruthy();
  });

  test('ChevronRightアイコンが表示される', () => {
    render(<Breadcrumbs />);

    // モックされたChevronRightアイコンが表示されることを確認
    expect(screen.getByTestId('chevron-right-icon')).toBeTruthy();
  });

  test('リンクが正しいhrefを持つ', () => {
    render(<Breadcrumbs />);

    // ホームリンクのhrefが正しいことを確認
    const homeLink = screen.getByRole('link', { name: 'ホーム' });
    expect(homeLink).toHaveAttribute('href', '/Home');
  });

  test('ルートパス("/Home")では何も表示されない', () => {
    mockUsePathname.mockReturnValue('/Home');
    mockUseParams.mockReturnValue({});

    render(<Breadcrumbs />);

    // ルートパスの場合、何も表示されない（空のナビゲーション）
    const nav = screen.getByRole('navigation');
    expect(nav.textContent).toBe('');
  });

  test('深いネストパス("/Home/OrderList/123")で正しく表示される', () => {
    mockUsePathname.mockReturnValue('/Home/OrderList/123');
    mockUseParams.mockReturnValue({ id: '123' });

    render(<Breadcrumbs />);

    // ホームリンクが表示される
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    // 注文一覧リンクが表示される
    expect(screen.getByText('注文一覧')).toBeInTheDocument();
    // IDが表示される（現在のページとして）
    expect(screen.getByText('123')).toBeInTheDocument();

    // ChevronRightアイコンが2つ表示される
    const chevronIcons = screen.getAllByTestId('chevron-right-icon');
    expect(chevronIcons).toHaveLength(2);
  });

  test('注文一覧ページ("/Home/OrderList")で正しく表示される', () => {
    mockUsePathname.mockReturnValue('/Home/OrderList');
    mockUseParams.mockReturnValue({});

    render(<Breadcrumbs />);

    // ホームリンクが表示される
    expect(screen.getByText('ホーム')).toBeInTheDocument();
    // 注文一覧が現在のページとして表示される
    expect(screen.getByText('注文一覧')).toBeInTheDocument();

    // ChevronRightアイコンが1つ表示される
    const chevronIcons = screen.getAllByTestId('chevron-right-icon');
    expect(chevronIcons).toHaveLength(1);
  });
});
