import { render, screen, fireEvent } from '@testing-library/react';
import DeliveryTable, { type Delivery } from './DeliveryTable';
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

describe('DeliveryTable', () => {
  const mockDeliveries: Delivery[] = [
    {
      id: 'D0000801',
      date: '2025-06-29',
      customerName: 'テスト顧客1',
      note: '備考1',
    },
    {
      id: 'D0000802',
      date: '2025-06-30',
      customerName: 'テスト顧客2',
      note: '備考2',
    },
  ];

  const mockOnSort = vi.fn();
  const mockRenderSortIcons = vi.fn((field) => <span data-testid={`sort-icon-${field}`}></span>);

  beforeEach(() => {
    mockOnSort.mockClear();
    mockRenderSortIcons.mockClear();
  });

  it('正しくコンポーネントがレンダリングされること', () => {
    render(
      <DeliveryTable
        deliveries={mockDeliveries}
        onSort={mockOnSort}
        renderSortIcons={mockRenderSortIcons}
        sortField={null}
        sortOrder={'asc'}
      />
    );
    // ヘッダーの存在確認
    expect(screen.getByText('納品ID')).toBeInTheDocument();
    expect(screen.getByText('納品日')).toBeInTheDocument();
    expect(screen.getByText('顧客名')).toBeInTheDocument();
    expect(screen.getByText('備考')).toBeInTheDocument();
    // データの表示確認
    mockDeliveries.forEach((delivery) => {
      expect(screen.getByText(delivery.customerName)).toBeInTheDocument();
      expect(screen.getByText(delivery.note)).toBeInTheDocument();
      expect(screen.getByText(delivery.date)).toBeInTheDocument();
    });
  });

  it('納品IDのリンクが正しく生成されること', () => {
    render(
      <DeliveryTable
        deliveries={mockDeliveries}
        onSort={mockOnSort}
        renderSortIcons={mockRenderSortIcons}
        sortField={null}
        sortOrder={'asc'}
      />
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(mockDeliveries.length);
    links.forEach((link, index) => {
      expect(link).toHaveAttribute('href', `/Home/DeliveryList/${mockDeliveries[index].id}`);
    });
  });

  it('空の配列が渡された場合も正しくレンダリングされること', () => {
    render(
      <DeliveryTable
        deliveries={[]}
        onSort={mockOnSort}
        renderSortIcons={mockRenderSortIcons}
        sortField={null}
        sortOrder={'asc'}
      />
    );
    // ヘッダーは表示されているが、データは表示されていないことを確認
    expect(screen.getByText('納品ID')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('ソートアイコンがレンダリングされること', () => {
    render(
      <DeliveryTable
        deliveries={mockDeliveries}
        onSort={mockOnSort}
        renderSortIcons={mockRenderSortIcons}
        sortField={'id'}
        sortOrder={'asc'}
      />
    );
    expect(screen.getByTestId('sort-icon-id')).toBeInTheDocument();
    expect(screen.getByTestId('sort-icon-date')).toBeInTheDocument();
  });

  it('ヘッダークリックでonSortが呼ばれること', () => {
    render(
      <DeliveryTable
        deliveries={mockDeliveries}
        onSort={mockOnSort}
        renderSortIcons={mockRenderSortIcons}
        sortField={null}
        sortOrder={'asc'}
      />
    );
    fireEvent.click(screen.getByText('納品ID'));
    expect(mockOnSort).toHaveBeenCalledWith('id');
    fireEvent.click(screen.getByText('納品日'));
    expect(mockOnSort).toHaveBeenCalledWith('date');
  });
});
