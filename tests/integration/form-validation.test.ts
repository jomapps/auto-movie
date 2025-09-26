import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProjectForm } from "@/components/forms/ProjectForm"

// Integration test for inline form validation with blocked submission
// Based on clarified requirement: Block submission, show all errors at once inline
// This test MUST fail until the ProjectForm component is implemented

describe("Form Validation Integration", () => {
  const mockOnSubmit = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it("should block submission and show all validation errors inline when form is invalid", async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole("button", { name: /create project|submit/i })
    
    // Try to submit empty form
    await user.click(submitButton)

    // Form submission should be blocked
    expect(mockOnSubmit).not.toHaveBeenCalled()

    // All required field errors should be displayed inline
    await waitFor(() => {
      expect(screen.getByText(/project title is required/i)).toBeInTheDocument()
      expect(screen.getByText(/genre is required/i)).toBeInTheDocument()
    })

    // Submit button should remain enabled for retry
    expect(submitButton).not.toBeDisabled()
  })

  it("should show validation errors for all invalid fields simultaneously", async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} />)

    const titleInput = screen.getByLabelText(/title/i)
    const episodeInput = screen.getByLabelText(/episode count/i)
    const submitButton = screen.getByRole("button", { name: /create project|submit/i })

    // Enter invalid data in multiple fields
    await user.clear(titleInput)
    await user.type(titleInput, "x".repeat(201)) // Exceeds 200 character limit
    await user.clear(episodeInput)
    await user.type(episodeInput, "100") // Exceeds 50 episode limit

    await user.click(submitButton)

    // Form submission should be blocked
    expect(mockOnSubmit).not.toHaveBeenCalled()

    // All validation errors should be shown at once
    await waitFor(() => {
      expect(screen.getByText(/cannot exceed 200 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/cannot exceed 50/i)).toBeInTheDocument()
    })
  })

  it("should validate fields in real-time and show errors inline", async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} />)

    const titleInput = screen.getByLabelText(/title/i)
    
    // Enter invalid title
    await user.type(titleInput, "x".repeat(201))
    await user.tab() // Trigger blur event for validation

    // Error should appear inline immediately
    await waitFor(() => {
      expect(screen.getByText(/cannot exceed 200 characters/i)).toBeInTheDocument()
    })

    // Fix the title
    await user.clear(titleInput)
    await user.type(titleInput, "Valid Title")
    await user.tab()

    // Error should disappear
    await waitFor(() => {
      expect(screen.queryByText(/cannot exceed 200 characters/i)).not.toBeInTheDocument()
    })
  })

  it("should prevent submission until all validation errors are resolved", async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} />)

    const titleInput = screen.getByLabelText(/title/i)
    const genreSelect = screen.getByLabelText(/genre/i)
    const submitButton = screen.getByRole("button", { name: /create project|submit/i })

    // Fill out form partially (missing required fields)
    await user.type(titleInput, "Test Project")
    await user.click(submitButton)

    // Should be blocked due to missing genre
    expect(mockOnSubmit).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByText(/genre is required/i)).toBeInTheDocument()
    })

    // Complete the form
    await user.selectOptions(genreSelect, "drama")
    await user.click(submitButton)

    // Now submission should work
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: "Test Project",
        genre: "drama"
      }))
    })
  })

  it("should validate episode count range and show specific error messages", async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} />)

    const episodeInput = screen.getByLabelText(/episode count/i)
    const submitButton = screen.getByRole("button", { name: /create project|submit/i })

    // Test minimum validation
    await user.clear(episodeInput)
    await user.type(episodeInput, "0")
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/must be at least 1/i)).toBeInTheDocument()
    })

    // Test maximum validation
    await user.clear(episodeInput)
    await user.type(episodeInput, "100")
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/cannot exceed 50/i)).toBeInTheDocument()
    })

    // Test valid value
    await user.clear(episodeInput)
    await user.type(episodeInput, "25")
    await user.tab()

    await waitFor(() => {
      expect(screen.queryByText(/must be at least 1/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/cannot exceed 50/i)).not.toBeInTheDocument()
    })
  })

  it("should validate description length and show character count", async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} />)

    const descriptionInput = screen.getByLabelText(/description/i)
    const submitButton = screen.getByRole("button", { name: /create project|submit/i })

    // Enter description exceeding limit
    const longDescription = "x".repeat(1001)
    await user.type(descriptionInput, longDescription)
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/cannot exceed 1000 characters/i)).toBeInTheDocument()
    })

    // Should show character count near limit
    const validDescription = "x".repeat(950)
    await user.clear(descriptionInput)
    await user.type(descriptionInput, validDescription)

    // Character count should be displayed when approaching limit
    await waitFor(() => {
      expect(screen.getByText(/950.*1000/)).toBeInTheDocument()
    })
  })

  it("should handle form submission loading state without blocking validation display", async () => {
    const slowSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
    render(<ProjectForm onSubmit={slowSubmit} />)

    const titleInput = screen.getByLabelText(/title/i)
    const genreSelect = screen.getByLabelText(/genre/i)
    const submitButton = screen.getByRole("button", { name: /create project|submit/i })

    // Fill valid data
    await user.type(titleInput, "Test Project")
    await user.selectOptions(genreSelect, "drama")
    
    // Submit form
    await user.click(submitButton)

    // Submit button should show loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
      expect(screen.getByText(/creating|saving|submitting/i)).toBeInTheDocument()
    })

    // If user tries to interact with form during loading, validation should still work
    await user.clear(titleInput)
    await user.tab()

    // Validation error should still show even during loading
    await waitFor(() => {
      expect(screen.getByText(/project title is required/i)).toBeInTheDocument()
    })
  })

  it("should reset validation errors when form is reset", async () => {
    render(<ProjectForm onSubmit={mockOnSubmit} />)

    const titleInput = screen.getByLabelText(/title/i)
    const submitButton = screen.getByRole("button", { name: /create project|submit/i })
    const resetButton = screen.getByRole("button", { name: /reset|clear/i })

    // Create validation errors
    await user.type(titleInput, "x".repeat(201))
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/cannot exceed 200 characters/i)).toBeInTheDocument()
    })

    // Reset form
    await user.click(resetButton)

    // Errors should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/cannot exceed 200 characters/i)).not.toBeInTheDocument()
    })

    // Form should be back to initial state
    expect(titleInput).toHaveValue("")
  })
})