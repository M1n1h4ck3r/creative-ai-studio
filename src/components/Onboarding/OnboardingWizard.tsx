'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Sparkles, 
  Settings, 
  Palette, 
  Zap,
  BookOpen,
  Users,
  Rocket
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  skipable?: boolean
}

interface OnboardingWizardProps {
  onComplete: () => void
  onSkip?: () => void
  userType?: 'beginner' | 'intermediate' | 'advanced'
}

export const OnboardingWizard = ({ 
  onComplete, 
  onSkip,
  userType = 'beginner' 
}: OnboardingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  const welcomeSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao Creative AI Studio! 🎨',
      description: 'Sua plataforma completa para criação de imagens com inteligência artificial',
      icon: <Sparkles className="w-8 h-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-lg text-gray-600">
            Transforme suas ideias em imagens incríveis usando o poder da IA. 
            Vamos te guiar pelos primeiros passos!
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Palette className="w-6 h-6 text-blue-600" />
              <div>
                <h4 className="font-semibold">Criação Rápida</h4>
                <p className="text-sm text-gray-600">Gere imagens em segundos</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Zap className="w-6 h-6 text-green-600" />
              <div>
                <h4 className="font-semibold">Múltiplos Provedores</h4>
                <p className="text-sm text-gray-600">OpenAI, Google, e mais</p>
              </div>
            </div>
          </div>
        </div>
      ),
      skipable: true
    },
    {
      id: 'setup-keys',
      title: 'Configure suas API Keys',
      description: 'Adicione suas chaves de API para começar a gerar imagens',
      icon: <Settings className="w-8 h-8 text-orange-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Para usar o Creative AI Studio, você precisa configurar pelo menos uma API key.
          </p>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Google Gemini (Recomendado para iniciantes)
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Gratuito para começar, excelente qualidade
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                OpenAI DALL-E
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Alta qualidade, ideal para uso profissional
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                Replicate & Outros
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Modelos especializados e experimentais
              </p>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Configurar API Keys',
        onClick: () => {
          // Navigate to settings or open API key modal
          window.location.href = '/settings'
        }
      }
    },
    {
      id: 'first-generation',
      title: 'Sua primeira geração',
      description: 'Aprenda como criar sua primeira imagem',
      icon: <Palette className="w-8 h-8 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Criar imagens com IA é simples! Siga estes passos:
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <div>
                <h4 className="font-semibold">Escreva um prompt descritivo</h4>
                <p className="text-sm text-gray-600">Exemplo: "Um gato laranja dormindo em uma cama de flores coloridas"</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <div>
                <h4 className="font-semibold">Escolha o provider</h4>
                <p className="text-sm text-gray-600">Selecione Gemini para começar</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <div>
                <h4 className="font-semibold">Clique em "Gerar Imagem"</h4>
                <p className="text-sm text-gray-600">Aguarde alguns segundos e sua imagem estará pronta!</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      title: 'Explore recursos avançados',
      description: 'Descubra ferramentas que vão acelerar seu workflow',
      icon: <Rocket className="w-8 h-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600 mb-2" />
              <h4 className="font-semibold">Templates</h4>
              <p className="text-sm text-gray-600">Prompts prontos para diferentes estilos</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 mb-2" />
              <h4 className="font-semibold">Geração em Lote</h4>
              <p className="text-sm text-gray-600">Crie múltiplas imagens de uma vez</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <Settings className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-semibold">Configurações Avançadas</h4>
              <p className="text-sm text-gray-600">Ajuste qualidade, estilo e mais</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
              <Zap className="w-6 h-6 text-orange-600 mb-2" />
              <h4 className="font-semibold">API Developer</h4>
              <p className="text-sm text-gray-600">Integre com seus próprios projetos</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'Tudo pronto! 🚀',
      description: 'Você está preparado para criar imagens incríveis',
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-lg text-gray-600">
            Parabéns! Você agora sabe o básico para usar o Creative AI Studio.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900">💡 Dica Pro</h4>
            <p className="text-sm text-blue-800 mt-1">
              Prompts mais detalhados geram resultados melhores. 
              Inclua informações sobre estilo, cores, iluminação e composição!
            </p>
          </div>
          <div className="flex justify-center space-x-4 mt-6">
            <Badge variant="secondary">✨ Primeira geração</Badge>
            <Badge variant="secondary">⚙️ Configurações</Badge>
            <Badge variant="secondary">📚 Recursos</Badge>
          </div>
        </div>
      )
    }
  ]

  const steps = userType === 'advanced' 
    ? welcomeSteps.filter(step => !['welcome', 'first-generation'].includes(step.id))
    : welcomeSteps

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipOnboarding = () => {
    onSkip?.()
  }

  const markStepComplete = () => {
    setCompletedSteps([...completedSteps, currentStepData.id])
    nextStep()
  }

  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {currentStepData.icon}
              <div>
                <CardTitle className="text-xl">{currentStepData.title}</CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
            {currentStepData.skipable && (
              <Button variant="ghost" size="sm" onClick={skipOnboarding}>
                Pular
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Passo {currentStep + 1} de {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStepData.content}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </Button>

            <div className="flex space-x-2">
              {currentStepData.action && (
                <Button
                  variant="outline"
                  onClick={currentStepData.action.onClick}
                >
                  {currentStepData.action.label}
                </Button>
              )}
              
              <Button
                onClick={isLastStep ? onComplete : markStepComplete}
                className="flex items-center space-x-2"
              >
                <span>{isLastStep ? 'Finalizar' : 'Próximo'}</span>
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OnboardingWizard