import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import HomePage from './page';
import { useRouter } from 'next/navigation';
import { useStore } from '@/app/contexts/StoreContext';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock StoreContext
vi.mock('@/app/contexts/StoreContext', () => ({
  useStore: vi.fn(),
}));

// Mock Loading component
vi.mock('@/app/components/Loading', () => ({
  Loading: function Loading({ variant, size, text }: { variant?: string; size?: string; text?: string }) {
    return (
      <div data-testid="loading-component">
        <span data-testid="loading-variant">{variant}</span>
        <span data-testid="loading-size">{size}</span>
        <span data-testid="loading-text">{text}</span>
      </div>
    );
  },
}));

describe('HomePage', () => {
  const mockPush = vi.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
  });

  it('renders loading component with correct props', () => {
    vi.mocked(useStore).mockReturnValue({
      selectedStore: null,
    });

    render(<HomePage />);

    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    expect(screen.getByTestId('loading-variant')).toHaveTextContent('spinner');
    expect(screen.getByTestId('loading-size')).toHaveTextContent('md');
    expect(screen.getByTestId('loading-text')).toHaveTextContent('読み込み中...');
  });

  it('redirects to /Home when selectedStore exists', () => {
    vi.mocked(useStore).mockReturnValue({
      selectedStore: { id: 1, name: 'Test Store' },
    });

    render(<HomePage />);

    expect(mockPush).toHaveBeenCalledWith('/Home');
  });

  it('redirects to /stores when selectedStore is null', () => {
    vi.mocked(useStore).mockReturnValue({
      selectedStore: null,
    });

    render(<HomePage />);

    expect(mockPush).toHaveBeenCalledWith('/stores');
  });

  it('redirects to /stores when selectedStore is undefined', () => {
    vi.mocked(useStore).mockReturnValue({
      selectedStore: undefined,
    });

    render(<HomePage />);

    expect(mockPush).toHaveBeenCalledWith('/stores');
  });

  it('has the correct CSS classes for styling', () => {
    vi.mocked(useStore).mockReturnValue({
      selectedStore: null,
    });

    render(<HomePage />);

    const container = screen.getByTestId('loading-component').parentElement;
    expect(container).toHaveClass('flex', 'min-h-screen', 'items-center', 'justify-center', 'bg-gray-50');
  });
});