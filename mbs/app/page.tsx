// components/LargeVerticalButtons.tsx
'use client';

import React from 'react';

const LargeVerticalButtons = () => {
  const CustomerAveragetime = () => {
    // 関数の内容
  };

  const CustomerSales = () => {
    // 関数の内容
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 bg-white">
      <button 
        onClick={CustomerAveragetime}
        className="
          w-full max-w-[90%] sm:max-w-[400px] md:max-w-[600px]
           border-2 border-black px-10 py-6 text-2xl text-black text-center tracking-widest
        "
      >
        {/* モバイル用（表示） */}
          <span className="block sm:hidden">平均リードタイム</span>
  
        {/* スマホ以上用（非表示 → 表示） */}
          <span className="hidden sm:block">顧客別平均リードタイム</span>
      </button>

      <button 
        onClick={CustomerSales}
        className="
          w-full max-w-[90%] sm:max-w-[400px] md:max-w-[600px]
           border-2 border-black px-10 py-6 text-2xl text-black text-center tracking-widest
        "
      >
        顧客別売上額
      </button>
    </div>
  );
};

export default LargeVerticalButtons;
