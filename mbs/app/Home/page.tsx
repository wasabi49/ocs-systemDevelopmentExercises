import Link from 'next/link';

export default function HomePage() {
  const buttons = [
    { label: '顧客情報一覧', path: '/Home/CustomerList' },
    { label: '注文一覧', path: '/Home/OrderList' },
    { label: '納品一覧', path: '/Home/DeliveryList' },
    { label: '統計情報閲覧', path: '/Home/Statistics' },
  ];

  return (
    <div className="flex min-h-142 items-center justify-center p-4">
      <div className="grid w-full max-w-screen-lg grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-15">
        {buttons.map((btn, idx) => (
          <Link
            key={idx}
            href={btn.path}
            className="flex h-24 w-full items-center justify-center border border-black bg-white text-2xl transition hover:bg-gray-200 sm:h-40"
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
