'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeMode = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  themeMode: ThemeMode
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('system')
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')

  // Function to get system theme
  const getSystemTheme = (): ThemeMode => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // Function to update theme mode
  const updateThemeMode = (newTheme: Theme) => {
    let mode: ThemeMode

    if (newTheme === 'system') {
      mode = getSystemTheme()
    } else {
      mode = newTheme
    }

    setThemeMode(mode)

    // Apply theme to document
    const root = document.documentElement
    
    if (mode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Store theme preference
    localStorage.setItem('theme', newTheme)
  }

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme || 'system'
    setTheme(storedTheme)
    updateThemeMode(storedTheme)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        updateThemeMode('system')
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [theme])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    updateThemeMode(newTheme)
  }

  const toggleTheme = () => {
    const newTheme: Theme = themeMode === 'light' ? 'dark' : 'light'
    handleSetTheme(newTheme)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setTheme: handleSetTheme,
        toggleTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}