// Multi-format export system for Creative AI Studio
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'

export interface ExportOptions {
  format: ExportFormat
  quality?: 'low' | 'medium' | 'high' | 'original'
  includeMetadata?: boolean
  includePrompts?: boolean
  watermark?: {
    text: string
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity: number
  }
  dimensions?: {
    width: number
    height: number
  }
  compression?: {
    enabled: boolean
    level: number // 0-100
  }
}

export type ExportFormat = 
  | 'png' | 'jpg' | 'webp' | 'svg' | 'pdf' 
  | 'zip' | 'json' | 'csv' | 'xlsx'
  | 'psd' | 'ai' | 'sketch'
  | 'gif' | 'mp4' // For animated exports

export interface ExportableItem {
  id: string
  type: 'image' | 'text' | 'project' | 'template'
  name: string
  url?: string
  data?: string
  metadata: Record<string, any>
  created_at: string
}

export interface ExportResult {
  success: boolean
  filename?: string
  blob?: Blob
  error?: string
  stats?: {
    originalSize: number
    compressedSize: number
    compressionRatio: number
    processingTime: number
  }
}

export class ExportManager {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }

  // Main export method
  async exportItems(items: ExportableItem[], options: ExportOptions): Promise<ExportResult> {
    const startTime = Date.now()

    try {
      switch (options.format) {
        case 'png':
        case 'jpg':
        case 'webp':
          return await this.exportImages(items, options)
        
        case 'pdf':
          return await this.exportPDF(items, options)
        
        case 'zip':
          return await this.exportZip(items, options)
        
        case 'json':
          return await this.exportJSON(items, options)
        
        case 'csv':
          return await this.exportCSV(items, options)
        
        case 'svg':
          return await this.exportSVG(items, options)
        
        case 'gif':
          return await this.exportGIF(items, options)
        
        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
        stats: {
          originalSize: 0,
          compressedSize: 0,
          compressionRatio: 0,
          processingTime: Date.now() - startTime
        }
      }
    }
  }

  // Image export methods
  private async exportImages(items: ExportableItem[], options: ExportOptions): Promise<ExportResult> {
    if (items.length === 1) {
      return await this.exportSingleImage(items[0], options)
    } else {
      return await this.exportMultipleImages(items, options)
    }
  }

  private async exportSingleImage(item: ExportableItem, options: ExportOptions): Promise<ExportResult> {
    try {
      const img = await this.loadImage(item.url || item.data!)
      
      // Set canvas dimensions
      const { width, height } = this.calculateDimensions(img, options.dimensions)
      this.canvas.width = width
      this.canvas.height = height

      // Clear canvas and draw image
      this.ctx.clearRect(0, 0, width, height)
      this.ctx.drawImage(img, 0, 0, width, height)

      // Add watermark if specified
      if (options.watermark) {
        await this.addWatermark(options.watermark)
      }

      // Convert to blob
      const quality = this.getQualityValue(options.quality)
      const mimeType = this.getMimeType(options.format)
      
      return new Promise((resolve) => {
        this.canvas.toBlob((blob) => {
          if (blob) {
            const filename = `${item.name}.${options.format}`
            resolve({
              success: true,
              filename,
              blob,
              stats: {
                originalSize: 0, // Would need original size
                compressedSize: blob.size,
                compressionRatio: 0,
                processingTime: 0
              }
            })
          } else {
            resolve({ success: false, error: 'Failed to create blob' })
          }
        }, mimeType, quality)
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image export failed'
      }
    }
  }

  private async exportMultipleImages(items: ExportableItem[], options: ExportOptions): Promise<ExportResult> {
    const zip = new JSZip()
    const folder = zip.folder('exported-images')

    for (const item of items) {
      try {
        const result = await this.exportSingleImage(item, options)
        if (result.success && result.blob) {
          folder!.file(result.filename!, result.blob)
        }
      } catch (error) {
        console.error(`Failed to export ${item.name}:`, error)
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    
    return {
      success: true,
      filename: `exported-images.zip`,
      blob: zipBlob,
      stats: {
        originalSize: 0,
        compressedSize: zipBlob.size,
        compressionRatio: 0,
        processingTime: 0
      }
    }
  }

  // PDF export
  private async exportPDF(items: ExportableItem[], options: ExportOptions): Promise<ExportResult> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    let pageCount = 0

    for (const item of items) {
      if (pageCount > 0) {
        pdf.addPage()
      }

      if (item.type === 'image' && item.url) {
        try {
          const img = await this.loadImage(item.url)
          
          // Calculate dimensions to fit page
          const pageWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()
          const margin = 20
          
          const maxWidth = pageWidth - (margin * 2)
          const maxHeight = pageHeight - (margin * 2)
          
          const { width, height } = this.calculateDimensions(
            img, 
            { width: maxWidth, height: maxHeight }
          )
          
          // Convert canvas to base64
          this.canvas.width = img.width
          this.canvas.height = img.height
          this.ctx.drawImage(img, 0, 0)
          const imgData = this.canvas.toDataURL('image/jpeg', 0.8)
          
          pdf.addImage(imgData, 'JPEG', margin, margin, width, height)
          
          // Add metadata if requested
          if (options.includeMetadata) {
            pdf.setFontSize(10)
            pdf.text(`Name: ${item.name}`, margin, height + margin + 10)
            pdf.text(`Created: ${new Date(item.created_at).toLocaleString()}`, margin, height + margin + 20)
            
            if (options.includePrompts && item.metadata.prompt) {
              pdf.text(`Prompt: ${item.metadata.prompt}`, margin, height + margin + 30)
            }
          }
        } catch (error) {
          console.error(`Failed to add ${item.name} to PDF:`, error)
        }
      }

      pageCount++
    }

    const pdfBlob = pdf.output('blob')
    
    return {
      success: true,
      filename: 'exported-content.pdf',
      blob: pdfBlob,
      stats: {
        originalSize: 0,
        compressedSize: pdfBlob.size,
        compressionRatio: 0,
        processingTime: 0
      }
    }
  }

  // ZIP export
  private async exportZip(items: ExportableItem[], options: ExportOptions): Promise<ExportResult> {
    const zip = new JSZip()
    
    // Create folder structure
    const imagesFolder = zip.folder('images')
    const dataFolder = zip.folder('data')
    
    // Export images
    for (const item of items.filter(i => i.type === 'image')) {
      try {
        const result = await this.exportSingleImage(item, { ...options, format: 'png' })
        if (result.success && result.blob) {
          imagesFolder!.file(`${item.name}.png`, result.blob)
        }
      } catch (error) {
        console.error(`Failed to add ${item.name} to zip:`, error)
      }
    }
    
    // Export metadata
    if (options.includeMetadata) {
      const metadata = items.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        created_at: item.created_at,
        metadata: item.metadata
      }))
      
      dataFolder!.file('metadata.json', JSON.stringify(metadata, null, 2))
    }
    
    // Export prompts if requested
    if (options.includePrompts) {
      const prompts = items
        .filter(item => item.metadata.prompt)
        .map(item => ({
          name: item.name,
          prompt: item.metadata.prompt,
          negative_prompt: item.metadata.negativePrompt
        }))
      
      dataFolder!.file('prompts.json', JSON.stringify(prompts, null, 2))
    }

    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: options.compression?.level || 6
      }
    })
    
    return {
      success: true,
      filename: 'creative-ai-export.zip',
      blob: zipBlob
    }
  }

  // JSON export
  private async exportJSON(items: ExportableItem[], options: ExportOptions): Promise<ExportResult> {
    const exportData = {
      exported_at: new Date().toISOString(),
      export_options: options,
      items: items.map(item => ({
        ...item,
        // Convert blob URLs to base64 if needed
        data: item.url ? undefined : item.data
      }))
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })

    return {
      success: true,
      filename: 'export-data.json',
      blob
    }
  }

  // CSV export
  private async exportCSV(items: ExportableItem[], options: ExportOptions): Promise<ExportResult> {
    const headers = ['Name', 'Type', 'Created At', 'Prompt', 'Provider', 'Model']
    const rows = items.map(item => [
      item.name,
      item.type,
      item.created_at,
      item.metadata.prompt || '',
      item.metadata.provider || '',
      item.metadata.model || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })

    return {
      success: true,
      filename: 'export-data.csv',
      blob
    }
  }

  // SVG export (for vector graphics)
  private async exportSVG(items: ExportableItem[], options: ExportOptions): Promise<ExportResult> {
    // Create SVG container
    const svgWidth = options.dimensions?.width || 1024
    const svgHeight = options.dimensions?.height || 1024
    
    let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`
    
    // Add background
    svgContent += `<rect width="100%" height="100%" fill="white"/>`
    
    // For now, embed images as base64
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type === 'image' && item.url) {
        try {
          const img = await this.loadImage(item.url)
          this.canvas.width = img.width
          this.canvas.height = img.height
          this.ctx.drawImage(img, 0, 0)
          const dataUrl = this.canvas.toDataURL()
          
          const x = (i % 2) * (svgWidth / 2)
          const y = Math.floor(i / 2) * (svgHeight / 2)
          
          svgContent += `<image x="${x}" y="${y}" width="${svgWidth/2}" height="${svgHeight/2}" href="${dataUrl}"/>`
        } catch (error) {
          console.error(`Failed to add ${item.name} to SVG:`, error)
        }
      }
    }
    
    svgContent += '</svg>'
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    
    return {
      success: true,
      filename: 'export.svg',
      blob
    }
  }

  // GIF export (for animations)
  private async exportGIF(items: ExportableItem[], options: ExportOptions): Promise<ExportResult> {
    // For animated GIFs, we'd need a GIF encoding library
    // This is a placeholder implementation
    throw new Error('GIF export not yet implemented. Consider using a library like gif.js')
  }

  // Utility methods
  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  private calculateDimensions(
    img: HTMLImageElement, 
    target?: { width: number; height: number }
  ): { width: number; height: number } {
    if (!target) {
      return { width: img.width, height: img.height }
    }

    const aspectRatio = img.width / img.height
    
    if (target.width / target.height > aspectRatio) {
      return {
        width: target.height * aspectRatio,
        height: target.height
      }
    } else {
      return {
        width: target.width,
        height: target.width / aspectRatio
      }
    }
  }

  private async addWatermark(watermark: ExportOptions['watermark']): Promise<void> {
    if (!watermark) return

    this.ctx.save()
    this.ctx.globalAlpha = watermark.opacity
    this.ctx.font = '20px Arial'
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.lineWidth = 1

    const textWidth = this.ctx.measureText(watermark.text).width
    const textHeight = 20
    
    let x: number, y: number
    
    switch (watermark.position) {
      case 'top-left':
        x = 10
        y = 30
        break
      case 'top-right':
        x = this.canvas.width - textWidth - 10
        y = 30
        break
      case 'bottom-left':
        x = 10
        y = this.canvas.height - 10
        break
      case 'bottom-right':
        x = this.canvas.width - textWidth - 10
        y = this.canvas.height - 10
        break
      case 'center':
      default:
        x = (this.canvas.width - textWidth) / 2
        y = this.canvas.height / 2
        break
    }

    this.ctx.strokeText(watermark.text, x, y)
    this.ctx.fillText(watermark.text, x, y)
    this.ctx.restore()
  }

  private getQualityValue(quality?: string): number {
    switch (quality) {
      case 'low': return 0.3
      case 'medium': return 0.7
      case 'high': return 0.9
      case 'original': return 1.0
      default: return 0.8
    }
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'png': return 'image/png'
      case 'jpg': return 'image/jpeg'
      case 'webp': return 'image/webp'
      default: return 'image/png'
    }
  }

  // Download helper
  downloadResult(result: ExportResult): void {
    if (result.success && result.blob && result.filename) {
      saveAs(result.blob, result.filename)
    }
  }
}

// Export formats configuration
export const EXPORT_FORMATS = {
  image: [
    { value: 'png', label: 'PNG', description: 'Alta qualidade com transparência' },
    { value: 'jpg', label: 'JPEG', description: 'Compressão otimizada' },
    { value: 'webp', label: 'WebP', description: 'Formato moderno e eficiente' },
    { value: 'svg', label: 'SVG', description: 'Gráfico vetorial escalável' }
  ],
  document: [
    { value: 'pdf', label: 'PDF', description: 'Documento portátil' },
    { value: 'zip', label: 'ZIP', description: 'Arquivo compactado' }
  ],
  data: [
    { value: 'json', label: 'JSON', description: 'Dados estruturados' },
    { value: 'csv', label: 'CSV', description: 'Planilha compatível' }
  ],
  professional: [
    { value: 'psd', label: 'PSD', description: 'Photoshop (em breve)' },
    { value: 'ai', label: 'AI', description: 'Illustrator (em breve)' },
    { value: 'sketch', label: 'Sketch', description: 'Design (em breve)' }
  ]
} as const

// Singleton instance
export const exportManager = new ExportManager()