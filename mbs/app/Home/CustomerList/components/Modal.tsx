import React, { useState } from 'react';
import Papa from 'papaparse';
import Modal from '../../../components/Modal';

export type CSVImportModalProps = {
  open: boolean;
  onCancel: () => void;
  onOk: (data: string[][]) => void;
};

const CSVImportModal = ({ open, onCancel, onOk }: CSVImportModalProps) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileNames([file.name]); // ここでファイル名を保存

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;

      Papa.parse(text, {
        complete: (result) => {
          setCsvData(result.data as string[][]);
        },
        encoding: 'Shift_JIS', // Shift_JISに対応
      });
    };
    reader.readAsText(file, 'Shift_JIS'); // 明示的にShift_JISで読む
  };

  const modalContent = (
    <>
      <p className="mb-2 text-sm">文字コード: Shift_JIS</p>

      <div className="mb-3">
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
      onClick={() => onOk(csvData)}
    >
      インポート
    </button>
  );

  return (
    <Modal open={open} onCancel={onCancel} title="CSVファイルをインポート" footer={modalFooter}>
      {modalContent}
    </Modal>
  );
};

export default Modal;
