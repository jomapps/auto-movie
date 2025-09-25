/**
 * Response Formatters
 * Standardized response formatting utilities
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  meta?: {
    timestamp: string
    requestId?: string
    pagination?: PaginationMeta
    performance?: PerformanceMeta
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PerformanceMeta {
  duration: number
  cached?: boolean
}

/**
 * Format successful API response
 */
export function formatSuccess<T>(
  data: T,
  message?: string,
  meta?: Partial<ApiResponse['meta']>
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }
}

/**
 * Format error API response
 */
export function formatError(
  error: string,
  statusCode?: number,
  meta?: Partial<ApiResponse['meta']>
): ApiResponse {
  return {
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  }
}

/**
 * Format paginated response
 */
export function formatPaginated<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / limit)
  
  return formatSuccess(data, message, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  })
}

/**
 * Format project data
 */
export interface FormattedProject {
  id: string
  title: string
  description: string
  genre: string
  status: string
  episodeCount: number
  targetAudience: string
  progress: {
    overallProgress: number
    currentPhase: string
    completedSteps: string[]
  }
  settings: {
    aspectRatio: string
    episodeDuration: number
    qualityTier: string
  }
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
    collaborators: number
    totalSessions: number
    totalMedia: number
  }
}

export function formatProject(project: any): FormattedProject {
  return {
    id: project.id,
    title: project.title,
    description: project.description || '',
    genre: project.genre,
    status: project.status,
    episodeCount: project.episodeCount,
    targetAudience: project.targetAudience || 'PG',
    progress: {
      overallProgress: project.progress?.overallProgress || 0,
      currentPhase: project.progress?.currentPhase || 'concept',
      completedSteps: project.progress?.completedSteps || [],
    },
    settings: {
      aspectRatio: project.projectSettings?.aspectRatio || '16:9',
      episodeDuration: project.projectSettings?.episodeDuration || 30,
      qualityTier: project.projectSettings?.qualityTier || 'standard',
    },
    metadata: {
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      createdBy: project.createdBy?.name || project.createdBy,
      collaborators: project.collaborators?.length || 0,
      totalSessions: project._count?.sessions || 0,
      totalMedia: project._count?.media || 0,
    },
  }
}

/**
 * Format chat session data
 */
export interface FormattedSession {
  id: string
  projectId: string
  projectTitle: string
  currentStep: string
  status: string
  lastActivity: string
  messageCount: number
  metadata: {
    createdAt: string
    updatedAt: string
    userId: string
    duration?: number
  }
}

export function formatSession(session: any): FormattedSession {
  return {
    id: session.id,
    projectId: session.project?.id || session.projectId,
    projectTitle: session.project?.title || 'Unknown Project',
    currentStep: session.currentStep,
    status: session.sessionState,
    lastActivity: session.updatedAt,
    messageCount: session.conversationHistory?.length || 0,
    metadata: {
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      userId: session.user?.id || session.userId,
      duration: session.metadata?.duration,
    },
  }
}

/**
 * Format media asset data
 */
export interface FormattedMedia {
  id: string
  projectId: string
  type: string
  name: string
  description: string
  url?: string
  thumbnailUrl?: string
  metadata: {
    createdAt: string
    size?: number
    duration?: number
    resolution?: string
    agentGenerated: boolean
    generationData?: {
      agentId: string
      prompt: string
      modelVersion: string
    }
  }
  tags: string[]
  relatedElements: {
    characters?: string[]
    episode?: number
    scene?: string
  }
}

export function formatMedia(media: any): FormattedMedia {
  return {
    id: media.id,
    projectId: media.project?.id || media.projectId,
    type: media.mediaType,
    name: media.filename || media.description || 'Untitled',
    description: media.description || '',
    url: media.url,
    thumbnailUrl: media.thumbnailUrl,
    metadata: {
      createdAt: media.createdAt,
      size: media.filesize,
      duration: media.technicalData?.duration,
      resolution: media.technicalData?.resolution,
      agentGenerated: media.agentGenerated || false,
      generationData: media.generationMetadata ? {
        agentId: media.generationMetadata.agentId,
        prompt: media.generationMetadata.promptUsed,
        modelVersion: media.generationMetadata.modelVersion,
      } : undefined,
    },
    tags: media.tags || [],
    relatedElements: {
      characters: media.relatedElements?.characters,
      episode: media.relatedElements?.episode,
      scene: media.relatedElements?.scene,
    },
  }
}

/**
 * Format chat message
 */
export interface FormattedMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  attachments?: FormattedAttachment[]
  metadata?: {
    type?: string
    processed?: boolean
    tokens?: number
    model?: string
  }
}

export interface FormattedAttachment {
  id: string
  type: string
  name: string
  url?: string
  thumbnailUrl?: string
}

export function formatMessage(message: any): FormattedMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp,
    attachments: message.attachments?.map((attachment: any) => ({
      id: attachment.id,
      type: attachment.mediaType,
      name: attachment.description || attachment.filename,
      url: attachment.url,
      thumbnailUrl: attachment.thumbnailUrl,
    })),
    metadata: {
      type: message.metadata?.type,
      processed: message.metadata?.processed,
      tokens: message.metadata?.tokens,
      model: message.metadata?.model,
    },
  }
}

/**
 * Format workflow progress
 */
export interface FormattedProgress {
  overallProgress: number
  currentStep: string
  steps: FormattedStep[]
  estimatedCompletion?: string
  lastActivity: string
}

export interface FormattedStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  progress: number
  estimatedTime: string
  tasks: FormattedTask[]
}

export interface FormattedTask {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  progress: number
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedTime: string
}

export function formatProgress(workflow: any): FormattedProgress {
  return {
    overallProgress: workflow.overallProgress || 0,
    currentStep: workflow.currentStep,
    steps: workflow.steps?.map((step: any) => ({
      id: step.id,
      title: step.title,
      description: step.description,
      status: step.completed ? 'completed' : step.current ? 'in_progress' : 'pending',
      progress: step.progress || 0,
      estimatedTime: step.estimatedDuration,
      tasks: step.tasks?.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        progress: task.progress,
        difficulty: task.difficulty,
        estimatedTime: task.estimatedTime,
      })) || [],
    })) || [],
    estimatedCompletion: workflow.estimatedCompletion,
    lastActivity: workflow.updatedAt,
  }
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format duration (seconds to human readable)
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`
  
  return formatDate(date)
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export default {
  formatSuccess,
  formatError,
  formatPaginated,
  formatProject,
  formatSession,
  formatMedia,
  formatMessage,
  formatProgress,
  formatFileSize,
  formatDuration,
  formatDate,
  formatRelativeTime,
  truncateText,
}