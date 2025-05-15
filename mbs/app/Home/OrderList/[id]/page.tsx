"use client";

import { notFound } from "next/navigation";
import React from "react";

type OrderData = {
  orderInfo: {
    date: string;
    status: string;
    note: string;
  };
  customer: {
    name: string;
    person: string;
    phone: string;
    delivery: string;
    address: string;
  };
  details: {
    detailId: string;
    name: string;
    price: string;
    qty: number;
    deliveryId: string;
    note: string;
  }[];
};

// ✅ インデックスシグネチャで柔軟に対応
const dummyData: { [key: string]: OrderData } = {
  O12345: {
    orderInfo: {
      date: "2004/4/7",
      status: "完了",
      note: "",
    },
    customer: {
      name: "大阪情報専門学校",
      person: "田中太郎",
      phone: "06-1234-5678",
      delivery: "午前中指定",
      address: "大阪市東成区中道1-10-3",
    },
    details: [
      {
        detailId: "O12345-01",
        name: "情報処理筆記作権",
        price: "2,400円",
        qty: 10,
        deliveryId: "D12345-01",
        note: "",
      },
      {
        detailId: "O12345-02",
        name: "プログラミングノート",
        price: "500円",
        qty: 15,
        deliveryId: "D12345-02",
        note: "",
      },
    ],
  },
  O12457: {
    orderInfo: {
      date: "2004/4/8",
      status: "未完了",
      note: "確認中",
    },
    customer: {
      name: "森ノ宮病院",
      person: "今井美由紀",
      phone: "050-8454-9544",
      delivery: "平日不定",
      address: "大阪市東成区大今里6-1-1",
    },
    details: [
      {
        detailId: "O12457-01",
        name: "診察ノート",
        price: "1,000円",
        qty: 5,
        deliveryId: "D12457-01",
        note: "至急",
      },
    ],
  },
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const data = dummyData[params.id];
  if (!data) return notFound();

  const { orderInfo, customer, details } = data;

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-start">
        <table className="border-collapse w-3/5">
          <thead className="bg-blue-300">
            <tr>
              <th className="border px-2 py-1">注文明細ID</th>
              <th className="border px-2 py-1">商品名</th>
              <th className="border px-2 py-1">単価</th>
              <th className="border px-2 py-1">数量</th>
              <th className="border px-2 py-1">納品明細ID</th>
              <th className="border px-2 py-1">摘要</th>
            </tr>
          </thead>
          <tbody>
            {details.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-blue-100" : ""}>
                <td className="border px-2 py-1">{item.detailId}</td>
                <td className="border px-2 py-1">{item.name}</td>
                <td className="border px-2 py-1">{item.price}</td>
                <td className="border px-2 py-1">{item.qty}</td>
                <td className="border px-2 py-1">{item.deliveryId}</td>
                <td className="border px-2 py-1">{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="w-2/5 space-y-4">
          <section className="bg-blue-100 p-4 border">
            <h2 className="font-bold mb-2">注文情報</h2>
            <p><strong>注文ID：</strong>{params.id}</p>
            <p><strong>注文日：</strong>{orderInfo.date}</p>
            <p><strong>状態：</strong>{orderInfo.status}</p>
            <p><strong>備考：</strong>{orderInfo.note || "なし"}</p>
          </section>

          <section className="bg-blue-100 p-4 border">
            <h2 className="font-bold mb-2">顧客情報</h2>
            <p><strong>名称：</strong>{customer.name}</p>
            <p><strong>担当者：</strong>{customer.person}</p>
            <p><strong>電話番号：</strong>{customer.phone}</p>
            <p><strong>配達方法：</strong>{customer.delivery}</p>
            <p><strong>住所：</strong>{customer.address}</p>
          </section>
        </div>
      </div>

      <div className="flex justify-between">
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">削除</button>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">PDF出力</button>
      </div>
    </div>
  );
}
