import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';

/**
 * Performance Test: Chat Response Times
 * 
 * Target: Chat message responses < 2 seconds
 * 
 * This test validates that the AI Movie Platform meets performance
 * requirements for chat interactions under various conditions:
 * - Single user chat response times
 * - Concurrent user load testing
 * - Different message types and complexities
 * - Network condition variations
 * - AI service response optimization
 */
test.describe('Chat Response Time Performance', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    // Setup authenticated session and test project
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="submit-login"]');

    // Create test project
    await page.click('[data-testid="create-project-button"]');
    await page.fill('[data-testid="project-title"]', 'Performance Test Project');
    await page.selectOption('[data-testid="project-genre"]', 'Action');
    await page.fill('[data-testid="episode-count"]', '5');
    await page.click('[data-testid="create-project-submit"]');

    projectId = page.url().split('/').pop()!;

    // Navigate to chat interface
    await page.click('[data-testid="start-chat-button"]');
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
  });

  test('should respond to simple chat messages within 2 seconds', async ({ page }) => {
    const testMessages = [
      'Hello, let\'s start working on this project.',
      'What genre should we focus on?',
      'I want to create an action-packed opening scene.',
      'How many characters should we include?',
      'What\'s the target audience for this project?'
    ];

    const responseTimings: number[] = [];

    for (const message of testMessages) {
      // Measure response time
      const startTime = performance.now();

      await page.fill('[data-testid="message-input"]', message);
      await page.click('[data-testid="send-message"]');

      // Wait for AI response
      await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 5000 });

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      responseTimings.push(responseTime);

      // Validate individual response time
      expect(responseTime).toBeLessThan(2000); // < 2 seconds

      console.log(`Message: "${message}" - Response time: ${responseTime.toFixed(2)}ms`);

      // Small delay between messages
      await page.waitForTimeout(500);
    }

    // Calculate and validate statistics
    const avgResponseTime = responseTimings.reduce((a, b) => a + b, 0) / responseTimings.length;
    const maxResponseTime = Math.max(...responseTimings);
    const minResponseTime = Math.min(...responseTimings);

    console.log(`Average response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Max response time: ${maxResponseTime.toFixed(2)}ms`);
    console.log(`Min response time: ${minResponseTime.toFixed(2)}ms`);

    // Performance assertions
    expect(avgResponseTime).toBeLessThan(1500); // Average should be well under limit
    expect(maxResponseTime).toBeLessThan(2000); // No single response over 2s
    expect(minResponseTime).toBeGreaterThan(100); // Sanity check - should take some time
  });

  test('should handle complex messages within performance limits', async ({ page }) => {
    const complexMessages = [
      'I want to create a detailed action sequence involving multiple characters in a high-speed car chase through downtown city streets with explosions, dramatic music, and close-up shots of the protagonists. The scene should build tension gradually and include dialogue between the main character and their partner about the mission objectives.',
      'Please analyze the uploaded reference materials and create a comprehensive character development plan that incorporates the visual style elements while maintaining consistency with the overall narrative arc. Consider the psychological motivations of each character and how their backstories influence their actions throughout the series.',
      'Design a complex multi-episode story arc that weaves together three separate plotlines: the main character\'s personal vendetta, the larger conspiracy they\'ve uncovered, and the romantic subplot with their partner. Each episode should advance all three storylines while maintaining individual episode themes and climaxes.'
    ];

    for (const message of complexMessages) {
      const startTime = performance.now();

      await page.fill('[data-testid="message-input"]', message);
      await page.click('[data-testid="send-message"]');

      // Wait for AI response with longer timeout for complex processing
      await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 8000 });

      const responseTime = performance.now() - startTime;
      
      console.log(`Complex message response time: ${responseTime.toFixed(2)}ms`);

      // Complex messages may take slightly longer but should still be reasonable
      expect(responseTime).toBeLessThan(3000); // Allow 3s for very complex queries

      await page.waitForTimeout(1000);
    }
  });

  test('should maintain performance under concurrent message load', async ({ page }) => {
    // Simulate rapid-fire message sending
    const rapidMessages = [
      'Quick question 1',
      'Quick question 2', 
      'Quick question 3',
      'Quick question 4',
      'Quick question 5'
    ];

    const startTime = performance.now();

    // Send messages rapidly without waiting
    for (let i = 0; i < rapidMessages.length; i++) {
      await page.fill('[data-testid="message-input"]', rapidMessages[i]);
      await page.click('[data-testid="send-message"]');
      await page.waitForTimeout(100); // Small delay to prevent input conflicts
    }

    // Wait for all responses to arrive
    await expect(page.locator('[data-testid="ai-response"]')).toHaveCount(rapidMessages.length, { timeout: 10000 });

    const totalTime = performance.now() - startTime;
    const averageTime = totalTime / rapidMessages.length;

    console.log(`Concurrent message handling - Total: ${totalTime.toFixed(2)}ms, Average: ${averageTime.toFixed(2)}ms`);

    // Should handle concurrent messages efficiently
    expect(averageTime).toBeLessThan(2500); // Allow some overhead for concurrency
  });

  test('should degrade gracefully under network constraints', async ({ page }) => {
    // Test with slow network conditions
    await page.route('**/api/v1/chat/**', async route => {
      // Add artificial delay to simulate slow network
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.continue();
    });

    const networkConstrainedMessage = 'Test message under network constraints';
    
    const startTime = performance.now();
    await page.fill('[data-testid="message-input"]', networkConstrainedMessage);
    await page.click('[data-testid="send-message"]');

    // Should show loading/processing indicator during delay
    await expect(page.locator('[data-testid="message-processing"]')).toBeVisible();

    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 6000 });
    const responseTime = performance.now() - startTime;

    console.log(`Network constrained response time: ${responseTime.toFixed(2)}ms`);

    // Should still complete within reasonable time despite network delay
    expect(responseTime).toBeLessThan(4000); // Allow extra time for network simulation
  });

  test('should handle choice selection performance efficiently', async ({ page }) => {
    // Send message to trigger choice presentation
    await page.fill('[data-testid="message-input"]', 'Please give me some options for the opening scene.');
    await page.click('[data-testid="send-message"]');

    // Wait for choices to appear
    await expect(page.locator('[data-testid="choice-selector"]')).toBeVisible({ timeout: 5000 });

    // Measure choice selection response time
    const startTime = performance.now();
    await page.click('[data-testid="choice-option"]:first-child');

    // Wait for workflow progression
    await expect(page.locator('[data-testid="step-advanced"]')).toBeVisible({ timeout: 3000 });
    
    const selectionTime = performance.now() - startTime;
    
    console.log(`Choice selection processing time: ${selectionTime.toFixed(2)}ms`);

    // Choice selection should be nearly instant
    expect(selectionTime).toBeLessThan(1000);
  });

  test('should maintain WebSocket connection performance', async ({ page }) => {
    // Test WebSocket message roundtrip time
    const connectionStartTime = performance.now();

    // Trigger WebSocket activity by sending a message
    await page.fill('[data-testid="message-input"]', 'WebSocket performance test');
    await page.click('[data-testid="send-message"]');

    // Check connection status updates
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
    
    const connectionTime = performance.now() - connectionStartTime;
    
    console.log(`WebSocket roundtrip time: ${connectionTime.toFixed(2)}ms`);

    // WebSocket operations should be very fast
    expect(connectionTime).toBeLessThan(500);

    // Test connection resilience
    await page.evaluate(() => {
      // Simulate temporary connection issue
      (window as any).testWebSocketDisconnect = true;
    });

    // Should reconnect automatically
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Reconnecting', { timeout: 2000 });
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected', { timeout: 5000 });
  });

  test.afterEach(async ({ page }) => {
    // Performance test cleanup
    if (projectId) {
      await page.goto(`/dashboard/projects/${projectId}`);
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