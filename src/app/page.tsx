import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-primary rounded-lg p-3">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold">Creative AI Studio</h1>
        <p className="text-muted-foreground text-lg">
          Gere criativos incríveis usando inteligência artificial
        </p>
        
        <div className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link href="/auth">Começar Agora</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Versão 0.1 - First Image Generation
        </p>
      </div>
    </div>
  )
}
