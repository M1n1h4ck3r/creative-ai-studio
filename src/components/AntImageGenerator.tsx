'use client'

import { useState, useCallback } from 'react'
import { useSpring, animated, useTrail, config } from '@react-spring/web'
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Tag,
  Tooltip,
  Progress,
  Alert,
  Image,
  Spin,
  FloatButton,
  message,
  Badge,
  Slider,
  Switch,
  Collapse,
  Upload
} from 'antd'
import {
  SendOutlined,
  PictureOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  EditOutlined,
  CopyOutlined,
  ReloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  StarOutlined
} from '@ant-design/icons'

const { TextArea } = Input
const { Text, Title } = Typography
const { Option } = Select
const { Panel } = Collapse

interface AntImageGeneratorProps {
  onGenerate?: (params: any) => void
}

const providers = [
  { value: 'gemini', label: 'Google Gemini', icon: '🧠', description: 'Melhor qualidade geral' },
  { value: 'openai', label: 'DALL-E 3', icon: '🎨', description: 'Excelente para arte' },
  { value: 'replicate', label: 'Replicate', icon: '🔄', description: 'Modelos especializados' },
]

const stylePresets = [
  { value: 'photorealistic', label: 'Fotorrealístico', color: '#52c41a' },
  { value: 'artistic', label: 'Artístico', color: '#722ed1' },
  { value: 'cartoon', label: 'Cartoon', color: '#fa8c16' },
  { value: 'anime', label: 'Anime', color: '#eb2f96' },
  { value: 'abstract', label: 'Abstrato', color: '#13c2c2' },
  { value: 'minimalist', label: 'Minimalista', color: '#1890ff' },
]

const quickPrompts = [
  "Uma paisagem futurística com neon",
  "Retrato de uma pessoa em estilo cyberpunk",
  "Um animal fantástico em uma floresta mágica",
  "Arquitetura moderna com elementos naturais",
  "Arte digital abstrata colorida"
]

