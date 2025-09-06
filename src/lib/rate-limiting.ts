'use client'

import { createClient } from '@/lib/supabase'
import { redis } from '@/lib/redis'
import { AuditLogger } from '@/lib/audit'

export interface RateLimitConfig {
  requests_per_minute: number
  requests_per_hour: number
  requests_per_day: number
  burst_limit: number
  concurrent_requests: number
  enabled: boolean
  whitelist_ips: string[]
  blacklist_ips: string[]
}

export interface UserQuota {
  user_id: string
  plan_type: 'free' | 'pro' | 'enterprise' | 'custom'
  daily_generations: number
  monthly_generations: number
  api_calls_per_minute: number
  api_calls_per_hour: number
  api_calls_per_day: number
  concurrent_requests: number
  priority_level: number // 1-10, higher = better
  features: string[]
  expires_at?: Date
  usage: {
    daily_generations_used: number
    monthly_generations_used: number
    api_calls_today: number
    last_reset: Date
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset_time: number
  retry_after?: number
  quota_exceeded?: boolean
  reason?: string
  headers: Record<string, string>
}

export interface RateLimitRule {
  id: string
  name: string
  description: string
  endpoint_pattern: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | '*'
  limit_per_minute: number
  limit_per_hour: number
  limit_per_day: number
  burst_multiplier: number
  apply_to: 'all' | 'authenticated' | 'anonymous' | 'plan' | 'user'
  plan_types?: string[]
  user_ids?: string[]
  ip_ranges?: string[]
  priority: number
  enabled: boolean
  created_at: Date
}

export interface UsageMetrics {
  user_id?: string
  ip?: string
  endpoint: string
  method: string
  timestamp: Date
  response_time: number
  status_code: number
  user_agent?: string
  rate_limit_hit: boolean
  quota_exceeded: boolean
}

// Default quota configurations for different plans
const DEFAULT_QUOTAS: Record<string, Omit<UserQuota, 'user_id' | 'usage'>> = {
  free: {
    plan_type: 'free',
    daily_generations: 10,
    monthly_generations: 100,
    api_calls_per_minute: 30,
    api_calls_per_hour: 1000,
    api_calls_per_day: 10000,
    concurrent_requests: 5,
    priority_level: 1,
    features: ['basic_generation', 'templates']
  },
  pro: {
    plan_type: 'pro',
    daily_generations: 100,
    monthly_generations: 2000,
    api_calls_per_minute: 120,
    api_calls_per_hour: 5000,
    api_calls_per_day: 50000,
    concurrent_requests: 15,
    priority_level: 5,
    features: ['basic_generation', 'advanced_generation', 'templates', 'collaboration', 'backup']
  },
  enterprise: {
    plan_type: 'enterprise',
    daily_generations: 1000,
    monthly_generations: 20000,
    api_calls_per_minute: 600,
    api_calls_per_hour: 20000,
    api_calls_per_day: 200000,
    concurrent_requests: 50,
    priority_level: 8,
    features: ['basic_generation', 'advanced_generation', 'templates', 'collaboration', 'backup', 'audit', 'priority_support']
  },
  custom: {
    plan_type: 'custom',
    daily_generations: 10000,
    monthly_generations: 100000,
    api_calls_per_minute: 1200,
    api_calls_per_hour: 50000,
    api_calls_per_day: 500000,
    concurrent_requests: 100,
    priority_level: 10,
    features: ['all']
  }
}

class RateLimitManager {
  private supabase = createClient()
  private auditLogger = new AuditLogger()
  private activeConnections = new Map<string, Set<string>>() // user_id -> Set<request_id>

