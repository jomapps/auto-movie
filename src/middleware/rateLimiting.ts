/**
 * Rate Limiting Middleware for Chat Endpoints
 * Implements sliding window rate limiting with Redis-like in-memory store
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number        // Time window in milliseconds
  maxRequests: number     // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
}

/**
 * Rate limit store interface
 */
interface RateLimitStore {
  get(key: string): Promise<RateLimitData | null>
  set(key: string, data: RateLimitData, ttl: number): Promise<void>
  increment(key: string): Promise<RateLimitData>
  reset(key: string): Promise<void>
}

/**
 * Rate limit data structure
 */
interface RateLimitData {
  count: number
  firstRequest: number
  lastRequest: number
}

/**
 * In-memory rate limit store
 * TODO: Replace with Redis in production for distributed systems
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitData>()
  private timers = new Map<string, NodeJS.Timeout>()

  async get(key: string): Promise<RateLimitData | null> {
    return this.store.get(key) || null
  }

  async set(key: string, data: RateLimitData, ttl: number): Promise<void> {
    this.store.set(key, data)
    
    // Clear existing timer
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set expiration timer
    const timer = setTimeout(() => {
      this.store.delete(key)
      this.timers.delete(key)
    }, ttl)
    
    this.timers.set(key, timer)
  }

  async increment(key: string): Promise<RateLimitData> {
    const now = Date.now()
    const existing = this.store.get(key)
    
    if (existing) {
      existing.count++
      existing.lastRequest = now
      return existing
    } else {
      const newData: RateLimitData = {
        count: 1,
        firstRequest: now,
        lastRequest: now,
      }
      this.store.set(key, newData)
      return newData
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }
}

// Global store instance
const globalStore = new MemoryStore()

/**
 * Rate limiting configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Chat message sending - more restrictive
  chatMessage: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30,          // 30 messages per minute
    message: 'Too many chat messages. Please slow down.',
  },
  
  // Choice selection - moderate
  chatChoice: {
    windowMs: 30 * 1000,      // 30 seconds
    maxRequests: 20,          // 20 choices per 30 seconds
    message: 'Too many choice selections. Please wait a moment.',
  },
  
  // File upload - very restrictive
  fileUpload: {
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 10,          // 10 uploads per 5 minutes
    message: 'Upload limit exceeded. Please wait before uploading more files.',
  },
  
  // Session operations - moderate
  sessionOps: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 session operations per minute
    message: 'Too many session operations. Please slow down.',
  },
  
  // General API - lenient
  generalApi: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 100,         // 100 requests per minute
    message: 'API rate limit exceeded. Please try again later.',
  },
  
  // WebSocket connections - very restrictive
  websocketConnect: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 5,           // 5 connection attempts per minute
    message: 'Too many connection attempts. Please wait before retrying.',
  },
} as const

/**
 * Default key generator based on IP and user ID
 */
function defaultKeyGenerator(req: NextRequest, prefix: string = 'rateLimit'): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
  
  // Try to get user ID from request (if authenticated)
  const userId = req.headers.get('x-user-id') || 'anonymous'
  
  return `${prefix}:${ip}:${userId}`
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(
  config: RateLimitConfig,
  store: RateLimitStore = globalStore
) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      const keyGenerator = config.keyGenerator || ((r) => defaultKeyGenerator(r, 'chat'))
      const key = keyGenerator(req)
      
      // Get current data
      const data = await store.increment(key)
      const now = Date.now()
      
      // Check if we're within the time window
      const windowStart = now - config.windowMs
      
      if (data.firstRequest < windowStart) {
        // Window expired, reset the counter
        await store.reset(key)
        const newData = await store.increment(key)
        await store.set(key, newData, config.windowMs)
        return null // Allow request
      }
      
      // Set TTL for cleanup
      await store.set(key, data, config.windowMs)
      
      if (data.count > config.maxRequests) {
        // Rate limit exceeded
        const resetTime = Math.ceil((data.firstRequest + config.windowMs) / 1000)
        
        return NextResponse.json(
          {
            success: false,
            error: config.message || 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: resetTime,
            limit: config.maxRequests,
            remaining: 0,
            reset: resetTime,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTime.toString(),
              'Retry-After': Math.ceil((data.firstRequest + config.windowMs - now) / 1000).toString(),
            },
          }
        )
      }

      // Add rate limit headers to response
      const remaining = Math.max(0, config.maxRequests - data.count)
      const resetTime = Math.ceil((data.firstRequest + config.windowMs) / 1000)
      
      // These headers will be added to the successful response by the wrapper
      req.headers.set('x-ratelimit-limit', config.maxRequests.toString())
      req.headers.set('x-ratelimit-remaining', remaining.toString())
      req.headers.set('x-ratelimit-reset', resetTime.toString())
      
      return null // Allow request
    } catch (error) {
      console.error('Rate limiting error:', error)
      // If rate limiting fails, allow the request to proceed
      return null
    }
  }
}

