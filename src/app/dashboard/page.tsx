'use client'

import { Layout } from 'antd'
import AntHeader from '@/components/ui/ant-header'
import AntDashboard from '@/components/AntDashboard'
import { useRouter } from 'next/navigation'

const { Content } = Layout

export default function DashboardPage() {
  const router = useRouter()

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <AntHeader title="Creative AI Studio" subtitle="v2.0 - Powered by Ant Design" />
      <Content style={{ background: 'transparent' }}>
        <AntDashboard onNavigate={handleNavigate} />
      </Content>
    </Layout>
  )
}