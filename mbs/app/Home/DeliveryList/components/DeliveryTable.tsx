// components/DeliveryTable.tsx
import React from 'react';
import Link from 'next/link';
import { SortConfig, SortIcon } from '@/app/utils/sortUtils';

export type Delivery = {
  id: string;
  date: string;
  customerName: string;
  note: string;
};

type Props = {
  deliveries: Delivery[];
  onSort: (field: keyof Delivery) => void;
  sortConfig: SortConfig<Delivery> | null;
};

export default function DeliveryTable({ deliveries, onSort, sortConfig }: Props) {
  const renderSortIcon = (field: keyof Delivery) => {
    return <SortIcon<Delivery> field={field} sortConfig={sortConfig} />;
  };

  return (
    <table className="w-full min-w-[600px] border-collapse text-center text-xs sm:text-sm">
      <thead className="bg-blue-300">
        <tr>
          <th
            className="w-[15%] cursor-pointer truncate border px-2 py-2 transition-colors hover:bg-blue-400 sm:w-[12%] sm:px-3 sm:py-3"
            onClick={() => onSort('id')}
          >
            <div className="flex items-center justify-center">納品ID{renderSortIcon('id')}</div>
          </th>
          <th
            className="w-[15%] cursor-pointer truncate border px-2 py-2 transition-colors hover:bg-blue-400 sm:w-[12%] sm:px-3 sm:py-3"
            onClick={() => onSort('date')}
          >
            <div className="flex items-center justify-center">納品日{renderSortIcon('date')}</div>
          </th>
          <th className="w-[30%] truncate border px-2 py-2 sm:px-3 sm:py-3">顧客名</th>
          <th className="w-[40%] truncate border px-2 py-2 sm:px-3 sm:py-3">備考</th>
        </tr>
      </thead>
      <tbody>
        {deliveries.map((delivery, index) => (
          <tr
            key={delivery.id || `empty-${index}`}
            className={`${
              index % 2 === 0 ? 'bg-blue-100' : 'bg-white'
            } h-10 transition-colors hover:bg-blue-200 sm:h-12`}
          >
            <td className="truncate border px-2 py-1 sm:px-3 sm:py-2">
              {delivery.id ? (
                <Link
                  href={`/Home/DeliveryList/${delivery.id}`}
                  className="font-medium text-blue-600 underline transition-colors hover:text-blue-800"
                >
                  {delivery.id}
                </Link>
              ) : (
                ''
              )}
            </td>
            <td className="truncate border px-2 py-1 sm:px-3 sm:py-2">{delivery.date}</td>
            <td className="truncate border px-2 py-1 text-left sm:px-3 sm:py-2 sm:text-center">
              {delivery.customerName}
            </td>
            <td className="truncate border px-2 py-1 text-left sm:px-3 sm:py-2 sm:text-center">
              {delivery.note}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
