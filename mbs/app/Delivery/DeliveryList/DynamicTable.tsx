"use client";


import React from 'react';

type DynamicTableProps = {
  headers: { label: string; key: string }[];
  data: { id: number; name: string; role: string }[];
};

const DynamicTable : React.FC<DynamicTableProps> = ({ headers, data }) => {
  return (
    <div className="flex justify-center items-center h-screen">
    <table style={{ border: '3px solid black' }}>
      <thead>
        <tr>
          {headers.map((header: { label: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, i: React.Key | null | undefined) => (
            <th key={i}>{header.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row: { [x: string]: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, rowIndex: React.Key | null | undefined) => (
          <tr key={rowIndex}>
            {headers.map((header: { key: string | number; }, i: React.Key | null | undefined) => (
              <td key={i}>{row[header.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

export default DynamicTable;