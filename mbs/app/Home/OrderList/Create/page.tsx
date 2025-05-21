'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 商品項目の型定義
type ProductItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description: string;
};

// 顧客データの型定義
type Customer = {
  id: string;
  name: string;
};

// ダミーの顧客データ
const dummyCustomers: Customer[] = [
  { id: '1', name: '大阪情報専門学校' },
  { id: '2', name: '森ノ宮病院' },
  { id: '3', name: 'アイテックス株式会社' },
  { id: '4', name: '株式会社システム開発' },
  { id: '5', name: 'ヘアサロン ナニー' },
  { id: '6', name: '大阪デザイン専門学校' },
  { id: '7', name: '関西電力株式会社' },
  { id: '8', name: '大阪メトロ株式会社' }
];

// 注文追加ページのコンポーネント
export default function OrderCreatePage() {
  const router = useRouter();
  
  // 状態管理
  const [products, setProducts] = useState<ProductItem[]>([
    { id: '1', name: 'IT情報コンサルメント', quantity: 2, price: 3500, description: '' },
    { id: '2', name: '', quantity: 1, price: 2400, description: '9784813299035' }
  ]);
  const [orderDate, setOrderDate] = useState<string>('2024/12/15');
  const [customer, setCustomer] = useState<string>('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(dummyCustomers);
  const [remarks, setRemarks] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  
  // 日本円のフォーマット関数
  const formatJPY = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP').format(amount);
  };
  
  // 顧客検索フィルター
  useEffect(() => {
    if (customerSearchTerm.trim() === '') {
      setFilteredCustomers(dummyCustomers);
    } else {
      const filtered = dummyCustomers.filter(c => 
        c.name.toLowerCase().includes(customerSearchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchTerm]);
  
  // 商品追加ハンドラー
  const handleAddProduct = () => {
    const newProduct: ProductItem = {
      id: String(products.length + 1),
      name: '',
      quantity: 1,
      price: 0,
      description: ''
    };
    setProducts([...products, newProduct]);
  };

  // 商品編集ハンドラー
  const handleEditProduct = (index: number, field: keyof ProductItem, value: string | number) => {
    const updatedProducts = [...products];
    updatedProducts[index] = {
      ...updatedProducts[index],
      [field]: value
    };
    setProducts(updatedProducts);
  };

  // 商品削除ハンドラー
  const handleDeleteProduct = (index: number) => {
    if (confirm('この商品を削除してもよろしいですか？')) {
      const updatedProducts = products.filter((_, i) => i !== index);
      setProducts(updatedProducts);
    }
  };

  // 顧客選択ハンドラー
  const handleSelectCustomer = (customerName: string) => {
    setCustomer(customerName);
    setShowCustomerDropdown(false);
  };
  
  // カレンダー日付選択ハンドラー
  const handleDateSelect = (date: string) => {
    setOrderDate(date);
    setShowCalendar(false);
  };
  
  // 簡易カレンダーコンポーネント
  const SimpleCalendar = () => {
    // 現在の年月を取得
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // 月の最初の日と最後の日を取得
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // 曜日の配列
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    
    // 日付の配列を作成
    const days = [];
    
    // 前月の日を埋める
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // 当月の日を埋める
    for (let i = 1; i <= lastDate; i++) {
      days.push(i);
    }
    
    return (
      <div className="bg-white border rounded shadow-lg p-2 absolute top-full right-0 z-10">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekdays.map((day, index) => (
            <div 
              key={index} 
              className={`text-center text-xs font-semibold ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : ''
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div 
              key={index}
              className={`w-7 h-7 flex items-center justify-center text-xs rounded ${
                day ? 
                  day === currentDay ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 cursor-pointer' 
                  : ''
              }`}
              onClick={() => day && handleDateSelect(`${currentYear}/${currentMonth + 1}/${day}`)}
            >
              {day}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 注文追加ハンドラー
  const handleAddOrder = () => {
    // 入力検証
    if (products.length === 0 || !orderDate || !customer || !remarks) {
      alert('必須項目を入力してください');
      return;
    }
    
    // 注文データを作成
    const orderData = {
      products,
      orderDate,
      customer,
      remarks
    };
    
    // 通常は API 呼び出しをここで行います
    console.log('注文データ:', orderData);
    
    // デモ用アラート
    alert('注文を追加しました（デモのため実際の追加は行われていません）');
    
    // 注文一覧画面に戻る
    router.push('/Home/OrderList');
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* 商品選択エリア（左側） */}
        <div className="w-full lg:w-1/2">
          <div className="mb-4">
            <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border border-black">
              商品選択
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-xs sm:text-sm border border-black">
                <thead>
                  <tr>
                    <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[35%]">商品名 *</th>
                    <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[10%]">数量</th>
                    <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[15%]">単価</th>
                    <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[30%]">摘要</th>
                    <th className="border border-black px-2 py-1 bg-blue-500 text-white w-[10%]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-blue-100" : "bg-white"}>
                      <td className="border border-black px-2 py-1">
                        <input 
                          type="text" 
                          className="w-full px-1 py-1 text-xs sm:text-sm"
                          value={product.name}
                          onChange={(e) => handleEditProduct(index, 'name', e.target.value)}
                        />
                      </td>
                      <td className="border border-black px-2 py-1">
                        <input 
                          type="number" 
                          className="w-full px-1 py-1 text-xs sm:text-sm text-right"
                          value={product.quantity}
                          min="1"
                          onChange={(e) => handleEditProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </td>
                      <td className="border border-black px-2 py-1">
                        <input 
                          type="text" 
                          className="w-full px-1 py-1 text-xs sm:text-sm text-right"
                          value={product.price === 0 ? '' : formatJPY(product.price)}
                          onChange={(e) => {
                            // カンマを取り除いて数値に変換
                            const value = e.target.value.replace(/,/g, '');
                            // 文字列から数値への変換
                            const numValue = isNaN(Number(value)) ? 0 : Number(value);
                            handleEditProduct(index, 'price', numValue);
                          }}
                        />
                      </td>
                      <td className="border border-black px-2 py-1">
                        <input 
                          type="text" 
                          className="w-full px-1 py-1 text-xs sm:text-sm"
                          value={product.description}
                          onChange={(e) => handleEditProduct(index, 'description', e.target.value)}
                        />
                      </td>
                      <td className="border border-black px-2 py-1 text-center">
                        <button 
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs rounded"
                          onClick={() => handleDeleteProduct(index)}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 商品追加ボタン */}
            <div className="mt-3 flex justify-center">
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-4 rounded text-xs sm:text-sm"
                onClick={handleAddProduct}
              >
                追加
              </button>
            </div>
            
            {/* 注意書き */}
            <div className="mt-2 text-red-500 text-xs">
              * 商品名または摘要欄の項目は必須です
              <br />
              * 商品は最大20個までです
            </div>
            
            {/* 吹き出し（左寄せ） */}
            <div className="relative mt-3 ml-4">
              <div className="border border-gray-300 rounded p-2 bg-white text-xs max-w-xs">
                追加された商品データを確認することができます。
                <br />
                「商品削除」ボタンで各項目を削除できます。
              </div>
              <div className="absolute top-3 -left-3">
                <div className="w-0 h-0 border-t-[6px] border-t-transparent border-r-[6px] border-r-gray-300 border-b-[6px] border-b-transparent"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 注文情報エリア（右側） */}
        <div className="w-full lg:w-1/2">
          <div className="flex flex-col gap-4">
            {/* 顧客情報 */}
            <div>
              <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border border-black">
                顧客情報
              </div>
              <div className="p-3 border-x border-b border-black">
                <div className="flex items-center mb-2">
                  <label className="text-xs sm:text-sm flex items-center mr-2">
                    顧客 *
                  </label>
                  <div className="flex-1 relative">
                    <div className="flex items-center">
                      <div className="absolute left-2 text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input 
                        type="text" 
                        className="w-full pl-8 pr-2 py-2 rounded text-xs sm:text-sm"
                        value={customerSearchTerm}
                        onChange={(e) => {
                          setCustomerSearchTerm(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onClick={() => setShowCustomerDropdown(true)}
                        placeholder="顧客名を検索"
                      />
                    </div>
                    
                    {showCustomerDropdown && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <div 
                              key={c.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-xs sm:text-sm"
                              onClick={() => handleSelectCustomer(c.name)}
                            >
                              {c.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-xs sm:text-sm">顧客が見つかりません</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-gray-600 text-xs mt-1">
                  選択された顧客: <span className="font-semibold">{customer}</span>
                </div>
              </div>
            </div>
            
            {/* 注文日 */}
            <div>
              <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border border-black">
                注文日
              </div>
              <div className="p-3 border-x border-b border-black">
                <div className="flex items-center relative">
                  <input 
                    type="text" 
                    className="flex-1 px-2 py-2 rounded text-xs sm:text-sm"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    readOnly
                  />
                  <button 
                    className="ml-2 border border-black rounded p-2 bg-white"
                    onClick={() => setShowCalendar(!showCalendar)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {showCalendar && <SimpleCalendar />}
                </div>
              </div>
            </div>
            
            {/* 備考欄 */}
            <div>
              <div className="bg-blue-500 text-white p-2 font-semibold text-sm sm:text-base border border-black">
                備考
              </div>
              <div className="p-3 border-x border-b border-black">
                <textarea 
                  className="w-full px-2 py-2 rounded text-xs sm:text-sm min-h-[120px] border border-black"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                ></textarea>
                <div className="text-red-500 text-xs mt-1">* 備考は必須項目です</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 追加ボタン */}
      <div className="flex justify-center mt-6">
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded text-sm sm:text-base"
          onClick={handleAddOrder}
        >
          追加
        </button>
      </div>
    </div>
  );
}