import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, History, Sparkles, Settings } from 'lucide-react'
import ImageGenerator from '@/components/ImageGenerator'

export default function DashboardPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold'>Creative AI Studio</h1>
            <p className='text-muted-foreground mt-2'>
              Gere criativos incríveis usando inteligência artificial
            </p>
          </div>
          <div className='flex space-x-2'>
            <Link href="/history">
              <Button variant="outline">
                <History className="mr-2 h-4 w-4" />
                Histórico
              </Button>
            </Link>
            <Link href="/dashboard/monitoring">
              <Button variant="ghost">
                <Activity className="mr-2 h-4 w-4" />
                Monitor
              </Button>
            </Link>
            <Link href="/test-generate">
              <Button variant="ghost">
                <Sparkles className="mr-2 h-4 w-4" />
                Teste
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost">
                <Settings className="mr-2 h-4 w-4" />
                Config
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <ImageGenerator />
    </div>
  )
}