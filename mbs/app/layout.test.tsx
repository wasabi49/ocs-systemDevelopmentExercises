import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import RootLayout from './layout';

// Mock CSS import
vi.mock('./globals.css', () => ({}));

// Mock all the imported components
vi.mock('./components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('./components/Breadcrumbs', () => ({
  default: () => <div data-testid="breadcrumbs">Breadcrumbs</div>,
}));

vi.mock('./components/StoreGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="store-guard">{children}</div>
  ),
}));

vi.mock('./contexts/StoreContext', () => ({
  StoreProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="store-provider">
      {children}
    </div>
  ),
}));

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Geist: () => ({
    variable: '--font-geist-sans',
  }),
  Geist_Mono: () => ({
    variable: '--font-geist-mono',
  }),
}));

describe('RootLayout', () => {
  it('レイアウト構造が正しく表示される', () => {
    const TestComponent = RootLayout({
      children: <div data-testid="test-children">Test Content</div>,
    });

    render(TestComponent);

    // Check if all main components are rendered
    expect(screen.getByTestId('store-provider')).toBeInTheDocument();
    expect(screen.getByTestId('store-guard')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
  });

  it('StoreProviderがコンポーネントをラップする', () => {
    const TestComponent = RootLayout({
      children: <div>Test</div>,
    });

    render(TestComponent);

    const storeProvider = screen.getByTestId('store-provider');
    expect(storeProvider).toBeInTheDocument();
  });

  it('レイアウト構造内で子要素を表示する', () => {
    const testContent = 'Custom test content';
    const TestComponent = RootLayout({
      children: <div>{testContent}</div>,
    });

    render(TestComponent);

    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  it('必要なレイアウト要素を含む', () => {
    const TestComponent = RootLayout({
      children: <div data-testid="test-child">Test</div>,
    });

    render(TestComponent);
    
    // Check that the layout contains the required structure
    expect(screen.getByTestId('store-provider')).toBeInTheDocument();
    expect(screen.getByTestId('store-guard')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
  });


  it('適切なコンポーネント階層を維持する', () => {
    const TestComponent = RootLayout({
      children: <div data-testid="child-content">Child</div>,
    });

    render(TestComponent);

    // Check that StoreGuard contains Header, Breadcrumbs, and children
    const storeGuard = screen.getByTestId('store-guard');
    expect(storeGuard).toContainElement(screen.getByTestId('header'));
    expect(storeGuard).toContainElement(screen.getByTestId('breadcrumbs'));
    expect(storeGuard).toContainElement(screen.getByTestId('child-content'));
  });
});