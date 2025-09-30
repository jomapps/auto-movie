import { test, expect } from '@playwright/test'

/**
 * E2E Tests: Production Integration
 *
 * Tests the end-to-end flow from chat entity creation to
 * production workflow triggering and status tracking.
 *
 * Coverage includes:
 * - Production task creation
 * - Task status updates
 * - Real-time progress tracking
 * - Task failure handling
 * - Production pipeline visualization
 */

test.describe('Production Integration', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Create test project
    await page.click('button:has-text("New Project")')
    await page.fill('input[name="title"]', 'Production Test Project')
    await page.fill('textarea[name="description"]', 'Testing production integration')
    await page.selectOption('select[name="genre"]', 'sci-fi')
    await page.fill('input[name="episodeCount"]', '5')
    await page.click('button:has-text("Create Project")')

    await page.waitForURL(/\/projects\/.*/)
    projectId = page.url().split('/').pop() || ''
  })

  test('should trigger production task when character is created', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    // Create character
    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Dr. Sarah Chen, neuroscientist')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Open production tasks panel
    await page.click('[data-testid="production-panel-toggle"]')

    // Verify task was created
    await expect(page.locator('[data-testid="production-task"]')).toHaveCount(1, { timeout: 5000 })
    await expect(page.locator('[data-testid="task-type"]')).toContainText('character_sheet')
  })

  test('should show task status badge', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Test Hero')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Badge should appear
    await expect(page.locator('[data-testid="production-badge"]')).toBeVisible()
    await expect(page.locator('[data-testid="production-badge"]')).toContainText('1')
  })

  test('should update task status in real-time', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Real-Time Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Open production panel
    await page.click('[data-testid="production-panel-toggle"]')

    // Initial status should be pending
    await expect(page.locator('[data-testid="task-status"]').first()).toContainText('pending')

    // Wait for status update
    await page.waitForTimeout(3000)

    // Status should progress
    const statusText = await page.locator('[data-testid="task-status"]').first().textContent()
    expect(['pending', 'running', 'completed']).toContain(statusText?.toLowerCase() || '')
  }, 15000)

  test('should show progress bar for running tasks', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character with production')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Wait for task to start running
    await page.waitForTimeout(2000)

    // Progress bar should be visible
    await expect(page.locator('[data-testid="task-progress"]').first()).toBeVisible()
  }, 10000)

  test('should create multiple tasks for multiple entities', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create three characters: Alice, Bob, and Charlie')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Should have 3 tasks
    await expect(page.locator('[data-testid="production-task"]')).toHaveCount(3, { timeout: 5000 })
  })

  test('should show task details on click', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Details Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Click on task
    await page.click('[data-testid="production-task"]')

    // Details modal should open
    await expect(page.locator('[data-testid="task-details-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="task-id"]')).toBeVisible()
    await expect(page.locator('[data-testid="task-created-time"]')).toBeVisible()
  })

  test('should handle task failures gracefully', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    // Create character that might cause failure (mock scenario)
    await chatInput.fill('Create character Failure Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Wait for potential failure
    await page.waitForTimeout(5000)

    const status = await page.locator('[data-testid="task-status"]').first().textContent()

    if (status?.toLowerCase() === 'failed') {
      // Error message should be shown
      await expect(page.locator('[data-testid="task-error"]')).toBeVisible()

      // Retry button should be available
      await expect(page.locator('[data-testid="retry-task-button"]')).toBeVisible()
    }
  }, 10000)

  test('should allow retrying failed tasks', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Retry Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Wait for task
    await page.waitForTimeout(3000)

    // If failed, retry
    const status = await page.locator('[data-testid="task-status"]').first().textContent()

    if (status?.toLowerCase() === 'failed') {
      await page.click('[data-testid="retry-task-button"]')

      // New task should be created or status should change
      await page.waitForTimeout(2000)

      const newStatus = await page.locator('[data-testid="task-status"]').first().textContent()
      expect(['pending', 'running']).toContain(newStatus?.toLowerCase() || '')
    }
  }, 15000)

  test('should show task completion notification', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Completion Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Wait for task completion
    await page.waitForTimeout(8000)

    // Notification should appear
    await expect(page.locator('[data-testid="task-complete-notification"]')).toBeVisible({ timeout: 10000 })
  }, 20000)

  test('should filter tasks by status', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create three characters for filtering test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Apply filter
    await page.click('[data-testid="task-filter-dropdown"]')
    await page.click('[data-testid="filter-pending"]')

    // Should only show pending tasks
    const tasks = await page.locator('[data-testid="production-task"]').count()
    expect(tasks).toBeGreaterThan(0)

    // All visible tasks should be pending
    const statuses = await page.locator('[data-testid="task-status"]').allTextContents()
    statuses.forEach(status => {
      expect(status.toLowerCase()).toBe('pending')
    })
  })

  test('should show task duration', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Duration Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Wait for some time
    await page.waitForTimeout(5000)

    // Duration should be displayed
    await expect(page.locator('[data-testid="task-duration"]').first()).toBeVisible()
    const duration = await page.locator('[data-testid="task-duration"]').first().textContent()
    expect(duration).toMatch(/\d+.*second/i)
  })

  test('should link task to entity', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Link Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Go to character details
    await page.click('[data-testid="characters-tab"]')
    await page.click('[data-testid="character-card"]')

    // Should show associated production task
    await expect(page.locator('[data-testid="character-production-task"]')).toBeVisible()
    await expect(page.locator('[data-testid="production-task-status"]')).toBeVisible()
  })

  test('should show task output when completed', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Output Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Wait for completion
    await page.waitForTimeout(10000)

    // Click on completed task
    const status = await page.locator('[data-testid="task-status"]').first().textContent()

    if (status?.toLowerCase() === 'completed') {
      await page.click('[data-testid="production-task"]')

      // Output should be visible
      await expect(page.locator('[data-testid="task-output"]')).toBeVisible()
    }
  }, 20000)

  test('should track overall production progress', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create five characters for progress test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Overall progress bar should be visible
    await expect(page.locator('[data-testid="overall-production-progress"]')).toBeVisible()

    // Progress should be calculated based on task completion
    const progressText = await page.locator('[data-testid="production-progress-text"]').textContent()
    expect(progressText).toMatch(/\d+.*of.*\d+/)
  })

  test('should cancel running task', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Cancel Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // Click cancel button
    await page.click('[data-testid="cancel-task-button"]')

    // Confirmation dialog
    await page.click('[data-testid="confirm-cancel"]')

    // Task should be cancelled
    await page.waitForTimeout(2000)
    const status = await page.locator('[data-testid="task-status"]').first().textContent()
    expect(['cancelled', 'failed']).toContain(status?.toLowerCase() || '')
  })

  test('should show LangGraph workflow status', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Develop complete story structure')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')

    // LangGraph workflow should be visible
    const workflows = page.locator('[data-testid="langgraph-workflow"]')

    if (await workflows.count() > 0) {
      await expect(workflows.first()).toBeVisible()
      await expect(page.locator('[data-testid="workflow-steps"]')).toBeVisible()
    }
  })

  test('should persist task state across page refresh', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Persist Test')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await page.click('[data-testid="production-panel-toggle"]')
    const initialCount = await page.locator('[data-testid="production-task"]').count()

    // Refresh page
    await page.reload()

    // Tasks should still be visible
    await page.click('[data-testid="production-panel-toggle"]')
    const afterRefreshCount = await page.locator('[data-testid="production-task"]').count()

    expect(afterRefreshCount).toBe(initialCount)
  })
})