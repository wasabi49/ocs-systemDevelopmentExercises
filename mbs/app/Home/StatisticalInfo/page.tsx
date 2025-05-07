'use client';

import React from 'react';

const StatisticalInfo = () => {
  const LeadTime = () => {
    // 関数の内容
  };

  const Sales = () => {
    // 関数の内容
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 bg-white">
      <button 
        onClick={LeadTime}
        className="
          w-full max-w-[90%] sm:max-w-[400px] md:max-w-[600px]
          border-2 border-black px-6 py-6 text-center tracking-widest
          text-black text-sm sm:text-base md:text-lg lg:text-xl
        "
      >
        <span className="block sm:hidden">平均リードタイム</span>
        <span className="hidden sm:block">顧客別平均リードタイム</span>
      </button>

      <button 
        onClick={Sales}
        className="
          w-full max-w-[90%] sm:max-w-[400px] md:max-w-[600px]
          border-2 border-black px-6 py-6 text-center tracking-widest
          text-black text-sm sm:text-base md:text-lg lg:text-xl
        "
      >
        顧客別売上額
      </button>
    </div>
  );
};

export default StatisticalInfo;
