/**
 * Gemini 2.5 Flash Image Generation Examples
 * 
 * This file demonstrates how to use the updated GeminiProvider with
 * actual Gemini 2.5 Flash Image generation capabilities.
 * 
 * Based on the official Gemini documentation:
 * https://ai.google.dev/gemini-api/docs/image-generation
 */

import { GeminiProvider } from '../lib/providers/gemini'
import { GenerationOptions } from '../lib/providers/types'

// Initialize the provider with your API key
const geminiProvider = new GeminiProvider(process.env.GEMINI_API_KEY!)

/**
 * Example 1: Basic Text-to-Image Generation
 * Generates images from simple text prompts
 */
export async function basicTextToImage() {
  const options: GenerationOptions = {
    prompt: "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme",
    style: "photorealistic",
    quality: "hd"
  }

  const result = await geminiProvider.generateImage(options)
  
  if (result.success && result.imageUrl) {
    console.log('Image generated successfully!')
    console.log('Image URL (data URL):', result.imageUrl.substring(0, 50) + '...')
    console.log('Generation time:', result.metadata?.generationTime + 'ms')
    console.log('Estimated cost:', result.metadata?.cost + ' credits')
    
    // You can save the base64 data or display the image
    if (result.imageData) {
      // Save to file or use in your application
      console.log('Raw image data available for processing')
    }
  } else {
    console.error('Image generation failed:', result.error)
  }
}

/**
 * Example 2: Photorealistic Scene Generation
 * Using detailed prompts for realistic imagery
 */
export async function generatePhotorealisticScene() {
  const options: GenerationOptions = {
    prompt: `A photorealistic close-up portrait of an elderly Japanese ceramicist with 
    deep, sun-etched wrinkles and a warm, knowing smile. He is carefully inspecting a 
    freshly glazed tea bowl. The setting is his rustic, sun-drenched workshop with 
    pottery wheels and shelves of clay pots in the background. The scene is illuminated 
    by soft, golden hour light streaming through a window, highlighting the fine texture 
    of the clay and the fabric of his apron. Captured with an 85mm portrait lens, 
    resulting in a soft, blurred background (bokeh). The overall mood is serene and masterful.`,
    style: "photorealistic",
    negativePrompt: "cartoon, drawing, low quality, blurry"
  }

  const result = await geminiProvider.generateImage(options)
  return result
}

/**
 * Example 3: Kawaii-Style Sticker Generation
 * Creating stylized illustrations with clean backgrounds
 */
export async function generateKawaiiSticker() {
  const options: GenerationOptions = {
    prompt: `A kawaii-style sticker of a happy red panda wearing a tiny bamboo hat. 
    It's munching on a green bamboo leaf. The design features bold, clean outlines, 
    simple cel-shading, and a vibrant color palette. The background must be white.`,
    style: "kawaii-style"
  }

  const result = await geminiProvider.generateImage(options)
  return result
}

/**
 * Example 4: Logo with Text Generation
 * Demonstrating Gemini's text rendering capabilities
 */
export async function generateLogoWithText() {
  const options: GenerationOptions = {
    prompt: `Create a modern, minimalist logo for a coffee shop called 'The Daily Grind'. 
    The text should be in a clean, bold, sans-serif font. The design should feature a 
    simple, stylized icon of a coffee bean seamlessly integrated with the text. 
    The color scheme is black and white.`,
    style: "minimalist"
  }

  const result = await geminiProvider.generateImage(options)
  return result
}

/**
 * Example 5: Product Mockup Generation
 * Creating professional product photography
 */
export async function generateProductMockup() {
  const options: GenerationOptions = {
    prompt: `A high-resolution, studio-lit product photograph of a minimalist ceramic 
    coffee mug in matte black, presented on a polished concrete surface. The lighting 
    is a three-point softbox setup designed to create soft, diffused highlights and 
    eliminate harsh shadows. The camera angle is a slightly elevated 45-degree shot to 
    showcase its clean lines. Ultra-realistic, with sharp focus on the steam rising 
    from the coffee. Square image.`,
    style: "studio-lit",
    aspectRatio: "1:1"
  }

  const result = await geminiProvider.generateImage(options)
  return result
}

/**
 * Example 6: Image Editing with Existing Images
 * Edit an existing image with text prompts
 */
export async function editExistingImage(inputImageBase64: string) {
  const prompt = `Using the provided image of my cat, please add a small, knitted wizard hat 
  on its head. Make it look like it's sitting comfortably and matches the soft lighting of the photo.`

  const result = await geminiProvider.editImage(prompt, inputImageBase64)
  return result
}