  async checkRateLimit(
    userId: string | null,
    ip: string,
    endpoint: string,
    method: string,
    userAgent?: string
  ): Promise<RateLimitResult> {
    try {
      const now = Date.now()
      
      // Check IP blacklist first
      if (await this.isBlacklisted(ip)) {
        return this.createResult(false, 0, now + 3600000, 'IP blacklisted')
      }

      // Check IP whitelist (bypass rate limits if whitelisted)
      if (await this.isWhitelisted(ip)) {
        return this.createResult(true, 999999, now + 60000)
      }

      // Get applicable rate limit rules
      const rules = await this.getApplicableRules(userId, endpoint, method)
      const quota = userId ? await this.getUserQuota(userId) : null

      // Check global rate limits first
      const globalResult = await this.checkGlobalRateLimit(ip, endpoint)
      if (!globalResult.allowed) {
        return globalResult
      }

      // Check user-specific quota if authenticated
      if (userId && quota) {
        const quotaResult = await this.checkUserQuota(userId, quota, endpoint)
        if (!quotaResult.allowed) {
          return quotaResult
        }
      }

      // Check specific rule limits
      for (const rule of rules) {
        const ruleResult = await this.checkRuleLimit(userId, ip, rule)
        if (!ruleResult.allowed) {
          return ruleResult
        }
      }

      // Check concurrent request limits
      const concurrentResult = await this.checkConcurrentRequests(userId, ip, quota)
      if (!concurrentResult.allowed) {
        return concurrentResult
      }

      // All checks passed - allow the request
      await this.recordUsage({
        user_id: userId || undefined,
        ip,
        endpoint,
        method,
        timestamp: new Date(),
        response_time: 0, // Will be updated after request completes
        status_code: 0, // Will be updated after request completes
        user_agent: userAgent,
        rate_limit_hit: false,
        quota_exceeded: false
      })

      return this.createResult(true, 1000, now + 60000)

    } catch (error) {
      console.error('Rate limit check error:', error)
      // Fail open - allow request but log the error
      return this.createResult(true, 100, Date.now() + 60000)
    }
  }

  private async checkGlobalRateLimit(ip: string, endpoint: string): Promise<RateLimitResult> {
    const key = `global:${ip}:${endpoint}`
    const now = Math.floor(Date.now() / 1000)
    const window = 60 // 1 minute

    try {
      if (redis) {
        // Use sliding window log algorithm
        const pipeline = redis.pipeline()
        
        // Remove old entries
        pipeline.zremrangebyscore(key, 0, now - window)
        
        // Count current requests in window
        pipeline.zcard(key)
        
        // Add current request
        pipeline.zadd(key, now, `${now}-${Math.random()}`)
        
        // Set expiration
        pipeline.expire(key, window)
        
        const results = await pipeline.exec()
        const count = results?.[1]?.[1] as number || 0
        
        const limit = 60 // 60 requests per minute per IP per endpoint
        
        if (count >= limit) {
          return this.createResult(false, 0, now + window, 'Global rate limit exceeded')
        }
        
        return this.createResult(true, limit - count - 1, now + window)
      } else {
        // Fallback to in-memory (not recommended for production)
        return this.createResult(true, 1000, now + window)
      }
    } catch (error) {
      console.error('Global rate limit check error:', error)
      return this.createResult(true, 100, now + window)
    }
  }

  private async checkUserQuota(userId: string, quota: UserQuota, endpoint: string): Promise<RateLimitResult> {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Check if we need to reset daily counters
    if (quota.usage.last_reset.toDateString() !== now.toDateString()) {
      await this.resetDailyUsage(userId)
      quota.usage.daily_generations_used = 0
      quota.usage.api_calls_today = 0
    }

    // Check daily generation limit
    if (endpoint.includes('/generate') && quota.usage.daily_generations_used >= quota.daily_generations) {
      await this.auditLogger.log(
        'rate_limit_exceeded',
        'system',
        {
          user_id: userId,
          limit_type: 'daily_generations',
          limit: quota.daily_generations,
          used: quota.usage.daily_generations_used
        },
        'warning',
        userId
      )

      return this.createResult(false, 0, startOfDay.getTime() + 24 * 60 * 60 * 1000, 'Daily generation quota exceeded')
    }

    // Check monthly generation limit
    if (endpoint.includes('/generate') && quota.usage.monthly_generations_used >= quota.monthly_generations) {
      const nextMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1)
      return this.createResult(false, 0, nextMonth.getTime(), 'Monthly generation quota exceeded')
    }

