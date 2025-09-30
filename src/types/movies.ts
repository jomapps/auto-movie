/**
 * Type definitions for Movie Generation API
 */

import { z } from 'zod'

// Movie generation request types
export interface MovieGenerationRequest {
  projectId: string
  title: string
  description: string
  genre: 'action' | 'comedy' | 'drama' | 'scifi' | 'fantasy' | 'horror' | 'documentary' | 'animation'
  episodeCount: number
  episodeDuration?: number
  style?: {
    visualStyle?: string
    musicStyle?: string
    narrativeTone?: string
  }
  settings?: {
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3'
    qualityTier?: 'draft' | 'standard' | 'premium'
    autoPublish?: boolean
  }
}

// Movie generation job status
export type MovieGenerationStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

// Movie generation job response
export interface MovieGenerationJob {
  jobId: string
  sessionId: string
  projectId: string
  status: MovieGenerationStatus
  message: string
  estimatedTime?: number
  createdAt: string
}

// Movie generation status response
export interface MovieGenerationStatusResponse {
  jobId: string
  sessionId: string
  status: MovieGenerationStatus
  progress: number
  createdAt: string
  updatedAt: string
  project?: {
    id: string
    title: string
    status: string
  }
  message: string
  currentStep?: string
  estimatedTimeRemaining?: number
  result?: {
    mediaCount: number
    duration: number
    outputUrl: string | null
  }
  error?: string
  errorCode?: string
}

// Movie list item
export interface MovieListItem {
  id: string
  jobId: string | null
  projectId: string | null
  project: {
    id: string
    title: string
    genre: string
  } | null
  status: MovieGenerationStatus
  progress: number
  result: any
  error: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
  details?: any
}

// Pagination info
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
  hasNext: boolean
  hasPrev: boolean
}

// Movie list response
export interface MovieListResponse {
  movies: MovieListItem[]
  pagination: PaginationInfo
}

// Validation schemas
export const movieGenerationRequestSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  genre: z.enum([
    'action',
    'comedy',
    'drama',
    'scifi',
    'fantasy',
    'horror',
    'documentary',
    'animation',
  ]),
  episodeCount: z.number().int().min(1).max(50),
  episodeDuration: z.number().int().min(5).max(120).optional().default(30),
  style: z
    .object({
      visualStyle: z.string().optional(),
      musicStyle: z.string().optional(),
      narrativeTone: z.string().optional(),
    })
    .optional(),
  settings: z
    .object({
      aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3']).optional().default('16:9'),
      qualityTier: z.enum(['draft', 'standard', 'premium']).optional().default('standard'),
      autoPublish: z.boolean().optional().default(false),
    })
    .optional(),
})

// Error codes
export enum MovieApiErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  JOB_NOT_FOUND = 'JOB_NOT_FOUND',
  MISSING_JOB_ID = 'MISSING_JOB_ID',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  GENERATION_ERROR = 'GENERATION_ERROR',
  SUBSCRIPTION_LIMIT = 'SUBSCRIPTION_LIMIT',
}