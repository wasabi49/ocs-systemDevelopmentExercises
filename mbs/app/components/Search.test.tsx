import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import Search from './Search';

describe('Search', () => {
  const mockOnSearchFieldChange = vi.fn();
  const mockOnKeywordChange = vi.fn();

  const defaultProps = {
    searchField: 'すべて' as const,
    keyword: '',
    onSearchFieldChange: mockOnSearchFieldChange,
    onKeywordChange: mockOnKeywordChange,
    searchFieldOptions: [
      { value: 'すべて', label: 'すべて' },
      { value: '顧客ID', label: '顧客ID' },
      { value: '顧客名', label: '顧客名' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search component correctly', () => {
    render(<Search {...defaultProps} />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays correct default search field value', () => {
    render(<Search {...defaultProps} />);

    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue('すべて');
  });

  it('displays correct search keyword value', () => {
    render(<Search {...defaultProps} keyword="test keyword" />);

    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveValue('test keyword');
  });

  it('calls onSearchFieldChange when search field is changed', () => {
    render(<Search {...defaultProps} />);

    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: '顧客名' } });

    expect(mockOnSearchFieldChange).toHaveBeenCalledWith('顧客名');
  });

  it('calls onKeywordChange when search keyword is changed', () => {
    render(<Search {...defaultProps} />);

    const inputElement = screen.getByRole('textbox');
    fireEvent.change(inputElement, { target: { value: 'test' } });

    expect(mockOnKeywordChange).toHaveBeenCalledWith('test');
  });

  it('renders with correct placeholder text', () => {
    render(<Search {...defaultProps} />);

    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveAttribute('placeholder', '検索キーワードを入力');
  });

  it('renders action button when provided', () => {
    const propsWithAction = {
      ...defaultProps,
      actionButtonLabel: '追加',
      onActionButtonClick: vi.fn(),
    };

    render(<Search {...propsWithAction} />);

    const actionButton = screen.getByRole('button', { name: '追加' });
    expect(actionButton).toBeInTheDocument();
  });
});