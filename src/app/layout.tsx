import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import PageTracker from '@/components/Analytics/PageTracker'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider, theme as antdTheme } from 'antd'
import ptBR from 'antd/locale/pt_BR'
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
        <AntdRegistry>
          <NextThemeProvider attribute="class" defaultTheme="light">
            <ConfigProvider
              locale={ptBR}
              theme={{
                algorithm: [antdTheme.defaultAlgorithm],
                token: {
                  colorPrimary: '#3b82f6',
                  colorSuccess: '#10b981',
                  colorWarning: '#f59e0b',
                  colorError: '#ef4444',
                  borderRadius: 8,
                  fontFamily: inter.style.fontFamily,
                },
                components: {
                  Button: {
                    borderRadius: 8,
                    controlHeight: 40,
                  },
                  Input: {
                    borderRadius: 8,
                    controlHeight: 40,
                  },
                  Card: {
                    borderRadius: 12,
                  },
                },
              }}
            >
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
            </ConfigProvider>
          </NextThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
