"use client";

 import React, { useState } from 'react';
import './app.css'; // 後でスタイルを追加します

const Counter: React.FC = () => {
  // useStateを使って数値の状態を管理します
  // count は現在の値、setCount は値を更新するための関数です
  const [count, setCount] = useState<number>(0);

  // 「増やす」ボタンが押されたときの処理
  const handleIncrement = () => {
    setCount(prevCount => prevCount + 1); // 現在の値に1を加算
  };

  // 「減らす」ボタンが押されたときの処理
  const handleDecrement = () => {
    setCount(prevCount => prevCount - 1); // 現在の値から1を減算
  };

  // 「リセット」ボタンが押されたときの処理
  const handleReset = () => {
    setCount(0); // 値を0にリセット
  };

  return (
    <div className="counter-container">
      <h2>シンプルなカウンター</h2>
      <p className="count-display">現在のカウント: {count}</p>
      <div className="button-group">
        <button onClick={handleIncrement}>増やす (+1)</button>
        <button onClick={handleDecrement}>減らす (-1)</button>
        <button onClick={handleReset}>リセット</button>
      </div>
    </div>
  );
};

export default Counter;