/**
 * Example 7: Conversational Multi-Turn Image Editing
 * Demonstrate the conversational editing capabilities
 */
export async function conversationalImageEditing() {
  // Start with an initial image generation
  const initialResult = await geminiProvider.generateImage({
    prompt: "A photorealistic image of a blue sports car in a parking lot during golden hour"
  })

  if (!initialResult.success || !initialResult.imageData) {
    throw new Error('Failed to generate initial image')
  }

  // Now have a conversation to edit the image
  const conversation = [
    { type: 'image' as const, content: '', imageData: initialResult.imageData },
    { type: 'text' as const, content: 'Turn this car into a convertible' },
  ]

  const editResult1 = await geminiProvider.conversationalEdit(conversation)
  
  if (editResult1.success && editResult1.imageData) {
    // Continue the conversation
    const continuedConversation = [
      ...conversation,
      { type: 'image' as const, content: '', imageData: editResult1.imageData },
      { type: 'text' as const, content: 'Now change the color to yellow and add racing stripes' }
    ]

    const editResult2 = await geminiProvider.conversationalEdit(continuedConversation)
    return editResult2
  }

  return editResult1
}

/**
 * Example 8: Style Transfer
 * Transform an image into a different artistic style
 */
export async function styleTransferExample(originalImageBase64: string) {
  const prompt = `Transform the provided photograph of a modern city street at night into 
  the artistic style of Vincent van Gogh's 'Starry Night'. Preserve the original composition 
  of buildings and cars, but render all elements with swirling, impasto brushstrokes and a 
  dramatic palette of deep blues and bright yellows.`

  const result = await geminiProvider.editImage(prompt, originalImageBase64)
  return result
}

/**
 * Example 9: Batch Generation with Different Styles
 * Generate multiple variations of the same prompt
 */
export async function batchGenerationExample() {
  const basePrompt = "A serene mountain lake at sunset with snow-capped peaks reflected in the water"
  
  const styles = ['photorealistic', 'impressionism', 'minimalist', 'artistic']
  const results = []

  for (const style of styles) {
    const result = await geminiProvider.generateImage({
      prompt: basePrompt,
      style: style
    })
    
    results.push({
      style,
      result,
      success: result.success
    })

    // Add a small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return results
}

/**
 * Example 10: Cost Estimation
 * Estimate costs before generation
 */
export async function costEstimationExample() {
  const options: GenerationOptions = {
    prompt: "A detailed architectural visualization of a futuristic city skyline",
    style: "photorealistic",
    quality: "hd"
  }

  // Estimate cost before generation
  const costEstimate = geminiProvider.estimateCost(options)
  
  console.log('Cost Estimation:')
  console.log(`- Credits: ${costEstimate.credits}`)
  console.log(`- USD Cost: $${costEstimate.usdCost.toFixed(4)}`)
  console.log(`- Description: ${costEstimate.description}`)

  // Proceed with generation if cost is acceptable
  if (costEstimate.credits <= 10) { // Example: only proceed if cost is <= 10 credits
    const result = await geminiProvider.generateImage(options)
    return result
  } else {
    console.log('Cost too high, skipping generation')
    return null
  }
}

/**
 * Usage Example: Run all examples
 */
export async function runAllExamples() {
  try {
    console.log('🎨 Running Gemini 2.5 Flash Image Generation Examples...\n')

    // Example 1: Basic generation
    console.log('1. Basic Text-to-Image Generation:')
    await basicTextToImage()
    console.log()

    // Example 2: Photorealistic scene
    console.log('2. Photorealistic Scene:')
    const photoResult = await generatePhotorealisticScene()
    console.log('Success:', photoResult.success)
    console.log()

    // Example 3: Kawaii sticker
    console.log('3. Kawaii Sticker:')
    const stickerResult = await generateKawaiiSticker()
    console.log('Success:', stickerResult.success)
    console.log()

    // Example 4: Logo with text
    console.log('4. Logo Generation:')
    const logoResult = await generateLogoWithText()
    console.log('Success:', logoResult.success)
    console.log()

    // Example 5: Product mockup
    console.log('5. Product Mockup:')
    const mockupResult = await generateProductMockup()
    console.log('Success:', mockupResult.success)
    console.log()

    // Example 9: Batch generation
    console.log('9. Batch Generation:')
    const batchResults = await batchGenerationExample()
    console.log('Results:', batchResults.map(r => ({ style: r.style, success: r.success })))
    console.log()

    // Example 10: Cost estimation
    console.log('10. Cost Estimation:')
    await costEstimationExample()

    console.log('\n✅ All examples completed!')

  } catch (error) {
    console.error('❌ Error running examples:', error)
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples()
}