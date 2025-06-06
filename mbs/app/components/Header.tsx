'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Home, Users, ShoppingCart, Truck, BarChart3, Store, Menu, X } from 'lucide-react';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // 店舗選択画面かどうかを判定
  const isStoreSelectionPage = pathname === '/';

  // モバイルメニューが開いているときのスクロール防止
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // キーボードでメニューを閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const menuItems = [
    { href: '/Home/CustomerList', label: '顧客管理', icon: Users },
    { href: '/Home/OrderList', label: '注文管理', icon: ShoppingCart },
    { href: '/Home/DeliveryList', label: '納品管理', icon: Truck },
    { href: '/Home/Statisticalinfo', label: '統計情報', icon: BarChart3 },
    { href: '/', label: '店舗選択', icon: Store },
  ];

  // 店舗選択画面では一部のメニューを非表示にする
  const displayMenuItems = isStoreSelectionPage
    ? menuItems.filter((item) => item.href === '/')
    : menuItems;

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* ロゴ */}
          <div className="flex items-center">
            <Link
              href="/Home"
              className="group flex items-center space-x-2 text-white transition-all duration-200 hover:text-blue-100"
            >
              <Home className="h-8 w-8 transition-transform group-hover:scale-110" />
              <span className="text-2xl font-bold tracking-tight">MBS</span>
            </Link>
          </div>

          {/* ハンバーガーメニューボタン */}
          {!isStoreSelectionPage && (
            <button
              className="rounded-lg p-2 text-white hover:bg-white/10 md:hidden"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          {/* デスクトップナビゲーション */}
          {!isStoreSelectionPage && (
            <nav className="hidden md:block">
              <ul className="flex space-x-1">
                {displayMenuItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="group flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 hover:text-blue-100 focus:ring-2 focus:ring-white/20 focus:outline-none"
                      >
                        <IconComponent className="h-4 w-4 transition-transform group-hover:scale-110" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </div>
      </div>

      {/* モバイルナビゲーションメニュー */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-80 transform bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* メニューヘッダー */}
          <div className="flex items-center justify-between bg-blue-500 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">メニュー</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 text-white hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* メニューアイテム */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-3">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 rounded-lg px-4 py-3 text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* フッター */}
          <div className="border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">© 2025 MBS システム</p>
          </div>
        </div>
      </div>

      {/* 背景オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Header;
