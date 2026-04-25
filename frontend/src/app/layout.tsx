import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CondominiumProvider } from '@/contexts/CondominiumContext';
import { Toaster } from 'sonner';
import QueryProvider from '@/components/shared/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vialar',
  description: 'Plataforma inteligente de gestão condominial',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <CondominiumProvider>
              {children}
              <Toaster richColors position="top-right" />
            </CondominiumProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
