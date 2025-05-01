"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Breadcrumbs = () => {
  const pathname: Record<string, string> = {'Home': 'ホーム', 'CustomerList': '顧客一覧', 'OrderList': '注文一覧', 'OrderDetail' : '注文明細',  'AddOrder': '注文追加', 'EditOrder': '注文編集', 
    'DeliveryList': '納品一覧', 'DeliveryDetail':'納品明細', 'AddDelivery': '納品追加', '納品編集':'EditDelivery',
     'SatatisticalInfo': '統計情報', 'CustomerAverageLeadTime':'顧客別平均リードタイム', 'CustomerTotalSales': '顧客別累計売上額'};
  const path = usePathname();
  const pathSegments = path.split('/').filter((segment) => segment !== '')

  return (
    <nav className="flex items-center space-x-2 text-sm md:text-base">
      &nbsp;
      {pathSegments.map((segment: string, index: number) => {
        if(pathSegments.length === 1 || pathSegments.length === 0){
          return(
            <span key={index}></span>
        );}else if(pathSegments.length > index + 1){
          return(
            <span key={index}>
              <Link
                key={index}
                href={`/${pathSegments.slice(0, index + 1).join('/')}`}
                className="text-blue-500 hover:underline"
              >
              {pathname[segment]}
              </Link>
              &nbsp;&gt;&nbsp;
            </span>
        );}else{
          return(
            <span key={index}>
              {pathname[segment]}
            </span>
          );
        }
      })}
    </nav>
  );
}
export default Breadcrumbs;