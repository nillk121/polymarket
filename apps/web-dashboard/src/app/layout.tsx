import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Polymarket - Админ панель',
  description: 'Админ панель и аналитика для платформы прогнозных рынков',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

