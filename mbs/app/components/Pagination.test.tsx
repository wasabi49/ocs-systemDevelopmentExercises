import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import Pagination from './Pagination';

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pagination component correctly', () => {
    render(
      <Pagination 
        currentPage={1} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onPageChange when page number is clicked', () => {
    render(
      <Pagination 
        currentPage={1} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange even when current page is clicked', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    const currentPageButton = screen.getByText('3');
    fireEvent.click(currentPageButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('highlights current page correctly', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('bg-blue-500');
    expect(currentPageButton).toHaveClass('text-white');
    expect(currentPageButton).toHaveClass('font-bold');
  });

  it('renders previous button correctly', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    const prevButton = screen.getByLabelText('前のページ');
    expect(prevButton).toBeInTheDocument();
    expect(prevButton).not.toBeDisabled();
  });

  it('renders next button correctly', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    const nextButton = screen.getByLabelText('次のページ');
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination 
        currentPage={1} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    const prevButton = screen.getByLabelText('前のページ');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination 
        currentPage={5} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    const nextButton = screen.getByLabelText('次のページ');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange with previous page when previous button is clicked', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    const prevButton = screen.getByLabelText('前のページ');
    fireEvent.click(prevButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when next button is clicked', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalPages={5} 
        onPageChange={mockOnPageChange} 
      />
    );

    const nextButton = screen.getByLabelText('次のページ');
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('handles single page correctly', () => {
    render(
      <Pagination 
        currentPage={1} 
        totalPages={1} 
        onPageChange={mockOnPageChange} 
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    const prevButton = screen.getByLabelText('前のページ');
    const nextButton = screen.getByLabelText('次のページ');
    
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('renders page information text with itemsInfo', () => {
    render(
      <Pagination 
        currentPage={3} 
        totalPages={5} 
        onPageChange={mockOnPageChange}
        itemsInfo={{
          startIndex: 20,
          endIndex: 30,
          totalItems: 50,
        }}
      />
    );

    expect(screen.getByText('21-30 / 50件')).toBeInTheDocument();
  });

  it('shows all pages when total pages is within maxVisiblePages', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={mockOnPageChange} />);

    // Should show all pages 1-5
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows first pages when current page is near beginning', () => {
    render(<Pagination currentPage={2} totalPages={10} onPageChange={mockOnPageChange} />);

    // Should show pages 1-5 when current page is 2
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('6')).not.toBeInTheDocument();
  });

  it('shows last pages when current page is near end', () => {
    render(<Pagination currentPage={9} totalPages={10} onPageChange={mockOnPageChange} />);

    // Should show pages 6-10 when current page is 9
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });

  it('shows middle pages when current page is in center', () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={mockOnPageChange} />);

    // Should show pages 3-7 when current page is 5
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.queryByText('8')).not.toBeInTheDocument();
  });

  it('correctly validates page range in handlePageChange', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={mockOnPageChange} />);

    // Test clicking page 1 (valid)
    const page1Button = screen.getByText('1');
    fireEvent.click(page1Button);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);

    // Test clicking page 5 (valid)
    const page5Button = screen.getByText('5');
    fireEvent.click(page5Button);
    expect(mockOnPageChange).toHaveBeenCalledWith(5);

    expect(mockOnPageChange).toHaveBeenCalledTimes(2);
  });

  it('handles large page numbers correctly', () => {
    render(<Pagination currentPage={50} totalPages={100} onPageChange={mockOnPageChange} />);

    // Should show pages 48-52 when current page is 50
    expect(screen.getByText('48')).toBeInTheDocument();
    expect(screen.getByText('49')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('51')).toBeInTheDocument();
    expect(screen.getByText('52')).toBeInTheDocument();
  });

  it('handles edge case at boundary pages', () => {
    // Test page 3 (should show 1-5)
    render(<Pagination currentPage={3} totalPages={10} onPageChange={mockOnPageChange} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.queryByText('6')).not.toBeInTheDocument();
  });

  it('handles another edge case at end boundary', () => {
    // Test page 8 (should show 6-10)  
    render(<Pagination currentPage={8} totalPages={10} onPageChange={mockOnPageChange} />);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.queryByText('5')).not.toBeInTheDocument();
  });
});