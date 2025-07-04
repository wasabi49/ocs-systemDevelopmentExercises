import React, { useState } from 'react';
import Papa from 'papaparse';
import { importCustomersFromCSV } from '@/app/actions/customerActions';
import { useStore } from '@/app/contexts/StoreContext';
import { Loading } from '@/app/components/Loading';

export type CSVImportModalProps = {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void; // CSVインポート成功時のコールバック
};

type ImportResult = {
  status: 'success' | 'error';
  data?: {
    totalProcessed: number;
    addedCount: number;
    updatedCount: number;
    deletedCount: number;
  };
  error?: string;
  errorData?: {
    currentStoreName: string;
    invalidCustomers: Array<{
      customerId: string;
      storeName: string;
    }>;
    moreCount: number;
  };
};

// CSV検証結果の型定義
type CSVValidationResult = {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  details?: {
    totalRows: number;
    headerRow?: string[];
    validDataRows: number;
    invalidRows: Array<{
      rowIndex: number;
      issues: string[];
    }>;
  };
};

// 美しい結果表示コンポーネント
const ImportResultDisplay = ({
  result,
  onClose,
}: {
  result: ImportResult;
  onClose: () => void;
}) => {
  const isSuccess = result.status === 'success';

  return (
    <div className="text-center">
      {/* アイコンとタイトル */}
      <div className="mb-6">
        <div
          className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isSuccess
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/25'
              : 'bg-gradient-to-r from-red-400 to-pink-500 shadow-lg shadow-red-500/25'
          }`}
        >
          {isSuccess ? (
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>
        <h3 className={`text-xl font-bold ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
          {isSuccess ? 'インポート完了' : 'エラーが発生しました'}
        </h3>
      </div>

      {/* 結果詳細 */}
      {isSuccess && result.data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
              <div className="text-2xl font-bold text-blue-600">{result.data.totalProcessed}</div>
              <div className="text-sm font-medium text-blue-800">処理対象</div>
            </div>
            <div className="rounded-lg border border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
              <div className="text-2xl font-bold text-green-600">{result.data.addedCount}</div>
              <div className="text-sm font-medium text-green-800">新規追加</div>
            </div>
            <div className="rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
              <div className="text-2xl font-bold text-amber-600">{result.data.updatedCount}</div>
              <div className="text-sm font-medium text-amber-800">更新</div>
            </div>
            <div className="rounded-lg border border-red-100 bg-gradient-to-br from-red-50 to-pink-50 p-4">
              <div className="text-2xl font-bold text-red-600">{result.data.deletedCount}</div>
              <div className="text-sm font-medium text-red-800">削除</div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
            <p className="text-sm font-medium text-green-700">
              ✨ 顧客データが正常にインポートされました
            </p>
          </div>
        </div>
      ) : (
        <div className="max-h-80 space-y-4 overflow-y-auto pr-2">
          {/* メインエラーメッセージ */}
          <div className="rounded-lg border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-6">
            <div className="flex items-start space-x-3">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-medium text-red-800">エラー詳細</p>
                <div className="mt-1 text-sm font-medium break-words whitespace-pre-wrap text-red-800">
                  {result.error}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 閉じるボタン */}
      <button
        onClick={onClose}
        className={`mt-6 rounded-lg px-8 py-3 font-medium transition-all duration-200 ${
          isSuccess
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:from-green-600 hover:to-emerald-700'
            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg hover:from-gray-600 hover:to-gray-700'
        }`}
      >
        {isSuccess ? '完了' : '閉じる'}
      </button>
    </div>
  );
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-brightness-50"
      onClick={onCancel}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-lg bg-white p-4 shadow-lg sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex flex-shrink-0 items-center justify-between sm:mb-4">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">{title}</h3>
          <button
            onClick={onCancel}
            className="text-lg text-gray-400 hover:text-gray-600 sm:text-xl"
          >
            ×
          </button>
        </div>
        <div className="mb-3 min-h-0 flex-1 overflow-y-auto pr-2 sm:mb-4">{children}</div>
        {footer && <div className="flex flex-shrink-0 justify-center">{footer}</div>}
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
  const [showResult, setShowResult] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const processFile = (file: File) => {
    setFileNames([file.name]);
    setCsvValidation(null); // 検証結果をリセット

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;

      Papa.parse(text, {
        complete: (result) => {
          const parsedData = result.data as string[][];
          setCsvData(parsedData);
        },
        encoding: 'Shift_JIS',
        skipEmptyLines: true,
      });
    };
    reader.readAsText(file, 'Shift_JIS');
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      setImportResult({ status: 'error', error: 'CSVデータがありません' });
      setShowResult(true);
      return;
    }

    // インポート時にCSV検証を実行
    const validation = validateCSVStructure(csvData, selectedStore?.name);
    setCsvValidation(validation);

    if (!validation.isValid) {
      setImportResult({
        status: 'error',
        error: validation.error || 'CSVファイルの形式が正しくありません',
      });
      setShowResult(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await importCustomersFromCSV(csvData, selectedStore?.id);

      if (result.status === 'success') {
        setImportResult(result as ImportResult);
        setShowResult(true);
        // 成功時にコールバックを呼び出して一覧をリフレッシュ
        onSuccess();
      } else {
        setImportResult({
          status: 'error',
          error: result.error || 'インポートに失敗しました',
          errorData: result.errorData,
        });
        setShowResult(true);
      }
    } catch (error) {
      console.error(error);
      setImportResult({ status: 'error', error: 'インポート中にエラーが発生しました' });
      setShowResult(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setFileNames([]);
    setCsvData([]);
    setIsDragActive(false);
    setIsLoading(false);
    setShowResult(false);
    setImportResult(null);
    setCsvValidation(null);
  };

  const handleCancel = () => {
    resetState();
    onCancel();
  };

  const handleResultClose = () => {
    resetState();
    onCancel(); // モーダルを閉じる
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

  const validateCSVStructure = (csvData: string[][], storeName?: string): CSVValidationResult => {
    if (!csvData || csvData.length === 0) {
      return {
        isValid: false,
        error: 'CSVファイルが空です',
      };
    }

    if (csvData.length < 2) {
      return {
        isValid: false,
        error: 'CSVファイルにデータ行がありません（ヘッダー行のみ）',
      };
    }

    const headerRow = csvData[0];
    const dataRows = csvData.slice(1);
    const warnings: string[] = [];
    const invalidRows: Array<{ rowIndex: number; issues: string[] }> = [];

    // ヘッダー行の基本検証
    if (headerRow.length < 8) {
      return {
        isValid: false,
        error:
          'CSVファイルの列数が不足しています（8列必要：顧客ID、店舗名、顧客名、担当者名、住所、電話番号、配送条件、備考）',
      };
    }

    // 推奨されるヘッダー名をチェック
    const expectedHeaders = [
      '顧客ID',
      '店舗名',
      '顧客名',
      '担当者名',
      '住所',
      '電話番号',
      '配送条件',
      '備考',
    ];
    const headerWarnings: string[] = [];

    expectedHeaders.forEach((expected, index) => {
      const actual = headerRow[index]?.toString().trim();
      if (
        actual &&
        !actual.includes(expected.replace('ID', '')) &&
        !actual.toLowerCase().includes(expected.toLowerCase().replace('ID', 'id'))
      ) {
        headerWarnings.push(`列${index + 1}: "${actual}" (推奨: "${expected}")`);
      }
    });

    if (headerWarnings.length > 0) {
      warnings.push(`ヘッダー名が推奨形式と異なります: ${headerWarnings.join(', ')}`);
    }

    // データ行の検証
    let validDataRows = 0;
    dataRows.forEach((row, index) => {
      const rowIndex = index + 2; // ヘッダーを除いた実際の行番号
      const issues: string[] = [];

      // 基本的な列数チェック
      if (row.length < 8) {
        issues.push(
          '列数が不足しています（8列必要：顧客ID、店舗名、顧客名、担当者名、住所、電話番号、配送条件、備考）',
        );
      } else {
        const customerIdCol = row[0]?.toString().trim();
        const storeNameCol = row[1]?.toString().trim();
        const customerNameCol = row[2]?.toString().trim();
        const contactPersonCol = row[3]?.toString().trim();
        const addressCol = row[4]?.toString().trim();
        const phoneCol = row[5]?.toString().trim();
        const deliveryConditionCol = row[6]?.toString().trim();
        const noteCol = row[7]?.toString().trim();

        // 必須項目チェック
        if (!storeNameCol) {
          issues.push('店舗名が空です');
        }
        if (!customerNameCol) {
          issues.push('顧客名が空です');
        }

        // 店舗名チェック（現在選択している店舗と比較）
        if (storeName && storeNameCol && storeNameCol !== storeName) {
          issues.push(`店舗名が一致しません（期待値: "${storeName}", 実際: "${storeNameCol}"）`);
        }

        // 顧客IDの形式チェック（存在する場合）
        if (customerIdCol && !customerIdCol.match(/^C-\d{5}$/)) {
          warnings.push(
            `行${rowIndex}: 顧客ID "${customerIdCol}" が推奨形式（C-00001）と異なります`,
          );
        }

        // 電話番号の形式チェック（存在する場合）
        if (phoneCol && !phoneCol.match(/^[\d\-\(\)\s\+]+$/)) {
          warnings.push(`行${rowIndex}: 電話番号 "${phoneCol}" の形式が正しくない可能性があります`);
        }

        // データ長チェック
        if (customerNameCol && customerNameCol.length > 100) {
          issues.push('顧客名が長すぎます（100文字以内）');
        }
        if (contactPersonCol && contactPersonCol.length > 100) {
          issues.push('担当者名が長すぎます（100文字以内）');
        }
        if (addressCol && addressCol.length > 200) {
          issues.push('住所が長すぎます（200文字以内）');
        }
        if (phoneCol && phoneCol.length > 20) {
          issues.push('電話番号が長すぎます（20文字以内）');
        }
        if (deliveryConditionCol && deliveryConditionCol.length > 100) {
          issues.push('配送条件が長すぎます（100文字以内）');
        }
        if (noteCol && noteCol.length > 500) {
          issues.push('備考が長すぎます（500文字以内）');
        }

        // オプション項目の存在チェック（警告として表示）
        if (!contactPersonCol) {
          warnings.push(`行${rowIndex}: 担当者名が空です`);
        }
        if (!addressCol) {
          warnings.push(`行${rowIndex}: 住所が空です`);
        }
        if (!phoneCol) {
          warnings.push(`行${rowIndex}: 電話番号が空です`);
        }
      }

      if (issues.length === 0) {
        validDataRows++;
      } else {
        invalidRows.push({ rowIndex, issues });
      }
    });

    // 結果の判定
    const isValid = invalidRows.length === 0;
    let error: string | undefined;

    if (!isValid) {
      if (validDataRows === 0) {
        error = 'インポート可能な有効なデータ行がありません';
      } else {
        error = `${invalidRows.length}行にエラーがあります`;
      }
    }

    return {
      isValid,
      error,
      warnings: warnings.length > 0 ? warnings : undefined,
      details: {
        totalRows: csvData.length,
        headerRow,
        validDataRows,
        invalidRows,
      },
    };
  };

  const modalContent = (
    <>
      <p className="mb-2 text-xs text-gray-600 sm:text-sm">文字コード: Shift_JIS</p>

      {/* CSV形式の説明 */}
      <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 p-3 sm:mb-4">
        <p className="mb-2 text-xs font-medium text-blue-800">必要なCSV項目（8列）:</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-blue-700">
          <div>1. 顧客ID</div>
          <div>2. 店舗名</div>
          <div>3. 顧客名</div>
          <div>4. 担当者名</div>
          <div>5. 住所</div>
          <div>6. 電話番号</div>
          <div>7. 配送条件</div>
          <div>8. 備考</div>
        </div>
      </div>

      {/* ドラッグ&ドロップエリア */}
      <div
        className={`mb-3 rounded-lg border-2 border-dashed p-4 text-center transition-colors sm:mb-4 sm:p-6 ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="mb-2 sm:mb-3">
          <svg
            className="mx-auto h-6 w-6 text-gray-400 sm:h-8 sm:w-8"
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
        <p className="mb-1 text-xs text-gray-600 sm:mb-2 sm:text-sm">
          CSVファイルをここにドラッグ&ドロップ
        </p>
        <p className="mb-2 text-xs text-gray-500 sm:mb-3">または</p>
        <label
          htmlFor="csv-upload"
          className="inline-block cursor-pointer rounded bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600 sm:px-4 sm:py-2 sm:text-sm"
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

      {/* ファイル名とデータ行数の表示 */}
      {fileNames.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <div className="mb-2 text-xs whitespace-pre-line text-gray-600">
            {fileNames.join('\n')}
          </div>
          {csvData.length > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center">
                <svg
                  className="mr-2 h-5 w-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-blue-800">CSVファイル読み込み完了</span>
              </div>
              <div className="mt-2 text-xs text-blue-700">
                データ行数: {csvData.length - 1}行（ヘッダー除く）
              </div>
              <div className="mt-1 text-xs text-blue-600">
                インポートボタンを押すとデータの検証とインポートを開始します
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );

  const modalFooter = (
    <button
      className={`mx-auto px-6 py-1.5 text-sm text-white sm:px-8 sm:py-2 ${
        isLoading || csvData.length === 0
          ? 'cursor-not-allowed bg-gray-400'
          : 'bg-slate-900 hover:bg-slate-700'
      }`}
      onClick={handleImport}
      disabled={isLoading || csvData.length === 0}
    >
      {isLoading ? <Loading variant="button" size="sm" text="インポート中..." /> : 'データインポート'}
    </button>
  );

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={showResult ? 'インポート結果' : 'CSVファイルで顧客データをインポート'}
      footer={showResult ? null : modalFooter}
    >
      {showResult && importResult ? (
        <ImportResultDisplay result={importResult} onClose={handleResultClose} />
      ) : (
        modalContent
      )}
    </Modal>
  );
};

export default CSVImportModal;
