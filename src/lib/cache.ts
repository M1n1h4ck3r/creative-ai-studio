// Hybrid caching system - Redis when available, memory cache fallback
import { LRUCache } from 'lru-cache'

// Memory cache as fallback when Redis is not available
const memoryCache = new LRUCache<string, { value: any; expires: number }>({
  max: 500,
  ttl: 1000 * 60 * 15, // 15 minutes default
})

// Redis client (optional, only if available)
let redis: any = null
let redisAvailable = false

// Initialize Redis if available
async function initializeRedis() {
  if (process.env.REDIS_URL && !redis) {
    try {
      const Redis = await import('ioredis')
      redis = new Redis.default(process.env.REDIS_URL, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
      })

      redis.on('error', (error: any) => {
        console.warn('Redis connection error, falling back to memory cache:', error.message)
        redisAvailable = false
      })

      redis.on('connect', () => {
        console.log('✅ Redis connected successfully')
        redisAvailable = true
      })

      // Test connection
      await redis.ping()
      redisAvailable = true
    } catch (error) {
      console.warn('Redis not available, using memory cache:', error)
      redis = null
      redisAvailable = false
    }
  }
}

// Initialize Redis on module load
initializeRedis().catch(() => {
  console.log('🔄 Starting with memory cache only')
})

export const getRedisClient = () => {
  return redisAvailable ? redis : null
}

// Cache interface
export interface CacheOptions {
  ttl?: number // Time to live in seconds (default: 1 hour)
  prefix?: string // Cache key prefix
}

// Default cache settings
const DEFAULT_TTL = 3600 // 1 hour
const DEFAULT_PREFIX = 'creative-ai-studio'

// Generate cache key
export const generateCacheKey = (
  key: string, 
  prefix: string = DEFAULT_PREFIX
): string => {
  return `${prefix}:${key}`
}

// Set cache value (hybrid approach)
export const setCache = async (
  key: string, 
  value: any, 
  options: CacheOptions = {}
): Promise<boolean> => {
  const cacheKey = generateCacheKey(key, options.prefix)
  const ttl = options.ttl || DEFAULT_TTL

  // Try Redis first
  const client = getRedisClient()
  if (client && redisAvailable) {
    try {
      const serializedValue = JSON.stringify(value)
      await client.setex(cacheKey, ttl, serializedValue)
      return true
    } catch (error) {
      console.warn('Redis set failed, falling back to memory cache:', error)
      redisAvailable = false
    }
  }

  // Fallback to memory cache
  try {
    const expires = Date.now() + (ttl * 1000)
    memoryCache.set(cacheKey, { value, expires })
    return true
  } catch (error) {
    console.error('Memory cache set error:', error)
    return false
  }
}

// Get cache value (hybrid approach)
export const getCache = async <T = any>(
  key: string, 
  prefix?: string
): Promise<T | null> => {
  const cacheKey = generateCacheKey(key, prefix)

  // Try Redis first
  const client = getRedisClient()
  if (client && redisAvailable) {
    try {
      const cached = await client.get(cacheKey)
      if (cached) {
        return JSON.parse(cached) as T
      }
    } catch (error) {
      console.warn('Redis get failed, falling back to memory cache:', error)
      redisAvailable = false
    }
  }

  // Fallback to memory cache
  try {
    const cached = memoryCache.get(cacheKey)
    if (!cached) return null
    
    // Check if expired
    if (Date.now() > cached.expires) {
      memoryCache.delete(cacheKey)
      return null
    }
    
    return cached.value as T
  } catch (error) {
    console.error('Memory cache get error:', error)
    return null
  }
}

// Delete cache value
export const deleteCache = async (
  key: string, 
  prefix?: string
): Promise<boolean> => {
  const client = getRedisClient()
  if (!client) return false

  try {
    const cacheKey = generateCacheKey(key, prefix)
    await client.del(cacheKey)
    return true
  } catch (error) {
    console.error('Cache delete error:', error)
    return false
  }
}

// Clear cache by pattern
export const clearCachePattern = async (
  pattern: string, 
  prefix?: string
): Promise<number> => {
  const client = getRedisClient()
  if (!client) return 0

  try {
    const searchPattern = generateCacheKey(pattern, prefix)
    const keys = await client.keys(searchPattern)
    
    if (keys.length === 0) return 0
    
    await client.del(...keys)
    return keys.length
  } catch (error) {
    console.error('Cache clear pattern error:', error)
    return 0
  }
}

// Cache statistics
export const getCacheStats = async (): Promise<{
  connected: boolean
  memory: string | null
  keyspace: Record<string, any> | null
}> => {
  const client = getRedisClient()
  
  if (!client) {
    return { connected: false, memory: null, keyspace: null }
  }

  try {
    const info = await client.info('memory')
    const keyspace = await client.info('keyspace')
    
    return {
      connected: true,
      memory: info,
      keyspace: keyspace
    }
  } catch (error) {
    console.error('Cache stats error:', error)
    return { connected: false, memory: null, keyspace: null }
  }
}

