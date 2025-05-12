import { render } from "@testing-library/react";
import Breadcrumbs from "./Breadcrumbs";

// モックデータ
const mockItems = [
  { label: "", path: "/Home" },
  { label: "ホーム > 顧客一覧", path: "/Home/CustomerList" },
  { label: "ホーム > 注文一覧", path: "/Home/OrderList" },
  {
    label: "ホーム > 注文一覧 > 注文明細",
    path: "/Home/OrderList/OrderDetail",
  },
  { label: "ホーム > 注文一覧 > 注文追加", path: "/Home/OrderList/AddOrder" },
  {
    label: "ホーム > 注文一覧 > 注文明細 > 注文編集",
    path: "/Home/OrderList/OrderDetail/EditOrder",
  },
  { label: "ホーム > 納品一覧", path: "/Home/DeliveryList" },
  {
    label: "ホーム > 納品一覧 > 納品明細",
    path: "/Home/DeliveryList/DeliveryDetail",
  },
  {
    label: "ホーム > 納品一覧 > 納品追加",
    path: "/Home/DeliveryList/AddDelivery",
  },
  {
    label: "ホーム > 納品一覧 > 納品明細 > 納品編集",
    path: "/Home/DeliveryList/DeliveryDetail/EditDelivery",
  },
  { label: "ホーム > 統計", path: "/Statistics" },
];

test("Breadcrumbsコンポーネントのレンダリング", async () => {
  mockItems.forEach((item) => {
    const { container } = render(<Breadcrumbs path={item.path} />);
    expect(container.textContent?.includes(item.label))
  });
});




