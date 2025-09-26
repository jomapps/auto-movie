/**
 * Authentication Middleware for /api/v1/* routes
 * Handles JWT validation and user authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getPayloadInstance } from '@/utils/getPayload'

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    role: string
    name?: string
  }
}

/**
 * JWT Authentication middleware
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  authenticated: boolean
  user?: any
  error?: string
}> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.PAYLOAD_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured')
      return { authenticated: false, error: 'Server configuration error' }
    }

    let decoded: any
    try {
      decoded = jwt.verify(token, jwtSecret)
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return { authenticated: false, error: 'Token expired' }
      }
      if (jwtError instanceof jwt.JsonWebTokenError) {
        return { authenticated: false, error: 'Invalid token' }
      }
      return { authenticated: false, error: 'Token verification failed' }
    }

    // Get user from PayloadCMS
    const payload = await getPayloadInstance()
    const user = await payload.findByID({
      collection: 'users',
      id: decoded.id || decoded.sub,
      depth: 0,
    })

    if (!user) {
      return { authenticated: false, error: 'User not found' }
    }

    // Check if user is active
    if (user.blocked) {
      return { authenticated: false, error: 'User account is blocked' }
    }

    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        name: user.name,
      }
    }

  } catch (error) {
    console.error('Authentication error:', error)
    return { authenticated: false, error: 'Authentication failed' }
  }
}

/**
 * Role-based authorization check
 */
export function authorizeRole(userRole: string, requiredRoles: string[]): boolean {
  if (requiredRoles.includes('*')) return true
  return requiredRoles.includes(userRole)
}

/**
 * Create authenticated API response helper
 */
export function createAuthenticatedHandler(
  handler: (request: AuthenticatedRequest, user: any) => Promise<NextResponse>,
  options: {
    requiredRoles?: string[]
    skipAuth?: boolean
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip authentication if configured
    if (options.skipAuth) {
      return handler(request as AuthenticatedRequest, null)
    }

    // Authenticate request
    const authResult = await authenticateRequest(request)
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { 
          success: false, 
          error: authResult.error || 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    // Check role authorization
    if (options.requiredRoles && options.requiredRoles.length > 0) {
      if (!authorizeRole(authResult.user!.role, options.requiredRoles)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient permissions',
            code: 'FORBIDDEN'
          },
          { status: 403 }
        )
      }
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = authResult.user!

    return handler(authenticatedRequest, authResult.user)
  }
}

/**
 * Resource ownership validation
 */
export async function validateResourceOwnership(
  userId: string,
  resourceType: 'project' | 'session' | 'media',
  resourceId: string
): Promise<boolean> {
  try {
    const payload = await getPayloadInstance()

    switch (resourceType) {
      case 'project': {
        const project = await payload.findByID({
          collection: 'projects',
          id: resourceId,
          depth: 1,
        })
        
        // Check if user is creator or collaborator
        const isCreator = project.createdBy?.id === userId || project.createdBy === userId
        const isCollaborator = project.collaborators?.some(
          (collab: any) => collab.id === userId || collab === userId
        )
        
        return isCreator || isCollaborator
      }

      case 'session': {
        const session = await payload.findByID({
          collection: 'sessions',
          id: resourceId,
          depth: 1,
        })
        
        // Check if user owns the session or has access to the project
        const isOwner = session.user?.id === userId || session.user === userId
        if (isOwner) return true
        
        // Check project access
        const projectId = session.project?.id || session.project
        if (projectId) {
          return validateResourceOwnership(userId, 'project', projectId)
        }
        
        return false
      }

      case 'media': {
        const media = await payload.findByID({
          collection: 'media',
          id: resourceId,
          depth: 1,
        })
        
        // Check project access
        const projectId = media.project?.id || media.project
        if (projectId) {
          return validateResourceOwnership(userId, 'project', projectId)
        }
        
        return false
      }

      default:
        return false
    }
  } catch (error) {
    console.error(`Error validating ${resourceType} ownership:`, error)
    return false
  }
}

/**
 * API Key authentication for external services
 */
export function authenticateApiKey(request: NextRequest): {
  authenticated: boolean
  service?: string
  error?: string
} {
  const apiKey = request.headers.get('x-api-key')
  if (!apiKey) {
    return { authenticated: false, error: 'API key required' }
  }

  // Check against configured API keys
  const validApiKeys = {
    [process.env.WEBHOOK_API_KEY || '']: 'webhook',
    [process.env.CRON_API_KEY || '']: 'cron',
    [process.env.ADMIN_API_KEY || '']: 'admin',
  }

  const service = validApiKeys[apiKey]
  if (!service) {
    return { authenticated: false, error: 'Invalid API key' }
  }

  return { authenticated: true, service }
}

/**
 * Session token validation for WebSocket connections
 */
export async function validateSessionToken(token: string): Promise<{
  valid: boolean
  user?: any
  error?: string
}> {
  try {
    const jwtSecret = process.env.JWT_SECRET || process.env.PAYLOAD_SECRET
    if (!jwtSecret) {
      return { valid: false, error: 'Server configuration error' }
    }

    const decoded = jwt.verify(token, jwtSecret) as any
    
    const payload = await getPayloadInstance()
    const user = await payload.findByID({
      collection: 'users',
      id: decoded.id || decoded.sub,
      depth: 0,
    })

    if (!user || user.blocked) {
      return { valid: false, error: 'Invalid user' }
    }

    return {
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        name: user.name,
      }
    }
  } catch (error) {
    return { valid: false, error: 'Token validation failed' }
  }
}

export default {
  authenticateRequest,
  authorizeRole,
  createAuthenticatedHandler,
  validateResourceOwnership,
  authenticateApiKey,
  validateSessionToken,
}