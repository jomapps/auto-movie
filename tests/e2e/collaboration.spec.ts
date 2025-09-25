import { test, expect } from '@playwright/test';

/**
 * E2E Test: Multi-User Collaboration
 * 
 * This test validates multi-user collaboration features including:
 * - Project sharing and collaborator invitation
 * - Real-time chat synchronization between users
 * - Concurrent session management
 * - Permission levels and access control
 * - Collaborative decision making
 * - Conflict resolution in choices
 * 
 * Test requires multiple browser contexts to simulate different users.
 */
test.describe('Multi-User Collaboration', () => {
  let projectId: string;
  let ownerContext: any;
  let collaboratorContext: any;
  let ownerPage: any;
  let collaboratorPage: any;

  test.beforeAll(async ({ browser }) => {
    // Create two separate browser contexts for different users
    ownerContext = await browser.newContext();
    collaboratorContext = await browser.newContext();
    
    ownerPage = await ownerContext.newPage();
    collaboratorPage = await collaboratorContext.newPage();
  });

  test.beforeEach(async () => {
    // Authenticate owner user
    await ownerPage.goto('/');
    await ownerPage.fill('[data-testid="email-input"]', 'owner@example.com');
    await ownerPage.fill('[data-testid="password-input"]', 'ownerpassword123');
    await ownerPage.click('[data-testid="submit-login"]');
    await expect(ownerPage.locator('[data-testid="dashboard-header"]')).toBeVisible();

    // Authenticate collaborator user
    await collaboratorPage.goto('/');
    await collaboratorPage.fill('[data-testid="email-input"]', 'collaborator@example.com');
    await collaboratorPage.fill('[data-testid="password-input"]', 'collaboratorpassword123');
    await collaboratorPage.click('[data-testid="submit-login"]');
    await expect(collaboratorPage.locator('[data-testid="dashboard-header"]')).toBeVisible();
  });

  test('should enable real-time collaboration between project owner and collaborator', async () => {
    // Step 1: Owner creates project
    await ownerPage.click('[data-testid="create-project-button"]');
    await ownerPage.fill('[data-testid="project-title"]', 'Collaboration Test Project');
    await ownerPage.fill('[data-testid="project-description"]', 'Multi-user collaboration test');
    await ownerPage.selectOption('[data-testid="project-genre"]', 'Sci-Fi');
    await ownerPage.fill('[data-testid="episode-count"]', '6');
    await ownerPage.click('[data-testid="create-project-submit"]');

    // Extract project ID
    await expect(ownerPage).toHaveURL(/\/dashboard\/projects\/[a-zA-Z0-9]+$/);
    projectId = ownerPage.url().split('/').pop()!;

    // Step 2: Owner invites collaborator
    await ownerPage.click('[data-testid="project-settings"]');
    await ownerPage.click('[data-testid="manage-collaborators"]');
    
    await expect(ownerPage.locator('[data-testid="collaborator-management"]')).toBeVisible();
    await ownerPage.fill('[data-testid="invite-email"]', 'collaborator@example.com');
    await ownerPage.selectOption('[data-testid="collaborator-role"]', 'collaborator');
    await ownerPage.click('[data-testid="send-invitation"]');

    // Validate invitation sent
    await expect(ownerPage.locator('[data-testid="invitation-sent"]')).toBeVisible();

    // Step 3: Collaborator accepts invitation (simulated)
    // In real scenario, this would involve email verification
    // For E2E test, we'll navigate collaborator directly to shared project
    await collaboratorPage.goto(`/dashboard/projects/${projectId}`);

    // Validate collaborator can access project
    await expect(collaboratorPage.locator('[data-testid="project-title"]')).toContainText('Collaboration Test Project');
    await expect(collaboratorPage.locator('[data-testid="collaborator-badge"]')).toBeVisible();

    // Step 4: Both users start chat sessions
    await ownerPage.click('[data-testid="start-chat-button"]');
    await expect(ownerPage.locator('[data-testid="chat-interface"]')).toBeVisible();

    await collaboratorPage.click('[data-testid="start-chat-button"]');
    await expect(collaboratorPage.locator('[data-testid="chat-interface"]')).toBeVisible();

    // Validate both users show as connected
    await expect(ownerPage.locator('[data-testid="connection-status"]')).toContainText('Connected');
    await expect(collaboratorPage.locator('[data-testid="connection-status"]')).toContainText('Connected');

    // Step 5: Test real-time message synchronization
    // Owner sends message
    await ownerPage.fill('[data-testid="message-input"]', 'Hello collaborator! Let\'s work on this project together.');
    await ownerPage.click('[data-testid="send-message"]');

    // Validate message appears in both chat interfaces
    await expect(ownerPage.locator('[data-testid="user-message"]').last()).toContainText('Hello collaborator!');
    await expect(collaboratorPage.locator('[data-testid="user-message"]').last()).toContainText('Hello collaborator!');

    // Collaborator responds
    await collaboratorPage.fill('[data-testid="message-input"]', 'Great! I have some ideas for the sci-fi elements.');
    await collaboratorPage.click('[data-testid="send-message"]');

    // Validate response appears in both interfaces
    await expect(ownerPage.locator('[data-testid="user-message"]').last()).toContainText('sci-fi elements');
    await expect(collaboratorPage.locator('[data-testid="user-message"]').last()).toContainText('sci-fi elements');

    // Step 6: Test concurrent user indicators
    // Both users should see typing indicators when the other is typing
    await ownerPage.focus('[data-testid="message-input"]');
    await ownerPage.keyboard.type('I am typing...');

    // Check if collaborator sees typing indicator
    await expect(collaboratorPage.locator('[data-testid="typing-indicator"]')).toBeVisible({ timeout: 3000 });
    await expect(collaboratorPage.locator('[data-testid="typing-indicator"]')).toContainText('owner@example.com is typing');

    // Clear typing and send message
    await ownerPage.keyboard.press('Control+a');
    await ownerPage.keyboard.type('What specific sci-fi elements are you thinking about?');
    await ownerPage.click('[data-testid="send-message"]');

    // Typing indicator should disappear
    await expect(collaboratorPage.locator('[data-testid="typing-indicator"]')).not.toBeVisible();

    // Step 7: Test collaborative choice selection
    // Wait for AI to present choices
    await expect(ownerPage.locator('[data-testid="choice-selector"]')).toBeVisible({ timeout: 10000 });
    await expect(collaboratorPage.locator('[data-testid="choice-selector"]')).toBeVisible({ timeout: 10000 });

    // Validate both users see the same choices
    const ownerChoices = await ownerPage.locator('[data-testid="choice-option"]').count();
    const collaboratorChoices = await collaboratorPage.locator('[data-testid="choice-option"]').count();
    expect(ownerChoices).toBe(collaboratorChoices);

    // Owner selects a choice
    await ownerPage.click('[data-testid="choice-option"]:first-child');

    // Validate choice selection is synchronized
    await expect(ownerPage.locator('[data-testid="choice-selected"]')).toBeVisible();
    await expect(collaboratorPage.locator('[data-testid="choice-selected"]')).toBeVisible();

    // Both users should see workflow progression
    await expect(ownerPage.locator('[data-testid="step-advanced"]')).toBeVisible({ timeout: 5000 });
    await expect(collaboratorPage.locator('[data-testid="step-advanced"]')).toBeVisible({ timeout: 5000 });

    // Step 8: Test permission levels
    // Validate collaborator can interact with project
    await collaboratorPage.fill('[data-testid="message-input"]', 'I suggest we focus on space exploration themes.');
    await collaboratorPage.click('[data-testid="send-message"]');

    // Message should appear for both users
    await expect(ownerPage.locator('[data-testid="user-message"]').last()).toContainText('space exploration');
    await expect(collaboratorPage.locator('[data-testid="user-message"]').last()).toContainText('space exploration');

    // Both should be able to upload files
    const ownerFileInput = ownerPage.locator('[data-testid="file-input"]');
    await ownerFileInput.setInputFiles('tests/fixtures/test-image.jpg');
    await expect(ownerPage.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });

    // File should appear in collaborator's interface too
    await expect(collaboratorPage.locator('[data-testid="uploaded-media"]')).toBeVisible({ timeout: 5000 });

    // Step 9: Test active user display
    // Both interfaces should show active collaborators
    await expect(ownerPage.locator('[data-testid="active-users"]')).toBeVisible();
    await expect(collaboratorPage.locator('[data-testid="active-users"]')).toBeVisible();

    // Should show user count of 2
    await expect(ownerPage.locator('[data-testid="user-count"]')).toContainText('2');
    await expect(collaboratorPage.locator('[data-testid="user-count"]')).toContainText('2');

    // Step 10: Test session restoration with multiple users
    // Owner refreshes page
    await ownerPage.reload();
    await expect(ownerPage.locator('[data-testid="chat-interface"]')).toBeVisible();

    // Validate conversation history is preserved
    await expect(ownerPage.locator('[data-testid="user-message"]')).toContainText('space exploration');

    // Collaborator should still be connected and active
    await expect(collaboratorPage.locator('[data-testid="user-count"]')).toContainText('2');

    // New messages should still sync after refresh
    await collaboratorPage.fill('[data-testid="message-input"]', 'Welcome back! Did you see my space exploration idea?');
    await collaboratorPage.click('[data-testid="send-message"]');

    await expect(ownerPage.locator('[data-testid="user-message"]').last()).toContainText('Welcome back');
  });

  test('should handle collaborator permissions and access control', async () => {
    // Create project as owner
    await ownerPage.click('[data-testid="create-project-button"]');
    await ownerPage.fill('[data-testid="project-title"]', 'Permissions Test Project');
    await ownerPage.selectOption('[data-testid="project-genre"]', 'Horror');
    await ownerPage.fill('[data-testid="episode-count"]', '4');
    await ownerPage.click('[data-testid="create-project-submit"]');

    projectId = ownerPage.url().split('/').pop()!;

    // Test unauthorized access (collaborator not invited yet)
    await collaboratorPage.goto(`/dashboard/projects/${projectId}`);
    
    // Should show access denied or not found
    await expect(collaboratorPage.locator('[data-testid="access-denied"]')).toBeVisible();

    // Owner invites collaborator
    await ownerPage.goto(`/dashboard/projects/${projectId}`);
    await ownerPage.click('[data-testid="project-settings"]');
    await ownerPage.click('[data-testid="manage-collaborators"]');
    await ownerPage.fill('[data-testid="invite-email"]', 'collaborator@example.com');
    await ownerPage.selectOption('[data-testid="collaborator-role"]', 'viewer'); // Limited permissions
    await ownerPage.click('[data-testid="send-invitation"]');

    // Now collaborator can access (simulated invitation acceptance)
    await collaboratorPage.goto(`/dashboard/projects/${projectId}`);
    await expect(collaboratorPage.locator('[data-testid="project-title"]')).toBeVisible();

    // Test viewer permissions - should not be able to modify project settings
    const settingsButton = collaboratorPage.locator('[data-testid="project-settings"]');
    expect(await settingsButton.isVisible()).toBe(false);

    // But should be able to view chat interface
    await collaboratorPage.click('[data-testid="start-chat-button"]');
    await expect(collaboratorPage.locator('[data-testid="chat-interface"]')).toBeVisible();
  });

  test('should handle concurrent choice conflicts gracefully', async () => {
    // Setup project with both users in chat
    await ownerPage.click('[data-testid="create-project-button"]');
    await ownerPage.fill('[data-testid="project-title"]', 'Choice Conflict Test');
    await ownerPage.selectOption('[data-testid="project-genre"]', 'Thriller');
    await ownerPage.fill('[data-testid="episode-count"]', '5');
    await ownerPage.click('[data-testid="create-project-submit"]');

    projectId = ownerPage.url().split('/').pop()!;

    // Add collaborator and start both chat sessions
    await ownerPage.click('[data-testid="project-settings"]');
    await ownerPage.click('[data-testid="manage-collaborators"]');
    await ownerPage.fill('[data-testid="invite-email"]', 'collaborator@example.com');
    await ownerPage.click('[data-testid="send-invitation"]');

    await collaboratorPage.goto(`/dashboard/projects/${projectId}/chat`);
    await ownerPage.goto(`/dashboard/projects/${projectId}/chat`);

    // Wait for choices to appear
    await expect(ownerPage.locator('[data-testid="choice-selector"]')).toBeVisible({ timeout: 10000 });
    await expect(collaboratorPage.locator('[data-testid="choice-selector"]')).toBeVisible({ timeout: 10000 });

    // Simulate concurrent choice selection
    // Both users click different choices at nearly the same time
    const ownerChoicePromise = ownerPage.click('[data-testid="choice-option"]:first-child');
    const collaboratorChoicePromise = collaboratorPage.click('[data-testid="choice-option"]:last-child');

    await Promise.all([ownerChoicePromise, collaboratorChoicePromise]);

    // System should handle conflict gracefully
    // Either show conflict resolution dialog or accept first valid choice
    const ownerHasConflict = await ownerPage.locator('[data-testid="choice-conflict"]').isVisible();
    const collaboratorHasConflict = await collaboratorPage.locator('[data-testid="choice-conflict"]').isVisible();

    if (ownerHasConflict || collaboratorHasConflict) {
      // Conflict resolution UI should be shown
      await expect(ownerPage.locator('[data-testid="resolve-conflict"]')).toBeVisible();
      await expect(collaboratorPage.locator('[data-testid="resolve-conflict"]')).toBeVisible();
    } else {
      // One choice should be accepted and workflow should continue
      const ownerAdvanced = await ownerPage.locator('[data-testid="step-advanced"]').isVisible();
      const collaboratorAdvanced = await collaboratorPage.locator('[data-testid="step-advanced"]').isVisible();
      
      expect(ownerAdvanced && collaboratorAdvanced).toBe(true);
    }
  });

  test.afterEach(async () => {
    // Cleanup project
    if (projectId && ownerPage) {
      await ownerPage.goto(`/dashboard/projects/${projectId}`);
      
      const actionsMenu = ownerPage.locator('[data-testid="project-actions"]');
      if (await actionsMenu.isVisible()) {
        await actionsMenu.click();
        const archiveButton = ownerPage.locator('[data-testid="archive-project"]');
        if (await archiveButton.isVisible()) {
          await archiveButton.click();
          await ownerPage.click('[data-testid="confirm-archive"]');
        }
      }
    }
  });

  test.afterAll(async () => {
    // Close browser contexts
    await ownerContext?.close();
    await collaboratorContext?.close();
  });
});