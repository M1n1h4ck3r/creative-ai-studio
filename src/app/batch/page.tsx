'use client'

import { Suspense } from 'react'
import { Layout } from 'antd'
import BatchProcessor from '@/components/BatchProcessor'
import AntHeader from '@/components/ui/ant-header'

const { Content } = Layout

export default function BatchPage() {
  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <AntHeader 
        title="Creative AI Studio" 
        subtitle="Processamento em Lote" 
        showNavigation={true} 
      />
      <Content style={{ padding: '24px' }}>
        <Suspense fallback={<div>Loading...</div>}>
          <BatchProcessor />
        </Suspense>
      </Content>
    </Layout>
  )
}