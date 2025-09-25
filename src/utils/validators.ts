/**
 * Input Validation Utilities
 * Centralized validation functions for API requests and form data
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  data?: any
}

/**
 * Project validation
 */
export interface ProjectInput {
  title: string
  description?: string
  genre: string
  episodeCount: number
  targetAudience?: string
}

export function validateProject(input: any): ValidationResult {
  const errors: string[] = []
  
  // Title validation
  if (!input.title || typeof input.title !== 'string') {
    errors.push('Title is required and must be a string')
  } else if (input.title.length < 2 || input.title.length > 100) {
    errors.push('Title must be between 2 and 100 characters')
  }
  
  // Description validation (optional)
  if (input.description && typeof input.description !== 'string') {
    errors.push('Description must be a string')
  } else if (input.description && input.description.length > 1000) {
    errors.push('Description must be less than 1000 characters')
  }
  
  // Genre validation
  const validGenres = [
    'action', 'adventure', 'animation', 'comedy', 'crime', 'documentary',
    'drama', 'fantasy', 'horror', 'mystery', 'romance', 'sci-fi',
    'thriller', 'war', 'western', 'biography', 'history', 'music',
    'sport', 'family', 'musical'
  ]
  
  if (!input.genre || typeof input.genre !== 'string') {
    errors.push('Genre is required and must be a string')
  } else if (!validGenres.includes(input.genre.toLowerCase())) {
    errors.push(`Genre must be one of: ${validGenres.join(', ')}`)
  }
  
  // Episode count validation
  if (!input.episodeCount || typeof input.episodeCount !== 'number') {
    errors.push('Episode count is required and must be a number')
  } else if (input.episodeCount < 1 || input.episodeCount > 50) {
    errors.push('Episode count must be between 1 and 50')
  } else if (!Number.isInteger(input.episodeCount)) {
    errors.push('Episode count must be a whole number')
  }
  
  // Target audience validation (optional)
  const validAudiences = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA']
  if (input.targetAudience && !validAudiences.includes(input.targetAudience)) {
    errors.push(`Target audience must be one of: ${validAudiences.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      title: input.title,
      description: input.description || '',
      genre: input.genre.toLowerCase(),
      episodeCount: input.episodeCount,
      targetAudience: input.targetAudience || 'PG'
    } : undefined
  }
}

/**
 * Chat message validation
 */
export interface ChatMessageInput {
  sessionId: string
  message: string
  attachments?: string[]
}

export function validateChatMessage(input: any): ValidationResult {
  const errors: string[] = []
  
  // Session ID validation
  if (!input.sessionId || typeof input.sessionId !== 'string') {
    errors.push('Session ID is required and must be a string')
  } else if (input.sessionId.length < 10) {
    errors.push('Invalid session ID format')
  }
  
  // Message validation
  if (!input.message || typeof input.message !== 'string') {
    errors.push('Message is required and must be a string')
  } else if (input.message.trim().length === 0) {
    errors.push('Message cannot be empty')
  } else if (input.message.length > 5000) {
    errors.push('Message must be less than 5000 characters')
  }
  
  // Attachments validation (optional)
  if (input.attachments) {
    if (!Array.isArray(input.attachments)) {
      errors.push('Attachments must be an array')
    } else if (input.attachments.length > 10) {
      errors.push('Maximum 10 attachments allowed per message')
    } else {
      input.attachments.forEach((attachment: any, index: number) => {
        if (typeof attachment !== 'string') {
          errors.push(`Attachment ${index + 1} must be a string (media ID)`)
        }
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      sessionId: input.sessionId,
      message: input.message.trim(),
      attachments: input.attachments || []
    } : undefined
  }
}

/**
 * Choice selection validation
 */
export interface ChoiceInput {
  sessionId: string
  choiceId: string
}

export function validateChoice(input: any): ValidationResult {
  const errors: string[] = []
  
  // Session ID validation
  if (!input.sessionId || typeof input.sessionId !== 'string') {
    errors.push('Session ID is required and must be a string')
  }
  
  // Choice ID validation
  if (!input.choiceId || typeof input.choiceId !== 'string') {
    errors.push('Choice ID is required and must be a string')
  } else if (input.choiceId.length < 3) {
    errors.push('Invalid choice ID format')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      sessionId: input.sessionId,
      choiceId: input.choiceId
    } : undefined
  }
}

/**
 * File upload validation
 */
export interface FileUploadInput {
  projectId: string
  files: any[]
  mediaType?: string
}

export function validateFileUpload(input: any): ValidationResult {
  const errors: string[] = []
  
  // Project ID validation
  if (!input.projectId || typeof input.projectId !== 'string') {
    errors.push('Project ID is required and must be a string')
  }
  
  // Files validation
  if (!input.files || !Array.isArray(input.files)) {
    errors.push('Files array is required')
  } else if (input.files.length === 0) {
    errors.push('At least one file is required')
  } else if (input.files.length > 10) {
    errors.push('Maximum 10 files allowed per upload')
  } else {
    // Validate each file
    input.files.forEach((file: any, index: number) => {
      if (!file || typeof file !== 'object') {
        errors.push(`File ${index + 1} is invalid`)
        return
      }
      
      if (!file.name || typeof file.name !== 'string') {
        errors.push(`File ${index + 1} must have a valid name`)
      }
      
      if (!file.size || typeof file.size !== 'number') {
        errors.push(`File ${index + 1} must have a valid size`)
      } else if (file.size > 50 * 1024 * 1024) { // 50MB limit
        errors.push(`File ${index + 1} exceeds 50MB size limit`)
      }
      
      if (!file.type || typeof file.type !== 'string') {
        errors.push(`File ${index + 1} must have a valid type`)
      } else {
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm', 'video/quicktime',
          'audio/mp3', 'audio/wav', 'audio/ogg',
          'application/pdf', 'text/plain', 'text/markdown'
        ]
        
        if (!allowedTypes.includes(file.type)) {
          errors.push(`File ${index + 1} type '${file.type}' is not allowed`)
        }
      }
    })
  }
  
  // Media type validation (optional)
  if (input.mediaType) {
    const validMediaTypes = [
      'style_reference', 'character_design', 'environment_design',
      'concept_art', 'storyboard', 'voice_profile', 'music_track',
      'sound_effect', 'reference_material'
    ]
    
    if (!validMediaTypes.includes(input.mediaType)) {
      errors.push(`Media type must be one of: ${validMediaTypes.join(', ')}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      projectId: input.projectId,
      files: input.files,
      mediaType: input.mediaType || 'reference_material'
    } : undefined
  }
}

