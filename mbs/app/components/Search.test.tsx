/// <reference types="vitest" />
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Search, { SearchProps } from './Search';
import { vi } from 'vitest';

//テストに共通で使う「初期状態の props」を定義しています。毎回同じ値を書くのを避ける
describe('Search コンポーネント', () => {
  const defaultProps: SearchProps = {
    keyword: '',
    onKeywordChange: vi.fn(),
    searchField: 'name',
    onSearchFieldChange: vi.fn(),
    searchFieldOptions: [
      { value: 'name', label: '名前' },
      { value: 'email', label: 'メール' },
    ],
    placeholder: '検索してください',
    actionButtonLabel: '追加',
    onActionButtonClick: vi.fn(),
    actionButtonDisabled: false,
  };

  it('検索キーワードの入力が反映される', () => {
    render(<Search {...defaultProps} />);

    const input = screen.getByLabelText('検索フィールド');
    fireEvent.change(input, { target: { value: 'test keyword' } });

    expect(defaultProps.onKeywordChange).toHaveBeenCalledWith('test keyword');
  });

  it('検索フィールドの選択が反映される', () => {
    render(<Search {...defaultProps} />);

    const select = screen.getByDisplayValue('名前');
    fireEvent.change(select, { target: { value: 'email' } });

    expect(defaultProps.onSearchFieldChange).toHaveBeenCalledWith('email');
  });

  it('アクションボタンが表示されてクリックできる', () => {
    render(<Search {...defaultProps} />);

    const button = screen.getByRole('button', { name: '追加' });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(defaultProps.onActionButtonClick).toHaveBeenCalled();
  });

  it('アクションボタンが disabled のとき無効化されている', () => {
    render(<Search {...defaultProps} actionButtonDisabled={true} />);

    const button = screen.getByRole('button', { name: '追加' });
    expect(button).toBeDisabled();
  });

  it('アクションボタンが非表示の場合、表示されない', () => {
    const { queryByRole } = render(
      <Search
        {...defaultProps}
        actionButtonLabel={undefined}
        onActionButtonClick={undefined}
      />
    );

    const button = queryByRole('button', { name: '追加' });
    expect(button).not.toBeInTheDocument();
  });
});