    // Check API call limits
    const minuteKey = `quota:${userId}:minute:${Math.floor(Date.now() / 60000)}`
    const hourKey = `quota:${userId}:hour:${Math.floor(Date.now() / 3600000)}`
    const dayKey = `quota:${userId}:day:${Math.floor(Date.now() / 86400000)}`

    try {
      if (redis) {
        const [minuteCount, hourCount, dayCount] = await Promise.all([
          redis.get(minuteKey).then(v => parseInt(v || '0')),
          redis.get(hourKey).then(v => parseInt(v || '0')),
          redis.get(dayKey).then(v => parseInt(v || '0'))
        ])

        if (minuteCount >= quota.api_calls_per_minute) {
          return this.createResult(false, 0, Math.ceil(Date.now() / 60000) * 60000, 'Per-minute API quota exceeded')
        }

        if (hourCount >= quota.api_calls_per_hour) {
          return this.createResult(false, 0, Math.ceil(Date.now() / 3600000) * 3600000, 'Hourly API quota exceeded')
        }

        if (dayCount >= quota.api_calls_per_day) {
          return this.createResult(false, 0, Math.ceil(Date.now() / 86400000) * 86400000, 'Daily API quota exceeded')
        }

        // Increment counters
        const pipeline = redis.pipeline()
        pipeline.incr(minuteKey)
        pipeline.expire(minuteKey, 60)
        pipeline.incr(hourKey)
        pipeline.expire(hourKey, 3600)
        pipeline.incr(dayKey)
        pipeline.expire(dayKey, 86400)
        await pipeline.exec()
      }

      return this.createResult(true, quota.api_calls_per_minute - 1, Date.now() + 60000)
    } catch (error) {
      console.error('User quota check error:', error)
      return this.createResult(true, 100, Date.now() + 60000)
    }
  }

  private async checkConcurrentRequests(userId: string | null, ip: string, quota: UserQuota | null): Promise<RateLimitResult> {
    const identifier = userId || ip
    const maxConcurrent = quota?.concurrent_requests || 10
    
    const activeSet = this.activeConnections.get(identifier) || new Set()
    
    if (activeSet.size >= maxConcurrent) {
      return this.createResult(false, 0, Date.now() + 5000, 'Too many concurrent requests')
    }
    
    return this.createResult(true, maxConcurrent - activeSet.size - 1, Date.now() + 5000)
  }

  async startRequest(userId: string | null, ip: string, requestId: string): Promise<void> {
    const identifier = userId || ip
    
    if (!this.activeConnections.has(identifier)) {
      this.activeConnections.set(identifier, new Set())
    }
    
    this.activeConnections.get(identifier)!.add(requestId)
  }

  async endRequest(userId: string | null, ip: string, requestId: string, responseTime: number, statusCode: number): Promise<void> {
    const identifier = userId || ip
    
    if (this.activeConnections.has(identifier)) {
      this.activeConnections.get(identifier)!.delete(requestId)
      
      if (this.activeConnections.get(identifier)!.size === 0) {
        this.activeConnections.delete(identifier)
      }
    }

    // Update usage metrics
    await this.updateResponseMetrics(userId, ip, responseTime, statusCode)
  }

