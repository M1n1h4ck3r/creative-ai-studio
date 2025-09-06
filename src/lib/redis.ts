interface RedisInterface {
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, expireIn?: number) => Promise<void>
  del: (key: string) => Promise<void>
  exists: (key: string) => Promise<boolean>
  incr: (key: string) => Promise<number>
  expire: (key: string, seconds: number) => Promise<void>
}

// Mock Redis implementation for development/testing
class MockRedis implements RedisInterface {
  private store = new Map<string, { value: string; expiry?: number }>()

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key)
      return null
    }
    
    return item.value
  }

  async set(key: string, value: string, expireIn?: number): Promise<void> {
    const expiry = expireIn ? Date.now() + (expireIn * 1000) : undefined
    this.store.set(key, { value, expiry })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    const item = this.store.get(key)
    if (!item) return false
    
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key)
      return false
    }
    
    return true
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key)
    const newValue = (parseInt(current || '0', 10) + 1).toString()
    await this.set(key, newValue)
    return parseInt(newValue, 10)
  }

  async expire(key: string, seconds: number): Promise<void> {
    const item = this.store.get(key)
    if (item) {
      item.expiry = Date.now() + (seconds * 1000)
      this.store.set(key, item)
    }
  }
}

// Create Redis client - in production, this would connect to actual Redis
export const redis: RedisInterface = new MockRedis()

export default redis