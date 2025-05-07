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
        encoding: "Shift_JIS", // Shift_JISに対応
      });
    };
    reader.readAsText(file, "Shift_JIS"); // 明示的にShift_JISで読む
  };

  return open ? (
    <>
      <div className="bg-white top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 p-5 flex flex-col absolute z-20">
        <h1 className="text-xl font-bold mb-2">CSVファイルをインポート</h1>
        <p className="text-sm mb-2">文字コード: Shift_JIS</p>

        <div className="mb-3">
          <label htmlFor="csv-upload" className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded inline-block">
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
          <div className="text-xs text-gray-600 mb-3 whitespace-pre-line">
            {fileNames.join('\n')}
          </div>
        )}

        <div className="flex mt-auto w-full">
          <button
            className="bg-slate-900 hover:bg-slate-700 text-white px-8 py-2 mx-auto"
            onClick={() => onOk(csvData)}
          >
            インポート
          </button>
        </div>
      </div>
      <div className="fixed inset-0 bg-black/50 bg-opacity-25 w-full h-full z-10" onClick={onCancel}></div>
    </>
  ) : null;
};

export default Modal;
