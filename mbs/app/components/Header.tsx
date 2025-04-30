import Link from "next/link";

const Header = () => {
  return (
    <header className="flex justify-between items-center bg-blue-500 text-white p-4">
      <div className="text-3xl font-bold">
        <Link href="/home">MBS</Link>
      </div>
      <nav>
        <ul className="flex space-x-16">
          <li className="cursor-pointer hover:underline">
            <Link href="/Home/CustomerList">顧客</Link>
          </li>
          <li className="cursor-pointer hover:underline">
            <Link href="/orders">注文</Link>
          </li>
          <li className="cursor-pointer hover:underline">
            <Link href="/deliveries">納品</Link>
          </li>
          <li className="cursor-pointer hover:underline">
            <Link href="/statistics">統計</Link>
          </li>
          <li className="cursor-pointer hover:underline">
            <Link href="/stores">店舗</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