/**
 * Session creation validation
 */
export interface SessionInput {
  projectId: string
  currentStep?: string
}

export function validateSession(input: any): ValidationResult {
  const errors: string[] = []
  
  // Project ID validation
  if (!input.projectId || typeof input.projectId !== 'string') {
    errors.push('Project ID is required and must be a string')
  }
  
  // Current step validation (optional)
  if (input.currentStep) {
    const validSteps = [
      'concept', 'story', 'characters', 'storyboard',
      'assets', 'production', 'editing', 'review', 'final'
    ]
    
    if (!validSteps.includes(input.currentStep)) {
      errors.push(`Current step must be one of: ${validSteps.join(', ')}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      projectId: input.projectId,
      currentStep: input.currentStep || 'concept'
    } : undefined
  }
}

/**
 * Email validation utility
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * URL validation utility
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, maxLength)
}

/**
 * Validate pagination parameters
 */
export interface PaginationInput {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function validatePagination(input: any): ValidationResult {
  const errors: string[] = []
  
  // Page validation
  if (input.page !== undefined) {
    if (typeof input.page !== 'number' || input.page < 1) {
      errors.push('Page must be a positive number starting from 1')
    }
  }
  
  // Limit validation
  if (input.limit !== undefined) {
    if (typeof input.limit !== 'number' || input.limit < 1 || input.limit > 100) {
      errors.push('Limit must be between 1 and 100')
    }
  }
  
  // Sort order validation
  if (input.sortOrder && !['asc', 'desc'].includes(input.sortOrder)) {
    errors.push('Sort order must be "asc" or "desc"')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      page: input.page || 1,
      limit: input.limit || 20,
      sortBy: input.sortBy || 'createdAt',
      sortOrder: input.sortOrder || 'desc'
    } : undefined
  }
}

/**
 * Generic object validation helper
 */
export function validateRequired(obj: any, requiredFields: string[]): string[] {
  const errors: string[] = []
  
  requiredFields.forEach(field => {
    if (!obj[field]) {
      errors.push(`${field} is required`)
    }
  })
  
  return errors
}

export default {
  validateProject,
  validateChatMessage,
  validateChoice,
  validateFileUpload,
  validateSession,
  validateEmail,
  validateUrl,
  sanitizeString,
  validatePagination,
  validateRequired,
}