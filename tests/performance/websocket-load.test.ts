import { test, expect } from '@playwright/test';
import { performance } from 'perf_hooks';

/**
 * Performance Test: WebSocket Connection Load Testing
 * 
 * Target: WebSocket connection stability under load
 * 
 * This test validates WebSocket performance under various load conditions:
 * - Multiple concurrent connections
 * - High-frequency message throughput
 * - Connection resilience and recovery
 * - Memory usage under sustained load
 * - Real-time synchronization accuracy
 * - Scaling behavior with user count
 */
test.describe('WebSocket Load Testing', () => {
  let projectId: string;

  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="submit-login"]');

    // Create test project
    await page.click('[data-testid="create-project-button"]');
    await page.fill('[data-testid="project-title"]', 'WebSocket Load Test');
    await page.selectOption('[data-testid="project-genre"]', 'Thriller');
    await page.fill('[data-testid="episode-count"]', '5');
    await page.click('[data-testid="create-project-submit"]');

    projectId = page.url().split('/').pop()!;

    // Navigate to chat interface
    await page.click('[data-testid="start-chat-button"]');
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
  });

  test('should maintain stable WebSocket connection under message load', async ({ page }) => {
    const messageCount = 50;
    const messageInterval = 100; // ms between messages
    const connectionMetrics: number[] = [];

    console.log(`Testing ${messageCount} messages with ${messageInterval}ms intervals`);

    // Monitor connection status throughout test
    const connectionMonitor = setInterval(async () => {
      try {
        const status = await page.locator('[data-testid="connection-status"]').textContent();
        if (status?.includes('Connected')) {
          connectionMetrics.push(performance.now());
        }
      } catch (e) {
        // Connection status might not be available during heavy load
      }
    }, 200);

    const startTime = performance.now();

    // Send high-frequency messages
    for (let i = 1; i <= messageCount; i++) {
      const messageText = `Load test message ${i} - testing WebSocket throughput`;
      
      await page.fill('[data-testid="message-input"]', messageText);
      await page.click('[data-testid="send-message"]');

      // Log progress every 10 messages
      if (i % 10 === 0) {
        const elapsed = performance.now() - startTime;
        console.log(`Sent ${i} messages in ${elapsed.toFixed(2)}ms`);
      }

      // Wait for specified interval
      if (i < messageCount) {
        await page.waitForTimeout(messageInterval);
      }
    }

    // Wait for all responses to arrive
    await expect(page.locator('[data-testid="message-item"]')).toHaveCount(messageCount * 2, { timeout: 30000 }); // User messages + AI responses

    const totalTime = performance.now() - startTime;
    clearInterval(connectionMonitor);

    console.log(`Load test completed in ${totalTime.toFixed(2)}ms`);
    console.log(`Average message processing: ${(totalTime / messageCount).toFixed(2)}ms`);
    console.log(`Connection stable for: ${connectionMetrics.length} checks`);

    // Performance validations
    expect(totalTime).toBeLessThan(60000); // Should complete within 60 seconds
    expect(connectionMetrics.length).toBeGreaterThan(10); // Connection should remain stable
    
    // Connection should still be active
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
  });

  test('should handle multiple concurrent WebSocket connections', async ({ browser }) => {
    const connectionCount = 5;
    const contexts = [];
    const pages = [];
    const connectionTimes: number[] = [];

    try {
      // Create multiple browser contexts and pages
      for (let i = 0; i < connectionCount; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        contexts.push(context);
        pages.push(page);

        // Authenticate each user
        await page.goto('/');
        await page.fill('[data-testid="email-input"]', `user${i}@example.com`);
        await page.fill('[data-testid="password-input"]', 'testpassword123');
        await page.click('[data-testid="submit-login"]');
      }

      // Connect all users to the same project chat
      const connectionPromises = pages.map(async (page, index) => {
        const startTime = performance.now();
        
        await page.goto(`/dashboard/projects/${projectId}/chat`);
        await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
        await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
        
        const connectionTime = performance.now() - startTime;
        connectionTimes.push(connectionTime);
        
        console.log(`User ${index} connected in ${connectionTime.toFixed(2)}ms`);
        return page;
      });

      await Promise.all(connectionPromises);

      // Validate all connections established quickly
      const avgConnectionTime = connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length;
      const maxConnectionTime = Math.max(...connectionTimes);

      console.log(`Average connection time: ${avgConnectionTime.toFixed(2)}ms`);
      console.log(`Max connection time: ${maxConnectionTime.toFixed(2)}ms`);

      expect(avgConnectionTime).toBeLessThan(3000); // Should connect quickly
      expect(maxConnectionTime).toBeLessThan(5000); // Even slowest connection should be reasonable

      // Test message synchronization across all connections
      const testMessage = `Multi-user test message from user 0 - ${Date.now()}`;
      
      await pages[0].fill('[data-testid="message-input"]', testMessage);
      await pages[0].click('[data-testid="send-message"]');

      // All other users should see the message
      for (let i = 1; i < pages.length; i++) {
        await expect(pages[i].locator('[data-testid="user-message"]').last()).toContainText(testMessage, { timeout: 5000 });
        console.log(`User ${i} received message successfully`);
      }

      // Test concurrent message sending
      const concurrentMessages = pages.map(async (page, index) => {
        const message = `Concurrent message from user ${index}`;
        await page.fill('[data-testid="message-input"]', message);
        await page.click('[data-testid="send-message"]');
        return message;
      });

      const sentMessages = await Promise.all(concurrentMessages);

      // Validate all messages appear in all chat interfaces
      for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
        for (const message of sentMessages) {
          await expect(pages[pageIndex].locator('[data-testid="user-message"]')).toContainText(message, { timeout: 10000 });
        }
        console.log(`User ${pageIndex} received all concurrent messages`);
      }

    } finally {
      // Cleanup all contexts
      for (const context of contexts) {
        await context.close();
      }
    }
  });

  test('should recover gracefully from WebSocket disconnections', async ({ page }) => {
    // Establish baseline connection
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');

    // Send initial message to confirm working state
    await page.fill('[data-testid="message-input"]', 'Pre-disconnection message');
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 5000 });

    // Simulate network disconnection
    const disconnectStartTime = performance.now();
    await page.context().setOffline(true);

    // Should detect disconnection
    await expect(page.locator('[data-testid="connection-status"]')).toContainText(/disconnected|reconnecting/i, { timeout: 5000 });

    // Restore network connection
    await page.waitForTimeout(2000); // Simulate brief outage
    await page.context().setOffline(false);

    // Should reconnect automatically
    const reconnectTimeout = 15000; // Allow time for reconnection logic
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected', { timeout: reconnectTimeout });

    const reconnectTime = performance.now() - disconnectStartTime;
    console.log(`Reconnection completed in ${reconnectTime.toFixed(2)}ms`);

    // Validate functionality after reconnection
    await page.fill('[data-testid="message-input"]', 'Post-reconnection message');
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 8000 });

    // Reconnection should be reasonably fast
    expect(reconnectTime).toBeLessThan(20000); // Should reconnect within 20 seconds
  });

  test('should handle WebSocket message queuing during disconnection', async ({ page }) => {
    // Send initial message to confirm working state
    await page.fill('[data-testid="message-input"]', 'Initial working message');
    await page.click('[data-testid="send-message"]');
    await expect(page.locator('[data-testid="ai-response"]').last()).toBeVisible({ timeout: 5000 });

    // Disconnect network
    await page.context().setOffline(true);
    await expect(page.locator('[data-testid="connection-status"]')).toContainText(/disconnected|reconnecting/i, { timeout: 5000 });

    // Send messages while offline (should be queued)
    const offlineMessages = [
      'Queued message 1',
      'Queued message 2', 
      'Queued message 3'
    ];

    for (const message of offlineMessages) {
      await page.fill('[data-testid="message-input"]', message);
      await page.click('[data-testid="send-message"]');
      
      // Should show queued status
      await expect(page.locator('[data-testid="message-queued"]').last()).toBeVisible({ timeout: 2000 });
    }

    // Restore connection
    await page.context().setOffline(false);
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected', { timeout: 15000 });

    // Queued messages should be sent automatically
    for (const message of offlineMessages) {
      await expect(page.locator('[data-testid="user-message"]')).toContainText(message, { timeout: 10000 });
      // Should receive AI responses for queued messages
      await expect(page.locator('[data-testid="ai-response"]')).toContainText(/response|message|received/i, { timeout: 8000 });
    }

    console.log('All queued messages processed successfully after reconnection');
  });

  test('should monitor WebSocket memory usage under sustained load', async ({ page }) => {
    const sustainedLoadDuration = 30000; // 30 seconds
    const messageInterval = 1000; // 1 second between messages
    const startTime = performance.now();

    console.log(`Starting sustained load test for ${sustainedLoadDuration / 1000} seconds`);

    let messageCount = 0;
    const memoryChecks: number[] = [];

    // Monitor memory usage (browser implementation dependent)
    const memoryMonitor = setInterval(async () => {
      try {
        const memInfo = await page.evaluate(() => {
          if ((performance as any).memory) {
            return (performance as any).memory.usedJSHeapSize;
          }
          return 0;
        });
        
        if (memInfo > 0) {
          memoryChecks.push(memInfo);
        }
      } catch (e) {
        // Memory API might not be available
      }
    }, 5000);

    // Send messages continuously
    const sustainedLoad = setInterval(async () => {
      try {
        messageCount++;
        const message = `Sustained load message ${messageCount} - ${Date.now()}`;
        
        await page.fill('[data-testid="message-input"]', message);
        await page.click('[data-testid="send-message"]');

        if (messageCount % 10 === 0) {
          const elapsed = performance.now() - startTime;
          console.log(`Sustained load: ${messageCount} messages in ${(elapsed / 1000).toFixed(1)}s`);
        }

      } catch (e) {
        console.log('Error during sustained load:', e);
      }
    }, messageInterval);

    // Run for specified duration
    await page.waitForTimeout(sustainedLoadDuration);
    
    clearInterval(sustainedLoad);
    clearInterval(memoryMonitor);

    const totalTime = performance.now() - startTime;
    console.log(`Sustained load completed: ${messageCount} messages in ${(totalTime / 1000).toFixed(1)}s`);

    if (memoryChecks.length > 0) {
      const avgMemory = memoryChecks.reduce((a, b) => a + b, 0) / memoryChecks.length;
      const maxMemory = Math.max(...memoryChecks);
      const minMemory = Math.min(...memoryChecks);
      
      console.log(`Memory usage - Avg: ${(avgMemory / 1024 / 1024).toFixed(2)}MB, Max: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
      
      // Memory shouldn't grow excessively (rough check)
      const memoryGrowth = maxMemory - minMemory;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    }

    // Connection should remain stable
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
    
    // Should have processed significant number of messages
    expect(messageCount).toBeGreaterThan(20); // At minimum based on interval
  });

  test.afterEach(async ({ page }) => {
    // Cleanup test project
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