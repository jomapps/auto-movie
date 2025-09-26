/**
 * Subscription Limit Validation Middleware
 * Enforces usage limits based on user subscription tiers
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayloadInstance } from '@/utils/getPayload'
import { authLogger, AppError, ErrorType } from '@/utils/logger'

/**
 * Subscription tier definitions
 */
export interface SubscriptionTier {
  name: string
  limits: {
    maxProjects: number
    maxEpisodesPerProject: number
    maxStorageGB: number
    maxMonthlyAIRequests: number
    maxConcurrentSessions: number
    maxFileUploadsPerDay: number
    maxCollaboratorsPerProject: number
    allowsPrioritySupport: boolean
    allowsAdvancedFeatures: boolean
  }
  features: string[]
}

/**
 * Subscription tiers configuration
 */
export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: 'Free',
    limits: {
      maxProjects: 1,
      maxEpisodesPerProject: 3,
      maxStorageGB: 1,
      maxMonthlyAIRequests: 100,
      maxConcurrentSessions: 1,
      maxFileUploadsPerDay: 10,
      maxCollaboratorsPerProject: 0,
      allowsPrioritySupport: false,
      allowsAdvancedFeatures: false,
    },
    features: ['Basic AI assistance', 'Standard templates', 'Community support'],
  },
  pro: {
    name: 'Pro',
    limits: {
      maxProjects: 10,
      maxEpisodesPerProject: 20,
      maxStorageGB: 50,
      maxMonthlyAIRequests: 2000,
      maxConcurrentSessions: 5,
      maxFileUploadsPerDay: 100,
      maxCollaboratorsPerProject: 5,
      allowsPrioritySupport: true,
      allowsAdvancedFeatures: true,
    },
    features: [
      'Advanced AI features',
      'Premium templates',
      'Priority support',
      'Team collaboration',
      'Export options',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    limits: {
      maxProjects: 100,
      maxEpisodesPerProject: 100,
      maxStorageGB: 500,
      maxMonthlyAIRequests: 10000,
      maxConcurrentSessions: 20,
      maxFileUploadsPerDay: 1000,
      maxCollaboratorsPerProject: 50,
      allowsPrioritySupport: true,
      allowsAdvancedFeatures: true,
    },
    features: [
      'All Pro features',
      'Custom AI models',
      'White-label options',
      'Dedicated support',
      'Advanced analytics',
      'Custom integrations',
    ],
  },
}

/**
 * Usage tracking interface
 */
export interface UserUsage {
  userId: string
  tier: string
  currentUsage: {
    projects: number
    storageUsedMB: number
    monthlyAIRequests: number
    concurrentSessions: number
    dailyFileUploads: number
  }
  lastResetDate: string
  overageFlags: string[]
}

/**
 * Subscription limit error
 */
export class SubscriptionLimitError extends AppError {
  public readonly limitType: string
  public readonly currentUsage: number
  public readonly limit: number
  public readonly tier: string

  constructor(
    limitType: string,
    currentUsage: number,
    limit: number,
    tier: string,
    upgradeMessage?: string
  ) {
    const message = upgradeMessage || 
      `${limitType} limit reached (${currentUsage}/${limit}). Upgrade your subscription to continue.`
    
    super(message, ErrorType.AUTHORIZATION, 402, true, {
      limitType,
      currentUsage,
      limit,
      tier,
      upgradeAvailable: tier !== 'enterprise',
    })
    
    this.limitType = limitType
    this.currentUsage = currentUsage
    this.limit = limit
    this.tier = tier
  }
}

/**
 * Get user subscription and usage data
 */
async function getUserSubscriptionData(userId: string): Promise<{
  tier: string
  usage: UserUsage
  limits: SubscriptionTier['limits']
}> {
  try {
    const payload = await getPayloadInstance()
    
    // Get user with subscription data
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 1,
    })

    if (!user) {
      throw new Error('User not found')
    }

    const tier = user.subscription?.tier || 'free'
    const limits = SUBSCRIPTION_TIERS[tier]?.limits || SUBSCRIPTION_TIERS.free.limits

    // Calculate current usage
    const usage = await calculateUserUsage(payload, userId, tier)

    return { tier, usage, limits }
  } catch (error) {
    authLogger.error('Failed to get user subscription data', error as Error, { userId })
    throw error
  }
}

