// components/DeliveryTable.tsx
import React from 'react';
import Link from 'next/link';

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

export default function DeliveryTable({
  deliveries,
  onSort,
  renderSortIcons,
}: Props) {
  return (
    <div className="max-w-screen-lg mx-auto w-full overflow-x-auto px-4">
      <div className="min-w-[640px]">
        <table className="w-full border-collapse text-xs table-auto">
          <thead className="bg-blue-300">
            <tr>
              <th className="border px-1 py-1 cursor-pointer whitespace-nowrap w-24" onClick={() => onSort('id')}>
                納品ID{renderSortIcons('id')}
              </th>
              <th className="border px-1 py-1 cursor-pointer whitespace-nowrap w-24" onClick={() => onSort('date')}>
                納品日{renderSortIcons('date')}
              </th>
              <th className="border px-1 py-1 whitespace-nowrap">顧客名</th>
              <th className="border px-1 py-1 whitespace-normal break-words">備考</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery, index) => (
              <tr key={index} className={`${index % 2 === 0 ? 'bg-blue-100' : 'bg-white'} h-8`}>
                <td className="border px-2 py-1 text-sm w-24">
                  {delivery.id ? (
                    <Link href={`/delivery/${delivery.id}`} className="text-blue-600 underline decoration-blue-600">
                      {delivery.id}
                    </Link>
                  ) : null}
                </td>
                <td className="border px-2 py-1 text-sm w-24">{delivery.date}</td>
                <td className="border px-2 py-1 text-sm whitespace-nowrap">{delivery.customerName}</td>
                <td className="border px-2 py-1 text-sm whitespace-nowrap">{delivery.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
