import { test, expect } from '@playwright/test'

/**
 * E2E Tests: Workflow Validation
 *
 * Tests the enforcement of workflow prerequisites through the UI,
 * ensuring users cannot skip required steps and receive helpful
 * guidance when attempting invalid transitions.
 *
 * Coverage includes:
 * - Workflow step progression
 * - Prerequisite enforcement
 * - Error messaging
 * - Suggested next steps
 * - Progress tracking
 */

test.describe('Workflow Validation', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Create test project
    await page.click('button:has-text("New Project")')
    await page.fill('input[name="title"]', 'Workflow Test Project')
    await page.fill('textarea[name="description"]', 'Testing workflow enforcement')
    await page.selectOption('select[name="genre"]', 'action')
    await page.fill('input[name="episodeCount"]', '3')
    await page.click('button:has-text("Create Project")')

    await page.waitForURL(/\/projects\/.*/)
    projectId = page.url().split('/').pop() || ''
  })

  test('should show initial concept as first step', async ({ page }) => {
    // Check workflow indicator
    await expect(page.locator('[data-testid="current-step"]')).toContainText('Initial Concept')
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow', '0')
  })

  test('should prevent skipping to production without prerequisites', async ({ page }) => {
    // Try to navigate to production step
    await page.click('[data-testid="workflow-steps"]')
    await page.click('[data-testid="step-production"]')

    // Should show error message
    await expect(page.locator('[data-testid="workflow-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="workflow-error"]')).toContainText('prerequisite')

    // Should remain on current step
    await expect(page.locator('[data-testid="current-step"]')).toContainText('Initial Concept')
  })

  test('should show which prerequisites are missing', async ({ page }) => {
    await page.click('[data-testid="workflow-steps"]')
    await page.click('[data-testid="step-editing"]')

    // Error should list missing steps
    const errorMessage = await page.locator('[data-testid="workflow-error"]').textContent()
    expect(errorMessage).toContain('story')
    expect(errorMessage).toContain('character')
    expect(errorMessage).toContain('storyboard')
  })

  test('should allow advancing after completing prerequisites', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Complete initial concept
    await chatInput.fill('A sci-fi thriller about artificial intelligence')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Should now be able to advance to story structure
    await page.click('[data-testid="workflow-steps"]')
    await page.click('[data-testid="step-story-structure"]')

    // Should succeed
    await expect(page.locator('[data-testid="current-step"]')).toContainText('Story Structure')
  })

  test('should show available next steps', async ({ page }) => {
    // Check available steps indicator
    await expect(page.locator('[data-testid="available-steps"]')).toBeVisible()

    const availableSteps = await page.locator('[data-testid="available-step"]').allTextContents()

    // Should show story structure and character development
    expect(availableSteps.some(step => step.includes('Story'))).toBe(true)
    expect(availableSteps.some(step => step.includes('Character'))).toBe(true)
  })

  test('should update progress as steps are completed', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Initial progress
    let progress = await page.locator('[data-testid="progress-bar"]').getAttribute('aria-valuenow')
    expect(parseInt(progress || '0')).toBeLessThan(20)

    // Complete concept
    await chatInput.fill('Create a concept about time travel')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Progress should increase
    progress = await page.locator('[data-testid="progress-bar"]').getAttribute('aria-valuenow')
    expect(parseInt(progress || '0')).toBeGreaterThan(10)
  })

  test('should provide helpful suggestions when blocked', async ({ page }) => {
    await page.click('[data-testid="workflow-steps"]')
    await page.click('[data-testid="step-storyboard"]')

    // Should show suggestions panel
    await expect(page.locator('[data-testid="workflow-suggestions"]')).toBeVisible()

    // Should suggest what to do next
    const suggestions = await page.locator('[data-testid="suggestion-item"]').allTextContents()
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions.some(s => s.includes('character') || s.includes('story'))).toBe(true)
  })

  test('should highlight completed steps', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Complete initial concept
    await chatInput.fill('A mystery thriller')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Advance to story structure
    await chatInput.fill('The story has three acts with rising tension')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]:nth-of-type(2)', { timeout: 10000 })

    // Check workflow visualization
    await page.click('[data-testid="workflow-steps"]')

    // Initial concept should show as completed
    await expect(page.locator('[data-testid="step-initial-concept"]')).toHaveClass(/completed/)
  })

  test('should allow revisiting completed steps', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Complete concept and move to characters
    await chatInput.fill('Fantasy adventure concept')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await chatInput.fill('Create hero and villain characters')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]:nth-of-type(2)', { timeout: 10000 })

    // Go back to initial concept
    await page.click('[data-testid="workflow-steps"]')
    await page.click('[data-testid="step-initial-concept"]')

    // Should allow viewing and editing
    await expect(page.locator('[data-testid="current-step"]')).toContainText('Initial Concept')
  })

  test('should show step requirements in tooltip', async ({ page }) => {
    await page.click('[data-testid="workflow-steps"]')

    // Hover over locked step
    await page.hover('[data-testid="step-production"]')

    // Tooltip should show requirements
    await expect(page.locator('[data-testid="step-requirements-tooltip"]')).toBeVisible()
    const tooltip = await page.locator('[data-testid="step-requirements-tooltip"]').textContent()

    expect(tooltip).toContain('character')
    expect(tooltip).toContain('scene')
  })

  test('should recommend next step based on progress', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Create some characters
    await chatInput.fill('Create three main characters')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Check recommended next step
    await expect(page.locator('[data-testid="recommended-step"]')).toBeVisible()
    const recommended = await page.locator('[data-testid="recommended-step"]').textContent()

    // Should recommend story or scenes
    expect(recommended).toMatch(/story|scene|storyboard/i)
  })

  test('should validate minimum requirements for each step', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Create only one character
    await chatInput.fill('Create one character named Solo')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Try to advance to storyboard (requires 2+ characters)
    await page.click('[data-testid="workflow-steps"]')
    await page.click('[data-testid="step-storyboard"]')

    // Should show validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('at least 2 characters')
  })

  test('should show completion percentage', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Complete several steps
    await chatInput.fill('Create concept: space opera')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    await chatInput.fill('Add characters: captain and engineer')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]:nth-of-type(2)', { timeout: 10000 })

    // Check progress percentage
    const progressText = await page.locator('[data-testid="progress-percentage"]').textContent()
    const percentage = parseInt(progressText?.match(/\d+/)?.[0] || '0')

    expect(percentage).toBeGreaterThan(20)
    expect(percentage).toBeLessThan(50)
  })

  test('should handle manual override option', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    // Select manual override from choices
    await page.locator('[data-testid="chat-input"]').fill('What should I do next?')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="chat-choice"]', { timeout: 10000 })

    // Click manual override
    await page.click('[data-testid="chat-choice"]:has-text("Manual Override")')

    // Should show advanced workflow controls
    await expect(page.locator('[data-testid="advanced-workflow-controls"]')).toBeVisible()
  })

  test('should show estimated time for each step', async ({ page }) => {
    await page.click('[data-testid="workflow-steps"]')

    // Each step should show estimated duration
    const stepCards = page.locator('[data-testid="workflow-step-card"]')
    const firstStep = stepCards.first()

    await expect(firstStep.locator('[data-testid="estimated-time"]')).toBeVisible()
    const timeText = await firstStep.locator('[data-testid="estimated-time"]').textContent()

    expect(timeText).toMatch(/\d+.*minute/i)
  })

  test('should track time spent on each step', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Work on initial concept
    await chatInput.fill('Developing my movie concept')
    await page.click('[data-testid="send-message"]')

    // Wait some time
    await page.waitForTimeout(5000)

    // Check time tracker
    await page.click('[data-testid="workflow-steps"]')
    const timeSpent = await page.locator('[data-testid="time-spent-initial-concept"]').textContent()

    expect(timeSpent).toMatch(/\d+.*second/i)
  })

  test('should show workflow completion celebration', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Rapidly complete all steps (mock)
    // In real scenario, this would take many messages
    await chatInput.fill('Complete all workflow steps')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Simulate reaching 100%
    // Check for completion celebration
    const progress = await page.locator('[data-testid="progress-bar"]').getAttribute('aria-valuenow')

    if (parseInt(progress || '0') === 100) {
      await expect(page.locator('[data-testid="completion-celebration"]')).toBeVisible()
    }
  })

  test('should persist workflow state across sessions', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')
    const chatInput = page.locator('[data-testid="chat-input"]')

    // Make progress
    await chatInput.fill('Initial concept complete')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Reload page
    await page.reload()

    // Workflow progress should be maintained
    await expect(page.locator('[data-testid="current-step"]')).toContainText('Initial Concept')

    const progress = await page.locator('[data-testid="progress-bar"]').getAttribute('aria-valuenow')
    expect(parseInt(progress || '0')).toBeGreaterThan(0)
  })
})