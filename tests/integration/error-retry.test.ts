import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createProjectError, handlePayloadError, isRetryableError } from "@/lib/utils/error-handling"
import { projectToast } from "@/lib/toast"

// Integration test for manual error retry behavior
// Based on clarified requirement: Network failures require manual user retry (no auto-retry mechanisms)
// This test MUST fail until the error handling system is implemented

describe("Manual Error Retry Integration", () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Mock component to test error retry behavior
  function ErrorRetryComponent() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [retryCount, setRetryCount] = React.useState(0)

    const simulateNetworkOperation = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // Simulate network failure
        throw createProjectError("NETWORK_ERROR", "Network connection failed")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(errorMessage)
        projectToast.networkError()
      } finally {
        setIsLoading(false)
      }
    }

    const handleRetry = () => {
      setRetryCount(prev => prev + 1)
      simulateNetworkOperation()
    }

    return (
      <div>
        <button onClick={simulateNetworkOperation} disabled={isLoading}>
          {isLoading ? "Loading..." : "Trigger Network Error"}
        </button>
        
        {error && (
          <div data-testid="error-display">
            <p>{error}</p>
            <button onClick={handleRetry}>Retry</button>
            <p>Retry count: {retryCount}</p>
          </div>
        )}
      </div>
    )
  }

  it("should display error message and manual retry button for network errors", async () => {
    render(<ErrorRetryComponent />)

    const triggerButton = screen.getByText("Trigger Network Error")
    await user.click(triggerButton)

    // Error should be displayed
    await waitFor(() => {
      expect(screen.getByTestId("error-display")).toBeInTheDocument()
      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument()
    })

    // Retry button should be available
    expect(screen.getByText("Retry")).toBeInTheDocument()
  })

  it("should not automatically retry network errors", async () => {
    const consoleSpy = vi.spyOn(console, 'log')
    render(<ErrorRetryComponent />)

    const triggerButton = screen.getByText("Trigger Network Error")
    await user.click(triggerButton)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId("error-display")).toBeInTheDocument()
    })

    // Wait additional time to ensure no auto-retry happens
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Should still show the same error, no auto-retry
    expect(screen.getByText(/network connection failed/i)).toBeInTheDocument()
    expect(screen.getByText("Retry count: 0")).toBeInTheDocument()
    
    // No automatic retry logs should appear
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringMatching(/retry|attempt/i))
  })

  it("should allow manual retry and track retry attempts", async () => {
    render(<ErrorRetryComponent />)

    const triggerButton = screen.getByText("Trigger Network Error")
    await user.click(triggerButton)

    // Error should appear
    await waitFor(() => {
      expect(screen.getByTestId("error-display")).toBeInTheDocument()
    })

    const retryButton = screen.getByText("Retry")
    
    // Manual retry 1
    await user.click(retryButton)
    await waitFor(() => {
      expect(screen.getByText("Retry count: 1")).toBeInTheDocument()
    })

    // Manual retry 2
    await user.click(retryButton)
    await waitFor(() => {
      expect(screen.getByText("Retry count: 2")).toBeInTheDocument()
    })

    // Should still show error after retries (since we're simulating failure)
    expect(screen.getByText(/network connection failed/i)).toBeInTheDocument()
  })

  it("should identify retryable vs non-retryable errors correctly", () => {
    // Network errors should be retryable
    const networkError = createProjectError("NETWORK_ERROR")
    expect(isRetryableError(networkError)).toBe(true)

    // Validation errors should not be retryable
    const validationError = createProjectError("VALIDATION_ERROR")
    expect(isRetryableError(validationError)).toBe(false)

    // Permission errors should not be retryable
    const permissionError = createProjectError("PERMISSION_ERROR")
    expect(isRetryableError(permissionError)).toBe(false)

    // Server errors should be retryable
    const serverError = createProjectError("SERVER_ERROR")
    expect(isRetryableError(serverError)).toBe(true)
  })

  it("should handle PayloadCMS errors with appropriate retry behavior", () => {
    // Simulate different PayloadCMS error scenarios
    const networkError = new Error("ECONNREFUSED")
    networkError.code = "ECONNREFUSED"
    
    const validationError = {
      name: "ValidationError",
      errors: { title: "Required" },
      message: "Validation failed"
    }

    const notFoundError = {
      status: 404,
      message: "Project not found"
    }

    // Test error handling
    const handledNetworkError = handlePayloadError(networkError, "create")
    expect(handledNetworkError.retryable).toBe(true)
    expect(handledNetworkError.code).toBe("NETWORK_ERROR")

    const handledValidationError = handlePayloadError(validationError, "create")
    expect(handledValidationError.retryable).toBe(false)
    expect(handledValidationError.code).toBe("VALIDATION_ERROR")

    const handledNotFoundError = handlePayloadError(notFoundError, "findByID")
    expect(handledNotFoundError.retryable).toBe(true)
    expect(handledNotFoundError.code).toBe("NOT_FOUND_ERROR")
  })

  it("should show appropriate error messages for different error types", async () => {
    function MultiErrorComponent() {
      const [currentError, setCurrentError] = React.useState<string | null>(null)

      const triggerError = (type: string) => {
        let error: Error
        switch (type) {
          case "network":
            error = createProjectError("NETWORK_ERROR")
            break
          case "validation":
            error = createProjectError("VALIDATION_ERROR")
            break
          case "permission":
            error = createProjectError("PERMISSION_ERROR")
            break
          default:
            error = createProjectError("SERVER_ERROR")
        }
        setCurrentError(error.message)
      }

      return (
        <div>
          <button onClick={() => triggerError("network")}>Network Error</button>
          <button onClick={() => triggerError("validation")}>Validation Error</button>
          <button onClick={() => triggerError("permission")}>Permission Error</button>
          <button onClick={() => triggerError("server")}>Server Error</button>
          
          {currentError && (
            <div data-testid="current-error">
              <p>{currentError}</p>
              {isRetryableError(new Error(currentError)) && (
                <button>Retry</button>
              )}
            </div>
          )}
        </div>
      )
    }

    render(<MultiErrorComponent />)

    // Test network error (retryable)
    await user.click(screen.getByText("Network Error"))
    await waitFor(() => {
      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument()
      expect(screen.getByText("Retry")).toBeInTheDocument()
    })

    // Test validation error (not retryable)
    await user.click(screen.getByText("Validation Error"))
    await waitFor(() => {
      expect(screen.getByText(/invalid form data/i)).toBeInTheDocument()
      expect(screen.queryByText("Retry")).not.toBeInTheDocument()
    })

    // Test permission error (not retryable)
    await user.click(screen.getByText("Permission Error"))
    await waitFor(() => {
      expect(screen.getByText(/don't have permission/i)).toBeInTheDocument()
      expect(screen.queryByText("Retry")).not.toBeInTheDocument()
    })
  })

  it("should preserve retry state across component re-renders", async () => {
    function StatefulErrorComponent() {
      const [retryCount, setRetryCount] = React.useState(0)
      const [forceRender, setForceRender] = React.useState(0)

      const handleRetry = () => {
        setRetryCount(prev => prev + 1)
      }

      const forceRerender = () => {
        setForceRender(prev => prev + 1)
      }

      return (
        <div>
          <p>Retry count: {retryCount}</p>
          <p>Render count: {forceRender}</p>
          <button onClick={handleRetry}>Retry</button>
          <button onClick={forceRerender}>Force Re-render</button>
        </div>
      )
    }

    render(<StatefulErrorComponent />)

    // Perform some retries
    const retryButton = screen.getByText("Retry")
    await user.click(retryButton)
    await user.click(retryButton)

    expect(screen.getByText("Retry count: 2")).toBeInTheDocument()

    // Force component re-render
    const rerenderButton = screen.getByText("Force Re-render")
    await user.click(rerenderButton)

    // Retry count should be preserved
    await waitFor(() => {
      expect(screen.getByText("Retry count: 2")).toBeInTheDocument()
      expect(screen.getByText("Render count: 1")).toBeInTheDocument()
    })
  })

  it("should provide clear feedback about manual retry requirement", async () => {
    render(<ErrorRetryComponent />)

    const triggerButton = screen.getByText("Trigger Network Error")
    await user.click(triggerButton)

    await waitFor(() => {
      const errorDisplay = screen.getByTestId("error-display")
      expect(errorDisplay).toBeInTheDocument()
      
      // Should clearly indicate manual action is required
      expect(screen.getByText("Retry")).toBeInTheDocument()
      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument()
    })

    // Should not show any automatic retry indicators
    expect(screen.queryByText(/retrying/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/attempting/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/auto.*retry/i)).not.toBeInTheDocument()
  })
})