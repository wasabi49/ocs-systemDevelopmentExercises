// components/DeliveryTable.tsx
import React from 'react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export type Delivery = {
  id: string;
  date: string;
  customerName: string;
  note: string;
};

type Props = {
  deliveries: Delivery[];
  onSort: (field: keyof Delivery) => void;
  renderSortIcons: (field: keyof Delivery) => React.ReactNode;
  sortField: keyof Delivery | null;
  sortOrder: 'asc' | 'desc';
};

export default function DeliveryTable({ deliveries, onSort, renderSortIcons }: Props) {
  logger.debug('DeliveryTable rendering', { deliveries })
  return (
    <table className="w-full min-w-0 border-collapse text-center text-[10px] sm:text-xs md:text-sm">
      <thead className="bg-blue-300">
        <tr>
          <th
            className="max-w-[70px] min-w-[60px] cursor-pointer truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm"
            onClick={() => onSort('id')}
          >
            納品ID{renderSortIcons('id')}
          </th>
          <th
            className="max-w-[100px] min-w-[80px] cursor-pointer truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm"
            onClick={() => onSort('date')}
          >
            納品日{renderSortIcons('date')}
          </th>
          <th className="min-w-[120px] truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm">
            顧客名
          </th>
          <th className="min-w-[100px] truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-2 md:text-sm">
            備考
          </th>
        </tr>
      </thead>
      <tbody>
        {deliveries.map((delivery, index) => (
          <tr
            key={delivery.id || `empty-${index}`}
            className={`${
              index % 2 === 0 ? 'bg-blue-100' : 'bg-white'
            } h-6 transition-colors hover:bg-blue-200 sm:h-8 md:h-10`}
          >
            <td className="max-w-[70px] min-w-[60px] truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-1.5 md:text-sm">
              {delivery.id ? (
                <Link
                  href={`/Home/DeliveryList/${delivery.id}`}
                  className="text-blue-600 underline decoration-blue-600"
                >
                  {delivery.id}
                </Link>
              ) : null}
            </td>
            <td className="max-w-[100px] min-w-[80px] truncate border px-1 py-0.5 text-[10px] sm:px-2 sm:py-1 sm:text-xs md:px-3 md:py-1.5 md:text-sm">
              {delivery.date}
            </td>
            <td className="min-w-[120px] truncate border px-1 py-0.5 text-left text-[10px] sm:px-2 sm:py-1 sm:text-center sm:text-xs md:px-3 md:py-1.5 md:text-sm">
              {delivery.customerName}
            </td>
            <td className="min-w-[100px] truncate border px-1 py-0.5 text-left text-[10px] sm:px-2 sm:py-1 sm:text-center sm:text-xs md:px-3 md:py-1.5 md:text-sm">
              {delivery.note}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
