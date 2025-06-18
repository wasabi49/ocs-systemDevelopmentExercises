"use client"

import Link from "next/link"
import { User, ShoppingCart, Truck, BarChart3 } from "lucide-react"

export default function HomePage() {
  const buttons = [
    {
      label: "顧客管理",
      path: "/Home/CustomerList",
      icon: User,
      color: "text-blue-500",
    },
    {
      label: "注文管理",
      path: "/Home/OrderList",
      icon: ShoppingCart,
      color: "text-blue-500",
    },
    {
      label: "納品管理",
      path: "/Home/DeliveryList",
      icon: Truck,
      color: "text-blue-500",
    },
    {
      label: "統計情報",
      path: "/Home/Statistics",
      icon: BarChart3,
      color: "text-blue-500",
    },
  ]

  return (
    <div className="flex h-[calc(90vh-68px)] flex-col bg-sky-50 p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">管理メニュー</h1>
        <p className="mt-2 text-lg text-gray-600">管理したい項目を選択してください</p>
      </div>

      <div className="flex flex-1 items-center justify-center">
        <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-8">
          {buttons.map((btn, idx) => {
            const IconComponent = btn.icon
            return (
              <Link
                key={idx}
                href={btn.path}
                className="flex h-24 w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-4 shadow-sm transition hover:shadow-md sm:h-48 sm:px-8 sm:py-12"
              >
                <IconComponent className={`mb-2 h-6 w-6 ${btn.color} sm:mb-6 sm:h-12 sm:w-12`} />
                <span className="text-base font-medium text-gray-800 sm:text-xl">{btn.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
