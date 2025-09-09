'use client'

import { Layout } from 'antd'
import AntHeader from '@/components/ui/ant-header'
import ImageHistory from '@/components/ImageHistory'

const { Content } = Layout

export default function HistoryPage() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <AntHeader 
        title="Creative AI Studio" 
        subtitle="Histórico de Imagens" 
        showNavigation={true} 
      />
      <Content style={{ padding: '24px' }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Histórico de Imagens</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie suas imagens geradas
          </p>
        </div>
        
        <ImageHistory />
      </Content>
    </Layout>
  )
}