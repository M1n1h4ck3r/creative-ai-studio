'use client'

import { useState } from 'react'
import { useSpring, animated, useTrail } from '@react-spring/web'
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Space, 
  Badge,
  Switch,
  Button,
  Drawer,
  Typography,
  Divider
} from 'antd'
import {
  UserOutlined,
  SettingOutlined,
  BarChartOutlined,
  LogoutOutlined,
  MenuOutlined,
  HomeOutlined,
  HeartOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  EditOutlined,
  BulbOutlined,
  MoonOutlined,
  SunOutlined,
  StarOutlined,
  RocketOutlined
} from '@ant-design/icons'
import Link from 'next/link'
// import { useTheme } from 'next-themes'

const { Header } = Layout
const { Text } = Typography

interface AntHeaderProps {
  title?: string
  subtitle?: string
  showNavigation?: boolean
}

const navigationItems = [
  { key: 'dashboard', href: '/dashboard', icon: <HomeOutlined />, label: 'Dashboard' },
  { key: 'history', href: '/history', icon: <HistoryOutlined />, label: 'Histórico' },
  { key: 'collections', href: '/collections', icon: <HeartOutlined />, label: 'Coleções' },
  { key: 'batch', href: '/batch', icon: <AppstoreOutlined />, label: 'Lote' },
  { key: 'editor', href: '/editor', icon: <EditOutlined />, label: 'Editor' },
  { key: 'analytics', href: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
]

export function AntHeader({ 
  title = "Creative AI Studio", 
  subtitle, 
  showNavigation = true 
}: AntHeaderProps) {
  const [drawerVisible, setDrawerVisible] = useState(false)
  // const { theme, setTheme } = useTheme() // Disabled until next-themes is properly configured
  
  // React Spring animations
  const logoAnimation = useSpring({
    from: { scale: 0, rotate: -180 },
    to: { scale: 1, rotate: 0 },
    config: { tension: 200, friction: 20 }
  })

  const titleAnimation = useSpring({
    from: { opacity: 0, x: -20 },
    to: { opacity: 1, x: 0 },
    delay: 200,
    config: { tension: 300, friction: 25 }
  })

  const navigationTrail = useTrail(navigationItems.length, {
    from: { opacity: 0, y: -20 },
    to: { opacity: 1, y: 0 },
    delay: 400,
    config: { tension: 300, friction: 25 }
  })

  const badgeAnimation = useSpring({
    from: { scale: 0 },
    to: { scale: 1 },
    delay: 600,
    config: { type: 'spring', damping: 15 }
  })

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    }
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>Usuário</div>
            <Text type="secondary" style={{ fontSize: 12 }}>user@example.com</Text>
          </div>
        </Space>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configurações',
      onClick: () => window.location.href = '/settings'
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      onClick: () => window.location.href = '/analytics'
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      onClick: handleLogout,
      danger: true,
    },
  ]

  const themeSwitch = (
    <Space>
      <SunOutlined />
      <Switch
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
        checked={false}
        onChange={() => {}} // Disabled until next-themes is properly configured
        disabled
      />
    </Space>
  )

  return (
    <Header 
      style={{ 
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Logo and Title */}
      <Space size="large">
        {/* Mobile Menu Button */}
        {showNavigation && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            className="md:hidden"
            style={{ border: 'none' }}
          />
        )}
        
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Space size="middle" align="center">
            <animated.div style={logoAnimation}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 18,
                }}
              >
                <StarOutlined />
              </div>
            </animated.div>
            
            <animated.div style={titleAnimation}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>
                  {title}
                </div>
                {subtitle && (
                  <Text type="secondary" style={{ fontSize: 12, lineHeight: 1 }}>
                    {subtitle}
                  </Text>
                )}
              </div>
            </animated.div>
          </Space>
        </Link>

        {/* AI Badge */}
        <animated.div style={badgeAnimation}>
          <Badge 
            count={
              <Space size={4} style={{ 
                fontSize: 11, 
                color: '#667eea',
                background: 'rgba(102, 126, 234, 0.1)',
                padding: '2px 6px',
                borderRadius: 6,
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <RocketOutlined />
                AI-Powered
              </Space>
            }
            style={{ backgroundColor: 'transparent' }}
          />
        </animated.div>
      </Space>

      {/* Desktop Navigation */}
      {showNavigation && (
        <div className="hidden md:flex">
          <Space size="small">
            {navigationTrail.map((props, index) => (
              <animated.div key={navigationItems[index].key} style={props}>
                <Link href={navigationItems[index].href}>
                  <Button 
                    type="text" 
                    icon={navigationItems[index].icon}
                    style={{ 
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      borderRadius: 8,
                    }}
                  >
                    {navigationItems[index].label}
                  </Button>
                </Link>
              </animated.div>
            ))}
          </Space>
        </div>
      )}

      {/* Actions */}
      <Space size="middle">
        {/* Theme Toggle */}
        {themeSwitch}
        
        {/* User Menu */}
        <Dropdown 
          menu={{ items: userMenuItems }} 
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            shape="circle"
            icon={<Avatar size="small" icon={<UserOutlined />} />}
            style={{ 
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Dropdown>
      </Space>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 14,
              }}
            >
              <StarOutlined />
            </div>
            Creative AI Studio
          </Space>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
      >
        <div style={{ padding: '8px 0' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Navegue pelas funcionalidades
          </Text>
        </div>
        
        <Divider />
        
        <Menu
          mode="inline"
          style={{ border: 'none' }}
          items={navigationItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: (
              <Link 
                href={item.href}
                onClick={() => setDrawerVisible(false)}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                {item.label}
              </Link>
            ),
          }))}
        />

        <Divider />
        
        <div style={{ padding: '16px 0' }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Configurações</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>Tema</Text>
              {themeSwitch}
            </div>
          </Space>
        </div>
      </Drawer>
    </Header>
  )
}

export default AntHeader