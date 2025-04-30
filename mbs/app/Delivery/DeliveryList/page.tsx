"use client";

import DynamicTable from "./DynamicTable"
import SearchMultiSelectBox from "./SearchMultiSelectBox"
import DeliveryButton from "./DeliveryButton"

const DeliveryList = () => {
  const headers = [
    { label: 'ID', key: 'id' },
    { label: '名前', key: 'name' },
    { label: '年齢', key: 'age' },
    { label: '役割', key: 'role' },
  ];
  
  const data = [
    { id: 1, name: '山田太郎', age: 30, role: '管理者' },
    { id: 2, name: '佐藤花子', age: 25, role: 'ユーザー' },
    { id: 3, name: '奥田真那斗', age: 21, role: 'ユーザー' },
  ];
  return(
    <div>
    <SearchMultiSelectBox/>
    <DynamicTable headers={headers} data={data} />
    <DeliveryButton styleType="primary">納品追加</DeliveryButton>
    </div>
  );
}

export default DeliveryList





