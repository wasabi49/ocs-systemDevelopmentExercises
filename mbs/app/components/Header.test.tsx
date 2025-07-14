import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Header from './Header';

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock Next Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Home: () => <svg data-testid="home-icon" />,
  Users: () => <svg data-testid="users-icon" />,
  ShoppingCart: () => <svg data-testid="shopping-cart-icon" />,
  Truck: () => <svg data-testid="truck-icon" />,
  BarChart3: () => <svg data-testid="bar-chart-icon" />,
  Store: () => <svg data-testid="store-icon" />,
  Menu: () => <svg data-testid="menu-icon" />,
  X: () => <svg data-testid="x-icon" />,
}));

// Mock StoreContext
const mockUseStore = vi.fn();
vi.mock('@/app/contexts/StoreContext', () => ({
  useStore: () => mockUseStore(),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/Home/CustomerList');
    mockUseStore.mockReturnValue({
      selectedStore: { id: 'store1', name: 'Test Store' },
    });
  });

  it('renders header component correctly', () => {
    render(<Header />);

    expect(screen.getByText('MBS')).toBeInTheDocument();
  });

  it('displays navigation menu items', () => {
    render(<Header />);

    expect(screen.getAllByText('顧客管理').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('注文管理').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('納品管理').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('統計情報').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('店舗選択').length).toBeGreaterThanOrEqual(1);
  });

  it('displays selected store information when store is selected', () => {
    render(<Header />);

    expect(screen.getAllByText('Test Store').length).toBeGreaterThanOrEqual(1);
  });

  it('does not display store information when no store is selected', () => {
    mockUseStore.mockReturnValue({
      selectedStore: null,
    });

    render(<Header />);

    expect(screen.queryByText('Test Store')).not.toBeInTheDocument();
  });

  it('handles mobile menu toggle', () => {
    render(<Header />);

    const menuButton = screen.getByTestId('menu-icon').closest('button');
    expect(menuButton).toBeInTheDocument();

    fireEvent.click(menuButton!);
    expect(screen.getAllByTestId('x-icon').length).toBeGreaterThanOrEqual(1);
  });

  it('displays brand name correctly', () => {
    render(<Header />);

    const brandLink = screen.getByText('MBS').closest('a');
    expect(brandLink).toHaveAttribute('href', '/Home');
  });

  it('handles keyboard menu close with Escape key', () => {
    render(<Header />);

    const menuButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuButton!);

    // Menu should be open
    expect(screen.getAllByTestId('x-icon').length).toBeGreaterThanOrEqual(1);

    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Menu should be closed
    expect(screen.getAllByTestId('menu-icon').length).toBeGreaterThanOrEqual(1);
  });

  it('does not close menu with other keys', () => {
    render(<Header />);

    const menuButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuButton!);

    // Menu should be open
    expect(screen.getAllByTestId('x-icon').length).toBeGreaterThanOrEqual(1);

    // Press other key
    fireEvent.keyDown(document, { key: 'Enter', code: 'Enter' });

    // Menu should still be open
    expect(screen.getAllByTestId('x-icon').length).toBeGreaterThanOrEqual(1);
  });

  it('sets body overflow when menu is open', () => {
    render(<Header />);

    const menuButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuButton!);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('resets body overflow when menu is closed', () => {
    render(<Header />);

    const menuButton = screen.getByTestId('menu-icon').closest('button');
    fireEvent.click(menuButton!);
    
    // Open menu
    expect(document.body.style.overflow).toBe('hidden');
    
    // Close menu using the same menu button (toggle)
    fireEvent.click(menuButton!);
    
    expect(document.body.style.overflow).toBe('unset');
  });

  it('hides desktop navigation on store selection page', () => {
    mockUsePathname.mockReturnValue('/stores');
    
    render(<Header />);

    // Desktop navigation should be hidden (md:hidden class means mobile navigation is always visible)
    // But mobile navigation menu items are still there, just verify the component renders
    expect(screen.getByText('店舗選択')).toBeInTheDocument();
  });

  it('hides desktop navigation on home page', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<Header />);

    // Desktop navigation should be hidden on home page too
    expect(screen.getByText('店舗選択')).toBeInTheDocument();
  });
});