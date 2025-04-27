import React, { useState } from 'react';

// 注文データ型定義
type Order = {
  id: string;
  date: string;
  customerName: string;
  note: string;
  status: '完了' | '未完了';
};

// ダミーデータ
const dummyOrders: Order[] = [
  { id: 'O12345', date: '2004/4/7', customerName: '大阪情報専門学校', note: '', status: '完了' },
  { id: 'O12457', date: '2004/4/8', customerName: '森ノ宮病院', note: '', status: '未完了' },
];

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(dummyOrders);
  const [searchField, setSearchField] = useState<'すべて' | '注文ID' | '注文日' | '顧客名' | '備考' | '状態'>('すべて');
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleAddOrder = () => {
    // 遷移処理は別途親コンポーネントやルーティングで実装してください
    alert('注文追加画面に遷移します（仮）');
  };

  const handleSort = (field: keyof Order) => {
    const sorted = [...orders].sort((a, b) => (a[field] > b[field] ? 1 : -1));
    setOrders(sorted);
  };

  const filteredOrders = orders.filter(order => {
    if (searchField === 'すべて') {
      return (
        order.id.includes(searchKeyword) ||
        order.date.includes(searchKeyword) ||
        order.customerName.includes(searchKeyword) ||
        order.note.includes(searchKeyword) ||
        order.status.includes(searchKeyword)
      );
    }
    return order[searchField as keyof Order].includes(searchKeyword);
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleAddOrder} style={{ marginRight: '10px', backgroundColor: 'yellow' }}>注文追加</button>
        <select value={searchField} onChange={e => setSearchField(e.target.value as any)}>
          <option value="すべて">すべて検索</option>
          <option value="注文ID">注文ID</option>
          <option value="注文日">注文日</option>
          <option value="顧客名">顧客名</option>
          <option value="備考">備考</option>
          <option value="状態">状態</option>
        </select>
        <input
          type="text"
          placeholder="例：注文ID"
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          style={{ marginLeft: '10px' }}
        />
      </div>

      <table border={1} cellPadding={5} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th><button onClick={() => handleSort('id')}>注文ID</button></th>
            <th><button onClick={() => handleSort('date')}>注文日</button></th>
            <th>顧客名</th>
            <th>備考</th>
            <th><button onClick={() => handleSort('status')}>状態</button></th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map((order, index) => (
            <tr key={index}>
              <td>{order.id}</td>
              <td>{order.date}</td>
              <td>{order.customerName}</td>
              <td>{order.note}</td>
              <td style={{ color: order.status === '完了' ? 'black' : 'red' }}>{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ページネーション（ダミー） */}
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        {'<<'} <span style={{ margin: '0 5px' }}>1</span> <span style={{ margin: '0 5px', textDecoration: 'underline' }}>2</span> <span style={{ margin: '0 5px' }}>3</span> {'>>'}
      </div>
    </div>
  );
};

export default OrderList;
