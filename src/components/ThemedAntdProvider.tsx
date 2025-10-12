'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { ConfigProvider, theme as antdTheme } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

interface ThemedAntdProviderProps {
  children: React.ReactNode
}

export function ThemedAntdProvider({ children }: ThemedAntdProviderProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
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
          ...(theme === 'dark' && {
            colorBgContainer: 'rgba(255, 255, 255, 0.05)',
            colorBgElevated: 'rgba(255, 255, 255, 0.08)',
            colorBgLayout: '#000000',
            colorBgSpotlight: 'rgba(255, 255, 255, 0.1)',
            colorBorder: 'rgba(255, 255, 255, 0.1)',
            colorBorderSecondary: 'rgba(255, 255, 255, 0.06)',
          }),
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
            ...(theme === 'dark' && {
              colorBgContainer: 'rgba(255, 255, 255, 0.07)',
              colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
            }),
          },
          Layout: {
            ...(theme === 'dark' && {
              colorBgHeader: 'rgba(0, 0, 0, 0.8)',
              colorBgBody: '#000000',
              colorBgTrigger: 'rgba(255, 255, 255, 0.05)',
            }),
          },
          Menu: {
            ...(theme === 'dark' && {
              colorBgContainer: 'rgba(255, 255, 255, 0.05)',
              colorItemBgSelected: 'rgba(59, 130, 246, 0.2)',
            }),
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