/**
 * Calculate current user usage
 */
async function calculateUserUsage(payload: any, userId: string, tier: string): Promise<UserUsage> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  try {
    // Count projects
    const projectsResult = await payload.find({
      collection: 'projects',
      where: {
        or: [
          { createdBy: { equals: userId } },
          { collaborators: { contains: userId } }
        ]
      },
      limit: 1,
    })

    // Count AI requests this month
    const aiRequestsResult = await payload.find({
      collection: 'sessions',
      where: {
        and: [
          { user: { equals: userId } },
          { updatedAt: { greater_than: startOfMonth.toISOString() } }
        ]
      },
      limit: 1,
    })

    // Estimate AI requests from conversation history
    const sessions = await payload.find({
      collection: 'sessions',
      where: {
        and: [
          { user: { equals: userId } },
          { updatedAt: { greater_than: startOfMonth.toISOString() } }
        ]
      },
      limit: 100,
    })

    const monthlyAIRequests = sessions.docs.reduce((total: number, session: any) => {
      return total + (session.conversationHistory?.filter((msg: any) => msg.role === 'user').length || 0)
    }, 0)

    // Count concurrent sessions
    const activeSessions = await payload.find({
      collection: 'sessions',
      where: {
        and: [
          { user: { equals: userId } },
          { sessionState: { equals: 'active' } }
        ]
      },
      limit: 1,
    })

    // Count today's file uploads
    const todayUploads = await payload.find({
      collection: 'media',
      where: {
        and: [
          { createdBy: { equals: userId } },
          { createdAt: { greater_than: startOfDay.toISOString() } }
        ]
      },
      limit: 1,
    })

    // Calculate storage usage (simplified estimation)
    const mediaResult = await payload.find({
      collection: 'media',
      where: {
        project: {
          in: projectsResult.docs.map((p: any) => p.id)
        }
      },
      limit: 1000, // Get enough to estimate
    })

    const storageUsedMB = mediaResult.docs.reduce((total: number, media: any) => {
      return total + (media.filesize || 0)
    }, 0) / (1024 * 1024)

    return {
      userId,
      tier,
      currentUsage: {
        projects: projectsResult.totalDocs,
        storageUsedMB: Math.round(storageUsedMB),
        monthlyAIRequests,
        concurrentSessions: activeSessions.totalDocs,
        dailyFileUploads: todayUploads.totalDocs,
      },
      lastResetDate: startOfMonth.toISOString(),
      overageFlags: [],
    }
  } catch (error) {
    authLogger.error('Failed to calculate user usage', error as Error, { userId })
    
    // Return minimal usage data on error
    return {
      userId,
      tier,
      currentUsage: {
        projects: 0,
        storageUsedMB: 0,
        monthlyAIRequests: 0,
        concurrentSessions: 0,
        dailyFileUploads: 0,
      },
      lastResetDate: startOfMonth.toISOString(),
      overageFlags: ['calculation_error'],
    }
  }
}

/**
 * Validate project creation limits
 */
export async function validateProjectCreation(userId: string): Promise<void> {
  const { tier, usage, limits } = await getUserSubscriptionData(userId)
  
  if (usage.currentUsage.projects >= limits.maxProjects) {
    throw new SubscriptionLimitError(
      'Projects',
      usage.currentUsage.projects,
      limits.maxProjects,
      tier,
      `You've reached your project limit (${limits.maxProjects}). Upgrade to ${tier === 'free' ? 'Pro' : 'Enterprise'} to create more projects.`
    )
  }
}

/**
 * Validate episode count limits
 */
export async function validateEpisodeCount(
  userId: string,
  episodeCount: number
): Promise<void> {
  const { tier, limits } = await getUserSubscriptionData(userId)
  
  if (episodeCount > limits.maxEpisodesPerProject) {
    throw new SubscriptionLimitError(
      'Episodes per project',
      episodeCount,
      limits.maxEpisodesPerProject,
      tier,
      `Episode count exceeds your limit (${limits.maxEpisodesPerProject}). Upgrade to ${tier === 'free' ? 'Pro' : 'Enterprise'} for more episodes per project.`
    )
  }
}

