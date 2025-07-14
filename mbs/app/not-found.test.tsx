import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import NotFound from './not-found';

describe('NotFound', () => {
  it('404ページが正しく表示される', () => {
    render(<NotFound />);
    
    expect(screen.getByText('お探しのページは見つかりませんでした')).toBeInTheDocument();
    expect(screen.getByText('404 - not found')).toBeInTheDocument();
  });

  it('正しいスタイリングクラスを持つ', () => {
    const { container } = render(<NotFound />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('flex', 'h-screen', 'flex-col', 'items-center', 'justify-center', 'bg-gray-100');
  });

  it('両方のヘッダー要素が表示される', () => {
    render(<NotFound />);
    
    const h1 = screen.getByRole('heading', { level: 1 });
    const h2 = screen.getByRole('heading', { level: 2 });
    
    expect(h1).toBeInTheDocument();
    expect(h2).toBeInTheDocument();
    expect(h1.textContent).toBe('お探しのページは見つかりませんでした');
    expect(h2.textContent).toBe('404 - not found');
  });
});