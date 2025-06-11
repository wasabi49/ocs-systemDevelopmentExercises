'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { setCookie, deleteCookie } from 'cookies-next';

export interface Store {
  id: string;
  name: string;
}

interface StoreContextType {
  selectedStore: Store | null;
  setSelectedStore: (store: Store | null) => void;
  stores: Store[];
  setStores: (stores: Store[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

interface StoreProviderProps {
  children: ReactNode;
  initialStore?: Store | null;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children, initialStore = null }) => {
  // 初期値として、サーバーサイドから渡された店舗を設定
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(initialStore);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // シンプルなCookieとの同期関数
  const setSelectedStore = (store: Store | null) => {
    setSelectedStoreState(store);

    if (store) {
      // 店舗IDのみをcookieに保存（効率的）
      setCookie('selectedStoreId', store.id, {
        maxAge: 30 * 24 * 60 * 60, // 30日
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
      // フォールバック用に店舗名も保存
      setCookie('selectedStoreName', store.name, {
        maxAge: 30 * 24 * 60 * 60, // 30日
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });
    } else {
      deleteCookie('selectedStoreId');
      deleteCookie('selectedStoreName');
    }
  };

  return (
    <StoreContext.Provider
      value={{
        selectedStore,
        setSelectedStore,
        stores,
        setStores,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
