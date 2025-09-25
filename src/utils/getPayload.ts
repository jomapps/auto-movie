/**
 * PayloadCMS Utility Functions
 * Helper functions for PayloadCMS operations following constitution requirements
 */

import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Get configured PayloadCMS instance
 * Uses singleton pattern to avoid multiple initializations
 */
let payloadInstance: any = null

export async function getPayloadInstance() {
  if (!payloadInstance) {
    payloadInstance = await getPayload({ config })
  }
  return payloadInstance
}

/**
 * Collection operation helpers
 */

/**
 * Find documents with error handling
 */
export async function findDocuments(
  collection: string,
  options: any = {}
) {
  try {
    const payload = await getPayloadInstance()
    return await payload.find({
      collection,
      ...options,
    })
  } catch (error) {
    console.error(`Error finding documents in ${collection}:`, error)
    throw new Error(`Failed to fetch ${collection}`)
  }
}

/**
 * Find document by ID with error handling
 */
export async function findDocumentById(
  collection: string,
  id: string,
  options: any = {}
) {
  try {
    const payload = await getPayloadInstance()
    return await payload.findByID({
      collection,
      id,
      ...options,
    })
  } catch (error) {
    console.error(`Error finding ${collection} by ID ${id}:`, error)
    throw new Error(`Failed to fetch ${collection} with ID: ${id}`)
  }
}

/**
 * Create document with error handling
 */
export async function createDocument(
  collection: string,
  data: any,
  options: any = {}
) {
  try {
    const payload = await getPayloadInstance()
    return await payload.create({
      collection,
      data,
      ...options,
    })
  } catch (error) {
    console.error(`Error creating ${collection}:`, error)
    throw new Error(`Failed to create ${collection}`)
  }
}

/**
 * Update document with error handling
 */
export async function updateDocument(
  collection: string,
  id: string,
  data: any,
  options: any = {}
) {
  try {
    const payload = await getPayloadInstance()
    return await payload.update({
      collection,
      id,
      data,
      ...options,
    })
  } catch (error) {
    console.error(`Error updating ${collection} ${id}:`, error)
    throw new Error(`Failed to update ${collection}`)
  }
}

/**
 * Delete document with error handling
 */
export async function deleteDocument(
  collection: string,
  id: string,
  options: any = {}
) {
  try {
    const payload = await getPayloadInstance()
    return await payload.delete({
      collection,
      id,
      ...options,
    })
  } catch (error) {
    console.error(`Error deleting ${collection} ${id}:`, error)
    throw new Error(`Failed to delete ${collection}`)
  }
}

/**
 * Project-specific utilities
 */

/**
 * Find projects by user
 */
export async function findProjectsByUser(
  userId: string,
  options: { page?: number; limit?: number; sort?: string } = {}
) {
  return findDocuments('projects', {
    where: {
      or: [
        { createdBy: { equals: userId } },
        { collaborators: { contains: userId } }
      ]
    },
    page: options.page || 1,
    limit: options.limit || 20,
    sort: options.sort || '-updatedAt',
    depth: 1,
  })
}

/**
 * Find active sessions for user
 */
export async function findActiveSessionsByUser(userId: string) {
  return findDocuments('sessions', {
    where: {
      and: [
        { user: { equals: userId } },
        { sessionState: { equals: 'active' } }
      ]
    },
    sort: '-updatedAt',
    depth: 2,
  })
}

/**
 * Find project media
 */
export async function findProjectMedia(
  projectId: string,
  options: { 
    mediaType?: string; 
    page?: number; 
    limit?: number;
    agentGenerated?: boolean;
  } = {}
) {
  const where: any = { project: { equals: projectId } }
  
  if (options.mediaType) {
    where.mediaType = { equals: options.mediaType }
  }
  
  if (options.agentGenerated !== undefined) {
    where.agentGenerated = { equals: options.agentGenerated }
  }
  
  return findDocuments('media', {
    where,
    page: options.page || 1,
    limit: options.limit || 50,
    sort: '-createdAt',
  })
}

/**
 * Session utilities
 */

/**
 * Create or update session
 */
export async function upsertSession(
  projectId: string,
  userId: string,
  sessionData: any = {}
) {
  try {
    // Try to find existing active session
    const existingSessions = await findDocuments('sessions', {
      where: {
        and: [
          { project: { equals: projectId } },
          { user: { equals: userId } },
          { sessionState: { equals: 'active' } }
        ]
      },
      limit: 1,
    })

    if (existingSessions.docs.length > 0) {
      // Update existing session
      return updateDocument('sessions', existingSessions.docs[0].id, {
        ...sessionData,
        updatedAt: new Date().toISOString(),
      })
    } else {
      // Create new session
      return createDocument('sessions', {
        project: projectId,
        user: userId,
        currentStep: 'concept',
        conversationHistory: [],
        sessionState: 'active',
        awaitingUserInput: false,
        ...sessionData,
      })
    }
  } catch (error) {
    console.error('Error upserting session:', error)
    throw new Error('Failed to create or update session')
  }
}

/**
 * Add message to session
 */
