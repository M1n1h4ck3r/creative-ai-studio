import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import ApiKeyConfig from '@/components/ApiKeyConfig'

export default function SettingsPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className='text-3xl font-bold'>Configurações</h1>
        </div>
        <p className='text-muted-foreground'>
          Configure suas API keys e preferências
        </p>
      </div>
      
      <div className='flex justify-center'>
        <ApiKeyConfig />
      </div>
    </div>
  )
}