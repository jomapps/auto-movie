/**
 * Comprehensive Logging and Error Handling System
 * Structured logging with different levels and integrations
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: string
  metadata?: Record<string, any>
  stack?: string
  requestId?: string
  userId?: string
  sessionId?: string
  projectId?: string
}

/**
 * Error types for categorization
 */
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  FILE_UPLOAD = 'FILE_UPLOAD',
  AI_SERVICE = 'AI_SERVICE',
  WEBSOCKET = 'WEBSOCKET',
  SYSTEM = 'SYSTEM',
  USER_INPUT = 'USER_INPUT',
}

/**
 * Custom error class with metadata
 */
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly metadata: Record<string, any>
  public readonly requestId?: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.SYSTEM,
    statusCode: number = 500,
    isOperational: boolean = true,
    metadata: Record<string, any> = {},
    requestId?: string
  ) {
    super(message)

    this.name = this.constructor.name
    this.type = type
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.metadata = metadata
    this.requestId = requestId

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Logger class
 */
export class Logger {
  private context: string
  private minLevel: LogLevel

  constructor(context: string = 'App', minLevel?: LogLevel) {
    this.context = context
    this.minLevel =
      minLevel ?? (process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG)
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.minLevel
  }

  private formatMessage(level: LogLevel, message: string, metadata?: Record<string, any>): string {
    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]

    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context: this.context,
      metadata,
    }

    // In production, use structured JSON logging
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(logEntry)
    }

    // In development, use readable format
    const metaStr = metadata ? ` ${JSON.stringify(metadata, null, 2)}` : ''
    return `[${timestamp}] ${levelName} [${this.context}]: ${message}${metaStr}`
  }

  private writeLog(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return

    const formattedMessage = this.formatMessage(level, message, metadata)

    // Write to appropriate stream
    if (level <= LogLevel.WARN) {
      console.error(formattedMessage)
    } else {
      console.log(formattedMessage)
    }

    // In production, also send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger({
        timestamp: new Date().toISOString(),
        level,
        message,
        context: this.context,
        metadata,
      })
    }
  }

  private async sendToExternalLogger(_entry: LogEntry): Promise<void> {
    try {
      // TODO: Integrate with external logging service (e.g., Winston, Datadog, etc.)
      // Example implementation:
      /*
      await fetch(process.env.LOG_ENDPOINT!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      */
    } catch (error) {
      // Fallback to console if external logging fails
      console.error('Failed to send log to external service:', error)
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const logMetadata = {
      ...metadata,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          ...(error instanceof AppError && {
            type: error.type,
            statusCode: error.statusCode,
            isOperational: error.isOperational,
            requestId: error.requestId,
          }),
        },
      }),
    }

    this.writeLog(LogLevel.ERROR, message, logMetadata)
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.writeLog(LogLevel.WARN, message, metadata)
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.writeLog(LogLevel.INFO, message, metadata)
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.writeLog(LogLevel.DEBUG, message, metadata)
  }

  trace(message: string, metadata?: Record<string, any>): void {
    this.writeLog(LogLevel.TRACE, message, metadata)
  }

  // Request-specific logging
  logRequest(req: NextRequest, metadata?: Record<string, any>): void {
    const requestMetadata = {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      ...metadata,
    }

    this.info('Incoming request', requestMetadata)
  }

  logResponse(
    req: NextRequest,
    res: NextResponse,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const responseMetadata = {
      method: req.method,
      url: req.url,
      status: res.status,
      duration: `${duration}ms`,
      ...metadata,
    }

    const level =
      res.status >= 500 ? LogLevel.ERROR : res.status >= 400 ? LogLevel.WARN : LogLevel.INFO
    this.writeLog(level, 'Request completed', responseMetadata)
  }
}

/**
 * Default logger instances
 */
export const logger = new Logger('App')
export const authLogger = new Logger('Auth')
export const dbLogger = new Logger('Database')
export const aiLogger = new Logger('AI')
export const uploadLogger = new Logger('Upload')
export const wsLogger = new Logger('WebSocket')

/**
 * Error handler middleware
 */
