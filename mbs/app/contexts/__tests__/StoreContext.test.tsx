import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { StoreProvider, useStore, Store } from '../StoreContext';

// Mock cookies-next
vi.mock('cookies-next', () => ({
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
}));

describe('StoreContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // console.errorをモックしてエラーログを非表示にする
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useStore', () => {
    it('StoreProvider外で使用した場合、エラーをスローする', () => {
      // エラーが予想されるのでconsole.errorをモック
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useStore());
      }).toThrow('useStore must be used within a StoreProvider');
      
      consoleSpy.mockRestore();
    });

    it('StoreProvider内で使用した場合、コンテキストを返す', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider>{children}</StoreProvider>
      );

      const { result } = renderHook(() => useStore(), { wrapper });

      expect(result.current).toMatchObject({
        selectedStore: null,
        setSelectedStore: expect.any(Function),
        stores: [],
        setStores: expect.any(Function),
        isLoading: false,
        setIsLoading: expect.any(Function),
      });
    });
  });

  describe('StoreProvider', () => {
    it('初期状態では適切なデフォルト値を持つ', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider>{children}</StoreProvider>
      );

      const { result } = renderHook(() => useStore(), { wrapper });

      expect(result.current.selectedStore).toBeNull();
      expect(result.current.stores).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('initialStoreが渡された場合、初期値として設定される', () => {
      const initialStore: Store = { id: 'store-1', name: '店舗1' };
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider initialStore={initialStore}>{children}</StoreProvider>
      );

      const { result } = renderHook(() => useStore(), { wrapper });

      expect(result.current.selectedStore).toEqual(initialStore);
    });

    it('setSelectedStoreで店舗を設定できる', async () => {
      const { setCookie } = await import('cookies-next');
      const store: Store = { id: 'store-1', name: '店舗1' };
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider>{children}</StoreProvider>
      );

      const { result } = renderHook(() => useStore(), { wrapper });

      act(() => {
        result.current.setSelectedStore(store);
      });

      expect(result.current.selectedStore).toEqual(store);
      expect(setCookie).toHaveBeenCalledWith('selectedStoreId', 'store-1', {
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
        secure: false, // NODE_ENVがproductionでない場合
        path: '/',
      });
      expect(setCookie).toHaveBeenCalledWith('selectedStoreName', '店舗1', {
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
        secure: false,
        path: '/',
      });
    });

    it('setSelectedStoreでnullを設定した場合、Cookieが削除される', async () => {
      const { deleteCookie } = await import('cookies-next');
      const store: Store = { id: 'store-1', name: '店舗1' };
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider initialStore={store}>{children}</StoreProvider>
      );

      const { result } = renderHook(() => useStore(), { wrapper });

      act(() => {
        result.current.setSelectedStore(null);
      });

      expect(result.current.selectedStore).toBeNull();
      expect(deleteCookie).toHaveBeenCalledWith('selectedStoreId');
      expect(deleteCookie).toHaveBeenCalledWith('selectedStoreName');
    });

    it('production環境ではsecure cookieが設定される', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const { setCookie } = await import('cookies-next');
      const store: Store = { id: 'store-1', name: '店舗1' };
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider>{children}</StoreProvider>
      );

      const { result } = renderHook(() => useStore(), { wrapper });

      act(() => {
        result.current.setSelectedStore(store);
      });

      expect(setCookie).toHaveBeenCalledWith('selectedStoreId', 'store-1', {
        maxAge: 30 * 24 * 60 * 60,
        sameSite: 'lax',
        secure: true,
        path: '/',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('setStoresで店舗リストを設定できる', () => {
      const stores: Store[] = [
        { id: 'store-1', name: '店舗1' },
        { id: 'store-2', name: '店舗2' },
      ];
      
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider>{children}</StoreProvider>
      );

      const { result } = renderHook(() => useStore(), { wrapper });

      act(() => {
        result.current.setStores(stores);
      });

      expect(result.current.stores).toEqual(stores);
    });

    it('setIsLoadingでローディング状態を設定できる', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <StoreProvider>{children}</StoreProvider>
      );

      const { result } = renderHook(() => useStore(), { wrapper });

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('コンポーネントを正常にレンダリングできる', () => {
      const TestComponent = () => {
        const { selectedStore } = useStore();
        return <div>{selectedStore ? selectedStore.name : 'No store selected'}</div>;
      };

      render(
        <StoreProvider>
          <TestComponent />
        </StoreProvider>
      );

      expect(screen.getByText('No store selected')).toBeInTheDocument();
    });

    it('初期店舗が設定されている場合、コンポーネントに反映される', () => {
      const initialStore: Store = { id: 'store-1', name: '店舗1' };
      
      const TestComponent = () => {
        const { selectedStore } = useStore();
        return <div>{selectedStore ? selectedStore.name : 'No store selected'}</div>;
      };

      render(
        <StoreProvider initialStore={initialStore}>
          <TestComponent />
        </StoreProvider>
      );

      expect(screen.getByText('店舗1')).toBeInTheDocument();
    });
  });
});