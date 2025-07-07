import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import React from 'react';
import { render } from '@testing-library/react';
import { pdf } from '@react-pdf/renderer';

import {
  registerJapaneseFont,
  safeJapaneseText,
  formatJapaneseDate,
  formatJapaneseYen,
  OrderPDF,
  generateOrderPdfBuffer,
  generateOrderPdfFileName,
  OrderData,
} from './path-to-your-pdf-utils';

// fsをモック
vi.mock('fs');
// @react-pdf/rendererのpdf関数もモック
vi.mock('@react-pdf/renderer', () => ({
  pdf: vi.fn(),
}));

describe('PDFユーティリティ関数群のテスト', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerJapaneseFont', () => {
    it('フォントファイルが存在し正常に登録されるとtrueを返す', () => {
      (fs.existsSync as vi.Mock).mockReturnValue(true);
      (fs.readFileSync as vi.Mock).mockReturnValue(Buffer.from('dummy font data'));

      const result = registerJapaneseFont();
      expect(result).toBe(true);
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('フォントファイルが存在しない場合falseを返す', () => {
      (fs.existsSync as vi.Mock).mockReturnValue(false);

      const result = registerJapaneseFont();
      expect(result).toBe(false);
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('例外発生時はfalseを返す', () => {
      (fs.existsSync as vi.Mock).mockImplementation(() => {
        throw new Error('fs error');
      });

      const result = registerJapaneseFont();
      expect(result).toBe(false);
    });
  });

  describe('safeJapaneseText', () => {
    it('制御文字を除去しトリムする', () => {
      const input = '\u0000テスト\u001F ';
      expect(safeJapaneseText(input)).toBe('テスト');
    });

    it('文字数制限を超えたら省略される', () => {
      const input = 'あいうえおかきくけこさしすせそたちつてとな';
      const result = safeJapaneseText(input, 10);
      expect(result).toMatch(/...$/);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('空文字やnullは空文字を返す', () => {
      expect(safeJapaneseText('')).toBe('');
      expect(safeJapaneseText(null as any)).toBe('');
      expect(safeJapaneseText(undefined as any)).toBe('');
    });
  });

  describe('formatJapaneseDate', () => {
    it('Dateオブジェクトを正しくフォーマットする', () => {
      const date = new Date('2023-07-07T00:00:00Z');
      const formatted = formatJapaneseDate(date);
      expect(formatted).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    });

    it('文字列の日付を正しくフォーマットする', () => {
      const dateStr = '2023-07-07';
      const formatted = formatJapaneseDate(dateStr);
      expect(formatted).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    });
  });

  describe('formatJapaneseYen', () => {
    it('数値を日本円通貨形式で返す', () => {
      expect(formatJapaneseYen(1234567)).toBe('￥1,234,567');
      expect(formatJapaneseYen(0)).toBe('￥0');
    });
  });

  describe('OrderPDFコンポーネント', () => {
    const validOrderData: OrderData = {
      id: '123',
      orderDate: '2023-07-07',
      customer: { name: 'テスト顧客' },
      orderDetails: [
        {
          productName: '商品A',
          quantity: 1,
          unitPrice: 1000,
          description: 'テスト商品',
        },
      ],
      note: '備考テキスト',
    };

    it('正常にレンダリングされる', () => {
      const { getByText } = render(<OrderPDF orderData={validOrderData} useCustomFont={false} />);
      expect(getByText('注文書')).toBeTruthy();
      expect(getByText('テスト顧客')).toBeTruthy();
      expect(getByText('商品A')).toBeTruthy();
      expect(getByText('1')).toBeTruthy();
      expect(getByText('¥1,000')).toBeTruthy();
      expect(getByText('テスト商品')).toBeTruthy();
      expect(getByText('備考')).toBeTruthy();
      expect(getByText('備考テキスト')).toBeTruthy();
    });

    it('不正なorderDataで例外が投げられる', () => {
      expect(() => render(<OrderPDF orderData={null as any} useCustomFont={false} />)).toThrow();
      expect(() => render(<OrderPDF orderData={{} as any} useCustomFont={false} />)).toThrow();
      expect(() =>
        render(<OrderPDF orderData={{ ...validOrderData, orderDetails: null as any }} useCustomFont={false} />)
      ).toThrow();
    });
  });

  describe('generateOrderPdfBuffer', () => {
    const sampleOrderData: OrderData = {
      id: 'order123',
      orderDate: '2023-07-07',
      customer: { name: 'テスト顧客' },
      orderDetails: [],
    };

    it('pdf.toBuffer()がBufferを返す場合、正常にBufferが返される', async () => {
      const mockToBuffer = vi.fn().mockResolvedValue(Buffer.from('dummy pdf data'));
      (pdf as vi.Mock).mockReturnValue({ toBuffer: mockToBuffer });

      const buffer = await generateOrderPdfBuffer(sampleOrderData);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(mockToBuffer).toHaveBeenCalled();
    });

    it('pdf.toBuffer()がストリームを返す場合の挙動（簡易テスト）', async () => {
      // ストリームモックの作成
      const chunks: Buffer[] = [];
      const listeners: Record<string, Function[]> = {};
      const mockStream = {
        on: (event: string, cb: Function) => {
          if (!listeners[event]) listeners[event] = [];
          listeners[event].push(cb);
          return mockStream;
        },
      };

      (pdf as vi.Mock).mockReturnValue(mockStream);
      const promise = generateOrderPdfBuffer(sampleOrderData);

      // データを流す
      listeners['data']?.forEach((cb) => cb(Buffer.from('chunk1')));
      listeners['data']?.forEach((cb) => cb(Buffer.from('chunk2')));
      listeners['end']?.forEach((cb) => cb());

      const buffer = await promise;
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('PDF生成失敗時は例外を投げる', async () => {
      (pdf as vi.Mock).mockImplementation(() => {
        throw new Error('PDF生成エラー');
      });

      await expect(generateOrderPdfBuffer(sampleOrderData)).rejects.toThrow('PDF生成に失敗しました');
    });
  });

  describe('generateOrderPdfFileName', () => {
    it('正しいファイル名を生成する', () => {
      const orderData: OrderData = {
        id: 'abc123',
        orderDate: '2023-07-07',
        customer: { name: 'テスト' },
        orderDetails: [],
      };

      const fileName = generateOrderPdfFileName(orderData);
      expect(fileName).toBe('order_abc123_20230707.pdf');
    });
  });
});
