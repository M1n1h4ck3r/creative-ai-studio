'use client'

import { useState, useEffect } from 'react'
import { useSpring, animated, useTrail, config } from '@react-spring/web'
import {
  Row,
  Col,
  Card,
  Statistic,
  Button,
  Space,
  Typography,
  Avatar,
  Progress,
  Timeline,
  Badge,
  Divider,
  Tag,
  Tooltip,
  List,
  Image,
  Empty,
  Skeleton,
} from 'antd'
import {
  PictureOutlined,
  HeartOutlined,
  BarChartOutlined,
  RocketOutlined,
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  StarOutlined,
  EyeOutlined,
  ShareAltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons'

const { Title, Text, Paragraph } = Typography

interface AntDashboardProps {
  onNavigate?: (path: string) => void
}

const mockStats = {
  totalImages: 1247,
  monthlyGrowth: 23,
  collections: 8,
  favorites: 156,
  successRate: 96,
  avgGenerationTime: '12s',
}

const mockRecentImages = [
  {
    id: 1,
    url: 'https://picsum.photos/200/200?random=1',
    prompt: 'Cyberpunk cityscape at night',
    provider: 'Gemini',
    createdAt: '2 horas atrás',
    likes: 24,
  },
  {
    id: 2,
    url: 'https://picsum.photos/200/200?random=2',
    prompt: 'Fantasy dragon in magical forest',
    provider: 'DALL-E',
    createdAt: '5 horas atrás',
    likes: 18,
  },
  {
    id: 3,
    url: 'https://picsum.photos/200/200?random=3',
    prompt: 'Abstract art with vibrant colors',
    provider: 'Replicate',
    createdAt: '1 dia atrás',
    likes: 31,
  },
]

const quickActions = [
  {
    title: 'Nova Imagem',
    description: 'Gerar uma nova criação',
    icon: <PlusOutlined />,
    color: '#722ed1',
    action: 'generate',
  },
  {
    title: 'Minhas Coleções',
    description: 'Ver imagens salvas',
    icon: <HeartOutlined />,
    color: '#eb2f96',
    action: 'collections',
  },
  {
    title: 'Analytics',
    description: 'Métricas detalhadas',
    icon: <BarChartOutlined />,
    color: '#13c2c2',
    action: 'analytics',
  },
  {
    title: 'Histórico',
    description: 'Gerações anteriores',
    icon: <ClockCircleOutlined />,
    color: '#52c41a',
    action: 'history',
  },
]

export function AntDashboard({ onNavigate }: AntDashboardProps) {
  const [loading, setLoading] = useState(true)
  
  // React Spring animations
  const containerAnimation = useSpring({
    from: { opacity: 0, y: 30 },
    to: { opacity: 1, y: 0 },
    config: config.gentle,
  })

  const statsCardsTrail = useTrail(4, {
    from: { opacity: 0, scale: 0.8, y: 20 },
    to: { opacity: 1, scale: 1, y: 0 },
    delay: 200,
    config: config.wobbly,
  })

  const quickActionsTrail = useTrail(quickActions.length, {
    from: { opacity: 0, x: -30 },
    to: { opacity: 1, x: 0 },
    delay: 600,
    config: config.gentle,
  })

  const recentImagesAnimation = useSpring({
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    delay: 800,
    config: config.gentle,
  })

  const welcomeAnimation = useSpring({
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    delay: 100,
    config: config.wobbly,
  })

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleQuickAction = (action: string) => {
    const routes = {
      generate: '/generator',
      collections: '/collections', 
      analytics: '/analytics',
      history: '/history',
    }
    onNavigate?.(routes[action as keyof typeof routes])
  }

  const statsCards = [
    {
      title: 'Imagens Geradas',
      value: mockStats.totalImages,
      prefix: <PictureOutlined style={{ color: '#722ed1' }} />,
      suffix: <ArrowUpOutlined style={{ color: '#52c41a' }} />,
      description: `+${mockStats.monthlyGrowth}% este mês`,
      color: '#722ed1',
    },
    {
      title: 'Coleções',
      value: mockStats.collections,
      prefix: <HeartOutlined style={{ color: '#eb2f96' }} />,
      description: `${mockStats.favorites} favoritos`,
      color: '#eb2f96',
    },
    {
      title: 'Taxa de Sucesso',
      value: mockStats.successRate,
      suffix: '%',
      prefix: <TrophyOutlined style={{ color: '#faad14' }} />,
      description: 'Gerações bem-sucedidas',
      color: '#faad14',
    },
    {
      title: 'Tempo Médio',
      value: mockStats.avgGenerationTime,
      prefix: <ThunderboltOutlined style={{ color: '#13c2c2' }} />,
      description: 'Por geração',
      color: '#13c2c2',
    },
  ]

  return (
    <animated.div style={containerAnimation}>
      <div style={{ padding: '24px' }}>
        {/* Welcome Section */}
        <animated.div style={welcomeAnimation}>
          <Card
            bordered={false}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              marginBottom: 24,
            }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Space direction="vertical" size="small">
                  <Title level={2} style={{ color: 'white', margin: 0 }}>
                    Bem-vindo ao Creative AI Studio! 🎨
                  </Title>
                  <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: 0 }}>
                    Transforme suas ideias em arte com inteligência artificial
                  </Paragraph>
                </Space>
              </Col>
              <Col>
                <Avatar
                  size={80}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontSize: 32,
                    backdropFilter: 'blur(10px)',
                  }}
                  icon={<RocketOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </animated.div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statsCardsTrail.map((props, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <animated.div style={props}>
                <Card bordered={false} className="shadow-sm">
                  <Statistic
                    title={statsCards[index].title}
                    value={statsCards[index].value}
                    prefix={statsCards[index].prefix}
                    suffix={statsCards[index].suffix}
                    valueStyle={{ 
                      color: statsCards[index].color,
                      fontSize: 24,
                      fontWeight: 700,
                    }}
                  />
                  {statsCards[index].description && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {statsCards[index].description}
                    </Text>
                  )}
                  <Progress
                    percent={75}
                    size="small"
                    strokeColor={statsCards[index].color}
                    showInfo={false}
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </animated.div>
            </Col>
          ))}
        </Row>

        <Row gutter={[24, 24]}>
          {/* Quick Actions */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FireOutlined style={{ color: '#ff4d4f' }} />
                  <span>Ações Rápidas</span>
                </Space>
              }
              bordered={false}
              className="shadow-sm"
            >
              <Row gutter={[16, 16]}>
                {quickActionsTrail.map((props, index) => (
                  <Col xs={24} sm={12} key={index}>
                    <animated.div style={props}>
                      <Card
                        hoverable
                        size="small"
                        style={{
                          borderLeft: `4px solid ${quickActions[index].color}`,
                          cursor: 'pointer',
                        }}
                        onClick={() => handleQuickAction(quickActions[index].action)}
                        bodyStyle={{ padding: '16px' }}
                      >
                        <Space>
                          <Avatar
                            style={{ 
                              backgroundColor: quickActions[index].color + '15',
                              color: quickActions[index].color 
                            }}
                            icon={quickActions[index].icon}
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {quickActions[index].title}
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {quickActions[index].description}
                            </Text>
                          </div>
                        </Space>
                      </Card>
                    </animated.div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* Recent Activity */}
          <Col xs={24} lg={12}>
            <animated.div style={recentImagesAnimation}>
              <Card
                title={
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>Criações Recentes</span>
                  </Space>
                }
                extra={
                  <Button type="link" onClick={() => onNavigate?.('/history')}>
                    Ver todas
                  </Button>
                }
                bordered={false}
                className="shadow-sm"
              >
                {loading ? (
                  <Skeleton active />
                ) : (
                  <List
                    dataSource={mockRecentImages}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Tooltip title="Visualizar" key="view">
                            <Button type="text" icon={<EyeOutlined />} size="small" />
                          </Tooltip>,
                          <Tooltip title="Compartilhar" key="share">
                            <Button type="text" icon={<ShareAltOutlined />} size="small" />
                          </Tooltip>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            <Image
                              src={item.url}
                              alt={item.prompt}
                              width={50}
                              height={50}
                              style={{ borderRadius: 8 }}
                              preview={false}
                            />
                          }
                          title={
                            <Space>
                              <Text ellipsis style={{ maxWidth: 200 }}>
                                {item.prompt}
                              </Text>
                              <Tag color="blue" size="small">
                                {item.provider}
                              </Tag>
                            </Space>
                          }
                          description={
                            <Space split={<Divider type="vertical" />}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.createdAt}
                              </Text>
                              <Space>
                                <HeartOutlined style={{ color: '#eb2f96' }} />
                                <Text style={{ fontSize: 12 }}>{item.likes}</Text>
                              </Space>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            </animated.div>
          </Col>

          {/* Activity Timeline */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#1890ff' }} />
                  <span>Atividade Recente</span>
                </Space>
              }
              bordered={false}
              className="shadow-sm"
              size="small"
            >
              <Timeline
                size="small"
                items={[
                  {
                    dot: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                    children: (
                      <div>
                        <Text strong>Imagem gerada</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Cyberpunk cityscape • há 2h
                        </Text>
                      </div>
                    ),
                  },
                  {
                    dot: <HeartOutlined style={{ color: '#eb2f96' }} />,
                    children: (
                      <div>
                        <Text strong>Adicionado aos favoritos</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Fantasy dragon • há 5h
                        </Text>
                      </div>
                    ),
                  },
                  {
                    dot: <ShareAltOutlined style={{ color: '#13c2c2' }} />,
                    children: (
                      <div>
                        <Text strong>Imagem compartilhada</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Abstract art • há 1d
                        </Text>
                      </div>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          {/* Tips & Tricks */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#faad14' }} />
                  <span>Dicas para Melhores Resultados</span>
                </Space>
              }
              bordered={false}
              className="shadow-sm"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Card size="small" style={{ background: '#f6ffed' }}>
                    <Space direction="vertical" size="small">
                      <Text strong style={{ color: '#52c41a' }}>
                        🎯 Seja Específico
                      </Text>
                      <Text style={{ fontSize: 13 }}>
                        Inclua detalhes como estilo, iluminação, cores e composição para resultados mais precisos.
                      </Text>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small" style={{ background: '#fff7e6' }}>
                    <Space direction="vertical" size="small">
                      <Text strong style={{ color: '#fa8c16' }}>
                        ⚡ Use Palavras-Chave
                      </Text>
                      <Text style={{ fontSize: 13 }}>
                        Termos como "alta qualidade", "8K", "arte digital" melhoram a qualidade da imagem.
                      </Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </animated.div>
  )
}

export default AntDashboard