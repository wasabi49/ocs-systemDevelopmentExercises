import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Modal from './Modal';
import Papa from 'papaparse';
import { importCustomersFromCSV } from '@/app/actions/customerActions';
import { useStore } from '@/app/contexts/StoreContext';

// Mock dependencies
vi.mock('@/app/actions/customerActions', () => ({
  importCustomersFromCSV: vi.fn(),
}));

vi.mock('@/app/contexts/StoreContext', () => ({
  useStore: vi.fn(),
}));

vi.mock('@/app/components/Loading', () => ({
  Loading: ({ text }: { text: string }) => <div data-testid="loading">{text}</div>,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

describe('Modal', () => {
  const mockProps = {
    open: true,
    onCancel: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useStore).mockReturnValue({
      selectedStore: { id: 'store1', name: 'Test Store' },
    });
  });

  it('renders modal when open is true', () => {
    render(<Modal {...mockProps} />);

    expect(screen.getByText('CSVファイルで顧客データをインポート')).toBeInTheDocument();
    expect(screen.getByText('ファイルを選択')).toBeInTheDocument();
    expect(screen.getByText('必要なCSV項目（8列）:')).toBeInTheDocument();
  });

  it('does not render modal when open is false', () => {
    render(<Modal {...mockProps} open={false} />);

    expect(screen.queryByText('CSVファイルで顧客データをインポート')).not.toBeInTheDocument();
  });

  it('calls onCancel when close button is clicked', () => {
    render(<Modal {...mockProps} />);

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('handles file selection', () => {
    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(fileInput.files?.[0]).toBe(file);
  });

  it('handles file drag and drop', () => {
    render(<Modal {...mockProps} />);

    const dropZone = screen.getByText('CSVファイルをここにドラッグ&ドロップ').closest('div');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });

    fireEvent.dragEnter(dropZone!);
    fireEvent.dragOver(dropZone!);
    fireEvent.drop(dropZone!, { dataTransfer: { files: [file] } });

    expect(dropZone).toBeInTheDocument();
  });

  it('handles drag leave', () => {
    render(<Modal {...mockProps} />);

    const dropZone = screen.getByText('CSVファイルをここにドラッグ&ドロップ').closest('div');

    fireEvent.dragEnter(dropZone!);
    fireEvent.dragLeave(dropZone!);

    expect(dropZone).toBeInTheDocument();
  });

  it('processes CSV file with Papa.parse', async () => {
    const mockData = [
      ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
      ['C001', 'Store1', 'Customer1', 'Manager1', 'Address1', '123-456-7890', 'Condition1', 'Note1'],
    ];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(vi.mocked(Papa.parse)).toHaveBeenCalled();
    });
  });

  it('handles successful import', async () => {
    const mockData = [
      ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
      ['C001', 'Test Store', 'Customer1', 'Manager1', 'Address1', '123-456-7890', 'Condition1', 'Note1'],
    ];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    vi.mocked(importCustomersFromCSV).mockResolvedValue({
      status: 'success',
      data: {
        totalProcessed: 1,
        addedCount: 1,
        updatedCount: 0,
        deletedCount: 0,
      },
    });

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const importButton = screen.getByText('データインポート');
      expect(importButton).not.toBeDisabled();
    });

    const importButton = screen.getByText('データインポート');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(vi.mocked(importCustomersFromCSV)).toHaveBeenCalledWith(mockData, 'store1');
    });

    await waitFor(() => {
      expect(screen.getByText('インポート完了')).toBeInTheDocument();
    });
  });

  it('handles import error', async () => {
    const mockData = [
      ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
      ['C001', 'Test Store', 'Customer1', 'Manager1', 'Address1', '123-456-7890', 'Condition1', 'Note1'],
    ];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    vi.mocked(importCustomersFromCSV).mockResolvedValue({
      status: 'error',
      error: 'Import failed',
    });

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const importButton = screen.getByText('データインポート');
      expect(importButton).not.toBeDisabled();
    });

    const importButton = screen.getByText('データインポート');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  it('handles import exception', async () => {
    const mockData = [
      ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
      ['C001', 'Test Store', 'Customer1', 'Manager1', 'Address1', '123-456-7890', 'Condition1', 'Note1'],
    ];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    vi.mocked(importCustomersFromCSV).mockRejectedValue(new Error('Network error'));

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const importButton = screen.getByText('データインポート');
      expect(importButton).not.toBeDisabled();
    });

    const importButton = screen.getByText('データインポート');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  it('handles empty CSV data', async () => {
    render(<Modal {...mockProps} />);

    const importButton = screen.getByText('データインポート');
    
    // 空のCSVデータの場合、ボタンは無効化されている
    expect(importButton).toBeDisabled();
    
    // 無効化されたボタンをクリックしてもイベントは発生しない
    fireEvent.click(importButton);

    // 結果画面に移行しないことを確認
    expect(screen.queryByText('インポート結果')).not.toBeInTheDocument();
    expect(screen.queryByText('エラーが発生しました')).not.toBeInTheDocument();
    
    // 元の画面が表示されていることを確認
    expect(screen.getByText('CSVファイルで顧客データをインポート')).toBeInTheDocument();
  });

  it('handles CSV file with empty data rows', async () => {
    // 空のCSVファイル（ヘッダーなし）のシナリオ
    const mockData: string[][] = [];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File([''], 'empty.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    // CSVファイルは処理されるが、データが空なのでボタンは無効のまま
    await waitFor(() => {
      const importButton = screen.getByText('データインポート');
      expect(importButton).toBeDisabled();
    });

    // 空のデータなので結果画面は表示されない
    expect(screen.queryByText('インポート結果')).not.toBeInTheDocument();
  });

  it('handles CSV file with header only (no data rows)', async () => {
    // ヘッダーのみでデータ行がないCSVファイル
    const mockData = [
      ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
    ];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['header only'], 'header_only.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const importButton = screen.getByText('データインポート');
      expect(importButton).not.toBeDisabled();
    });

    const importButton = screen.getByText('データインポート');
    fireEvent.click(importButton);

    // 結果画面に移行するまで待機
    await waitFor(() => {
      expect(screen.getByText('インポート結果')).toBeInTheDocument();
    });

    // エラーメッセージの確認
    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
    
    // エラー詳細メッセージも確認（データ行がない場合のエラー）
    await waitFor(() => {
      expect(screen.getByText('CSVファイルにデータ行がありません（ヘッダー行のみ）')).toBeInTheDocument();
    });
  });

  it('validates CSV structure - invalid headers', async () => {
    const mockData = [
      ['Invalid', 'Headers'],
      ['C001', 'Data'],
    ];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const importButton = screen.getByText('データインポート');
      expect(importButton).not.toBeDisabled();
    });

    const importButton = screen.getByText('データインポート');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  it('validates CSV structure - wrong store name', async () => {
    const mockData = [
      ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
      ['C001', 'Wrong Store', 'Customer1', 'Manager1', 'Address1', '123-456-7890', 'Condition1', 'Note1'],
    ];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const importButton = screen.getByText('データインポート');
      expect(importButton).not.toBeDisabled();
    });

    const importButton = screen.getByText('データインポート');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  it('shows loading state during import', async () => {
    const mockData = [
      ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
      ['C001', 'Test Store', 'Customer1', 'Manager1', 'Address1', '123-456-7890', 'Condition1', 'Note1'],
    ];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    // Mock a slow response
    vi.mocked(importCustomersFromCSV).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const importButton = screen.getByText('データインポート');
      expect(importButton).not.toBeDisabled();
    });

    const importButton = screen.getByText('データインポート');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  it('handles result close', async () => {
    const mockData = [
      ['顧客ID', '店舗名', '顧客名', '担当者名', '住所', '電話番号', '配送条件', '備考'],
      ['C001', 'Test Store', 'Customer1', 'Manager1', 'Address1', '123-456-7890', 'Condition1', 'Note1'],
    ];

    vi.mocked(Papa.parse).mockImplementation((file, options) => {
      options.complete({ data: mockData });
    });

    vi.mocked(importCustomersFromCSV).mockResolvedValue({
      status: 'success',
      data: {
        totalProcessed: 1,
        addedCount: 1,
        updatedCount: 0,
        deletedCount: 0,
      },
    });

    render(<Modal {...mockProps} />);

    const fileInput = screen.getByLabelText('ファイルを選択');
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const importButton = screen.getByText('データインポート');
      expect(importButton).not.toBeDisabled();
    });

    const importButton = screen.getByText('データインポート');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText('インポート完了')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('完了');
    fireEvent.click(closeButton);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('handles backdrop click', () => {
    render(<Modal {...mockProps} />);

    // バックドロップをクラス名で取得
    const backdrop = document.querySelector('.fixed.inset-0.z-50');
    fireEvent.click(backdrop!);

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('prevents event bubbling on modal content click', () => {
    render(<Modal {...mockProps} />);

    const modalContent = screen.getByText('CSVファイルで顧客データをインポート').closest('div');
    fireEvent.click(modalContent!);

    expect(mockProps.onCancel).not.toHaveBeenCalled();
  });
});