export function AntImageGenerator({ onGenerate }: AntImageGeneratorProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // React Spring animations
  const containerAnimation = useSpring({
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    config: config.gentle
  })

  const cardAnimation = useSpring({
    from: { scale: 0.95, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    delay: 200,
    config: config.wobbly
  })

  const buttonAnimation = useSpring({
    scale: loading ? 0.95 : 1,
    config: config.wobbly
  })

  const progressAnimation = useSpring({
    width: loading ? `${progress}%` : '0%',
    config: config.slow
  })

  const imageAnimation = useSpring({
    opacity: generatedImage ? 1 : 0,
    scale: generatedImage ? 1 : 0.8,
    config: config.gentle
  })

  const quickPromptsTrail = useTrail(quickPrompts.length, {
    from: { opacity: 0, x: -20 },
    to: { opacity: 1, x: 0 },
    delay: 400,
    config: config.gentle
  })

  const stylePresetsTrail = useTrail(stylePresets.length, {
    from: { opacity: 0, scale: 0.8 },
    to: { opacity: 1, scale: 1 },
    delay: 600,
    config: config.wobbly
  })

  const handleGenerate = useCallback(async (values: any) => {
    setLoading(true)
    setProgress(0)
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 20
        })
      }, 500)

      // Call the actual generation API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })

      const data = await response.json()
      
      clearInterval(progressInterval)
      setProgress(100)

      if (data.success) {
        setGeneratedImage(data.imageUrl)
        message.success('Imagem gerada com sucesso!')
        onGenerate?.(data)
      } else {
        throw new Error(data.error || 'Erro na geração')
      }
    } catch (error: any) {
      message.error(error.message || 'Erro ao gerar imagem')
    } finally {
      setLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }, [onGenerate])

  const handleQuickPrompt = (prompt: string) => {
    form.setFieldsValue({ prompt })
    message.info('Prompt aplicado! Ajuste se necessário.')
  }

  const handleStyleSelect = (style: string) => {
    const currentPrompt = form.getFieldValue('prompt') || ''
    const newPrompt = currentPrompt + ` in ${style} style`
    form.setFieldsValue({ prompt: newPrompt })
    message.info(`Estilo ${style} adicionado!`)
  }

  return (
    <animated.div style={containerAnimation}>
      <Row gutter={[24, 24]}>
        {/* Main Generator Card */}
        <Col xs={24} lg={16}>
          <animated.div style={cardAnimation}>
            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#722ed1' }} />
                  <span>Gerador de Imagens IA</span>
                  <Badge count="Premium" style={{ backgroundColor: '#722ed1' }} />
                </Space>
              }
              extra={
                <Space>
                  <Tooltip title="Configurações avançadas">
                    <Button
                      type="text"
                      icon={<SettingOutlined />}
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    />
                  </Tooltip>
                </Space>
              }
              bordered={false}
              className="shadow-lg"
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleGenerate}
                initialValues={{
                  provider: 'gemini',
                  width: 1024,
                  height: 1024,
                  steps: 50,
                  guidance: 7.5,
                }}
              >
                {/* Prompt Input */}
                <Form.Item
                  name="prompt"
                  label={
                    <Space>
                      <PictureOutlined />
                      <span>Descreva sua imagem</span>
                    </Space>
                  }
                  rules={[{ required: true, message: 'Digite uma descrição!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Ex: Um gato robô futurista em uma cidade cyberpunk, arte digital, alta qualidade, 8k"
                    style={{ fontSize: 16 }}
                  />
                </Form.Item>

                {/* Provider Selection */}
                <Form.Item
                  name="provider"
                  label="Provedor de IA"
                >
                  <Select size="large">
                    {providers.map(provider => (
                      <Option key={provider.value} value={provider.value}>
                        <Space>
                          <span style={{ fontSize: 16 }}>{provider.icon}</span>
                          <div>
                            <div>{provider.label}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {provider.description}
                            </Text>
                          </div>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Advanced Settings */}
                {showAdvanced && (
                  <Collapse ghost>
                    <Panel header="Configurações Avançadas" key="advanced">
                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item name="width" label="Largura">
                            <Slider
                              min={256}
                              max={2048}
                              step={256}
                              marks={{
                                512: '512px',
                                1024: '1024px',
                                2048: '2048px',
                              }}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item name="height" label="Altura">
                            <Slider
                              min={256}
                              max={2048}
                              step={256}
                              marks={{
                                512: '512px',
                                1024: '1024px',
                                2048: '2048px',
                              }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={16}>
                        <Col xs={24} sm={12}>
                          <Form.Item name="steps" label="Passos de Geração">
                            <Slider min={20} max={100} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                          <Form.Item name="guidance" label="Força do Prompt">
                            <Slider min={1} max={20} step={0.5} />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Panel>
                  </Collapse>
                )}

                {/* Generate Button */}
                <Form.Item>
                  <animated.div style={buttonAnimation}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      htmlType="submit"
                      loading={loading}
                      block
                      style={{
                        height: 56,
                        fontSize: 16,
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                      }}
                    >
                      {loading ? 'Gerando Imagem...' : 'Gerar Imagem ✨'}
                    </Button>
                  </animated.div>
                </Form.Item>

                {/* Progress Bar */}
                {loading && (
                  <div style={{ marginTop: 16 }}>
                    <Progress
                      percent={progress}
                      status="active"
                      strokeColor={{
                        '0%': '#667eea',
                        '100%': '#764ba2',
                      }}
                      showInfo={false}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Criando sua obra de arte...
                    </Text>
                  </div>
                )}
              </Form>
            </Card>
          </animated.div>
        </Col>

        {/* Sidebar with Quick Options */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Quick Prompts */}
            <Card
              title="⚡ Prompts Rápidos"
              size="small"
              bordered={false}
            >
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                {quickPromptsTrail.map((props, index) => (
                  <animated.div key={index} style={props}>
                    <Button
                      type="dashed"
                      block
                      onClick={() => handleQuickPrompt(quickPrompts[index])}
                      style={{ textAlign: 'left', height: 'auto', padding: '8px 12px' }}
                    >
                      <Text style={{ fontSize: 13 }}>{quickPrompts[index]}</Text>
                    </Button>
                  </animated.div>
                ))}
              </Space>
            </Card>

            {/* Style Presets */}
            <Card
              title="🎨 Estilos Rápidos"
              size="small"
              bordered={false}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {stylePresetsTrail.map((props, index) => (
                  <animated.div key={index} style={props}>
                    <Tag
                      color={stylePresets[index].color}
                      style={{ 
                        cursor: 'pointer',
                        margin: 0,
                        padding: '4px 8px',
                        borderRadius: 6,
                      }}
                      onClick={() => handleStyleSelect(stylePresets[index].value)}
                    >
                      {stylePresets[index].label}
                    </Tag>
                  </animated.div>
                ))}
              </div>
            </Card>

            {/* Tips */}
            <Alert
              message="💡 Dica"
              description="Seja específico na descrição! Inclua estilo, iluminação, cores e detalhes para melhores resultados."
              type="info"
              showIcon
              style={{ fontSize: 13 }}
            />
          </Space>
        </Col>

        {/* Generated Image Result */}
        {generatedImage && (
          <Col xs={24}>
            <animated.div style={imageAnimation}>
              <Card
                title={
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>Resultado</span>
                  </Space>
                }
                extra={
                  <Space>
                    <Tooltip title="Favoritar">
                      <Button type="text" icon={<HeartOutlined />} />
                    </Tooltip>
                    <Tooltip title="Compartilhar">
                      <Button type="text" icon={<ShareAltOutlined />} />
                    </Tooltip>
                    <Tooltip title="Download">
                      <Button type="text" icon={<DownloadOutlined />} />
                    </Tooltip>
                    <Tooltip title="Editar">
                      <Button type="text" icon={<EditOutlined />} />
                    </Tooltip>
                  </Space>
                }
                bordered={false}
                className="shadow-lg"
              >
                <div style={{ textAlign: 'center' }}>
                  <Image
                    src={generatedImage}
                    alt="Generated image"
                    style={{
                      maxWidth: '100%',
                      borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    }}
                    preview={{
                      mask: (
                        <div style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                          <EyeOutlined /> Visualizar
                        </div>
                      )
                    }}
                  />
                </div>
              </Card>
            </animated.div>
          </Col>
        )}
      </Row>

      {/* Floating Action Button */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<ThunderboltOutlined />}
      >
        <FloatButton icon={<ReloadOutlined />} tooltip="Nova geração" />
        <FloatButton icon={<SettingOutlined />} tooltip="Configurações" />
        <FloatButton icon={<HeartOutlined />} tooltip="Favoritos" />
      </FloatButton.Group>
    </animated.div>
  )
}

export default AntImageGenerator