  async getUserQuota(userId: string): Promise<UserQuota> {
    try {
      const { data, error } = await this.supabase
        .from('user_quotas')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error || !data) {
        // Create default quota for new user
        const defaultQuota = DEFAULT_QUOTAS.free
        const newQuota: UserQuota = {
          user_id: userId,
          ...defaultQuota,
          usage: {
            daily_generations_used: 0,
            monthly_generations_used: 0,
            api_calls_today: 0,
            last_reset: new Date()
          }
        }

        await this.createUserQuota(newQuota)
        return newQuota
      }

      return data as UserQuota
    } catch (error) {
      console.error('Error fetching user quota:', error)
      
      // Return safe default
      return {
        user_id: userId,
        ...DEFAULT_QUOTAS.free,
        usage: {
          daily_generations_used: 0,
          monthly_generations_used: 0,
          api_calls_today: 0,
          last_reset: new Date()
        }
      }
    }
  }

  async updateUserQuota(userId: string, updates: Partial<UserQuota>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_quotas')
        .update(updates)
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to update user quota: ${error.message}`)
      }

      await this.auditLogger.log(
        'quota_updated',
        'system',
        { updates },
        'info',
        userId
      )

      return true
    } catch (error) {
      console.error('Error updating user quota:', error)
      return false
    }
  }

  private async createUserQuota(quota: UserQuota): Promise<void> {
    const { error } = await this.supabase
      .from('user_quotas')
      .insert(quota)

    if (error) {
      console.error('Error creating user quota:', error)
    }
  }

  private async resetDailyUsage(userId: string): Promise<void> {
    await this.supabase
      .from('user_quotas')
      .update({
        'usage.daily_generations_used': 0,
        'usage.api_calls_today': 0,
        'usage.last_reset': new Date().toISOString()
      })
      .eq('user_id', userId)
  }

  private async getApplicableRules(userId: string | null, endpoint: string, method: string): Promise<RateLimitRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('rate_limit_rules')
        .select('*')
        .eq('enabled', true)
        .order('priority', { ascending: false })

      if (error) {
        console.error('Error fetching rate limit rules:', error)
        return []
      }

      return (data as RateLimitRule[]).filter(rule => {
        // Check endpoint pattern
        const pattern = new RegExp(rule.endpoint_pattern.replace('*', '.*'))
        if (!pattern.test(endpoint)) return false

        // Check method
        if (rule.method && rule.method !== '*' && rule.method !== method) return false

        // Check apply_to conditions
        switch (rule.apply_to) {
          case 'authenticated':
            return !!userId
          case 'anonymous':
            return !userId
          case 'user':
            return rule.user_ids?.includes(userId!)
          case 'plan':
            // Would need to fetch user plan info
            return true
          default:
            return true
        }
      })
    } catch (error) {
      console.error('Error getting applicable rules:', error)
      return []
    }
  }

  private async checkRuleLimit(userId: string | null, ip: string, rule: RateLimitRule): Promise<RateLimitResult> {
    const identifier = userId || ip
    const keyPrefix = `rule:${rule.id}:${identifier}`

    try {
      if (redis) {
        const now = Math.floor(Date.now() / 1000)
        const windows = [
          { key: `${keyPrefix}:minute`, limit: rule.limit_per_minute, duration: 60 },
          { key: `${keyPrefix}:hour`, limit: rule.limit_per_hour, duration: 3600 },
          { key: `${keyPrefix}:day`, limit: rule.limit_per_day, duration: 86400 }
        ]

        for (const window of windows) {
          if (window.limit <= 0) continue

          const count = await redis.incr(window.key)
          if (count === 1) {
            await redis.expire(window.key, window.duration)
          }

          if (count > window.limit) {
            const ttl = await redis.ttl(window.key)
            return this.createResult(false, 0, now + ttl, `Rule ${rule.name} limit exceeded`)
          }
        }
      }

      return this.createResult(true, rule.limit_per_minute - 1, Date.now() + 60000)
    } catch (error) {
      console.error('Rule limit check error:', error)
      return this.createResult(true, 100, Date.now() + 60000)
    }
  }

  private async isBlacklisted(ip: string): Promise<boolean> {
    try {
      if (redis) {
        return !!(await redis.get(`blacklist:${ip}`))
      }
      
      // Fallback to database
      const { data } = await this.supabase
        .from('ip_blacklist')
        .select('ip')
        .eq('ip', ip)
        .eq('active', true)
        .single()

      return !!data
    } catch (error) {
      return false
    }
  }

  private async isWhitelisted(ip: string): Promise<boolean> {
    try {
      if (redis) {
        return !!(await redis.get(`whitelist:${ip}`))
      }
      
      // Fallback to database
      const { data } = await this.supabase
        .from('ip_whitelist')
        .select('ip')
        .eq('ip', ip)
        .eq('active', true)
        .single()

      return !!data
    } catch (error) {
      return false
    }
  }

  private async recordUsage(metrics: UsageMetrics): Promise<void> {
    try {
      // Store in database for long-term analytics
      await this.supabase
        .from('usage_metrics')
        .insert(metrics)

      // Update user usage counters if user is authenticated
      if (metrics.user_id && metrics.endpoint.includes('/generate')) {
        await this.supabase
          .from('user_quotas')
          .update({
            'usage.daily_generations_used': this.supabase.raw('usage.daily_generations_used + 1'),
            'usage.monthly_generations_used': this.supabase.raw('usage.monthly_generations_used + 1')
          })
          .eq('user_id', metrics.user_id)
      }
    } catch (error) {
      console.error('Error recording usage metrics:', error)
    }
  }

  private async updateResponseMetrics(userId: string | null, ip: string, responseTime: number, statusCode: number): Promise<void> {
    try {
      // Update the most recent usage record
      const { error } = await this.supabase
        .from('usage_metrics')
        .update({
          response_time: responseTime,
          status_code: statusCode
        })
        .eq('user_id', userId)
        .eq('ip', ip)
        .order('timestamp', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error updating response metrics:', error)
      }
    } catch (error) {
      console.error('Error updating response metrics:', error)
    }
  }

  private createResult(
    allowed: boolean,
    remaining: number,
    resetTime: number,
    reason?: string
  ): RateLimitResult {
    return {
      allowed,
      remaining,
      reset_time: resetTime,
      retry_after: allowed ? undefined : Math.ceil((resetTime - Date.now()) / 1000),
      quota_exceeded: reason?.includes('quota'),
      reason,
      headers: {
        'X-RateLimit-Limit': '1000',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.floor(resetTime / 1000).toString(),
        ...(reason && { 'X-RateLimit-Reason': reason }),
        ...(!allowed && { 'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString() })
      }
    }
  }

  async getUsageStats(userId: string, period: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    try {
      const endDate = new Date()
      const startDate = new Date()

      switch (period) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1)
          break
        case 'week':
          startDate.setDate(endDate.getDate() - 7)
          break
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1)
          break
      }

      const { data, error } = await this.supabase
        .from('usage_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())

      if (error) {
        throw new Error(`Failed to get usage stats: ${error.message}`)
      }

      // Process and aggregate the data
      const stats = {
        total_requests: data?.length || 0,
        successful_requests: data?.filter(m => m.status_code >= 200 && m.status_code < 300).length || 0,
        failed_requests: data?.filter(m => m.status_code >= 400).length || 0,
        rate_limited_requests: data?.filter(m => m.rate_limit_hit).length || 0,
        avg_response_time: data?.reduce((sum, m) => sum + (m.response_time || 0), 0) / (data?.length || 1) || 0,
        endpoints: {} as Record<string, number>
      }

      // Count requests per endpoint
      data?.forEach(metric => {
        stats.endpoints[metric.endpoint] = (stats.endpoints[metric.endpoint] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Error getting usage stats:', error)
      return {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        rate_limited_requests: 0,
        avg_response_time: 0,
        endpoints: {}
      }
    }
  }
}

export const rateLimitManager = new RateLimitManager()
export { RateLimitManager }