import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import LoadingPage from './loading';

// Mock the Loading component
vi.mock('./components/Loading', () => ({
  Loading: ({ variant, size, text, fullScreen }: {
    variant: string;
    size: string;
    text: string;
    fullScreen: boolean;
  }) => (
    <div data-testid="loading-component">
      <div data-variant={variant}></div>
      <div data-size={size}></div>
      <div data-text={text}>{text}</div>
      <div data-fullscreen={fullScreen.toString()}></div>
    </div>
  ),
}));

describe('LoadingPage', () => {
  it('renders loading page correctly', () => {
    render(<LoadingPage />);
    
    expect(screen.getByTestId('loading-component')).toBeInTheDocument();
    expect(screen.getByText('データを読み込み中です')).toBeInTheDocument();
  });

  it('passes correct props to Loading component', () => {
    render(<LoadingPage />);
    
    const loadingComponent = screen.getByTestId('loading-component');
    expect(loadingComponent.querySelector('[data-variant="spinner"]')).toBeInTheDocument();
    expect(loadingComponent.querySelector('[data-size="lg"]')).toBeInTheDocument();
    expect(loadingComponent.querySelector('[data-text="データを読み込み中です"]')).toBeInTheDocument();
    expect(loadingComponent.querySelector('[data-fullscreen="true"]')).toBeInTheDocument();
  });

  it('displays the correct loading text', () => {
    render(<LoadingPage />);
    
    const textElement = screen.getByText('データを読み込み中です');
    expect(textElement).toBeInTheDocument();
  });
});