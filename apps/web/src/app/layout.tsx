import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'YouTube Multi-Publisher',
  description: 'Publish videos to multiple YouTube channels at once',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f5f5f5' }}>
        {children}
      </body>
    </html>
  );
}
