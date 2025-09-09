'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import ThemeToggle from '@/components/ui/theme-toggle'
import { 
  Sparkles, 
  Settings, 
  User,
  Menu,
  Home,
  Heart,
  History,
  BarChart3,
  Layers,
  Edit
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface HeaderProps {
  title?: string
  subtitle?: string
  showNavigation?: boolean
}

const navigationItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/history', icon: History, label: 'Histórico' },
  { href: '/collections', icon: Heart, label: 'Coleções' },
  { href: '/batch', icon: Layers, label: 'Lote' },
  { href: '/editor', icon: Edit, label: 'Editor' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
]

export function Header({ title = "Creative AI Studio", subtitle, showNavigation = true }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            {showNavigation && (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center">
                      <Sparkles className="mr-2 h-5 w-5 text-blue-600" />
                      Creative AI Studio
                    </SheetTitle>
                    <SheetDescription>
                      Navegue pelas funcionalidades
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="mt-8 space-y-2">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Button variant="ghost" className="w-full justify-start">
                          <item.icon className="mr-2 h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            )}
            
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold leading-none">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </Link>
            
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>

          {/* Navigation - Desktop */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.slice(0, 4).map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" size="sm">
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            <DropdownMenu 
              open={isDropdownOpen} 
              onOpenChange={setIsDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative h-8 w-8 rounded-full hover:bg-accent focus:bg-accent"
                  onClick={() => {
                    console.log('Dropdown trigger clicked')
                    setIsDropdownOpen(!isDropdownOpen)
                  }}
                >
                  <User className="h-4 w-4" />
                  <span className="sr-only">Menu do usuário</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56" 
                align="end" 
                sideOffset={5}
                style={{ zIndex: 9999 }}
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">Usuário</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      user@example.com
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    console.log('Navegando para Configurações')
                    setIsDropdownOpen(false)
                    window.location.href = '/settings'
                  }}
                  className="flex items-center cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    console.log('Navegando para Analytics')
                    setIsDropdownOpen(false)
                    window.location.href = '/analytics'
                  }}
                  className="flex items-center cursor-pointer"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Analytics</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="flex items-center cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                  onClick={() => {
                    console.log('Fazendo logout...')
                    setIsDropdownOpen(false)
                    // Implementar logout
                    if (typeof window !== 'undefined') {
                      localStorage.clear()
                      sessionStorage.clear()
                      // Redirect para a página de login
                      window.location.href = '/'
                    }
                  }}
                >
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header