import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { Loading, LoadingWithIcon, LoadingOverlay } from './Loading';

describe('Loading', () => {
  it('renders loading component with text', () => {
    render(<Loading text="読み込み中..." />);

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('renders loading component with custom text', () => {
    render(<Loading text="データを取得中..." />);

    expect(screen.getByText('データを取得中...')).toBeInTheDocument();
  });

  it('renders default spinner variant', () => {
    render(<Loading />);

    const container = document.querySelector('.animate-spin');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('border-blue-600');
  });

  it('renders dots variant', () => {
    render(<Loading variant="dots" />);

    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  it('renders text variant', () => {
    render(<Loading variant="text" text="読み込み中..." />);

    const textElement = screen.getByText('読み込み中...');
    expect(textElement).toHaveClass('text-gray-600');
  });

  it('renders button variant', () => {
    render(<Loading variant="button" text="処理中..." />);

    expect(screen.getByText('処理中...')).toBeInTheDocument();
    const spinner = document.querySelector('.border-t-transparent');
    expect(spinner).toBeInTheDocument();
  });

  it('renders small size correctly', () => {
    render(<Loading size="sm" text="読み込み中..." />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-4', 'w-4');
  });

  it('renders medium size correctly', () => {
    render(<Loading size="md" text="読み込み中..." />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-8', 'w-8');
  });

  it('renders large size correctly', () => {
    render(<Loading size="lg" text="読み込み中..." />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('h-12', 'w-12');
  });

  it('renders spinning animation', () => {
    render(<Loading />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('animate-spin');
  });

  it('renders with default container classes', () => {
    render(<Loading />);

    const container = document.querySelector('.flex.items-center.justify-center');
    expect(container).toBeInTheDocument();
  });

  it('renders fullScreen variant correctly', () => {
    render(<Loading fullScreen />);

    const container = document.querySelector('.fixed.inset-0');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-gray-50');
  });

  it('renders with flex layout classes', () => {
    render(<Loading text="読み込み中..." />);

    const innerContainer = document.querySelector('.flex.flex-col.items-center.gap-4');
    expect(innerContainer).toBeInTheDocument();
  });

  it('renders custom className', () => {
    render(<Loading className="custom-class" />);

    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('handles no text prop', () => {
    render(<Loading />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('handles long text prop', () => {
    const longText = 'とても長いローディングメッセージが表示されています。この文字列は非常に長く、複数行にわたる可能性があります。';
    render(<Loading text={longText} />);

    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('handles special characters in text', () => {
    const specialText = 'データ読み込み中... (50%)';
    render(<Loading text={specialText} />);

    expect(screen.getByText(specialText)).toBeInTheDocument();
  });

  it('applies default padding for medium size', () => {
    render(<Loading />);

    const container = document.querySelector('.p-4');
    expect(container).toBeInTheDocument();
  });

  it('renders multiple Loading components independently', () => {
    render(
      <div>
        <Loading text="読み込み中1..." />
        <Loading text="読み込み中2..." variant="dots" />
      </div>
    );

    expect(screen.getByText('読み込み中1...')).toBeInTheDocument();
    expect(screen.getByText('読み込み中2...')).toBeInTheDocument();
    
    const spinners = document.querySelectorAll('.animate-spin, .animate-bounce');
    expect(spinners.length).toBeGreaterThan(0);
  });

  it('renders dots with correct animation delays', () => {
    render(<Loading variant="dots" />);

    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots[0]).toHaveStyle('animation-delay: 0ms');
    expect(dots[1]).toHaveStyle('animation-delay: 150ms');
    expect(dots[2]).toHaveStyle('animation-delay: 300ms');
  });

  it('renders text variant without duplicate text', () => {
    render(<Loading variant="text" text="テストテキスト" />);

    const textElements = screen.getAllByText('テストテキスト');
    expect(textElements).toHaveLength(1);
  });

  it('renders button variant with white text', () => {
    render(<Loading variant="button" text="処理中..." />);

    const textElement = screen.getByText('処理中...');
    expect(textElement).toHaveClass('text-white');
  });

  it('handles undefined variant gracefully', () => {
    // @ts-expect-error - testing edge case
    render(<Loading variant={undefined} />);

    // Should default to spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows text for spinner and dots variants when provided', () => {
    render(<Loading variant="spinner" text="スピナーテキスト" />);
    expect(screen.getByText('スピナーテキスト')).toBeInTheDocument();

    render(<Loading variant="dots" text="ドッツテキスト" />);
    expect(screen.getByText('ドッツテキスト')).toBeInTheDocument();
  });

  it('does not show additional text for text and button variants', () => {
    render(<Loading variant="text" text="テキストのみ" />);
    // Text variant should only show text once
    const textElements = screen.getAllByText('テキストのみ');
    expect(textElements).toHaveLength(1);

    render(<Loading variant="button" text="ボタンテキスト" />);
    // Button variant should only show text once
    const buttonTextElements = screen.getAllByText('ボタンテキスト');
    expect(buttonTextElements).toHaveLength(1);
  });
});

describe('LoadingWithIcon', () => {
  it('renders with icon by default', () => {
    render(<LoadingWithIcon text="アイコン付きローディング" />);

    expect(screen.getByText('アイコン付きローディング')).toBeInTheDocument();
    const iconElement = document.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });

  it('renders without icon when icon=false', () => {
    render(<LoadingWithIcon icon={false} text="アイコンなし" />);

    expect(screen.getByText('アイコンなし')).toBeInTheDocument();
    const iconElement = document.querySelector('svg');
    expect(iconElement).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    render(<LoadingWithIcon size="sm" text="小さい" />);
    const smallIcon = document.querySelector('.h-4.w-4');
    expect(smallIcon).toBeInTheDocument();

    render(<LoadingWithIcon size="md" text="中程度" />);
    const mediumIcon = document.querySelector('.h-6.w-6');
    expect(mediumIcon).toBeInTheDocument();

    render(<LoadingWithIcon size="lg" text="大きい" />);
    const largeIcon = document.querySelector('.h-8.w-8');
    expect(largeIcon).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<LoadingWithIcon className="custom-loading" text="カスタム" />);

    const container = document.querySelector('.custom-loading');
    expect(container).toBeInTheDocument();
    expect(screen.getByText('カスタム')).toBeInTheDocument();
  });

  it('renders without text', () => {
    render(<LoadingWithIcon />);

    const iconElement = document.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });
});

describe('LoadingOverlay', () => {
  it('renders overlay with background', () => {
    render(<LoadingOverlay text="オーバーレイ" />);

    expect(screen.getByText('オーバーレイ')).toBeInTheDocument();
    const overlay = document.querySelector('.fixed.inset-0.z-40');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('bg-black');
  });

  it('renders loading content in overlay', () => {
    render(<LoadingOverlay variant="dots" text="ドッツオーバーレイ" />);

    expect(screen.getByText('ドッツオーバーレイ')).toBeInTheDocument();
    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  it('renders with different loading variants', () => {
    render(<LoadingOverlay variant="spinner" size="lg" text="大きなスピナー" />);

    expect(screen.getByText('大きなスピナー')).toBeInTheDocument();
    const spinner = document.querySelector('.h-12.w-12');
    expect(spinner).toBeInTheDocument();
  });

  it('renders overlay structure correctly', () => {
    render(<LoadingOverlay fullScreen />);

    const backgroundOverlay = document.querySelector('.bg-opacity-50.fixed.inset-0.z-40');
    expect(backgroundOverlay).toBeInTheDocument();
    
    const contentOverlay = document.querySelector('.fixed.inset-0.z-50');
    expect(contentOverlay).toBeInTheDocument();
    
    const contentBox = document.querySelector('.rounded-lg.bg-white.p-6.shadow-lg');
    expect(contentBox).toBeInTheDocument();
  });
});