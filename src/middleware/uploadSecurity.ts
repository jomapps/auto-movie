/**
 * File Upload Security and Validation
 * Comprehensive security measures for file uploads
 */

import { NextRequest } from 'next/server'
import crypto from 'crypto'
import path from 'path'

export interface FileSecurityResult {
  isValid: boolean
  errors: string[]
  sanitizedFileName?: string
  fileHash?: string
  metadata?: {
    originalName: string
    size: number
    mimeType: string
    extension: string
  }
}

/**
 * Allowed file types with MIME type validation
 */
export const ALLOWED_FILE_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  
  // Videos
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  
  // Audio
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'audio/x-m4a': ['.m4a'],
  
  // Documents
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'application/json': ['.json'],
  
  // Archives (for project imports)
  'application/zip': ['.zip'],
  'application/x-tar': ['.tar'],
  'application/gzip': ['.gz'],
}

/**
 * File size limits by category (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,      // 10MB
  video: 100 * 1024 * 1024,     // 100MB
  audio: 20 * 1024 * 1024,      // 20MB
  document: 5 * 1024 * 1024,    // 5MB
  archive: 50 * 1024 * 1024,    // 50MB
}

/**
 * Get file category from MIME type
 */
function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip')) return 'archive'
  return 'document'
}

/**
 * Validate file security and sanitize filename
 */
export async function validateFileUpload(
  file: File,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    projectId?: string
    userId?: string
  } = {}
): Promise<FileSecurityResult> {
  const errors: string[] = []
  const originalName = file.name
  const size = file.size
  const mimeType = file.type
  const extension = path.extname(originalName).toLowerCase()

  // 1. File size validation
  const category = getFileCategory(mimeType)
  const maxSize = options.maxSize || FILE_SIZE_LIMITS[category] || FILE_SIZE_LIMITS.document
  
  if (size > maxSize) {
    errors.push(`File size (${formatFileSize(size)}) exceeds limit (${formatFileSize(maxSize)})`)
  }

  if (size === 0) {
    errors.push('File appears to be empty')
  }

  // 2. MIME type validation
  const allowedTypes = options.allowedTypes || Object.keys(ALLOWED_FILE_TYPES)
  if (!allowedTypes.includes(mimeType)) {
    errors.push(`File type '${mimeType}' is not allowed`)
  }

  // 3. File extension validation
  if (ALLOWED_FILE_TYPES[mimeType] && !ALLOWED_FILE_TYPES[mimeType].includes(extension)) {
    errors.push(`File extension '${extension}' does not match MIME type '${mimeType}'`)
  }

  // 4. Filename security validation
  const filenameSecurity = validateFilename(originalName)
  if (!filenameSecurity.isValid) {
    errors.push(...filenameSecurity.errors)
  }

  // 5. File content validation (for security)
  const contentValidation = await validateFileContent(file)
  if (!contentValidation.isValid) {
    errors.push(...contentValidation.errors)
  }

  // Generate file hash for deduplication
  let fileHash: string | undefined
  try {
    const buffer = await file.arrayBuffer()
    fileHash = crypto.createHash('sha256').update(new Uint8Array(buffer)).digest('hex')
  } catch (error) {
    console.error('Error generating file hash:', error)
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedFileName: filenameSecurity.sanitizedName,
    fileHash,
    metadata: {
      originalName,
      size,
      mimeType,
      extension,
    }
  }
}

/**
 * Validate and sanitize filename
 */
function validateFilename(filename: string): {
  isValid: boolean
  errors: string[]
  sanitizedName: string
} {
  const errors: string[] = []
  
  // Check filename length
  if (filename.length > 255) {
    errors.push('Filename is too long (max 255 characters)')
  }

  if (filename.length === 0) {
    errors.push('Filename cannot be empty')
  }

  // Check for dangerous characters
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/
  if (dangerousChars.test(filename)) {
    errors.push('Filename contains dangerous characters')
  }

  // Check for dangerous filenames
  const dangerousNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ]
  
  const baseName = path.parse(filename).name.toUpperCase()
  if (dangerousNames.includes(baseName)) {
    errors.push('Filename uses a reserved system name')
  }

  // Sanitize filename
  let sanitizedName = filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_') // Replace dangerous chars
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255) // Limit length

  // Ensure filename has extension
  if (!path.extname(sanitizedName)) {
    const originalExt = path.extname(filename)
    if (originalExt) {
      sanitizedName += originalExt
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedName,
  }
}

