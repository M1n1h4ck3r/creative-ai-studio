import ImageHistory from '@/components/ImageHistory'

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Histórico de Imagens</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e gerencie suas imagens geradas
        </p>
      </div>
      
      <ImageHistory />
    </div>
  )
}