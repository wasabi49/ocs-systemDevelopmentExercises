/*import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from './Header';
import '@testing-library/jest-dom/vitest';
import { StoreProvider } from '@/app/contexts/StoreContext';


// usePathname と useStore をモック
vi.mock('next/navigation', () => ({
  usePathname: () => '/Home', // 店舗選択画面ではない
}));

describe('Header（PC版）- 選択中の店舗表示', () => {
  const storeName = '今里店';

  beforeEach(() => {
    vi.clearAllMocks();
  });


 
  
    it(`選択中の店舗名「${storeName}」が表示される`, async () => {
      // useStore を動的にモック
      vi.doMock('@/app/contexts/StoreContext', () => ({
        useStore: () => ({
          selectedStore: { name: storeName }
        }),
      }));
      

      render(
        <StoreProvider>
          <Header />
        </StoreProvider>
      );
      
      const mbsLink = screen.getByRole('link', { name: /MBS/ });
      expect(mbsLink).toBeInTheDocument();

      // 店舗名が表示されることを確認（PC版用は .sm:flex なので非モバイル）
      expect(screen.getByText(storeName)).toBeInTheDocument();

      expect(screen.getByText('店舗選択')).toBeInTheDocument();
      expect(screen.queryByText('顧客管理')).toBeInTheDocument();
      expect(screen.queryByText('注文管理')).toBeInTheDocument();
      expect(screen.queryByText('納品管理')).toBeInTheDocument();
      expect(screen.queryByText('統計情報')).toBeInTheDocument();
    });
  });

*/