'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Edit, 
  Download, 
  Upload, 
  Undo, 
  Redo, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical,
  Crop,
  Paintbrush,
  Eraser,
  Move,
  ZoomIn,
  ZoomOut,
  Palette,
  Sparkles,
  Copy,
  Wand2,
  Image as ImageIcon,
  Layers
} from 'lucide-react'
import { toast } from 'sonner'

interface ImageEditorProps {
  initialImage?: string
  onSave?: (editedImage: string) => void
  onGenerate?: (prompt: string, options: any) => Promise<string>
  className?: string
}

interface EditAction {
  id: string
  type: 'crop' | 'resize' | 'rotate' | 'flip' | 'filter' | 'variation'
  data: any
  timestamp: number
}

interface VariationOptions {
  prompt: string
  strength: number
  guidance: number
  steps: number
  style?: string
}

interface FilterOptions {
  brightness: number
  contrast: number
  saturation: number
  hue: number
  blur: number
  sharpen: number
}

export default function ImageEditor({ initialImage, onSave, onGenerate, className }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage || null)
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [editHistory, setEditHistory] = useState<EditAction[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Basic editing states
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [isCropping, setIsCropping] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  
  // Filter states
  const [filters, setFilters] = useState<FilterOptions>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sharpen: 0
  })
  
  // Variation states
  const [variationOptions, setVariationOptions] = useState<VariationOptions>({
    prompt: '',
    strength: 0.7,
    guidance: 7.5,
    steps: 20,
    style: undefined
  })
  
  // AI Enhancement states
  const [enhancementPrompt, setEnhancementPrompt] = useState('')
  const [maskMode, setMaskMode] = useState(false)
  const [maskAreas, setMaskAreas] = useState<Array<{ x: number; y: number; radius: number }>>([])

  useEffect(() => {
    if (currentImage && canvasRef.current) {
      loadImageToCanvas(currentImage)
    }
  }, [currentImage])

  const loadImageToCanvas = (imageSrc: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      if (!originalImage) {
        setOriginalImage(imageSrc)
      }
    }
    img.src = imageSrc
  }

  const applyFilters = () => {
    const canvas = canvasRef.current
    if (!canvas || !originalImage) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Apply filters using CSS filter property
      ctx.filter = `
        brightness(${filters.brightness}%) 
        contrast(${filters.contrast}%) 
        saturate(${filters.saturation}%) 
        hue-rotate(${filters.hue}deg) 
        blur(${filters.blur}px)
      `
      
      ctx.drawImage(img, 0, 0)
      ctx.filter = 'none'
    }
    img.src = originalImage
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setCurrentImage(result)
      setOriginalImage(result)
      setEditHistory([])
      setCurrentHistoryIndex(-1)
    }
    reader.readAsDataURL(file)
  }

  const saveEdit = (action: EditAction) => {
    const newHistory = editHistory.slice(0, currentHistoryIndex + 1)
    newHistory.push(action)
    setEditHistory(newHistory)
    setCurrentHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1)
      // Apply edits up to new index
      reapplyEdits(currentHistoryIndex - 1)
    } else if (currentHistoryIndex === 0) {
      setCurrentHistoryIndex(-1)
      if (originalImage) {
        loadImageToCanvas(originalImage)
      }
    }
  }

  const redo = () => {
    if (currentHistoryIndex < editHistory.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1)
      reapplyEdits(currentHistoryIndex + 1)
    }
  }

  const reapplyEdits = (upToIndex: number) => {
    if (!originalImage) return
    
    loadImageToCanvas(originalImage)
    
    for (let i = 0; i <= upToIndex; i++) {
      const edit = editHistory[i]
      applyEdit(edit)
    }
  }

  const applyEdit = (edit: EditAction) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    switch (edit.type) {
      case 'rotate':
        rotateCanvas(edit.data.angle)
        break
      case 'flip':
        flipCanvas(edit.data.direction)
        break
      case 'crop':
        cropCanvas(edit.data.area)
        break
      case 'filter':
        applyFilterEdit(edit.data.filters)
        break
    }
  }

  const rotateCanvas = (angle: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    
    if (!tempCtx) return

    if (angle === 90 || angle === 270) {
      tempCanvas.width = canvas.height
      tempCanvas.height = canvas.width
    } else {
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
    }

    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2)
    tempCtx.rotate((angle * Math.PI) / 180)
    tempCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2)

    canvas.width = tempCanvas.width
    canvas.height = tempCanvas.height
    ctx.drawImage(tempCanvas, 0, 0)
  }

  const flipCanvas = (direction: 'horizontal' | 'vertical') => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    ctx.save()
    if (direction === 'horizontal') {
      ctx.scale(-1, 1)
      ctx.translate(-canvas.width, 0)
    } else {
      ctx.scale(1, -1)
      ctx.translate(0, -canvas.height)
    }
    
    ctx.putImageData(imageData, 0, 0)
    ctx.restore()
  }

  const cropCanvas = (area: { x: number; y: number; width: number; height: number }) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(area.x, area.y, area.width, area.height)
    canvas.width = area.width
    canvas.height = area.height
    ctx.putImageData(imageData, 0, 0)
  }

  const applyFilterEdit = (filterOptions: FilterOptions) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.filter = `
      brightness(${filterOptions.brightness}%) 
      contrast(${filterOptions.contrast}%) 
      saturate(${filterOptions.saturation}%) 
      hue-rotate(${filterOptions.hue}deg) 
      blur(${filterOptions.blur}px)
    `
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    ctx.putImageData(imageData, 0, 0)
    ctx.filter = 'none'
  }

  const handleRotate = (angle: number) => {
    rotateCanvas(angle)
    saveEdit({
      id: Date.now().toString(),
      type: 'rotate',
      data: { angle },
      timestamp: Date.now()
    })
  }

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    flipCanvas(direction)
    saveEdit({
      id: Date.now().toString(),
      type: 'flip',
      data: { direction },
      timestamp: Date.now()
    })
  }

  const handleApplyFilters = () => {
    applyFilters()
    saveEdit({
      id: Date.now().toString(),
      type: 'filter',
      data: { filters: { ...filters } },
      timestamp: Date.now()
    })
    toast.success('Filters applied')
  }

  const generateVariation = async () => {
    if (!currentImage || !onGenerate) {
      toast.error('No image loaded or generation function not provided')
      return
    }

    if (!variationOptions.prompt.trim()) {
      toast.error('Please enter a prompt for the variation')
      return
    }

    setIsLoading(true)
    try {
      const newImage = await onGenerate(variationOptions.prompt, {
        strength: variationOptions.strength,
        guidance: variationOptions.guidance,
        steps: variationOptions.steps,
        style: variationOptions.style,
        init_image: currentImage
      })

      setCurrentImage(newImage)
      toast.success('Variation generated successfully')
    } catch (error) {
      console.error('Variation generation failed:', error)
      toast.error('Failed to generate variation')
    } finally {
      setIsLoading(false)
    }
  }

  const enhanceWithAI = async () => {
    if (!currentImage || !onGenerate) {
      toast.error('No image loaded or generation function not provided')
      return
    }

    if (!enhancementPrompt.trim()) {
      toast.error('Please enter enhancement instructions')
      return
    }

    setIsLoading(true)
    try {
      const enhancedImage = await onGenerate(enhancementPrompt, {
        strength: 0.5,
        guidance: 7.5,
        steps: 20,
        init_image: currentImage,
        mask_image: maskAreas.length > 0 ? generateMaskFromAreas() : undefined
      })

      setCurrentImage(enhancedImage)
      toast.success('Image enhanced successfully')
    } catch (error) {
      console.error('AI enhancement failed:', error)
      toast.error('Failed to enhance image')
    } finally {
      setIsLoading(false)
    }
  }

  const generateMaskFromAreas = (): string => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx || !canvasRef.current) return ''

    canvas.width = canvasRef.current.width
    canvas.height = canvasRef.current.height

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = 'white'
    maskAreas.forEach(area => {
      ctx.beginPath()
      ctx.arc(area.x, area.y, area.radius, 0, 2 * Math.PI)
      ctx.fill()
    })

    return canvas.toDataURL()
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `edited-image-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
    toast.success('Image downloaded')
  }

  const saveImage = () => {
    const canvas = canvasRef.current
    if (!canvas || !onSave) return

    const imageData = canvas.toDataURL()
    onSave(imageData)
    toast.success('Image saved')
  }

  const resetToOriginal = () => {
    if (originalImage) {
      setCurrentImage(originalImage)
      setEditHistory([])
      setCurrentHistoryIndex(-1)
      setFilters({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        blur: 0,
        sharpen: 0
      })
      toast.success('Reset to original')
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Edit className="h-5 w-5" />
          <span>Image Editor</span>
        </CardTitle>
        <CardDescription>
          Edit, enhance, and create variations of your images
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload */}
        {!currentImage && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload an image to edit</p>
                <p className="text-sm text-muted-foreground">PNG, JPG, WebP up to 10MB</p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Choose Image
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Main Editor */}
        {currentImage && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={currentHistoryIndex < 0}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={currentHistoryIndex >= editHistory.length - 1}
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  New Image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetToOriginal}
                >
                  Reset
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  History: {currentHistoryIndex + 1}/{editHistory.length}
                </Badge>
                <Button onClick={downloadImage}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                {onSave && (
                  <Button onClick={saveImage}>
                    Save
                  </Button>
                )}
              </div>
            </div>

            {/* Canvas */}
            <div className="border rounded-lg p-4 bg-muted/10 flex justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-96 border rounded"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Editing Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="variations">Variations</TabsTrigger>
                <TabsTrigger value="ai">AI Enhance</TabsTrigger>
              </TabsList>

              {/* Basic Editing */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Transform</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotate(90)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFlip('horizontal')}
                      >
                        <FlipHorizontal className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFlip('vertical')}
                      >
                        <FlipVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tools</Label>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCropping(!isCropping)}
                        className={isCropping ? 'bg-primary text-primary-foreground' : ''}
                      >
                        <Crop className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(Math.max(0.1, scale - 0.1))}
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setScale(Math.min(3, scale + 0.1))}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Filters */}
              <TabsContent value="filters" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Brightness: {filters.brightness}%</Label>
                    <Slider
                      value={[filters.brightness]}
                      onValueChange={(value) => setFilters({ ...filters, brightness: value[0] })}
                      max={200}
                      min={0}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contrast: {filters.contrast}%</Label>
                    <Slider
                      value={[filters.contrast]}
                      onValueChange={(value) => setFilters({ ...filters, contrast: value[0] })}
                      max={200}
                      min={0}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Saturation: {filters.saturation}%</Label>
                    <Slider
                      value={[filters.saturation]}
                      onValueChange={(value) => setFilters({ ...filters, saturation: value[0] })}
                      max={200}
                      min={0}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hue: {filters.hue}°</Label>
                    <Slider
                      value={[filters.hue]}
                      onValueChange={(value) => setFilters({ ...filters, hue: value[0] })}
                      max={360}
                      min={-360}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Blur: {filters.blur}px</Label>
                    <Slider
                      value={[filters.blur]}
                      onValueChange={(value) => setFilters({ ...filters, blur: value[0] })}
                      max={10}
                      min={0}
                      step={0.1}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({
                      brightness: 100,
                      contrast: 100,
                      saturation: 100,
                      hue: 0,
                      blur: 0,
                      sharpen: 0
                    })}
                  >
                    Reset Filters
                  </Button>
                  <Button onClick={handleApplyFilters}>
                    <Palette className="mr-2 h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </TabsContent>

              {/* Variations */}
              <TabsContent value="variations" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Variation Prompt</Label>
                    <Textarea
                      placeholder="Describe how you want to modify the image..."
                      value={variationOptions.prompt}
                      onChange={(e) => setVariationOptions({ ...variationOptions, prompt: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Strength: {variationOptions.strength}</Label>
                      <Slider
                        value={[variationOptions.strength]}
                        onValueChange={(value) => setVariationOptions({ ...variationOptions, strength: value[0] })}
                        max={1}
                        min={0.1}
                        step={0.05}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Guidance: {variationOptions.guidance}</Label>
                      <Slider
                        value={[variationOptions.guidance]}
                        onValueChange={(value) => setVariationOptions({ ...variationOptions, guidance: value[0] })}
                        max={20}
                        min={1}
                        step={0.5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Steps: {variationOptions.steps}</Label>
                      <Slider
                        value={[variationOptions.steps]}
                        onValueChange={(value) => setVariationOptions({ ...variationOptions, steps: value[0] })}
                        max={50}
                        min={10}
                        step={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Style</Label>
                      <Select
                        value={variationOptions.style}
                        onValueChange={(value) => setVariationOptions({ ...variationOptions, style: value === 'none' ? undefined : value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Style</SelectItem>
                          <SelectItem value="photographic">Photographic</SelectItem>
                          <SelectItem value="artistic">Artistic</SelectItem>
                          <SelectItem value="cinematic">Cinematic</SelectItem>
                          <SelectItem value="anime">Anime</SelectItem>
                          <SelectItem value="digital-art">Digital Art</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={generateVariation} 
                    disabled={isLoading || !onGenerate}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Generating Variation...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Variation
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* AI Enhancement */}
              <TabsContent value="ai" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Mask Mode</Label>
                    <Switch
                      checked={maskMode}
                      onCheckedChange={setMaskMode}
                    />
                  </div>

                  {maskMode && (
                    <div className="p-4 border rounded-lg bg-muted/10">
                      <p className="text-sm text-muted-foreground mb-2">
                        Click on the canvas to add mask areas for targeted editing
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMaskAreas([])}
                        >
                          Clear Mask
                        </Button>
                        <Badge variant="outline">
                          Areas: {maskAreas.length}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Enhancement Instructions</Label>
                    <Textarea
                      placeholder="Describe what you want to enhance or change in the image..."
                      value={enhancementPrompt}
                      onChange={(e) => setEnhancementPrompt(e.target.value)}
                    />
                  </div>

                  <Button 
                    onClick={enhanceWithAI} 
                    disabled={isLoading || !onGenerate}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Enhance with AI
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}