'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';

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
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(initialStore);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 初期化中はtrue

  // クライアントサイドでcookieから店舗情報を読み取る
  useEffect(() => {
    // initialStoreが指定されている場合はcookieの読み込みをスキップ
    if (initialStore) {
      setIsLoading(false);
      return;
    }

    const storeId = getCookie('selectedStoreId');
    const storeName = getCookie('selectedStoreName');

    if (storeId && storeName) {
      setSelectedStoreState({
        id: storeId as string,
        name: storeName as string,
      });
    }
    
    setIsLoading(false); // 初期化完了
  }, [initialStore]);

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
