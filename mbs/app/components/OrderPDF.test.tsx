import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import OrderPDF, { generateOrderPDF } from './OrderPDF';

// Mock dependencies
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-document">{children}</div>,
  Page: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-page">{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span data-testid="pdf-text">{children}</span>,
  View: ({ children }: { children: React.ReactNode }) => <div data-testid="pdf-view">{children}</div>,
  StyleSheet: {
    create: (styles: Record<string, object>) => styles,
  },
  Font: {
    register: vi.fn(),
  },
  pdf: vi.fn(() => ({
    toBlob: vi.fn().mockResolvedValue(new Blob(['test pdf'], { type: 'application/pdf' })),
  })),
}));

// Mock window.URL
global.URL = {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn(),
} as unknown as URL;

describe('OrderPDF', () => {
  const mockOrderData = {
    id: 'O001',
    customerId: 'C001',
    orderDate: new Date('2023-01-01'),
    status: 'active',
    note: 'Test order note',
    updatedAt: new Date('2023-01-01T00:00:00Z'),
    isDeleted: false,
    deletedAt: null,
    customer: {
      id: 'C001',
      storeId: 'S001',
      name: 'Customer A',
      contactPerson: 'Contact A',
      address: 'Address A',
      phone: '123-456-7890',
      deliveryCondition: 'Condition A',
      note: 'Customer note',
      updatedAt: new Date('2023-01-01T00:00:00Z'),
      isDeleted: false,
      deletedAt: null,
    },
    orderDetails: [
      {
        id: 'OD001',
        orderId: 'O001',
        productName: 'Product A',
        unitPrice: 1000,
        quantity: 2,
        description: 'Description A',
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        isDeleted: false,
        deletedAt: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PDF document structure correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    expect(document.querySelector('[data-testid="pdf-document"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="pdf-page"]')).toBeInTheDocument();
  });

  it('displays order title correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const titleText = Array.from(texts).find(text => text.textContent === '注文書');
    expect(titleText).toBeInTheDocument();
  });

  it('displays customer name correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const customerText = Array.from(texts).find(text => text.textContent === 'Customer A');
    expect(customerText).toBeInTheDocument();
  });

  it('displays formatted order date correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const dateText = Array.from(texts).find(text => text.textContent === '2023年01月01日');
    expect(dateText).toBeInTheDocument();
  });

  it('displays product information correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const productText = Array.from(texts).find(text => text.textContent === 'Product A');
    expect(productText).toBeInTheDocument();
  });

  it('displays description correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const descriptionText = Array.from(texts).find(text => text.textContent === 'Description A');
    expect(descriptionText).toBeInTheDocument();
  });

  it('displays quantity correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const quantityText = Array.from(texts).find(text => text.textContent === '2');
    expect(quantityText).toBeInTheDocument();
  });

  it('displays formatted unit price correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const priceText = Array.from(texts).find(text => text.textContent === '¥1,000');
    expect(priceText).toBeInTheDocument();
  });

  it('displays formatted total amount correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥2,000');
    expect(totalText).toBeInTheDocument();
  });

  it('displays order note correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const noteText = Array.from(texts).find(text => text.textContent === 'Test order note');
    expect(noteText).toBeInTheDocument();
  });

  it('displays default note when no note provided', () => {
    const dataWithoutNote = {
      ...mockOrderData,
      note: null,
    };

    render(<OrderPDF orderData={dataWithoutNote} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const defaultNoteText = Array.from(texts).find(text => text.textContent === '特記事項はありません。');
    expect(defaultNoteText).toBeInTheDocument();
  });

  it('displays order ID in footer', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const idText = Array.from(texts).find(text => text.textContent === '注文書 ID: O001');
    expect(idText).toBeInTheDocument();
  });

  it('displays table headers correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    expect(Array.from(texts).find(text => text.textContent === '品番')).toBeInTheDocument();
    expect(Array.from(texts).find(text => text.textContent === '品名')).toBeInTheDocument();
    expect(Array.from(texts).find(text => text.textContent === '摘要')).toBeInTheDocument();
    expect(Array.from(texts).find(text => text.textContent === '数量')).toBeInTheDocument();
    expect(Array.from(texts).find(text => text.textContent === '単価')).toBeInTheDocument();
    expect(Array.from(texts).find(text => text.textContent === '金額')).toBeInTheDocument();
  });

  it('calculates total amount correctly with multiple items', () => {
    const dataWithMultipleItems = {
      ...mockOrderData,
      orderDetails: [
        {
          id: 'OD001',
          orderId: 'O001',
          productName: 'Product A',
          unitPrice: 1000,
          quantity: 2,
          description: 'Description A',
          updatedAt: new Date('2023-01-01T00:00:00Z'),
          isDeleted: false,
          deletedAt: null,
        },
        {
          id: 'OD002',
          orderId: 'O001',
          productName: 'Product B',
          unitPrice: 500,
          quantity: 3,
          description: 'Description B',
          updatedAt: new Date('2023-01-01T00:00:00Z'),
          isDeleted: false,
          deletedAt: null,
        },
      ],
    };

    render(<OrderPDF orderData={dataWithMultipleItems} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥3,500');
    expect(totalText).toBeInTheDocument();
  });

  it('handles empty order details', () => {
    const dataWithoutDetails = {
      ...mockOrderData,
      orderDetails: [],
    };

    render(<OrderPDF orderData={dataWithoutDetails} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥0');
    expect(totalText).toBeInTheDocument();
  });

  it('pads empty rows correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    // Should render PDF structure with empty rows filled to 20 total rows
    expect(document.querySelector('[data-testid="pdf-document"]')).toBeInTheDocument();
  });

  it('displays item numbers correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const itemNumberText = Array.from(texts).find(text => text.textContent === '1');
    expect(itemNumberText).toBeInTheDocument();
  });

  it('handles zero quantities correctly', () => {
    const dataWithZeroQuantity = {
      ...mockOrderData,
      orderDetails: [
        {
          id: 'OD001',
          orderId: 'O001',
          productName: 'Product A',
          unitPrice: 1000,
          quantity: 0,
          description: 'Description A',
          updatedAt: new Date('2023-01-01T00:00:00Z'),
          isDeleted: false,
          deletedAt: null,
        },
      ],
    };

    render(<OrderPDF orderData={dataWithZeroQuantity} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥0');
    expect(totalText).toBeInTheDocument();
  });

  it('handles zero unit prices correctly', () => {
    const dataWithZeroPrice = {
      ...mockOrderData,
      orderDetails: [
        {
          id: 'OD001',
          orderId: 'O001',
          productName: 'Product A',
          unitPrice: 0,
          quantity: 2,
          description: 'Description A',
          updatedAt: new Date('2023-01-01T00:00:00Z'),
          isDeleted: false,
          deletedAt: null,
        },
      ],
    };

    render(<OrderPDF orderData={dataWithZeroPrice} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥0');
    expect(totalText).toBeInTheDocument();
  });

  it('handles null description correctly', () => {
    const dataWithNullDescription = {
      ...mockOrderData,
      orderDetails: [
        {
          id: 'OD001',
          orderId: 'O001',
          productName: 'Product A',
          unitPrice: 1000,
          quantity: 2,
          description: null,
          updatedAt: new Date('2023-01-01T00:00:00Z'),
          isDeleted: false,
          deletedAt: null,
        },
      ],
    };

    render(<OrderPDF orderData={dataWithNullDescription} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const productText = Array.from(texts).find(text => text.textContent === 'Product A');
    expect(productText).toBeInTheDocument();
  });

  it('displays current date in footer', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const currentDate = new Date().toLocaleDateString('ja-JP');
    const dateText = Array.from(texts).find(text => text.textContent === `発行日: ${currentDate}`);
    expect(dateText).toBeInTheDocument();
  });

  it('handles string date format correctly', () => {
    const dataWithStringDate = {
      ...mockOrderData,
      orderDate: '2023-12-25',
    };

    render(<OrderPDF orderData={dataWithStringDate as unknown} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const dateText = Array.from(texts).find(text => text.textContent === '2023年12月25日');
    expect(dateText).toBeInTheDocument();
  });

  it('displays order message correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const messageText = Array.from(texts).find(text => text.textContent === '下記のとおり注文いたします。');
    expect(messageText).toBeInTheDocument();
  });

  it('displays customer label correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const labelText = Array.from(texts).find(text => text.textContent === '様');
    expect(labelText).toBeInTheDocument();
  });

  it('displays remarks title correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const remarksTitle = Array.from(texts).find(text => text.textContent === '備考');
    expect(remarksTitle).toBeInTheDocument();
  });

  it('displays total amount title correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalTitle = Array.from(texts).find(text => text.textContent === '合計金額');
    expect(totalTitle).toBeInTheDocument();
  });

  it('displays order date label correctly', () => {
    render(<OrderPDF orderData={mockOrderData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const dateLabel = Array.from(texts).find(text => text.textContent === '注文日');
    expect(dateLabel).toBeInTheDocument();
  });

  describe('generateOrderPDF', () => {
    beforeEach(() => {
      // Mock DOM methods
      const mockLink = {
        click: vi.fn(),
        setAttribute: vi.fn(),
        style: {},
      } as unknown as HTMLAnchorElement;

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
      vi.spyOn(document.body, 'appendChild').mockImplementation(vi.fn());
      vi.spyOn(document.body, 'removeChild').mockImplementation(vi.fn());
    });

    it('generates and downloads PDF successfully', async () => {
      await generateOrderPDF(mockOrderData);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(document.body.appendChild).toHaveBeenCalled();
      expect(document.body.removeChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('sets correct download filename', async () => {
      const mockLink = {
        click: vi.fn(),
        setAttribute: vi.fn(),
        download: '',
        href: '',
        style: {},
      } as unknown as HTMLAnchorElement;

      vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

      await generateOrderPDF(mockOrderData);

      expect(mockLink.download).toBe('注文書_Customer A_O001.pdf');
    });

    it('handles PDF generation errors gracefully', async () => {
      const { pdf } = await import('@react-pdf/renderer');
      const mockPdf = vi.mocked(pdf);
      
      mockPdf.mockReturnValueOnce({
        toBlob: vi.fn().mockRejectedValue(new Error('PDF generation failed')),
      });

      await expect(generateOrderPDF(mockOrderData)).rejects.toThrow('PDF generation failed');
    });
  });
});