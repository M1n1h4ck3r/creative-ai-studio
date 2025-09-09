'use client'

import { useTheme } from 'next-themes'
import { ConfigProvider, theme as antdTheme } from 'antd'
import { ReactNode, useEffect, useState } from 'react'
import ptBR from 'antd/locale/pt_BR'
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

interface ThemeWrapperProps {
  children: ReactNode
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evita hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Retorna tema padrão durante SSR
    return (
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
        {children}
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider
      locale={ptBR}
      theme={{
        algorithm: theme === 'dark' ? [antdTheme.darkAlgorithm] : [antdTheme.defaultAlgorithm],
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
      {children}
    </ConfigProvider>
  )
}