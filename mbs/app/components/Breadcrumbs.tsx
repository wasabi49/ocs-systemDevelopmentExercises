"use client";
import Link from "next/link";
import { useParams } from "next/navigation";

const Breadcrumbs = ({ path }: { path: string }) => {
  // useParamsを使用して、URLパラメータを取得
  const params = useParams();
  const { id } = params;
  // パスを分割して、各セグメントを取得
  const pathname: Record<string, string> = {
    Home: "ホーム",
    CustomerList: "顧客一覧",
    OrderList: "注文一覧",
    DeliveryList: "納品一覧",
    Add: "追加",
    Edit: "編集",
    [`${id}`]: `${id}`,
    Statistics: "統計情報",
  };


  // パスをスラッシュで分割し、空のセグメントを除去
  const pathSegments = path.split("/").filter((segment) => segment !== "");



  return (
    <nav className="flex items-center space-x-2 text-sm md:text-base px-2">
      {pathSegments.map((segment: string, index: number) => {
        if (pathSegments.length === 1 || pathSegments.length === 0) {
          return <span key={index}></span>;
        } else if (pathSegments.length > index + 1) {
          return (
            <span key={index}>
              <Link
                key={index}
                href={`/${pathSegments.slice(0, index + 1).join("/")}`}
                className="text-blue-500 hover:underline"
              >
                {pathname[segment]}
              </Link>
              &nbsp;&gt;&nbsp;
            </span>
          );
        } else {
          return <span key={index}>{pathname[segment]}</span>;
        }
      })}
    </nav>
  );
};
export default Breadcrumbs;
