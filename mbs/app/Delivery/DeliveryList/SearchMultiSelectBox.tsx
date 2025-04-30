"use client";
import { useState } from "react";
import Select from "react-select";

export interface OptionType {
    id: number;
    value: string;
    label: string;
    isCat: boolean;
  }
  
  const SearchMultiSelectBox = () => {
    /**
     * 選択肢のリスト
     *「key: value」は、自由に追加が可能なので、使い勝手がいい。
     */
    const options = [
      { id: 1, value: "robotama", label: "ロボ玉", isCat: false },
      { id: 2, value: "maritama", label: "まり玉", isCat: false },
      { id: 3, value: "hakutou", label: "白桃さん", isCat: true },
      { id: 4, value: "momo", label: "ももちゃん", isCat: true },
      { id: 5, value: "pyupyumaru", label: "ぴゅぴゅ丸", isCat: true },
    ];
  
    const [selectedValue, setSelectedValue] = useState([options[0]]);
  
    const handleChange = (options: OptionType[] | null) => {
      console.log("Select変更");
      console.log("option", options);
      if (options) {
        setSelectedValue([...options]);
      }
    };
  
    return (
      <div style={{ width: "500px", margin: "20px" }}>
        <Select
          /** SelectBox の id */
          instanceId="search-select-box"
          defaultValue={selectedValue}
          options={options}
          onChange={(options) => (options ? handleChange([...options]) : null)}
          /** 検索で、該当なしの場合のメッセージ */
          noOptionsMessage={() => "ペットが見つかりません"}
          placeholder="ペットを選んでください"
          /** 検索可能・オプション */
          isSearchable={true}
          components={{
            /** Defaultで表示されているセパレーターを消す */
            IndicatorSeparator: () => null,
          }}
          /** 複数選択・可能 */
          isMulti
        />
      </div>
    );
  };
  
  export default SearchMultiSelectBox;