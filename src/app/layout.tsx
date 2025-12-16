import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'One Bottle - One person. One bottle. One story.',
  description: '2025 数字时光胶囊，每人仅一次机会',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}

