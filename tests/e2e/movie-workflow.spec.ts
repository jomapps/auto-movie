import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Movie Project Workflow
 * 
 * This test validates the complete user journey from project creation
 * through chat interaction to project completion, following the scenarios
 * outlined in quickstart.md.
 * 
 * Test flow:
 * 1. User authentication and account setup
 * 2. Project creation with required metadata
 * 3. Chat interface initialization and first interaction
 * 4. File upload and AI processing integration
 * 5. Choice selection and workflow progression
 * 6. Manual override functionality
 * 7. Session persistence and restoration
 * 8. Progress tracking and completion validation
 */
test.describe('Complete Movie Project Workflow', () => {
  let projectId: string;
  let sessionId: string;

  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate
    await page.goto('/');
    
    // Check if already authenticated, otherwise login
    const loginButton = page.locator('[data-testid="login-button"]').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await page.fill('[data-testid="email-input"]', 'test@example.com');
      await page.fill('[data-testid="password-input"]', 'testpassword123');
      await page.click('[data-testid="submit-login"]');
    }

    // Wait for dashboard to load
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  });

  test('should complete full movie project workflow from creation to completion', async ({ page }) => {
    // Step 1: Create new project
    await page.click('[data-testid="create-project-button"]');
    await expect(page.locator('[data-testid="project-creation-form"]')).toBeVisible();

    // Fill project creation form
    await page.fill('[data-testid="project-title"]', 'E2E Test Movie Project');
    await page.fill('[data-testid="project-description"]', 'Test project for E2E validation');
    await page.selectOption('[data-testid="project-genre"]', 'Action');
    await page.fill('[data-testid="episode-count"]', '5');
    await page.selectOption('[data-testid="target-audience"]', 'PG-13');

    // Submit project creation
    await page.click('[data-testid="create-project-submit"]');

    // Wait for redirect to project detail page
    await expect(page).toHaveURL(/\/dashboard\/projects\/[a-zA-Z0-9]+$/);
    
    // Extract project ID from URL
    const url = page.url();
    projectId = url.split('/').pop()!;

    // Validate project details are displayed
    await expect(page.locator('[data-testid="project-title"]')).toContainText('E2E Test Movie Project');
    await expect(page.locator('[data-testid="project-genre"]')).toContainText('Action');
    await expect(page.locator('[data-testid="episode-count"]')).toContainText('5');

    // Step 2: Navigate to chat interface
    await page.click('[data-testid="start-chat-button"]');
    await expect(page).toHaveURL(/\/dashboard\/projects\/[a-zA-Z0-9]+\/chat$/);

    // Validate chat interface components load
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-area"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-upload-area"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();

    // Validate WebSocket connection status
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');

    // Validate initial system message and choices presentation
    await expect(page.locator('[data-testid="system-message"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="choice-selector"]')).toBeVisible();

    // Step 3: File upload and AI processing
    // Simulate file upload (using test image file)
    const fileInput = page.locator('[data-testid="file-input"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');

    // Wait for upload completion and AI processing
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="ai-processing-complete"]')).toBeVisible({ timeout: 30000 });

    // Validate file appears in media list
    await expect(page.locator('[data-testid="uploaded-media"]')).toBeVisible();

    // Step 4: First chat interaction with AI
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('I want to create an action movie with high-energy scenes. Please incorporate the uploaded reference image for the visual style.');
    await page.click('[data-testid="send-message"]');

    // Wait for AI response with timeout
    await expect(page.locator('[data-testid="ai-response"]').first()).toBeVisible({ timeout: 10000 });

    // Validate AI mentions uploaded reference in response
    const aiResponse = await page.locator('[data-testid="ai-response"]').first().textContent();
    expect(aiResponse).toMatch(/reference|image|style|uploaded/i);

    // Step 5: Choice selection and workflow progression
    await expect(page.locator('[data-testid="choice-options"]')).toBeVisible();
    
    // Select the first recommended choice
    await page.click('[data-testid="choice-option"]:first-child');

    // Validate progress advancement
    const progressBefore = await page.locator('[data-testid="progress-percentage"]').textContent();
    
    // Wait for workflow step advancement
    await expect(page.locator('[data-testid="step-advanced"]')).toBeVisible({ timeout: 5000 });
    
    const progressAfter = await page.locator('[data-testid="progress-percentage"]').textContent();
    expect(parseInt(progressAfter!) > parseInt(progressBefore!)).toBe(true);

    // Validate new choices are presented
    await expect(page.locator('[data-testid="choice-options"]')).toBeVisible();

    // Step 6: Manual override functionality
    await page.click('[data-testid="manual-override-button"]');
    await expect(page.locator('[data-testid="manual-override-input"]')).toBeVisible();

    // Provide custom instructions
    await page.fill('[data-testid="manual-override-input"]', 'I want to add a specific car chase scene in episode 2 with vintage muscle cars');
    await page.click('[data-testid="submit-override"]');

    // Wait for custom instructions to be processed
    await expect(page.locator('[data-testid="override-processed"]')).toBeVisible({ timeout: 10000 });

    // Validate custom instructions appear in next AI response
    const customResponse = await page.locator('[data-testid="ai-response"]').last().textContent();
    expect(customResponse).toMatch(/car chase|vintage|muscle cars|episode 2/i);

    // Step 7: Session persistence test
    // Get current session state
    sessionId = await page.locator('[data-testid="session-id"]').getAttribute('data-session-id') || '';
    const currentStep = await page.locator('[data-testid="current-step"]').textContent();
    const messageCount = await page.locator('[data-testid="message-item"]').count();

    // Simulate browser refresh/disconnection
    await page.reload();

    // Validate session restoration
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await expect(page.locator('[data-testid="session-restored"]')).toBeVisible({ timeout: 5000 });

    // Validate conversation history is preserved
    const restoredMessageCount = await page.locator('[data-testid="message-item"]').count();
    expect(restoredMessageCount).toBe(messageCount);

    // Validate correct workflow step is maintained
    await expect(page.locator('[data-testid="current-step"]')).toContainText(currentStep!);

    // Step 8: Progress multiple workflow steps toward completion
    let currentProgress = parseInt(await page.locator('[data-testid="progress-percentage"]').textContent() || '0');
    let iterationCount = 0;
    const maxIterations = 20; // Safety limit to prevent infinite loops

    // Continue workflow until significant progress or completion
    while (currentProgress < 80 && iterationCount < maxIterations) {
      // Check if choices are available
      const choicesVisible = await page.locator('[data-testid="choice-options"]').isVisible();
      
      if (choicesVisible) {
        // Select a choice to advance workflow
        await page.click('[data-testid="choice-option"]:first-child');
        
        // Wait for processing
        await page.waitForTimeout(2000);
        
        // Check progress update
        const newProgress = parseInt(await page.locator('[data-testid="progress-percentage"]').textContent() || '0');
        
        if (newProgress > currentProgress) {
          currentProgress = newProgress;
        }
      } else {
        // If no choices, send a message to continue workflow
        await messageInput.fill('Please continue with the next step in the movie production process.');
        await page.click('[data-testid="send-message"]');
        
        // Wait for AI response and new choices
        await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 10000 });
      }
      
      iterationCount++;
    }

    // Step 9: Validate final project state
    // Check that substantial progress was made
    expect(currentProgress).toBeGreaterThan(50);

    // Navigate back to project detail page to check overall status
    await page.goto(`/dashboard/projects/${projectId}`);

    // Validate project status updates
    await expect(page.locator('[data-testid="project-status"]')).toContainText(/in progress|active|pre-production|production/i);
    
    // Validate session is listed in project sessions
    await expect(page.locator('[data-testid="active-sessions"]')).toBeVisible();
    
    // Validate media assets are associated with project
    await expect(page.locator('[data-testid="project-media-count"]')).toContainText(/[1-9]/); // At least 1 media file

    // Step 10: Performance validation
    // Check that all critical interactions meet performance targets
    
    // Navigate back to chat for final performance check
    await page.goto(`/dashboard/projects/${projectId}/chat`);
    
    // Measure chat message response time
    const startTime = Date.now();
    await messageInput.fill('Final test message for performance validation');
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 5000 });
    const responseTime = Date.now() - startTime;
    
    // Validate response time meets target (<2 seconds)
    expect(responseTime).toBeLessThan(2000);

    // Validate all core functionality remains working
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-upload-area"]')).toBeVisible();
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Create a project first
    await page.click('[data-testid="create-project-button"]');
    await page.fill('[data-testid="project-title"]', 'Error Test Project');
    await page.selectOption('[data-testid="project-genre"]', 'Comedy');
    await page.fill('[data-testid="episode-count"]', '3');
    await page.click('[data-testid="create-project-submit"]');

    // Navigate to chat
    await page.click('[data-testid="start-chat-button"]');

    // Test error handling for network issues
    // Simulate network offline
    await page.context().setOffline(true);

    // Try to send a message
    await page.fill('[data-testid="message-input"]', 'Test message during offline');
    await page.click('[data-testid="send-message"]');

    // Validate error message appears
    await expect(page.locator('[data-testid="connection-error"]')).toBeVisible({ timeout: 5000 });

    // Restore network and validate recovery
    await page.context().setOffline(false);
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected', { timeout: 10000 });

    // Validate message can be sent after recovery
    await page.fill('[data-testid="message-input"]', 'Test message after recovery');
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 10000 });
  });

  test('should validate subscription limits and upgrade prompts', async ({ page }) => {
    // Test free tier limitations
    await page.goto('/dashboard/projects');

    // Check current project count
    const projectCount = await page.locator('[data-testid="project-item"]').count();

    // If approaching free tier limit (assume 3 projects for free tier)
    if (projectCount >= 2) {
      await page.click('[data-testid="create-project-button"]');
      
      // Fill form for project that would exceed limit
      await page.fill('[data-testid="project-title"]', 'Limit Test Project');
      await page.selectOption('[data-testid="project-genre"]', 'Drama');
      await page.fill('[data-testid="episode-count"]', '10'); // High episode count
      
      // Submit and expect upgrade prompt
      await page.click('[data-testid="create-project-submit"]');
      
      // Should show upgrade prompt instead of creating project
      await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-to-pro"]')).toBeVisible();
    }
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Archive test project if it was created
    if (projectId) {
      await page.goto(`/dashboard/projects/${projectId}`);
      
      // Check if project actions menu exists
      const actionsMenu = page.locator('[data-testid="project-actions"]');
      if (await actionsMenu.isVisible()) {
        await actionsMenu.click();
        
        const archiveButton = page.locator('[data-testid="archive-project"]');
        if (await archiveButton.isVisible()) {
          await archiveButton.click();
          await page.click('[data-testid="confirm-archive"]');
        }
      }
    }
  });
});