import React, { useState } from 'react';
import Papa from 'papaparse';
import { importCustomersFromCSV } from '@/app/actions/customerActions';
import { useStore } from '@/app/contexts/StoreContext';

export type CSVImportModalProps = {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void; // CSVインポート成功時のコールバック
};

// 基本的なModalコンポーネント
const Modal = ({
  open,
  onCancel,
  title,
  footer,
  children,
}: {
  open: boolean;
  onCancel: () => void;
  title: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-brightness-50"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
        <div className="mb-4">{children}</div>
        {footer && <div className="flex justify-center">{footer}</div>}
      </div>
    </div>
  );
};

const CSVImportModal = ({ open, onCancel, onSuccess }: CSVImportModalProps) => {
  const { selectedStore } = useStore();
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = (file: File) => {
    setFileNames([file.name]);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;

      Papa.parse(text, {
        complete: (result) => {
          setCsvData(result.data as string[][]);
        },
        encoding: 'Shift_JIS',
      });
    };
    reader.readAsText(file, 'Shift_JIS');
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      alert('CSVデータがありません');
      return;
    }

    setIsLoading(true);
    try {
      const result = await importCustomersFromCSV(csvData, selectedStore?.id);

      if (result.status === 'success') {
        alert(`${result.data.importedCount}件のデータをインポートしました`);
        onSuccess(); // 成功時にコールバックを呼び出して一覧をリフレッシュ
        onCancel(); // モーダルを閉じる
      } else {
        alert(`エラー: ${result.error}`);
      }
    } catch (error) {
      alert('インポート中にエラーが発生しました');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    processFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        processFile(file);
      }
    }
  };

  const modalContent = (
    <>
      <p className="mb-2 text-sm">文字コード: Shift_JIS</p>

      {/* ドラッグ&ドロップエリア */}
      <div
        className={`mb-4 rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="mb-3">
          <svg
            className="mx-auto h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="mb-2 text-sm text-gray-600">CSVファイルをここにドラッグ&ドロップ</p>
        <p className="mb-3 text-xs text-gray-500">または</p>
        <label
          htmlFor="csv-upload"
          className="inline-block cursor-pointer rounded bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
        >
          ファイルを選択
        </label>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* ファイル名を改行して表示 */}
      {fileNames.length > 0 && (
        <div className="mb-3 text-xs whitespace-pre-line text-gray-600">{fileNames.join('\n')}</div>
      )}
    </>
  );

  const modalFooter = (
    <button
      className="mx-auto bg-slate-900 px-8 py-2 text-white hover:bg-slate-700"
      onClick={handleImport}
      disabled={isLoading || csvData.length === 0}
    >
      {isLoading ? 'インポート中...' : 'インポート'}
    </button>
  );

  return (
    <Modal open={open} onCancel={onCancel} title="CSVファイルをインポート" footer={modalFooter}>
      {modalContent}
    </Modal>
  );
};

export default CSVImportModal;
