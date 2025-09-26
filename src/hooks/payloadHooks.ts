/**
 * PayloadCMS Hooks for Progress Tracking
 * Automatic progress calculation and workflow management
 */

import { AfterChangeHook, BeforeChangeHook, AfterDeleteHook } from 'payload/types'
import { dbLogger } from '@/utils/logger'

/**
 * Project progress calculation hook
 * Automatically updates project progress when sessions or media change
 */
export const updateProjectProgress: AfterChangeHook = async ({
  doc,
  req,
  operation,
  collection,
}) => {
  try {
    // Only process if this affects progress-related collections
    if (!['sessions', 'media', 'projects'].includes(collection.slug)) {
      return doc
    }

    const payload = req.payload
    let projectId: string | null = null

    // Get project ID based on the collection
    if (collection.slug === 'projects') {
      projectId = doc.id
    } else if (collection.slug === 'sessions') {
      projectId = doc.project?.id || doc.project
    } else if (collection.slug === 'media') {
      projectId = doc.project?.id || doc.project
    }

    if (!projectId) {
      dbLogger.warn('Could not determine project ID for progress update', {
        collection: collection.slug,
        docId: doc.id,
        operation,
      })
      return doc
    }

    // Calculate progress based on workflow completion
    const progressData = await calculateProjectProgress(payload, projectId)
    
    // Update the project with new progress
    if (collection.slug !== 'projects') {
      await payload.update({
        collection: 'projects',
        id: projectId,
        data: {
          progress: progressData,
        },
        depth: 0,
      })
    }

    dbLogger.info('Project progress updated', {
      projectId,
      progress: progressData.overallProgress,
      triggeredBy: `${collection.slug}:${operation}`,
    })

    return doc
  } catch (error) {
    dbLogger.error('Failed to update project progress', error as Error, {
      collection: collection.slug,
      docId: doc.id,
      operation,
    })
    return doc
  }
}

/**
 * Session state management hook
 * Updates session metadata and handles workflow transitions
 */
export const manageSessionState: BeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  try {
    const payload = req.payload

    // Add metadata for new sessions
    if (operation === 'create') {
      data.createdAt = new Date().toISOString()
      data.updatedAt = new Date().toISOString()
      data.sessionState = data.sessionState || 'active'
    }

    // Update timestamp for all changes
    if (operation === 'update') {
      data.updatedAt = new Date().toISOString()
    }

    // Handle workflow step transitions
    if (data.currentStep && originalDoc?.currentStep && data.currentStep !== originalDoc.currentStep) {
      dbLogger.info('Workflow step transition', {
        sessionId: originalDoc.id,
        projectId: data.project || originalDoc.project,
        from: originalDoc.currentStep,
        to: data.currentStep,
      })

      // Log the step transition in conversation history
      if (!data.conversationHistory) {
        data.conversationHistory = originalDoc.conversationHistory || []
      }

      data.conversationHistory.push({
        id: Date.now().toString(),
        role: 'system',
        content: `Workflow advanced from ${originalDoc.currentStep} to ${data.currentStep}`,
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'step_transition',
          fromStep: originalDoc.currentStep,
          toStep: data.currentStep,
        },
      })
    }

    // Validate session state transitions
    const validTransitions = {
      'active': ['paused', 'completed', 'archived'],
      'paused': ['active', 'completed', 'archived'],
      'completed': ['archived'],
      'archived': [], // No transitions from archived
      'error': ['active', 'archived'],
    }

    if (originalDoc?.sessionState && data.sessionState && data.sessionState !== originalDoc.sessionState) {
      const allowedTransitions = validTransitions[originalDoc.sessionState] || []
      if (!allowedTransitions.includes(data.sessionState)) {
        throw new Error(`Invalid session state transition from ${originalDoc.sessionState} to ${data.sessionState}`)
      }
    }

    return data
  } catch (error) {
    dbLogger.error('Session state management failed', error as Error, {
      sessionId: originalDoc?.id,
      operation,
    })
    throw error
  }
}

/**
 * Media processing hook
 * Handles file metadata and triggers AI processing
 */
