import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import Breadcrumbs from './components/Breadcrumbs';
import StoreGuard from './components/StoreGuard';
import { StoreProvider } from './contexts/StoreContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <StoreProvider>
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
