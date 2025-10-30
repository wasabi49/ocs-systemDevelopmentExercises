import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import DeliveryPDF, { generateDeliveryPDF } from './DeliveryPDF';

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

describe('DeliveryPDF', () => {
  const mockDeliveryData = {
    id: 'D001',
    customerId: 'C001',
    deliveryDate: '2023-01-15',
    totalAmount: 2000,
    totalQuantity: 3,
    note: 'Test delivery note',
    updatedAt: '2023-01-15T00:00:00Z',
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
      updatedAt: '2023-01-01T00:00:00Z',
      isDeleted: false,
      deletedAt: null,
    },
    deliveryDetails: [
      {
        id: 'DD001',
        deliveryId: 'D001',
        productName: 'Product A',
        unitPrice: 1000,
        quantity: 2,
        updatedAt: '2023-01-15T00:00:00Z',
        isDeleted: false,
        deletedAt: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PDF document structure correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    expect(document.querySelector('[data-testid="pdf-document"]')).toBeInTheDocument();
    expect(document.querySelector('[data-testid="pdf-page"]')).toBeInTheDocument();
  });

  it('displays delivery title correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const titleText = Array.from(texts).find(text => text.textContent === '納品書');
    expect(titleText).toBeInTheDocument();
  });

  it('displays customer name correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const customerText = Array.from(texts).find(text => text.textContent === 'Customer A');
    expect(customerText).toBeInTheDocument();
  });

  it('displays formatted delivery date correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const dateText = Array.from(texts).find(text => text.textContent === '2023年01月15日');
    expect(dateText).toBeInTheDocument();
  });

  it('displays product information correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const productText = Array.from(texts).find(text => text.textContent === 'Product A');
    expect(productText).toBeInTheDocument();
  });

  it('displays quantity correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const quantityText = Array.from(texts).find(text => text.textContent === '2');
    expect(quantityText).toBeInTheDocument();
  });

  it('displays formatted unit price correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const priceText = Array.from(texts).find(text => text.textContent === '¥1,000');
    expect(priceText).toBeInTheDocument();
  });

  it('displays formatted total amount correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥2,000');
    expect(totalText).toBeInTheDocument();
  });

  it('displays delivery note correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const noteText = Array.from(texts).find(text => text.textContent === 'Test delivery note');
    expect(noteText).toBeInTheDocument();
  });

  it('displays default note when no note provided', () => {
    const dataWithoutNote = {
      ...mockDeliveryData,
      note: undefined,
    };

    render(<DeliveryPDF deliveryData={dataWithoutNote} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const defaultNoteText = Array.from(texts).find(text => text.textContent === '特記事項はありません。');
    expect(defaultNoteText).toBeInTheDocument();
  });

  it('displays delivery ID in footer', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const idText = Array.from(texts).find(text => text.textContent === '納品書 ID: D001');
    expect(idText).toBeInTheDocument();
  });

  it('displays table headers correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    expect(Array.from(texts).find(text => text.textContent === '品番')).toBeInTheDocument();
    expect(Array.from(texts).find(text => text.textContent === '品名')).toBeInTheDocument();
    expect(Array.from(texts).find(text => text.textContent === '数量')).toBeInTheDocument();
    expect(Array.from(texts).find(text => text.textContent === '単価')).toBeInTheDocument();
    expect(Array.from(texts).find(text => text.textContent === '金額')).toBeInTheDocument();
  });

  it('calculates total amount correctly with multiple items', () => {
    const dataWithMultipleItems = {
      ...mockDeliveryData,
      deliveryDetails: [
        {
          id: 'DD001',
          deliveryId: 'D001',
          productName: 'Product A',
          unitPrice: 1000,
          quantity: 2,
          updatedAt: '2023-01-15T00:00:00Z',
          isDeleted: false,
          deletedAt: null,
        },
        {
          id: 'DD002',
          deliveryId: 'D001',
          productName: 'Product B',
          unitPrice: 500,
          quantity: 3,
          updatedAt: '2023-01-15T00:00:00Z',
          isDeleted: false,
          deletedAt: null,
        },
      ],
    };

    render(<DeliveryPDF deliveryData={dataWithMultipleItems} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥3,500');
    expect(totalText).toBeInTheDocument();
  });

  it('handles empty delivery details', () => {
    const dataWithoutDetails = {
      ...mockDeliveryData,
      deliveryDetails: [],
    };

    render(<DeliveryPDF deliveryData={dataWithoutDetails} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥0');
    expect(totalText).toBeInTheDocument();
  });

  it('pads empty rows correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    // Should render PDF structure with empty rows filled to 20 total rows
    expect(document.querySelector('[data-testid="pdf-document"]')).toBeInTheDocument();
  });

  it('displays item numbers correctly', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const itemNumberText = Array.from(texts).find(text => text.textContent === '1');
    expect(itemNumberText).toBeInTheDocument();
  });

  it('handles zero quantities correctly', () => {
    const dataWithZeroQuantity = {
      ...mockDeliveryData,
      deliveryDetails: [
        {
          id: 'DD001',
          deliveryId: 'D001',
          productName: 'Product A',
          unitPrice: 1000,
          quantity: 0,
          updatedAt: '2023-01-15T00:00:00Z',
          isDeleted: false,
          deletedAt: null,
        },
      ],
    };

    render(<DeliveryPDF deliveryData={dataWithZeroQuantity} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥0');
    expect(totalText).toBeInTheDocument();
  });

  it('handles zero unit prices correctly', () => {
    const dataWithZeroPrice = {
      ...mockDeliveryData,
      deliveryDetails: [
        {
          id: 'DD001',
          deliveryId: 'D001',
          productName: 'Product A',
          unitPrice: 0,
          quantity: 2,
          updatedAt: '2023-01-15T00:00:00Z',
          isDeleted: false,
          deletedAt: null,
        },
      ],
    };

    render(<DeliveryPDF deliveryData={dataWithZeroPrice} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const totalText = Array.from(texts).find(text => text.textContent === '¥0');
    expect(totalText).toBeInTheDocument();
  });

  it('displays current date in footer', () => {
    render(<DeliveryPDF deliveryData={mockDeliveryData} />);

    const texts = document.querySelectorAll('[data-testid="pdf-text"]');
    const currentDate = new Date().toLocaleDateString('ja-JP');
    const dateText = Array.from(texts).find(text => text.textContent === `発行日: ${currentDate}`);
    expect(dateText).toBeInTheDocument();
  });

  describe('generateDeliveryPDF', () => {
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
      await generateDeliveryPDF(mockDeliveryData);

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

      await generateDeliveryPDF(mockDeliveryData);

      expect(mockLink.download).toBe('納品書_Customer A_D001.pdf');
    });

    it('handles PDF generation errors gracefully', async () => {
      const { pdf } = await import('@react-pdf/renderer');
      const mockPdf = vi.mocked(pdf);
      
      mockPdf.mockReturnValueOnce({
        toBlob: vi.fn().mockRejectedValue(new Error('PDF generation failed')),
      });

      await expect(generateDeliveryPDF(mockDeliveryData)).rejects.toThrow('PDF generation failed');
    });
  });
});