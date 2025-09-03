/**
 * Feature flags configuration
 * Controls which features are enabled/disabled in the application
 */

interface FeatureFlags {
  // Core features
  isSaasMode: boolean
  enableBilling: boolean
  enableAnalytics: boolean
  enableWhatsApp: boolean
  enableN8N: boolean
  
  // AI Providers
  enableGemini: boolean
  enableOpenAI: boolean
  enableReplicate: boolean
  enableHuggingFace: boolean
  
  // Advanced features
  enableVideoGeneration: boolean
  enableBrandGuidelines: boolean
  enableBatchGeneration: boolean
  enableAssetLibrary: boolean
  enableTemplateMarketplace: boolean
  
  // Development features
  enableDebugMode: boolean
  enablePerformanceMetrics: boolean
  
  // Experimental features
  enableExperimentalFeatures: boolean
  enableBetaFeatures: boolean
}

// Default configuration - Internal use mode initially
export const defaultFeatures: FeatureFlags = {
  // Core features
  isSaasMode: process.env.NEXT_PUBLIC_SAAS_MODE === 'true',
  enableBilling: process.env.NEXT_PUBLIC_ENABLE_BILLING === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableWhatsApp: true, // Always enabled for internal use
  enableN8N: true, // Always enabled for internal use
  
  // AI Providers
  enableGemini: true,
  enableOpenAI: true,
  enableReplicate: false, // Disabled initially
  enableHuggingFace: false, // Disabled initially
  
  // Advanced features
  enableVideoGeneration: false, // Will be enabled in v0.9
  enableBrandGuidelines: false, // Will be enabled in v0.8
  enableBatchGeneration: false, // Will be enabled in v0.6
  enableAssetLibrary: false, // Will be enabled in v0.4
  enableTemplateMarketplace: false, // Will be enabled later
  
  // Development features
  enableDebugMode: process.env.NODE_ENV === 'development',
  enablePerformanceMetrics: process.env.NODE_ENV === 'development',
  
  // Experimental features
  enableExperimentalFeatures: false,
  enableBetaFeatures: false,
}

// Production overrides
export const productionFeatures: Partial<FeatureFlags> = {
  enableDebugMode: false,
  enablePerformanceMetrics: false,
  enableExperimentalFeatures: false,
}

// Get current features based on environment
export const getFeatures = (): FeatureFlags => {
  if (process.env.NODE_ENV === 'production') {
    return { ...defaultFeatures, ...productionFeatures }
  }
  
  return defaultFeatures
}

// Individual feature checkers for better DX
export const features = getFeatures()

// Helper functions
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return features[feature]
}

export const isSaasMode = () => features.isSaasMode
export const isBillingEnabled = () => features.enableBilling
export const isAnalyticsEnabled = () => features.enableAnalytics
export const isDebugMode = () => features.enableDebugMode

// Feature groups
export const aiProviders = {
  gemini: features.enableGemini,
  openai: features.enableOpenAI,
  replicate: features.enableReplicate,
  huggingface: features.enableHuggingFace,
}

export const advancedFeatures = {
  videoGeneration: features.enableVideoGeneration,
  brandGuidelines: features.enableBrandGuidelines,
  batchGeneration: features.enableBatchGeneration,
  assetLibrary: features.enableAssetLibrary,
}

// Version-specific features (for progressive rollout)
export const versionFeatures = {
  v01: ['gemini', 'openai'], // Basic image generation
  v02: ['multiFormat'], // Multi-format support
  v03: ['brandAssets'], // Brand assets
  v04: ['gallery', 'history'], // Gallery & History
  v05: ['smartText'], // Smart text generation
  v06: ['batchGeneration'], // Batch generation
  v07: ['whatsapp'], // WhatsApp integration
  v08: ['brandGuidelines'], // Brand guidelines
  v09: ['videoGeneration'], // Video generation
  v10: ['analytics'], // Full analytics
}

export default features