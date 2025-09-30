import { test, expect } from '@playwright/test'

/**
 * E2E Tests: Character Creation via Chat
 *
 * Tests the complete user flow for creating characters through
 * the chat interface, from typing a message to seeing the character
 * appear in the project.
 *
 * Coverage includes:
 * - Chat UI interaction
 * - Real-time message processing
 * - Character creation feedback
 * - Production task triggering
 * - Character list updates
 */

test.describe('Character Creation via Chat', () => {
  let projectId: string

  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Create a test project
    await page.click('button:has-text("New Project")')
    await page.fill('input[name="title"]', 'E2E Test Project')
    await page.fill('textarea[name="description"]', 'Test project for E2E tests')
    await page.selectOption('select[name="genre"]', 'action')
    await page.fill('input[name="episodeCount"]', '5')
    await page.click('button:has-text("Create Project")')

    // Wait for project creation and extract ID from URL
    await page.waitForURL(/\/projects\/.*/)
    projectId = page.url().split('/').pop() || ''
  })

  test('should create a single character from chat message', async ({ page }) => {
    // Open chat
    await page.click('[data-testid="chat-button"]')

    // Type character description
    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create a character named John, a brave detective in his 40s')

    // Send message
    await page.click('[data-testid="send-message"]')

    // Wait for AI response
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Check for character creation confirmation
    const response = await page.locator('[data-testid="assistant-message"]').last().textContent()
    expect(response).toContain('John')

    // Verify character appears in character list
    await page.click('[data-testid="characters-tab"]')
    await expect(page.locator('[data-testid="character-card"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="character-name"]')).toContainText('John')
  })

  test('should create multiple characters in one message', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create two characters: Sarah (a scientist) and Mike (a soldier)')

    await page.click('[data-testid="send-message"]')

    // Wait for processing
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Check characters list
    await page.click('[data-testid="characters-tab"]')
    await expect(page.locator('[data-testid="character-card"]')).toHaveCount(2)

    // Verify both names appear
    const characterNames = await page.locator('[data-testid="character-name"]').allTextContents()
    expect(characterNames.some(name => name.includes('Sarah'))).toBe(true)
    expect(characterNames.some(name => name.includes('Mike'))).toBe(true)
  })

  test('should show character attributes in detail view', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill(`Create Dr. Elena Rodriguez, a brilliant neuroscientist with dark hair,
                         age 35, who is determined and compassionate`)

    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Navigate to character details
    await page.click('[data-testid="characters-tab"]')
    await page.click('[data-testid="character-card"]')

    // Verify attributes are shown
    await expect(page.locator('[data-testid="character-age"]')).toContainText('35')
    await expect(page.locator('[data-testid="character-occupation"]')).toContainText('neuroscientist')
    await expect(page.locator('[data-testid="character-appearance"]')).toContainText('dark hair')
    await expect(page.locator('[data-testid="character-personality"]')).toContainText('determined')
  })

  test('should trigger production task for character', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Alex')

    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Check for production task notification
    await expect(page.locator('[data-testid="production-task-badge"]')).toBeVisible()

    // Open production tasks panel
    await page.click('[data-testid="production-tasks-button"]')

    // Verify character sheet generation task
    await expect(page.locator('[data-testid="task-type"]')).toContainText('character_sheet')
    await expect(page.locator('[data-testid="task-status"]')).toContainText('pending')
  })

  test('should provide contextual choices after character creation', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Hero')

    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Check for suggested actions
    await expect(page.locator('[data-testid="chat-choice"]')).toHaveCount(3, { timeout: 5000 })

    // Verify choice options
    const choices = await page.locator('[data-testid="chat-choice-title"]').allTextContents()
    expect(choices.some(choice => choice.includes('Scene') || choice.includes('Story'))).toBe(true)
  })

  test('should handle character refinement in follow-up messages', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')

    // Create character
    await chatInput.fill('Create character John')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Refine character
    await chatInput.fill('Make John a detective with a dark past')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]:nth-of-type(2)', { timeout: 10000 })

    // Verify character was updated
    await page.click('[data-testid="characters-tab"]')
    await page.click('[data-testid="character-card"]')

    await expect(page.locator('[data-testid="character-occupation"]')).toContainText('detective')
    await expect(page.locator('[data-testid="character-backstory"]')).toContainText('dark past')
  })

  test('should display extraction summary', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Add Sarah as a new character')

    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Check for extraction summary
    await expect(page.locator('[data-testid="extraction-summary"]')).toBeVisible()
    await expect(page.locator('[data-testid="entity-count"]')).toContainText('1')
  })

  test('should handle errors gracefully', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character with invalid @#$%^& characters')

    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Should still get a response (even if no character created)
    const response = await page.locator('[data-testid="assistant-message"]').last().textContent()
    expect(response).toBeTruthy()
    expect(response!.length).toBeGreaterThan(0)
  })

  test('should show loading state during processing', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character Test')

    await page.click('[data-testid="send-message"]')

    // Verify loading indicator appears
    await expect(page.locator('[data-testid="message-loading"]')).toBeVisible()

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Loading should disappear
    await expect(page.locator('[data-testid="message-loading"]')).not.toBeVisible()
  })

  test('should maintain character count in project summary', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    // Create first character
    await page.locator('[data-testid="chat-input"]').fill('Create character A')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Create second character
    await page.locator('[data-testid="chat-input"]').fill('Create character B')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]:nth-of-type(2)', { timeout: 10000 })

    // Check project summary
    await page.click('[data-testid="project-summary"]')
    await expect(page.locator('[data-testid="character-count"]')).toContainText('2')
  })

  test('should support keyboard shortcuts', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('Create character KeyboardTest')

    // Send with Enter key
    await chatInput.press('Enter')

    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    const response = await page.locator('[data-testid="assistant-message"]').last().textContent()
    expect(response).toContain('KeyboardTest')
  })

  test('should handle concurrent character creation', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    const chatInput = page.locator('[data-testid="chat-input"]')

    // Send multiple messages quickly
    await chatInput.fill('Create character One')
    await page.click('[data-testid="send-message"]')

    await chatInput.fill('Create character Two')
    await page.click('[data-testid="send-message"]')

    await chatInput.fill('Create character Three')
    await page.click('[data-testid="send-message"]')

    // Wait for all responses
    await page.waitForSelector('[data-testid="assistant-message"]:nth-of-type(3)', { timeout: 15000 })

    // Check all characters were created
    await page.click('[data-testid="characters-tab"]')
    await expect(page.locator('[data-testid="character-card"]')).toHaveCount(3, { timeout: 5000 })
  })

  test('should auto-scroll chat to latest message', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    // Send several messages
    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="chat-input"]').fill(`Create character ${i}`)
      await page.click('[data-testid="send-message"]')
      await page.waitForTimeout(1000)
    }

    // Last message should be visible
    await expect(page.locator('[data-testid="assistant-message"]').last()).toBeInViewport()
  })

  test('should preserve session across page refresh', async ({ page }) => {
    await page.click('[data-testid="chat-button"]')

    // Create character
    await page.locator('[data-testid="chat-input"]').fill('Create character Persistent')
    await page.click('[data-testid="send-message"]')
    await page.waitForSelector('[data-testid="assistant-message"]', { timeout: 10000 })

    // Refresh page
    await page.reload()

    // Check character still exists
    await page.click('[data-testid="characters-tab"]')
    await expect(page.locator('[data-testid="character-name"]')).toContainText('Persistent')
  })
})