/**
 * Validate AI request limits
 */
export async function validateAIRequest(userId: string): Promise<void> {
  const { tier, usage, limits } = await getUserSubscriptionData(userId)
  
  if (usage.currentUsage.monthlyAIRequests >= limits.maxMonthlyAIRequests) {
    throw new SubscriptionLimitError(
      'Monthly AI requests',
      usage.currentUsage.monthlyAIRequests,
      limits.maxMonthlyAIRequests,
      tier,
      `You've used all your AI requests this month (${limits.maxMonthlyAIRequests}). Upgrade to ${tier === 'free' ? 'Pro' : 'Enterprise'} for more requests.`
    )
  }
}

/**
 * Validate concurrent session limits
 */
export async function validateConcurrentSessions(userId: string): Promise<void> {
  const { tier, usage, limits } = await getUserSubscriptionData(userId)
  
  if (usage.currentUsage.concurrentSessions >= limits.maxConcurrentSessions) {
    throw new SubscriptionLimitError(
      'Concurrent sessions',
      usage.currentUsage.concurrentSessions,
      limits.maxConcurrentSessions,
      tier,
      `You have too many active sessions (${limits.maxConcurrentSessions} max). Close some sessions or upgrade to ${tier === 'free' ? 'Pro' : 'Enterprise'}.`
    )
  }
}

/**
 * Validate file upload limits
 */
export async function validateFileUpload(
  userId: string,
  fileSizeBytes: number
): Promise<void> {
  const { tier, usage, limits } = await getUserSubscriptionData(userId)
  
  // Check daily upload limit
  if (usage.currentUsage.dailyFileUploads >= limits.maxFileUploadsPerDay) {
    throw new SubscriptionLimitError(
      'Daily file uploads',
      usage.currentUsage.dailyFileUploads,
      limits.maxFileUploadsPerDay,
      tier,
      `Daily upload limit reached (${limits.maxFileUploadsPerDay}). Try again tomorrow or upgrade to ${tier === 'free' ? 'Pro' : 'Enterprise'}.`
    )
  }
  
  // Check storage limit
  const newStorageUsageGB = (usage.currentUsage.storageUsedMB + (fileSizeBytes / (1024 * 1024))) / 1024
  if (newStorageUsageGB > limits.maxStorageGB) {
    throw new SubscriptionLimitError(
      'Storage',
      Math.round(newStorageUsageGB * 1000) / 1000,
      limits.maxStorageGB,
      tier,
      `Storage limit exceeded (${limits.maxStorageGB}GB max). Delete some files or upgrade to ${tier === 'free' ? 'Pro' : 'Enterprise'}.`
    )
  }
}

/**
 * Validate collaborator limits
 */
export async function validateCollaboratorAddition(
  userId: string,
  projectId: string,
  currentCollaboratorCount: number
): Promise<void> {
  const { tier, limits } = await getUserSubscriptionData(userId)
  
  if (currentCollaboratorCount >= limits.maxCollaboratorsPerProject) {
    throw new SubscriptionLimitError(
      'Collaborators per project',
      currentCollaboratorCount,
      limits.maxCollaboratorsPerProject,
      tier,
      `Collaborator limit reached (${limits.maxCollaboratorsPerProject}). Upgrade to ${tier === 'free' ? 'Pro' : 'Enterprise'} to add more collaborators.`
    )
  }
}

/**
 * Check if user has access to advanced features
 */
export async function validateAdvancedFeature(
  userId: string,
  featureName: string
): Promise<void> {
  const { tier, limits } = await getUserSubscriptionData(userId)
  
  if (!limits.allowsAdvancedFeatures) {
    throw new SubscriptionLimitError(
      'Advanced features',
      0,
      1,
      tier,
      `${featureName} is a ${tier === 'free' ? 'Pro' : 'Enterprise'} feature. Upgrade your subscription to access it.`
    )
  }
}

