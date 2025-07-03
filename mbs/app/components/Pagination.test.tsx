/// <reference types="vitest" />
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination, { PaginationProps } from './Pagination';
import { vi } from 'vitest';

describe('Pagination コンポーネント', () => {
  const createProps = (overrides: Partial<PaginationProps> = {}) => ({
    currentPage: 3,
    totalPages: 10,
    onPageChange: vi.fn(),
    itemsInfo: {
      startIndex: 20,
      endIndex: 29,
      totalItems: 100,
    },
    ...overrides,
  });

  it('件数情報と基本ボタンが表示される', () => {
    render(<Pagination {...createProps()} />);

    expect(screen.getByText('21-29 / 100件')).toBeInTheDocument();
    ['最初のページ', '前のページ', '次のページ', '最後のページ'].forEach(label => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    });

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: `${i}` })).toBeInTheDocument();
    }
  });

  it('先頭付近ページの場合は先頭から maxVisiblePages 分のボタンが表示される', () => {
    render(<Pagination {...createProps({ currentPage: 2 })} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: `${i}` })).toBeInTheDocument();
    }
  });

  it('末尾付近ページの場合は末尾から maxVisiblePages 分のボタンが表示される', () => {
    render(<Pagination {...createProps({ currentPage: 9 })} />);
    for (let i = 6; i <= 10; i++) {
      expect(screen.getByRole('button', { name: `${i}` })).toBeInTheDocument();
    }
  });

  it('中央ページでは前後2ページずつ表示される', () => {
    render(<Pagination {...createProps({ currentPage: 5 })} />);
    for (let i = 3; i <= 7; i++) {
      expect(screen.getByRole('button', { name: `${i}` })).toBeInTheDocument();
    }
  });

  it('ページ番号クリックで onPageChange が呼び出される', () => {
    const props = createProps();
    render(<Pagination {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '5' }));
    expect(props.onPageChange).toHaveBeenCalledWith(5);
  });

  it('先頭ページでは「最初」「前へ」ボタンが無効になる', () => {
    render(<Pagination {...createProps({ currentPage: 1 })} />);
    expect(screen.getByRole('button', { name: '最初のページ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '前のページ' })).toBeDisabled();
  });

  it('最終ページでは「次へ」「最後」ボタンが無効になる', () => {
    render(<Pagination {...createProps({ currentPage: 10 })} />);
    expect(screen.getByRole('button', { name: '次のページ' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '最後のページ' })).toBeDisabled();
  });

  it('itemsInfo がない場合は件数情報が表示されない', () => {
    render(<Pagination {...createProps({ itemsInfo: undefined })} />);
    expect(screen.queryByText(/件/)).not.toBeInTheDocument();
  });

  it('ナビゲーションボタンでページ移動が呼ばれる', () => {
    const props = createProps({ currentPage: 4 });
    render(<Pagination {...props} />);
    fireEvent.click(screen.getByRole('button', { name: '最初のページ' }));
    expect(props.onPageChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: '前のページ' }));
    expect(props.onPageChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByRole('button', { name: '次のページ' }));
    expect(props.onPageChange).toHaveBeenCalledWith(5);
    fireEvent.click(screen.getByRole('button', { name: '最後のページ' }));
    expect(props.onPageChange).toHaveBeenCalledWith(10);
  });

  it('maxVisiblePages をカスタムすると表示数が制限される', () => {
    render(<Pagination {...createProps({ maxVisiblePages: 3, currentPage: 2 })} />);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '4' })).not.toBeInTheDocument();
  });
  it('itemsInfo.totalItems が 0 のとき "0件" と表示される', () => {
  render(
    <Pagination
      currentPage={1}
      totalPages={1}
      onPageChange={vi.fn()}
      itemsInfo={{ startIndex: 0, endIndex: 0, totalItems: 0 }}
    />
  );

  expect(screen.getByText('0件')).toBeInTheDocument();
});

});
