// Error handling utilities with manual retry patterns
// Based on clarified requirement for manual user retry (no auto-retry mechanisms)

export interface RetryableError {
  message: string
  code?: string
  retryable: boolean
  retryAction?: () => void
}

export class ProjectError extends Error {
  public readonly code: string
  public readonly retryable: boolean
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    code: string = "UNKNOWN_ERROR",
    retryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = "ProjectError"
    this.code = code
    this.retryable = retryable
    this.context = context
  }
}

// Error codes for different types of failures
export const ErrorCodes = {
  NETWORK_ERROR: "NETWORK_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PERMISSION_ERROR: "PERMISSION_ERROR",
  NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  PAYLOAD_API_ERROR: "PAYLOAD_API_ERROR",
  FORM_SUBMISSION_ERROR: "FORM_SUBMISSION_ERROR",
} as const

// Helper function to determine if an error is retryable
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ProjectError) {
    return error.retryable
  }
  
  // Network errors are generally retryable
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true
  }
  
  // 5xx server errors are retryable
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as any).status
    return status >= 500 && status < 600
  }
  
  return false
}

// Create standardized error messages for different scenarios
export function createProjectError(
  type: keyof typeof ErrorCodes,
  details?: string,
  context?: Record<string, any>
): ProjectError {
  switch (type) {
    case "NETWORK_ERROR":
      return new ProjectError(
        details || "Network connection failed. Please check your internet connection and try again.",
        ErrorCodes.NETWORK_ERROR,
        true,
        context
      )
    
    case "VALIDATION_ERROR":
      return new ProjectError(
        details || "Invalid form data. Please check your inputs and try again.",
        ErrorCodes.VALIDATION_ERROR,
        false,
        context
      )
    
    case "PERMISSION_ERROR":
      return new ProjectError(
        details || "You don't have permission to perform this action.",
        ErrorCodes.PERMISSION_ERROR,
        false,
        context
      )
    
    case "NOT_FOUND_ERROR":
      return new ProjectError(
        details || "The requested project could not be found.",
        ErrorCodes.NOT_FOUND_ERROR,
        true,
        context
      )
    
    case "SERVER_ERROR":
      return new ProjectError(
        details || "Server error occurred. Please try again later.",
        ErrorCodes.SERVER_ERROR,
        true,
        context
      )
    
    case "PAYLOAD_API_ERROR":
      return new ProjectError(
        details || "Database operation failed. Please try again.",
        ErrorCodes.PAYLOAD_API_ERROR,
        true,
        context
      )
    
    case "FORM_SUBMISSION_ERROR":
      return new ProjectError(
        details || "Form submission failed. Please check your inputs and try again.",
        ErrorCodes.FORM_SUBMISSION_ERROR,
        false,
        context
      )
    
    default:
      return new ProjectError(
        details || "An unexpected error occurred. Please try again.",
        "UNKNOWN_ERROR",
        false,
        context
      )
  }
}

// Error handler for PayloadCMS operations
export function handlePayloadError(error: unknown, operation: string): ProjectError {
  console.error(`PayloadCMS ${operation} error:`, error)
  
  if (error && typeof error === "object") {
    const errorObj = error as any
    
    // Handle PayloadCMS validation errors
    if (errorObj.name === "ValidationError" || errorObj.errors) {
      return createProjectError("VALIDATION_ERROR", errorObj.message, { operation, errors: errorObj.errors })
    }
    
    // Handle permission errors
    if (errorObj.status === 403 || errorObj.message?.includes("permission")) {
      return createProjectError("PERMISSION_ERROR", errorObj.message, { operation })
    }
    
    // Handle not found errors
    if (errorObj.status === 404 || errorObj.message?.includes("not found")) {
      return createProjectError("NOT_FOUND_ERROR", errorObj.message, { operation })
    }
    
    // Handle network/connection errors
    if (errorObj.code === "ECONNREFUSED" || errorObj.code === "ENOTFOUND") {
      return createProjectError("NETWORK_ERROR", errorObj.message, { operation })
    }
  }
  
  // Default to server error for PayloadCMS operations
  return createProjectError("PAYLOAD_API_ERROR", `${operation} failed: ${String(error)}`, { operation })
}

// Retry configuration for manual retry scenarios
export interface RetryConfig {
  maxAttempts: number
  retryMessage: string
  onRetry?: () => void
}

export function createRetryConfig(operation: string): RetryConfig {
  return {
    maxAttempts: 3,
    retryMessage: `${operation} failed. Click to try again.`,
    onRetry: undefined, // Will be set by the component handling the retry
  }
}

// Helper to extract meaningful error message for user display
export function getDisplayErrorMessage(error: unknown): string {
  if (error instanceof ProjectError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === "string") {
    return error
  }
  
  return "An unexpected error occurred. Please try again."
}