import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import StoreGuard from './components/StoreGuard';
import { StoreProvider } from './contexts/StoreContext';
import { getStoreFromCookie } from './utils/storeUtils';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // サーバーサイドで店舗情報を取得
  const initialStore = await getStoreFromCookie();

  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <StoreProvider initialStore={initialStore}>
          <StoreGuard>
            <Header />
            <Breadcrumbs />
            {children}
          </StoreGuard>
        </StoreProvider>
      </body>
    </html>
  );
}
