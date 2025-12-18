import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

export const metadata: Metadata = {
  title: 'One Bottle — One person. One bottle. One story.',
  description: 'Leave your 2025 in a bottle. One chance. No edits. No retries.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFBF7',
              color: '#44403C',
              border: '1px solid rgba(217, 119, 6, 0.15)',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '15px',
              fontFamily: 'Source Sans 3, system-ui, sans-serif',
            },
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