export const processMediaUpload: AfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  try {
    if (operation !== 'create' || !doc.filename) {
      return doc
    }

    const payload = req.payload

    // Generate metadata based on file type
    const fileExtension = doc.filename.split('.').pop()?.toLowerCase()
    const mediaType = inferMediaType(fileExtension, doc.mimeType)

    // Update the media document with inferred metadata
    await payload.update({
      collection: 'media',
      id: doc.id,
      data: {
        mediaType,
        status: 'processing',
        technicalData: {
          ...doc.technicalData,
          originalExtension: fileExtension,
          processedAt: new Date().toISOString(),
        },
      },
      depth: 0,
    })

    // Queue background processing for AI analysis
    if (shouldProcessWithAI(mediaType)) {
      await queueAIProcessing(doc.id, mediaType, doc.project)
    }

    dbLogger.info('Media upload processed', {
      mediaId: doc.id,
      projectId: doc.project,
      mediaType,
      filename: doc.filename,
    })

    return doc
  } catch (error) {
    dbLogger.error('Media processing failed', error as Error, {
      mediaId: doc.id,
      filename: doc.filename,
    })

    // Mark media as failed but don't throw - allow the upload to succeed
    try {
      await req.payload.update({
        collection: 'media',
        id: doc.id,
        data: { status: 'failed' },
        depth: 0,
      })
    } catch (updateError) {
      dbLogger.error('Failed to mark media as failed', updateError as Error)
    }

    return doc
  }
}

/**
 * User activity tracking hook
 */
export const trackUserActivity: AfterChangeHook = async ({
  doc,
  req,
  operation,
  collection,
}) => {
  try {
    // Skip if not a user-generated action
    if (!req.user?.id || operation === 'delete') {
      return doc
    }

    const payload = req.payload
    const userId = req.user.id
    const activityType = `${collection.slug}_${operation}`

    // Create activity record
    const activityData = {
      user: userId,
      type: activityType,
      resource: {
        collection: collection.slug,
        id: doc.id,
        title: doc.title || doc.name || doc.description || 'Untitled',
      },
      timestamp: new Date().toISOString(),
      metadata: {
        ip: req.ip || req.headers?.['x-forwarded-for'] || 'unknown',
        userAgent: req.headers?.['user-agent'] || 'unknown',
      },
    }

    // Store activity (if activity collection exists)
    try {
      await payload.create({
        collection: 'activities',
        data: activityData,
        depth: 0,
      })
    } catch (createError) {
      // Activities collection might not exist - log but don't fail
      dbLogger.debug('Activity tracking skipped - collection not found', {
        activityType,
        userId,
        resourceId: doc.id,
      })
    }

    return doc
  } catch (error) {
    dbLogger.error('User activity tracking failed', error as Error, {
      collection: collection.slug,
      docId: doc.id,
      userId: req.user?.id,
    })
    return doc
  }
}

/**
 * Cleanup orphaned resources hook
 */
export const cleanupOrphanedResources: AfterDeleteHook = async ({
  doc,
  req,
  collection,
}) => {
  try {
    const payload = req.payload

    // Clean up related resources when projects are deleted
    if (collection.slug === 'projects') {
      const projectId = doc.id

      // Delete associated sessions
      await payload.delete({
        collection: 'sessions',
        where: {
          project: { equals: projectId },
        },
      })

      // Delete associated media
      await payload.delete({
        collection: 'media',
        where: {
          project: { equals: projectId },
        },
      })

      dbLogger.info('Cleaned up resources for deleted project', {
        projectId,
        userId: req.user?.id,
      })
    }

    // Clean up sessions when users are deleted
    if (collection.slug === 'users') {
      const userId = doc.id

      await payload.update({
        collection: 'sessions',
        where: {
          user: { equals: userId },
        },
        data: {
          sessionState: 'archived',
          user: null, // Remove user reference
        },
      })

      dbLogger.info('Archived sessions for deleted user', {
        userId,
      })
    }

    return doc
  } catch (error) {
    dbLogger.error('Resource cleanup failed', error as Error, {
      collection: collection.slug,
      docId: doc.id,
    })
    return doc
  }
}

/**
 * Calculate project progress based on workflow completion
 */
