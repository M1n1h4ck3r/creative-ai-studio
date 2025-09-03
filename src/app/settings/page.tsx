import ApiKeyConfig from '@/components/ApiKeyConfig'

export default function SettingsPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Configurações</h1>
        <p className='text-muted-foreground mt-2'>
          Configure suas API keys e preferências
        </p>
      </div>
      
      <div className='flex justify-center'>
        <ApiKeyConfig />
      </div>
    </div>
  )
}