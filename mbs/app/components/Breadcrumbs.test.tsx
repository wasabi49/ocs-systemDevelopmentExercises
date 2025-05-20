import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import Breadcrumbs from './Breadcrumbs';

// Next.jsのuseParamsをモック
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '123' }),
}));

describe('Breadcrumbsコンポーネント', () => {
  test('ホームパスの表示', () => {
    render(<Breadcrumbs path="/Home" />);
    // 空の場合は何も表示されないので、コンテナが存在するかだけ確認
    expect(document.querySelector('nav')).toBeFalsy();
  });

  test('顧客一覧パスの表示', () => {
    render(<Breadcrumbs path="/Home/CustomerList" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 顧客一覧');
  });

  test('注文一覧パスの表示', () => {
    render(<Breadcrumbs path="/Home/OrderList" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 注文一覧');
  });

  test('注文詳細パスの表示', () => {
    render(<Breadcrumbs path="/Home/OrderList/123" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 注文一覧 > 123');
  });

  test('注文追加パスの表示', () => {
    render(<Breadcrumbs path="/Home/OrderList/Add" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 注文一覧 > 追加');
  });

  test('注文編集パスの表示', () => {
    render(<Breadcrumbs path="/Home/OrderList/123/Edit" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 注文一覧 > 123 > 編集');
  });

  test('納品一覧パスの表示', () => {
    render(<Breadcrumbs path="/Home/DeliveryList" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 納品一覧');
  });

  test('納品詳細パスの表示', () => {
    render(<Breadcrumbs path="/Home/DeliveryList/123" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 納品一覧 > 123');
  });

  test('納品追加パスの表示', () => {
    render(<Breadcrumbs path="/Home/DeliveryList/Add" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 納品一覧 > 追加');
  });

  test('納品編集パスの表示', () => {
    render(<Breadcrumbs path="/Home/DeliveryList/123/Edit" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 納品一覧 > 123 > 編集');
  });

  test('統計情報パスの表示', () => {
    render(<Breadcrumbs path="/Home/Statistics" />);
    const content = screen.getByRole('navigation').textContent || '';
    expect(content.replace(/\s+/g, ' ').trim()).toBe('ホーム > 統計情報');
  });
});
