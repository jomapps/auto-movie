/**
 * Production Integration Types
 * Types for Celery task integration, LangGraph workflows, and production sync
 */

// ==================== Celery Task Types ====================

export type CeleryTaskType =
  | 'character_sheet_generation'
  | 'scene_processing'
  | 'episode_generation'
  | 'audio_generation'
  | 'video_generation'
  | 'lipsync_processing'
  | 'image_generation'
  | 'style_transfer'

export type CeleryTaskStatus =
  | 'PENDING'
  | 'STARTED'
  | 'RETRY'
  | 'FAILURE'
  | 'SUCCESS'
  | 'REVOKED'

export interface CeleryTaskMetadata {
  projectId: string
  sessionId?: string
  userId?: string
  characterId?: string
  sceneId?: string
  episodeId?: string
  priority?: 'low' | 'normal' | 'high' | 'critical'
  retryCount?: number
  maxRetries?: number
  timeout?: number
  [key: string]: any
}

export interface CeleryTaskRequest {
  taskType: CeleryTaskType
  taskData: Record<string, any>
  metadata: CeleryTaskMetadata
  options?: {
    queue?: string
    routing_key?: string
    countdown?: number
    eta?: Date
    expires?: Date
  }
}

export interface CeleryTaskResult<T = any> {
  taskId: string
  status: CeleryTaskStatus
  result?: T
  error?: {
    type: string
    message: string
    traceback?: string
  }
  metadata?: {
    startedAt?: string
    completedAt?: string
    workerName?: string
    executionTime?: number
    retries?: number
  }
}

export interface CeleryTaskStatusResponse {
  taskId: string
  status: CeleryTaskStatus
  progress?: number
  progressMessage?: string
  result?: any
  error?: string
  traceback?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Character Sheet Generation Task
export interface CharacterSheetGenerationData {
  characterId: string
  characterName: string
  characterDescription: string
  styleReferences?: string[]
  outputFormat?: 'png' | 'jpg' | 'webp'
  resolution?: string
}

export interface CharacterSheetGenerationResult {
  characterId: string
  imageUrl: string
  thumbnailUrl?: string
  metadata: {
    generationTime: number
    model: string
    styleUsed?: string
  }
}

// Scene Processing Task
export interface SceneProcessingData {
  sceneId: string
  sceneDescription: string
  characterIds: string[]
  duration?: number
  audioEnabled?: boolean
  videoEnabled?: boolean
}

export interface SceneProcessingResult {
  sceneId: string
  audioUrl?: string
  videoUrl?: string
  thumbnailUrl?: string
  duration: number
  metadata: Record<string, any>
}

// Episode Generation Task
export interface EpisodeGenerationData {
  episodeId: string
  sceneIds: string[]
  transitions?: string[]
  backgroundColor?: string
  audioMixing?: boolean
}

export interface EpisodeGenerationResult {
  episodeId: string
  videoUrl: string
  duration: number
  scenes: Array<{
    sceneId: string
    startTime: number
    endTime: number
  }>
  metadata: Record<string, any>
}

// ==================== LangGraph Workflow Types ====================

export type WorkflowType =
  | 'character_development'
  | 'scene_breakdown'
  | 'episode_assembly'
  | 'story_generation'
  | 'dialogue_generation'
  | 'quality_review'

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface WorkflowNode {
  id: string
  type: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input?: any
  output?: any
  error?: string
  startedAt?: string
  completedAt?: string
  executionTime?: number
}

export interface WorkflowEdge {
  source: string
  target: string
  condition?: string
}

export interface WorkflowGraph {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  currentNode?: string
}

export interface WorkflowRequest {
  type: WorkflowType
  projectId: string
  input: Record<string, any>
  config?: {
    maxRetries?: number
    timeout?: number
    parallelExecution?: boolean
    checkpointing?: boolean
  }
  metadata?: {
    sessionId?: string
    userId?: string
    priority?: 'low' | 'normal' | 'high'
  }
}

export interface WorkflowResponse {
  workflowId: string
  type: WorkflowType
  status: WorkflowStatus
  projectId: string
  progress: number
  currentStep?: string
  graph?: WorkflowGraph
  result?: any
  error?: {
    message: string
    step?: string
    details?: any
  }
  metadata?: {
    createdAt: string
    startedAt?: string
    completedAt?: string
    estimatedCompletion?: string
    executionTime?: number
  }
}

export interface WorkflowCheckpoint {
  workflowId: string
  checkpointId: string
  step: string
  state: Record<string, any>
  createdAt: string
}

// Workflow-specific types
export interface CharacterDevelopmentWorkflow {
  characterCount: number
  genre: string
  characterTraits?: string[]
  relationships?: boolean
  visualDesign?: boolean
}

export interface SceneBreakdownWorkflow {
  storyOutline: string
  episodeCount: number
  scenesPerEpisode?: number
  detailLevel?: 'basic' | 'detailed' | 'extensive'
}

export interface EpisodeAssemblyWorkflow {
  episodeId: string
  sceneIds: string[]
  audioTracks?: string[]
  visualEffects?: string[]
  transitions?: string[]
}

// ==================== Production Sync Types ====================

export interface ProductionUpdate {
  type: 'task_update' | 'workflow_update' | 'system_notification'
  source: 'celery' | 'langgraph' | 'system'
  entityId: string // taskId or workflowId
  entityType: 'task' | 'workflow'
  status: string
  progress?: number
  message?: string
  data?: any
  timestamp: string
}

export interface ProductionNotification {
  id: string
  sessionId: string
  projectId?: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  action?: {
    label: string
    url?: string
    callback?: string
  }
  dismissed?: boolean
  createdAt: string
  expiresAt?: string
}

export interface ProductionStatusSummary {
  projectId: string
  tasks: {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
  }
  workflows: {
    total: number
    running: number
    completed: number
    failed: number
  }
  lastUpdated: string
}

// ==================== Webhook Types ====================

export interface CeleryWebhookPayload {
  taskId: string
  taskType: string
  status: CeleryTaskStatus
  result?: any
  error?: string
  metadata?: Record<string, any>
  timestamp: string
}

export interface LangGraphWebhookPayload {
  workflowId: string
  workflowType: string
  status: WorkflowStatus
  currentStep?: string
  progress: number
  result?: any
  error?: string
  timestamp: string
}

// ==================== Error Types ====================

export interface ProductionError {
  code: string
  message: string
  source: 'celery' | 'langgraph' | 'sync'
  taskId?: string
  workflowId?: string
  details?: any
  timestamp: string
  recoverable: boolean
  retryable: boolean
}

// ==================== Configuration Types ====================

export interface CeleryBridgeConfig {
  baseUrl: string
  apiKey: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  pollingInterval: number
}

export interface LangGraphBridgeConfig {
  baseUrl: string
  apiKey: string
  timeout: number
  checkpointingEnabled: boolean
  maxConcurrentWorkflows: number
}

export interface ProductionSyncConfig {
  celeryPollingInterval: number
  langgraphPollingInterval: number
  batchSize: number
  notificationTTL: number
  enableWebhooks: boolean
  webhookSecret?: string
}