async function calculateProjectProgress(payload: any, projectId: string): Promise<{
  overallProgress: number
  currentPhase: string
  completedSteps: string[]
}> {
  try {
    // Get project details
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 1,
    })

    // Get latest active session to determine current step
    const sessions = await payload.find({
      collection: 'sessions',
      where: {
        and: [
          { project: { equals: projectId } },
          { sessionState: { equals: 'active' } }
        ]
      },
      sort: '-updatedAt',
      limit: 1,
    })

    const currentSession = sessions.docs[0]
    const currentStep = currentSession?.currentStep || 'concept'

    // Get project media count for progress calculation
    const mediaResult = await payload.find({
      collection: 'media',
      where: {
        project: { equals: projectId },
      },
      limit: 1, // We just need the count
    })

    // Define workflow steps and their weights
    const workflowSteps = [
      { id: 'concept', weight: 10, name: 'Concept Development' },
      { id: 'story', weight: 20, name: 'Story Structure' },
      { id: 'characters', weight: 20, name: 'Character Design' },
      { id: 'storyboard', weight: 15, name: 'Storyboarding' },
      { id: 'assets', weight: 15, name: 'Asset Creation' },
      { id: 'production', weight: 15, name: 'Production' },
      { id: 'review', weight: 5, name: 'Review & Polish' },
    ]

    // Calculate completed steps based on current step
    const currentStepIndex = workflowSteps.findIndex(step => step.id === currentStep)
    const completedSteps = workflowSteps
      .slice(0, Math.max(0, currentStepIndex))
      .map(step => step.id)

    // Calculate progress percentage
    let baseProgress = 0
    if (currentStepIndex >= 0) {
      baseProgress = workflowSteps
        .slice(0, currentStepIndex)
        .reduce((sum, step) => sum + step.weight, 0)
    }

    // Add bonus progress for media uploads and session activity
    const mediaBonus = Math.min(10, mediaResult.totalDocs * 2) // Max 10% bonus for media
    const sessionBonus = currentSession?.conversationHistory?.length ? 
      Math.min(5, Math.floor(currentSession.conversationHistory.length / 10)) : 0 // Max 5% bonus for conversation

    const overallProgress = Math.min(100, baseProgress + mediaBonus + sessionBonus)

    return {
      overallProgress,
      currentPhase: workflowSteps[currentStepIndex]?.name || 'Unknown',
      completedSteps,
    }
  } catch (error) {
    dbLogger.error('Progress calculation failed', error as Error, { projectId })
    return {
      overallProgress: 0,
      currentPhase: 'concept',
      completedSteps: [],
    }
  }
}

/**
 * Infer media type from file extension and MIME type
 */
function inferMediaType(extension?: string, mimeType?: string): string {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const videoExtensions = ['mp4', 'webm', 'mov', 'avi']
  const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a']
  
  if (extension) {
    if (imageExtensions.includes(extension)) return 'style_reference'
    if (videoExtensions.includes(extension)) return 'video_segment'
    if (audioExtensions.includes(extension)) return 'audio_clip'
  }
  
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'style_reference'
    if (mimeType.startsWith('video/')) return 'video_segment'
    if (mimeType.startsWith('audio/')) return 'audio_clip'
  }
  
  return 'reference_material'
}

/**
 * Determine if media should be processed with AI
 */
function shouldProcessWithAI(mediaType: string): boolean {
  const aiProcessableTypes = [
    'style_reference',
    'character_design',
    'concept_art',
    'storyboard',
  ]
  
  return aiProcessableTypes.includes(mediaType)
}

/**
 * Queue AI processing for media
 */
async function queueAIProcessing(
  mediaId: string,
  mediaType: string,
  projectId: string
): Promise<void> {
  try {
    // TODO: Integration with background job queue (Redis, Bull, etc.)
    dbLogger.info('AI processing queued', {
      mediaId,
      mediaType,
      projectId,
    })
    
    // For now, just log that we would queue this
    // In production, this would integrate with a job queue system
  } catch (error) {
    dbLogger.error('Failed to queue AI processing', error as Error, {
      mediaId,
      mediaType,
      projectId,
    })
  }
}

/**
 * Export all hooks for use in collection configurations
 */
export const payloadHooks = {
  // Collection-specific hooks
  projects: {
    afterChange: [updateProjectProgress, trackUserActivity],
    afterDelete: [cleanupOrphanedResources],
  },
  sessions: {
    beforeChange: [manageSessionState],
    afterChange: [updateProjectProgress, trackUserActivity],
  },
  media: {
    afterChange: [processMediaUpload, updateProjectProgress, trackUserActivity],
  },
  users: {
    afterDelete: [cleanupOrphanedResources],
    afterChange: [trackUserActivity],
  },
}

export default payloadHooks