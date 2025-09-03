import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext'
import { ApiKeyProvider } from '@/contexts/ApiKeyContext'
import { Toaster } from 'sonner'

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
        <AuthProvider>
          <ApiKeyProvider>
            {children}
            <Toaster position="top-right" richColors />
          </ApiKeyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
