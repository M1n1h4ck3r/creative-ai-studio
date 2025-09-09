'use client'

import { Layout } from 'antd'
import AntHeader from '@/components/ui/ant-header'
import AntImageGenerator from '@/components/AntImageGenerator'

const { Content } = Layout

export default function GeneratorPage() {
  const handleGenerate = (data: any) => {
    console.log('Generated image data:', data)
    // Handle the generated image data (save to collections, etc.)
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <AntHeader 
        title="Creative AI Studio" 
        subtitle="Gerador de Imagens IA" 
        showNavigation={true} 
      />
      <Content style={{ padding: '24px' }}>
        <AntImageGenerator onGenerate={handleGenerate} />
      </Content>
    </Layout>
  )
}