export async function addMessageToSession(
  sessionId: string,
  message: {
    role: 'user' | 'assistant' | 'system'
    content: string
    attachments?: string[]
    metadata?: any
  }
) {
  try {
    const session = await findDocumentById('sessions', sessionId)
    
    const newMessage = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...message,
    }
    
    const updatedHistory = [
      ...(session.conversationHistory || []),
      newMessage,
    ]
    
    return updateDocument('sessions', sessionId, {
      conversationHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error adding message to session:', error)
    throw new Error('Failed to add message to session')
  }
}

/**
 * Update project progress
 */
export async function updateProjectProgress(
  projectId: string,
  progress: {
    overallProgress?: number
    currentPhase?: string
    completedSteps?: string[]
  }
) {
  try {
    const project = await findDocumentById('projects', projectId)
    
    const updatedProgress = {
      ...project.progress,
      ...progress,
    }
    
    return updateDocument('projects', projectId, {
      progress: updatedProgress,
    })
  } catch (error) {
    console.error('Error updating project progress:', error)
    throw new Error('Failed to update project progress')
  }
}

/**
 * Media utilities
 */

/**
 * Process uploaded media file
 */
export async function processUploadedMedia(
  file: any,
  projectId: string,
  options: {
    mediaType?: string
    description?: string
    agentGenerated?: boolean
    generationMetadata?: any
  } = {}
) {
  try {
    const mediaData = {
      project: projectId,
      mediaType: options.mediaType || 'reference_material',
      description: options.description || file.filename,
      agentGenerated: options.agentGenerated || false,
      generationMetadata: options.generationMetadata,
      status: 'active',
      version: 1,
      tags: [],
      relatedElements: {},
    }
    
    return createDocument('media', mediaData)
  } catch (error) {
    console.error('Error processing uploaded media:', error)
    throw new Error('Failed to process media upload')
  }
}

/**
 * Search utilities
 */

/**
 * Search across collections
 */
export async function searchGlobal(
  query: string,
  collections: string[] = ['projects', 'media'],
  options: { limit?: number; userId?: string } = {}
) {
  const results: any = {}
  
  for (const collection of collections) {
    try {
      let where: any = {}
      
      // Add user filtering for projects
      if (collection === 'projects' && options.userId) {
        where = {
          and: [
            {
              or: [
                { createdBy: { equals: options.userId } },
                { collaborators: { contains: options.userId } }
              ]
            },
            {
              or: [
                { title: { contains: query } },
                { description: { contains: query } }
              ]
            }
          ]
        }
      } else if (collection === 'media') {
        where = {
          or: [
            { description: { contains: query } },
            { tags: { contains: query } }
          ]
        }
      }
      
      const searchResults = await findDocuments(collection, {
        where,
        limit: options.limit || 10,
        sort: '-updatedAt',
      })
      
      results[collection] = searchResults.docs
    } catch (error) {
      console.error(`Error searching ${collection}:`, error)
      results[collection] = []
    }
  }
  
  return results
}

/**
 * Authentication helpers
 */

/**
 * Verify user access to project
 */
export async function verifyProjectAccess(
  projectId: string,
  userId: string
): Promise<boolean> {
  try {
    const project = await findDocumentById('projects', projectId, {
      depth: 1,
    })
    
    // Check if user is creator or collaborator
    const isCreator = project.createdBy?.id === userId || project.createdBy === userId
    const isCollaborator = project.collaborators?.some(
      (collab: any) => collab.id === userId || collab === userId
    )
    
    return isCreator || isCollaborator
  } catch (error) {
    console.error('Error verifying project access:', error)
    return false
  }
}

/**
 * Verify user access to session
 */
export async function verifySessionAccess(
  sessionId: string,
  userId: string
): Promise<boolean> {
  try {
    const session = await findDocumentById('sessions', sessionId, {
      depth: 1,
    })
    
    // Check if user owns the session
    const isOwner = session.user?.id === userId || session.user === userId
    
    // Also check if user has access to the project
    const hasProjectAccess = await verifyProjectAccess(
      session.project?.id || session.project,
      userId
    )
    
    return isOwner || hasProjectAccess
  } catch (error) {
    console.error('Error verifying session access:', error)
    return false
  }
}

/**
 * Cleanup utilities
 */

/**
 * Archive old sessions
 */
export async function archiveOldSessions(daysOld: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const payload = await getPayloadInstance()
    
    const result = await payload.update({
      collection: 'sessions',
      where: {
        and: [
          { updatedAt: { less_than: cutoffDate.toISOString() } },
          { sessionState: { not_equals: 'active' } }
        ]
      },
      data: {
        sessionState: 'archived',
      },
    })
    
    return result
  } catch (error) {
    console.error('Error archiving old sessions:', error)
    throw new Error('Failed to archive old sessions')
  }
}

export default {
  getPayloadInstance,
  findDocuments,
  findDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  findProjectsByUser,
  findActiveSessionsByUser,
  findProjectMedia,
  upsertSession,
  addMessageToSession,
  updateProjectProgress,
  processUploadedMedia,
  searchGlobal,
  verifyProjectAccess,
  verifySessionAccess,
  archiveOldSessions,
}