// Higher-level cache functions for specific use cases

// AI Generation Results Cache
export const cacheAIGeneration = async (
  provider: string,
  prompt: string,
  options: any,
  result: any
): Promise<void> => {
  const cacheKey = `ai-generation:${provider}:${Buffer.from(prompt + JSON.stringify(options)).toString('base64')}`
  await setCache(cacheKey, result, { ttl: 86400, prefix: 'ai-results' }) // 24 hours
}

export const getCachedAIGeneration = async (
  provider: string,
  prompt: string,
  options: any
): Promise<any | null> => {
  const cacheKey = `ai-generation:${provider}:${Buffer.from(prompt + JSON.stringify(options)).toString('base64')}`
  return await getCache(cacheKey, 'ai-results')
}

// API Keys Cache
export const cacheApiKey = async (
  userId: string,
  provider: string,
  keyData: any
): Promise<void> => {
  const cacheKey = `api-keys:${userId}:${provider}`
  await setCache(cacheKey, keyData, { ttl: 3600 }) // 1 hour
}

export const getCachedApiKey = async (
  userId: string,
  provider: string
): Promise<any | null> => {
  const cacheKey = `api-keys:${userId}:${provider}`
  return await getCache(cacheKey)
}

// User Session Cache
export const cacheUserSession = async (
  sessionId: string,
  userData: any
): Promise<void> => {
  const cacheKey = `user-session:${sessionId}`
  await setCache(cacheKey, userData, { ttl: 7200 }) // 2 hours
}

export const getCachedUserSession = async (
  sessionId: string
): Promise<any | null> => {
  const cacheKey = `user-session:${sessionId}`
  return await getCache(cacheKey)
}

// Rate Limiting Cache
export const incrementRateLimit = async (
  identifier: string,
  window: number = 3600 // 1 hour in seconds
): Promise<number> => {
  const client = getRedisClient()
  if (!client) return 0

  try {
    const key = generateCacheKey(`rate-limit:${identifier}`)
    const count = await client.incr(key)
    
    if (count === 1) {
      await client.expire(key, window)
    }
    
    return count
  } catch (error) {
    console.error('Rate limit increment error:', error)
    return 0
  }
}

export const getRateLimit = async (identifier: string): Promise<number> => {
  const client = getRedisClient()
  if (!client) return 0

  try {
    const key = generateCacheKey(`rate-limit:${identifier}`)
    const count = await client.get(key)
    return parseInt(count || '0', 10)
  } catch (error) {
    console.error('Rate limit get error:', error)
    return 0
  }
}

// Analytics Event Cache (for batching)
export const cacheAnalyticsEvent = async (
  event: any
): Promise<void> => {
  const client = getRedisClient()
  if (!client) return

  try {
    const key = generateCacheKey('analytics-events')
    await client.lpush(key, JSON.stringify({
      ...event,
      timestamp: new Date().toISOString()
    }))
    
    // Keep only last 1000 events
    await client.ltrim(key, 0, 999)
  } catch (error) {
    console.error('Analytics cache error:', error)
  }
}

export const flushAnalyticsEvents = async (): Promise<any[]> => {
  const client = getRedisClient()
  if (!client) return []

  try {
    const key = generateCacheKey('analytics-events')
    const events = await client.lrange(key, 0, -1)
    
    if (events.length > 0) {
      await client.del(key)
      return events.map(event => JSON.parse(event))
    }
    
    return []
  } catch (error) {
    console.error('Analytics flush error:', error)
    return []
  }
}

// Memory cache fallback for when Redis is unavailable
const memoryCache = new Map<string, { value: any; expires: number }>()

export const setMemoryCache = (
  key: string, 
  value: any, 
  ttlSeconds: number = DEFAULT_TTL
): void => {
  const expires = Date.now() + (ttlSeconds * 1000)
  memoryCache.set(key, { value, expires })
}

export const getMemoryCache = <T = any>(key: string): T | null => {
  const cached = memoryCache.get(key)
  
  if (!cached) return null
  
  if (Date.now() > cached.expires) {
    memoryCache.delete(key)
    return null
  }
  
  return cached.value as T
}

export const deleteMemoryCache = (key: string): void => {
  memoryCache.delete(key)
}

// Cleanup expired memory cache entries
setInterval(() => {
  const now = Date.now()
  for (const [key, cached] of memoryCache.entries()) {
    if (now > cached.expires) {
      memoryCache.delete(key)
    }
  }
}, 60000) // Clean up every minute

export default {
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  clearCachePattern,
  getCacheStats,
  cacheAIGeneration,
  getCachedAIGeneration,
  cacheApiKey,
  getCachedApiKey,
  cacheUserSession,
  getCachedUserSession,
  incrementRateLimit,
  getRateLimit,
  cacheAnalyticsEvent,
  flushAnalyticsEvents,
  setMemoryCache,
  getMemoryCache,
  deleteMemoryCache,
}