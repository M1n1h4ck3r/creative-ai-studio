import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import PageTracker from '@/components/Analytics/PageTracker'
// import { ErrorBoundary } from '@/components/ErrorBoundary'
// import { MonitoringProvider } from '@/components/MonitoringProvider'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Creative AI Studio",
  description: "Gere criativos incríveis com IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <ApiKeyProvider>
              <PageTracker />
              {children}
              <Toaster position="top-right" richColors />
              <Analytics />
            </ApiKeyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
