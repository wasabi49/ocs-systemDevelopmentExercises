import React, { useState } from 'react';
import Papa from 'papaparse';

export type ModalProps = {
  open: boolean;
  onCancel: () => void;
  onOk: (data: string[][]) => void;
};

const Modal = ({ open, onCancel, onOk }: ModalProps) => {
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

  return open ? (
    <>
      <div className="absolute top-1/2 left-1/2 z-20 flex w-96 -translate-x-1/2 -translate-y-1/2 transform flex-col bg-white p-5">
        <h1 className="mb-2 text-xl font-bold">CSVファイルをインポート</h1>
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
          <div className="mb-3 text-xs whitespace-pre-line text-gray-600">
            {fileNames.join('\n')}
          </div>
        )}

        <div className="mt-auto flex w-full">
          <button
            className="mx-auto bg-slate-900 px-8 py-2 text-white hover:bg-slate-700"
            onClick={() => onOk(csvData)}
          >
            インポート
          </button>
        </div>
      </div>
      <div
        className="bg-opacity-25 fixed inset-0 z-10 h-full w-full bg-black/50"
        onClick={onCancel}
      ></div>
    </>
  ) : null;
};

export default Modal;
