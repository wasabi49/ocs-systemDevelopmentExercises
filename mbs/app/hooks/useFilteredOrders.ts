import { useMemo } from 'react';

type Order = {
  id: string;
  customerName: string;
  managerName: string;
};

export function useFilteredOrders(
  orders: Order[],
  keyword: string,
  field: string
): Order[] {
  return useMemo(() => {
    if (!keyword) return orders;

    const lowerKeyword = keyword.toLowerCase();

    return orders.filter(order => {
      if (field === 'id') {
        return order.id.includes(lowerKeyword);
      }
      if (field === 'customerName') {
        return order.customerName.toLowerCase().includes(lowerKeyword);
      }
      if (field === 'managerName') {
        return order.managerName.toLowerCase().includes(lowerKeyword);
      }
      // 'all' の場合は全フィールド対象
      return (
        order.id.includes(lowerKeyword) ||
        order.customerName.toLowerCase().includes(lowerKeyword) ||
        order.managerName.toLowerCase().includes(lowerKeyword)
      );
    });
  }, [orders, keyword, field]);
}
