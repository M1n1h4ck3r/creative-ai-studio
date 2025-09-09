'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Share2, 
  Twitter, 
  Instagram, 
  Facebook, 
  Linkedin, 
  Copy, 
  Download,
  Mail,
  MessageCircle,
  Link2,
  QrCode,
  Palette,
  Sparkles,
  Camera
} from 'lucide-react'
import Image from 'next/image'
import { analytics } from '@/lib/analytics'

interface SocialShareProps {
  image: {
    url: string
    prompt: string
    provider: string
    metadata?: any
  }
}

interface ShareOptions {
  includePrompt: boolean
  includeProvider: boolean
  includeWatermark: boolean
  customMessage: string
  hashtags: string
}

const socialPlatforms = [
  {
    name: 'Twitter/X',
    icon: Twitter,
    color: 'bg-black',
    maxLength: 280,
    generateUrl: (imageUrl: string, text: string) => 
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(imageUrl)}`
  },
  {
    name: 'Facebook',
    icon: Facebook,
    color: 'bg-blue-600',
    maxLength: 63206,
    generateUrl: (imageUrl: string, text: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}&quote=${encodeURIComponent(text)}`
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'bg-blue-700',
    maxLength: 3000,
    generateUrl: (imageUrl: string, text: string) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(imageUrl)}&summary=${encodeURIComponent(text)}`
  },
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    color: 'bg-green-600',
    maxLength: 4096,
    generateUrl: (imageUrl: string, text: string) => 
      `https://wa.me/?text=${encodeURIComponent(text + ' ' + imageUrl)}`
  },
  {
    name: 'Email',
    icon: Mail,
    color: 'bg-gray-600',
    maxLength: 1000,
    generateUrl: (imageUrl: string, text: string) => 
      `mailto:?subject=${encodeURIComponent('Confira esta imagem criada com IA')}&body=${encodeURIComponent(text + '\n\n' + imageUrl)}`
  }
]

const suggestedHashtags = [
  '#AIArt', '#GenerativeAI', '#DigitalArt', '#CreativeAI', '#ArtificialIntelligence',
  '#MachineLearning', '#CreativeStudio', '#AIGenerated', '#DigitalCreative', '#TechArt'
]

