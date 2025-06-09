'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ローカルストレージから選択された店舗を復元
  useEffect(() => {
    const savedStore = localStorage.getItem('selectedStore');
    if (savedStore) {
      try {
        const store = JSON.parse(savedStore);
        setSelectedStore(store);
      } catch (error) {
        console.error('Failed to parse stored store data:', error);
        localStorage.removeItem('selectedStore');
      }
    }
  }, []);

  // 選択された店舗をローカルストレージに保存
  useEffect(() => {
    if (selectedStore) {
      localStorage.setItem('selectedStore', JSON.stringify(selectedStore));
    } else {
      localStorage.removeItem('selectedStore');
    }
  }, [selectedStore]);

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