/**
 * Validate file content for security threats
 */
async function validateFileContent(file: File): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  try {
    // Read first few bytes for magic number validation
    const headerBuffer = await file.slice(0, 512).arrayBuffer()
    const header = new Uint8Array(headerBuffer)

    // Check for executable file signatures
    const executableSignatures = [
      [0x4D, 0x5A], // PE executable
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
      [0xCE, 0xFA, 0xED, 0xFE], // Mach-O executable
      [0xCA, 0xFE, 0xBA, 0xBE], // Java class file
    ]

    for (const signature of executableSignatures) {
      if (header.length >= signature.length) {
        const matches = signature.every((byte, index) => header[index] === byte)
        if (matches) {
          errors.push('File appears to be an executable and is not allowed')
          break
        }
      }
    }

    // Validate MIME type matches file header for common formats
    const mimeValidation = validateMimeTypeHeader(file.type, header)
    if (!mimeValidation.isValid) {
      errors.push(...mimeValidation.errors)
    }

    // Check for embedded scripts in image files
    if (file.type.startsWith('image/')) {
      const scriptValidation = await checkForEmbeddedScripts(file)
      if (!scriptValidation.isValid) {
        errors.push(...scriptValidation.errors)
      }
    }

  } catch (error) {
    console.error('Error validating file content:', error)
    errors.push('Unable to validate file content')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validate MIME type against file header
 */
function validateMimeTypeHeader(mimeType: string, header: Uint8Array): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  const mimeSignatures: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38], [0x47, 0x49, 0x46, 0x39]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
    'video/mp4': [[0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]],
  }

  const signatures = mimeSignatures[mimeType]
  if (signatures) {
    const hasValidSignature = signatures.some(signature =>
      signature.every((byte, index) => index < header.length && header[index] === byte)
    )

    if (!hasValidSignature) {
      errors.push(`File header does not match declared MIME type '${mimeType}'`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check for embedded scripts in files
 */
async function checkForEmbeddedScripts(file: File): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  try {
    // Read file as text to check for script tags
    const content = await file.text()
    
    const scriptPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /onclick\s*=/i,
    ]

    for (const pattern of scriptPatterns) {
      if (pattern.test(content)) {
        errors.push('File contains potentially malicious script content')
        break
      }
    }
  } catch (error) {
    // If file can't be read as text, it's probably binary and safe from script injection
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Check for duplicate files
 */
export async function checkFileDuplicate(
  fileHash: string,
  projectId: string
): Promise<{
  isDuplicate: boolean
  existingFileId?: string
}> {
  try {
    const { findDocuments } = await import('@/src/utils/getPayload')
    
    const existingFiles = await findDocuments('media', {
      where: {
        and: [
          { project: { equals: projectId } },
          { 'metadata.fileHash': { equals: fileHash } }
        ]
      },
      limit: 1,
    })

    return {
      isDuplicate: existingFiles.docs.length > 0,
      existingFileId: existingFiles.docs[0]?.id,
    }
  } catch (error) {
    console.error('Error checking file duplicate:', error)
    return { isDuplicate: false }
  }
}

/**
 * Generate secure filename for storage
 */
export function generateSecureFilename(
  originalFilename: string,
  userId: string,
  projectId: string
): string {
  const ext = path.extname(originalFilename)
  const timestamp = Date.now()
  const randomId = crypto.randomBytes(8).toString('hex')
  
  return `${userId}_${projectId}_${timestamp}_${randomId}${ext}`
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Virus scanning placeholder (integrate with ClamAV or similar)
 */
export async function scanFileForVirus(file: File): Promise<{
  clean: boolean
  threat?: string
}> {
  // TODO: Integrate with actual virus scanning service
  // For now, return clean as placeholder
  return { clean: true }
}

export default {
  validateFileUpload,
  checkFileDuplicate,
  generateSecureFilename,
  scanFileForVirus,
  ALLOWED_FILE_TYPES,
  FILE_SIZE_LIMITS,
}