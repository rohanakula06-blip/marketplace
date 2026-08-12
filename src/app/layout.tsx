import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/providers/AppProvider';

export const metadata: Metadata = {
  title: 'LocalPro — Local Skills. Local Needs. One Powerful Connection.',
  description: 'Find trusted workers near you—or discover local jobs that match your skills. LocalPro connects customers and professionals through intelligent matching, secure booking and direct communication.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
