'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="relative bg-blue-500 p-4 text-white">
      <div className="flex items-center justify-between">
        <div className="text-3xl font-bold">
          <Link href="/Home">MBS</Link>
        </div>

        {/* ハンバーガーボタン：モバイル */}
        <button
          className="z-50 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* PC用ナビ */}
        <nav className="hidden md:block">
          <ul className="flex space-x-16">
            <li className="cursor-pointer hover:underline">
              <Link href="/Home/CustomerList">顧客</Link>
            </li>
            <li className="cursor-pointer hover:underline">
              <Link href="/Home/OrderList">注文</Link>
            </li>
            <li className="cursor-pointer hover:underline">
              <Link href="/Home/DeliveryList">納品</Link>
            </li>
            <li className="cursor-pointer hover:underline">
              <Link href="/Home/Statisticalinfo">統計</Link>
            </li>
            <li className="cursor-pointer hover:underline">
              <Link href="/">店舗</Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* サイドメニュー（右からスライドイン） */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-64 bg-blue-600 p-6 text-white transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ul className="mt-12 flex flex-col space-y-6 text-lg">
          <li onClick={() => setIsOpen(false)}>
            <Link href="/Home/CustomerList">顧客</Link>
          </li>
          <li onClick={() => setIsOpen(false)}>
            <Link href="/Home/OrderList">注文</Link>
          </li>
          <li onClick={() => setIsOpen(false)}>
            <Link href="/Home/DeliveryList">納品</Link>
          </li>
          <li onClick={() => setIsOpen(false)}>
            <Link href="/Home/Statisticalinfo">統計</Link>
          </li>
          <li onClick={() => setIsOpen(false)}>
            <Link href="/Home/Stores">店舗</Link>
          </li>
        </ul>
      </div>

      {/* 背景オーバーレイ */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setIsOpen(false)} />
      )}
    </header>
  );
};

export default Header;
