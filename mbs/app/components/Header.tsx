'use client';

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-blue-500 text-white p-4 relative">
      <div className="flex justify-between items-center">
        <div className="text-3xl font-bold">
          <Link href="/Home">MBS</Link>
        </div>

        {/* ハンバーガーボタン：モバイル */}
        <button
          className="md:hidden z-50"
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
        className={`fixed top-0 right-0 h-full w-64 bg-blue-600 text-white p-6 transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <ul className="flex flex-col space-y-6 text-lg mt-12">
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
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