/**
 * Create subscription validation middleware
 */
export function createSubscriptionValidator(
  validationType: 'project' | 'ai_request' | 'session' | 'upload' | 'collaborator' | 'advanced_feature',
  options: {
    extractUserId?: (req: NextRequest) => string | null
    extractData?: (req: NextRequest) => Promise<any>
    skipForTiers?: string[]
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      // Extract user ID from request
      const userId = options.extractUserId?.(req) || 
        req.headers.get('x-user-id') || 
        (req as any).user?.id

      if (!userId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required for subscription validation',
            code: 'AUTHENTICATION_REQUIRED',
          },
          { status: 401 }
        )
      }

      // Get user subscription info
      const { tier } = await getUserSubscriptionData(userId)

      // Skip validation for specified tiers
      if (options.skipForTiers?.includes(tier)) {
        return null
      }

      // Extract additional data if needed
      const data = options.extractData ? await options.extractData(req) : {}

      // Perform validation based on type
      switch (validationType) {
        case 'project':
          await validateProjectCreation(userId)
          break

        case 'ai_request':
          await validateAIRequest(userId)
          break

        case 'session':
          await validateConcurrentSessions(userId)
          break

        case 'upload':
          if (data.fileSize) {
            await validateFileUpload(userId, data.fileSize)
          }
          break

        case 'collaborator':
          if (data.projectId && data.currentCollaboratorCount !== undefined) {
            await validateCollaboratorAddition(userId, data.projectId, data.currentCollaboratorCount)
          }
          break

        case 'advanced_feature':
          await validateAdvancedFeature(userId, data.featureName || 'Advanced feature')
          break

        default:
          throw new Error(`Unknown validation type: ${validationType}`)
      }

      // Validation passed
      return null
    } catch (error) {
      if (error instanceof SubscriptionLimitError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: 'SUBSCRIPTION_LIMIT_EXCEEDED',
            details: {
              limitType: error.limitType,
              currentUsage: error.currentUsage,
              limit: error.limit,
              tier: error.tier,
              upgradeAvailable: error.metadata?.upgradeAvailable,
              upgradeUrl: `/dashboard/subscription/upgrade?from=${error.tier}`,
            },
          },
          { status: 402 }
        )
      }

      authLogger.error('Subscription validation error', error as Error, {
        validationType,
        userId: req.headers.get('x-user-id'),
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Subscription validation failed',
          code: 'SUBSCRIPTION_VALIDATION_ERROR',
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Get user usage summary for dashboard
 */
export async function getUserUsageSummary(userId: string): Promise<{
  tier: string
  usage: UserUsage
  limits: SubscriptionTier['limits']
  utilizationPercentages: Record<string, number>
  nearLimits: string[]
}> {
  const { tier, usage, limits } = await getUserSubscriptionData(userId)
  
  const utilizationPercentages = {
    projects: Math.round((usage.currentUsage.projects / limits.maxProjects) * 100),
    storage: Math.round((usage.currentUsage.storageUsedMB / (limits.maxStorageGB * 1024)) * 100),
    aiRequests: Math.round((usage.currentUsage.monthlyAIRequests / limits.maxMonthlyAIRequests) * 100),
    sessions: Math.round((usage.currentUsage.concurrentSessions / limits.maxConcurrentSessions) * 100),
    uploads: Math.round((usage.currentUsage.dailyFileUploads / limits.maxFileUploadsPerDay) * 100),
  }

  const nearLimits = Object.entries(utilizationPercentages)
    .filter(([, percentage]) => percentage >= 80)
    .map(([key]) => key)

  return {
    tier,
    usage,
    limits,
    utilizationPercentages,
    nearLimits,
  }
}

export default {
  SUBSCRIPTION_TIERS,
  SubscriptionLimitError,
  validateProjectCreation,
  validateEpisodeCount,
  validateAIRequest,
  validateConcurrentSessions,
  validateFileUpload,
  validateCollaboratorAddition,
  validateAdvancedFeature,
  createSubscriptionValidator,
  getUserUsageSummary,
}