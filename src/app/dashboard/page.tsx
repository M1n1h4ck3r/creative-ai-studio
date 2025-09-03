import ImageGenerator from '@/components/ImageGenerator'

export default function DashboardPage() {
  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold'>Creative AI Studio</h1>
        <p className='text-muted-foreground mt-2'>
          Gere criativos incríveis usando inteligência artificial
        </p>
      </div>
      
      <ImageGenerator />
    </div>
  )
}