/**
 * Specific rate limiters for chat endpoints
 */
export const chatMessageLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.chatMessage)
export const chatChoiceLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.chatChoice)
export const fileUploadLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.fileUpload)
export const sessionOpsLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.sessionOps)
export const websocketLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.websocketConnect)

/**
 * Adaptive rate limiting based on user subscription tier
 */
export function createAdaptiveRateLimiter(
  baseConfig: RateLimitConfig,
  tierMultipliers: Record<string, number> = {
    'free': 1,
    'pro': 3,
    'enterprise': 10,
  }
) {
  return async (req: NextRequest, userTier: string = 'free'): Promise<NextResponse | null> => {
    const multiplier = tierMultipliers[userTier] || 1
    const adaptedConfig = {
      ...baseConfig,
      maxRequests: Math.floor(baseConfig.maxRequests * multiplier),
      keyGenerator: (r: NextRequest) => defaultKeyGenerator(r, `adaptive-${userTier}`),
    }
    
    const limiter = createRateLimiter(adaptedConfig)
    return limiter(req)
  }
}

/**
 * IP-based rate limiting (for unauthenticated requests)
 */
export function createIPRateLimiter(config: RateLimitConfig) {
  return createRateLimiter({
    ...config,
    keyGenerator: (req) => {
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
      return `ip:${ip}`
    },
  })
}

/**
 * User-based rate limiting (for authenticated requests)
 */
export function createUserRateLimiter(config: RateLimitConfig) {
  return createRateLimiter({
    ...config,
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id') || 'anonymous'
      return `user:${userId}`
    },
  })
}

/**
 * Rate limit wrapper for API handlers
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  limiterConfig: keyof typeof RATE_LIMIT_CONFIGS | RateLimitConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Get the rate limiter
    const config = typeof limiterConfig === 'string' 
      ? RATE_LIMIT_CONFIGS[limiterConfig]
      : limiterConfig
    
    const limiter = createRateLimiter(config)
    
    // Check rate limit
    const limitResponse = await limiter(req)
    if (limitResponse) {
      return limitResponse
    }
    
    // Execute the handler
    const response = await handler(req)
    
    // Add rate limit headers to successful responses
    const limit = req.headers.get('x-ratelimit-limit')
    const remaining = req.headers.get('x-ratelimit-remaining')
    const reset = req.headers.get('x-ratelimit-reset')
    
    if (limit && remaining && reset) {
      response.headers.set('X-RateLimit-Limit', limit)
      response.headers.set('X-RateLimit-Remaining', remaining)
      response.headers.set('X-RateLimit-Reset', reset)
    }
    
    return response
  }
}

/**
 * Rate limit bypass for specific conditions
 */
export async function shouldBypassRateLimit(
  req: NextRequest,
  conditions: {
    adminUsers?: string[]
    whitelistedIPs?: string[]
    specialHeaders?: Record<string, string>
  } = {}
): Promise<boolean> {
  // Check admin users
  const userId = req.headers.get('x-user-id')
  if (userId && conditions.adminUsers?.includes(userId)) {
    return true
  }
  
  // Check whitelisted IPs
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.ip
  if (ip && conditions.whitelistedIPs?.includes(ip)) {
    return true
  }
  
  // Check special headers
  if (conditions.specialHeaders) {
    for (const [headerName, expectedValue] of Object.entries(conditions.specialHeaders)) {
      if (req.headers.get(headerName) === expectedValue) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Reset rate limit for a specific key (admin function)
 */
export async function resetRateLimit(
  key: string,
  store: RateLimitStore = globalStore
): Promise<void> {
  await store.reset(key)
}

export default {
  createRateLimiter,
  createAdaptiveRateLimiter,
  createIPRateLimiter,
  createUserRateLimiter,
  withRateLimit,
  shouldBypassRateLimit,
  resetRateLimit,
  chatMessageLimiter,
  chatChoiceLimiter,
  fileUploadLimiter,
  sessionOpsLimiter,
  websocketLimiter,
}