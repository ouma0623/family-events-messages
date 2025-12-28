import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '../components/Navigation';

export const metadata: Metadata = {
  title: 'Tokai Kids Events - 家族向けイベント検索',
  description: '愛知県の家族向け・子供向けイベントを検索・おすすめ',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <p className="text-center text-gray-400">
              © 2025 Tokai Kids Events. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