export const SocialShare = ({ image }: SocialShareProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ShareOptions>({
    includePrompt: true,
    includeProvider: true,
    includeWatermark: true,
    customMessage: '',
    hashtags: '#AIArt #GenerativeAI #DigitalArt'
  })
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>(['#AIArt', '#GenerativeAI', '#DigitalArt'])

  const generateShareText = (platform?: string, maxLength?: number) => {
    let text = ''
    
    // Custom message
    if (options.customMessage.trim()) {
      text += options.customMessage.trim() + '\n\n'
    } else {
      text += '🎨 Confira esta imagem criada com Inteligência Artificial!\n\n'
    }
    
    // Prompt
    if (options.includePrompt && image.prompt) {
      const promptText = image.prompt.length > 100 ? 
        image.prompt.substring(0, 97) + '...' : 
        image.prompt
      text += `💡 Prompt: "${promptText}"\n`
    }
    
    // Provider
    if (options.includeProvider) {
      text += `🤖 Criado com: ${image.provider.charAt(0).toUpperCase() + image.provider.slice(1)}\n`
    }
    
    // Hashtags
    if (selectedHashtags.length > 0) {
      text += '\n' + selectedHashtags.join(' ')
    }
    
    // Watermark/Attribution
    if (options.includeWatermark) {
      text += '\n\nCriado no Creative AI Studio 🚀'
    }
    
    // Truncate if needed
    if (maxLength && text.length > maxLength) {
      text = text.substring(0, maxLength - 3) + '...'
    }
    
    return text.trim()
  }

  const shareToSocial = (platform: typeof socialPlatforms[0]) => {
    const shareText = generateShareText(platform.name, platform.maxLength)
    const shareUrl = platform.generateUrl(image.url, shareText)
    
    window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    
    analytics.user.featureUsed('social_share', {
      platform: platform.name,
      provider: image.provider,
      include_prompt: options.includePrompt,
      include_provider: options.includeProvider
    })
    
    toast.success(`Compartilhando no ${platform.name}`)
  }

  const copyShareText = () => {
    const shareText = generateShareText()
    navigator.clipboard.writeText(shareText + '\n\n' + image.url)
    toast.success('Texto copiado para área de transferência!')
    
    analytics.user.featureUsed('share_text_copied', {
      provider: image.provider
    })
  }

  const copyImageUrl = () => {
    navigator.clipboard.writeText(image.url)
    toast.success('URL da imagem copiada!')
  }

  const downloadForSharing = async (format: 'original' | 'instagram' | 'story' | 'twitter') => {
    try {
      // For now, just download the original image
      // In a real implementation, you might resize/crop for different formats
      
      if (image.url.startsWith('data:')) {
        const a = document.createElement('a')
        a.href = image.url
        a.download = `creative-ai-${format}-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        const response = await fetch(image.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = url
        a.download = `creative-ai-${format}-${Date.now()}.png`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }

      analytics.user.imageDownloaded(`share_${format}`)
      toast.success(`Imagem baixada para ${format}!`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Erro ao fazer download')
    }
  }

  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag) 
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    )
  }

  const shareText = generateShareText()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share2 className="w-5 h-5 mr-2" />
            Compartilhar Imagem
          </DialogTitle>
          <DialogDescription>
            Compartilhe sua criação nas redes sociais ou copie o link
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <Image
                    src={image.url}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Palette className="w-3 h-3 mr-1" />
                      {image.provider}
                    </Badge>
                    <Badge variant="outline">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {image.prompt}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Opções de Compartilhamento</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="includePrompt">Incluir prompt</Label>
                <Switch
                  id="includePrompt"
                  checked={options.includePrompt}
                  onCheckedChange={(checked) => setOptions({...options, includePrompt: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="includeProvider">Incluir provedor</Label>
                <Switch
                  id="includeProvider"
                  checked={options.includeProvider}
                  onCheckedChange={(checked) => setOptions({...options, includeProvider: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="includeWatermark">Incluir marca d'água</Label>
                <Switch
                  id="includeWatermark"
                  checked={options.includeWatermark}
                  onCheckedChange={(checked) => setOptions({...options, includeWatermark: checked})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customMessage">Mensagem Personalizada</Label>
              <Textarea
                id="customMessage"
                placeholder="Adicione uma mensagem personalizada..."
                value={options.customMessage}
                onChange={(e) => setOptions({...options, customMessage: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Hashtags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestedHashtags.map(hashtag => (
                  <Badge
                    key={hashtag}
                    variant={selectedHashtags.includes(hashtag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleHashtag(hashtag)}
                  >
                    {hashtag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Text */}
          <div>
            <Label>Pré-visualização do Texto</Label>
            <div className="mt-2 p-3 bg-muted rounded-lg text-sm">
              <pre className="whitespace-pre-wrap font-sans">{shareText}</pre>
            </div>
          </div>

          {/* Social Platforms */}
          <div>
            <Label>Compartilhar em</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {socialPlatforms.map(platform => (
                <Button
                  key={platform.name}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center gap-2"
                  onClick={() => shareToSocial(platform)}
                >
                  <div className={`w-8 h-8 rounded-full ${platform.color} flex items-center justify-center text-white`}>
                    <platform.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs">{platform.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={copyShareText}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Texto
            </Button>
            <Button variant="outline" onClick={copyImageUrl}>
              <Link2 className="w-4 h-4 mr-2" />
              Copiar URL
            </Button>
          </div>

          {/* Download for Different Formats */}
          <div>
            <Label>Download Otimizado</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadForSharing('original')}
              >
                <Download className="w-3 h-3 mr-1" />
                Original
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadForSharing('instagram')}
              >
                <Camera className="w-3 h-3 mr-1" />
                Instagram
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadForSharing('story')}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Stories
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadForSharing('twitter')}
              >
                <Twitter className="w-3 h-3 mr-1" />
                Twitter
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SocialShare