export function createErrorHandler() {
  return async (error: Error, req: NextRequest, context?: string): Promise<NextResponse> => {
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID()

    // Log the error
    const contextLogger = context ? new Logger(context) : logger
    contextLogger.error('Request error', error, {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
    })

    // Handle different error types
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.type,
          requestId,
          ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
        },
        { status: error.statusCode }
      )
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          code: ErrorType.VALIDATION,
          details: error.message,
          requestId,
        },
        { status: 400 }
      )
    }

    // Handle database errors
    if (error.message.includes('database') || error.message.includes('collection')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database operation failed',
          code: ErrorType.DATABASE,
          requestId,
        },
        { status: 500 }
      )
    }

    // Default error response
    return NextResponse.json(
      {
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
        code: ErrorType.SYSTEM,
        requestId,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      },
      { status: 500 }
    )
  }
}

/**
 * Request logging middleware
 */
export function createRequestLogger() {
  return async (
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const startTime = Date.now()
    const requestId = crypto.randomUUID()

    // Add request ID to headers
    req.headers.set('x-request-id', requestId)

    // Log incoming request
    logger.logRequest(req, { requestId })

    try {
      // Execute handler
      const response = await handler(req)

      // Log response
      const duration = Date.now() - startTime
      logger.logResponse(req, response, duration, { requestId })

      // Add request ID to response headers
      response.headers.set('x-request-id', requestId)

      return response
    } catch (error) {
      // Log error and handle it
      const duration = Date.now() - startTime
      logger.error('Request failed', error as Error, {
        requestId,
        duration: `${duration}ms`,
      })

      throw error
    }
  }
}

/**
 * Async operation wrapper with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  metadata?: Record<string, any>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const contextLogger = new Logger(context)
    contextLogger.error(`Operation failed: ${context}`, error as Error, metadata)
    throw error
  }
}

/**
 * Safe async operation that doesn't throw
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (context) {
      const contextLogger = new Logger(context)
      contextLogger.warn('Safe async operation failed, using fallback', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
    return fallback
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private startTime: number
  private context: string
  private logger: Logger

  constructor(context: string) {
    this.startTime = Date.now()
    this.context = context
    this.logger = new Logger(`Perf:${context}`)
  }

  mark(label: string): void {
    const elapsed = Date.now() - this.startTime
    this.logger.debug(`Performance mark: ${label}`, { elapsed: `${elapsed}ms` })
  }

  end(metadata?: Record<string, any>): number {
    const duration = Date.now() - this.startTime
    this.logger.info(`Operation completed: ${this.context}`, {
      duration: `${duration}ms`,
      ...metadata,
    })
    return duration
  }
}

/**
 * Health check logging
 */
export function logHealthCheck(
  service: string,
  status: 'healthy' | 'unhealthy' | 'degraded',
  details?: Record<string, any>
): void {
  const healthLogger = new Logger(`Health:${service}`)
  const level =
    status === 'healthy' ? LogLevel.INFO : status === 'degraded' ? LogLevel.WARN : LogLevel.ERROR

  const message = `Service ${status}`
  const metadata = {
    service,
    status,
    ...details,
  }

  if (level === LogLevel.ERROR) {
    healthLogger.error(message, undefined, metadata)
  } else if (level === LogLevel.WARN) {
    healthLogger.warn(message, metadata)
  } else {
    healthLogger.info(message, metadata)
  }
}

/**
 * Security event logging
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
): void {
  const securityLogger = new Logger('Security')
  const level =
    severity === 'low' ? LogLevel.INFO : severity === 'medium' ? LogLevel.WARN : LogLevel.ERROR

  const message = `Security event: ${event}`
  const metadata = {
    event,
    severity,
    ...details,
  }

  if (level === LogLevel.ERROR) {
    securityLogger.error(message, undefined, metadata)
  } else if (level === LogLevel.WARN) {
    securityLogger.warn(message, metadata)
  } else {
    securityLogger.info(message, metadata)
  }
}

export default {
  Logger,
  AppError,
  ErrorType,
  LogLevel,
  logger,
  authLogger,
  dbLogger,
  aiLogger,
  uploadLogger,
  wsLogger,
  createErrorHandler,
  createRequestLogger,
  withErrorHandling,
  safeAsync,
  PerformanceMonitor,
  logHealthCheck,
  logSecurityEvent,
}
