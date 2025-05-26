import React from 'react'

export const Home = () => {
  const buttons = [
    { label: '顧客情報一覧', path: '/Home/CustomerList' },
    { label: '注文一覧', path: '/Home/OrderList' },
    { label: '納品一覧', path: '/Home/DeliveryList' },
    { label: '統計情報閲覧', path: '/Home/StatisticalInfo' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-screen-lg grid grid-cols-1 sm:grid-cols-2 sm:gap-15 gap-6">
        {buttons.map((btn, idx) => (
          <a
            key={idx}
            href={btn.path}
            className="w-full sm:h-40  h-24 border border-black text-2xl bg-white hover:bg-gray-200 transition flex items-center justify-center"
          >
            {btn.label}
          </a>
        ))}
      </div>
    </div>
  );
};


export default Home;
