import { test, expect } from '@playwright/test';

/**
 * E2E Test: Dashboard Navigation Flow
 * 
 * This test validates the complete dashboard user interface and navigation:
 * - Homepage to dashboard transition
 * - Dashboard layout and navigation components
 * - Project listing and filtering
 * - Project detail page navigation
 * - Chat interface access from multiple entry points
 * - Breadcrumb navigation
 * - Mobile responsive navigation
 * - User settings and profile management
 */
test.describe('Dashboard Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage and authenticate
    await page.goto('/');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'testpassword123');
    await page.click('[data-testid="submit-login"]');
  });

  test('should navigate from homepage through complete dashboard workflow', async ({ page }) => {
    // Step 1: Validate homepage elements before login redirect
    // (User should be redirected to dashboard after login)
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Step 2: Validate dashboard layout components
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-profile-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();

    // Step 3: Validate main navigation menu items
    const navigationItems = [
      'projects',
      'media',
      'settings',
      'help'
    ];

    for (const item of navigationItems) {
      await expect(page.locator(`[data-testid="nav-${item}"]`)).toBeVisible();
    }

    // Step 4: Test project navigation flow
    await page.click('[data-testid="nav-projects"]');
    await expect(page).toHaveURL(/\/dashboard\/projects/);
    await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="create-project-button"]')).toBeVisible();

    // Step 5: Create project to test detail navigation
    await page.click('[data-testid="create-project-button"]');
    await expect(page.locator('[data-testid="project-creation-form"]')).toBeVisible();

    await page.fill('[data-testid="project-title"]', 'Navigation Test Project');
    await page.fill('[data-testid="project-description"]', 'Testing dashboard navigation flow');
    await page.selectOption('[data-testid="project-genre"]', 'Adventure');
    await page.fill('[data-testid="episode-count"]', '4');
    await page.click('[data-testid="create-project-submit"]');

    // Step 6: Validate project detail page navigation
    await expect(page).toHaveURL(/\/dashboard\/projects\/[a-zA-Z0-9]+$/);
    const projectId = page.url().split('/').pop()!;

    // Validate breadcrumb navigation
    await expect(page.locator('[data-testid="breadcrumb-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="breadcrumb-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="breadcrumb-current"]')).toContainText('Navigation Test Project');

    // Validate project detail components
    await expect(page.locator('[data-testid="project-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-metadata"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-actions"]')).toBeVisible();

    // Step 7: Test chat interface navigation
    await page.click('[data-testid="start-chat-button"]');
    await expect(page).toHaveURL(/\/dashboard\/projects\/[a-zA-Z0-9]+\/chat$/);
    
    // Validate chat interface loads correctly
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    
    // Validate chat breadcrumb navigation
    await expect(page.locator('[data-testid="breadcrumb-chat"]')).toBeVisible();

    // Step 8: Test navigation back to project detail
    await page.click('[data-testid="breadcrumb-current-project"]');
    await expect(page).toHaveURL(/\/dashboard\/projects\/[a-zA-Z0-9]+$/);
    await expect(page.locator('[data-testid="project-header"]')).toBeVisible();

    // Step 9: Test navigation back to projects list
    await page.click('[data-testid="breadcrumb-projects"]');
    await expect(page).toHaveURL(/\/dashboard\/projects/);
    await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();

    // Validate new project appears in list
    await expect(page.locator('[data-testid="project-item"]')).toContainText('Navigation Test Project');

    // Step 10: Test media section navigation
    await page.click('[data-testid="nav-media"]');
    await expect(page).toHaveURL(/\/dashboard\/media/);
    await expect(page.locator('[data-testid="media-library"]')).toBeVisible();
    await expect(page.locator('[data-testid="media-filters"]')).toBeVisible();

    // Step 11: Test settings navigation
    await page.click('[data-testid="nav-settings"]');
    await expect(page).toHaveURL(/\/dashboard\/settings/);
    await expect(page.locator('[data-testid="settings-navigation"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-content"]')).toBeVisible();

    // Step 12: Test profile menu navigation
    await page.click('[data-testid="user-profile-menu"]');
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible();
    
    const profileMenuItems = [
      'profile-settings',
      'account-preferences', 
      'subscription-info',
      'logout'
    ];

    for (const item of profileMenuItems) {
      await expect(page.locator(`[data-testid="${item}"]`)).toBeVisible();
    }

    // Test profile settings navigation
    await page.click('[data-testid="profile-settings"]');
    await expect(page).toHaveURL(/\/dashboard\/settings\/profile/);
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
  });

  test('should handle project filtering and search functionality', async ({ page }) => {
    // Navigate to projects page
    await page.goto('/dashboard/projects');
    
    // Create multiple test projects with different genres
    const testProjects = [
      { title: 'Action Movie', genre: 'Action', episodes: '5' },
      { title: 'Comedy Series', genre: 'Comedy', episodes: '10' },
      { title: 'Drama Film', genre: 'Drama', episodes: '1' }
    ];

    for (const project of testProjects) {
      await page.click('[data-testid="create-project-button"]');
      await page.fill('[data-testid="project-title"]', project.title);
      await page.selectOption('[data-testid="project-genre"]', project.genre);
      await page.fill('[data-testid="episode-count"]', project.episodes);
      await page.click('[data-testid="create-project-submit"]');
      
      // Navigate back to projects list
      await page.goto('/dashboard/projects');
    }

    // Validate all projects appear in list
    await expect(page.locator('[data-testid="project-item"]')).toHaveCount(3);

    // Test genre filtering
    await page.selectOption('[data-testid="genre-filter"]', 'Action');
    await expect(page.locator('[data-testid="project-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="project-item"]')).toContainText('Action Movie');

    // Clear filter
    await page.selectOption('[data-testid="genre-filter"]', 'all');
    await expect(page.locator('[data-testid="project-item"]')).toHaveCount(3);

    // Test search functionality
    await page.fill('[data-testid="project-search"]', 'Comedy');
    await page.keyboard.press('Enter');
    
    await expect(page.locator('[data-testid="project-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="project-item"]')).toContainText('Comedy Series');

    // Clear search
    await page.fill('[data-testid="project-search"]', '');
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="project-item"]')).toHaveCount(3);

    // Test sorting options
    await page.selectOption('[data-testid="sort-projects"]', 'title-asc');
    
    // Validate sorting order
    const sortedTitles = await page.locator('[data-testid="project-title"]').allTextContents();
    expect(sortedTitles).toEqual(['Action Movie', 'Comedy Series', 'Drama Film']);
  });

  test('should provide responsive navigation for mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');

    // Mobile navigation should show hamburger menu
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-navigation"]')).not.toBeVisible();

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();

    // Test mobile navigation items
    await expect(page.locator('[data-testid="mobile-nav-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav-media"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav-settings"]')).toBeVisible();

    // Test mobile navigation functionality
    await page.click('[data-testid="mobile-nav-projects"]');
    await expect(page).toHaveURL(/\/dashboard\/projects/);
    
    // Mobile menu should close after navigation
    await expect(page.locator('[data-testid="mobile-navigation"]')).not.toBeVisible();

    // Test mobile project creation
    await page.click('[data-testid="create-project-button"]');
    await expect(page.locator('[data-testid="project-creation-form"]')).toBeVisible();
    
    // Form should be optimized for mobile
    await expect(page.locator('[data-testid="mobile-form-layout"]')).toBeVisible();
  });

  test('should handle deep linking and direct URL access', async ({ page }) => {
    // Create a project first
    await page.goto('/dashboard/projects');
    await page.click('[data-testid="create-project-button"]');
    await page.fill('[data-testid="project-title"]', 'Deep Link Test Project');
    await page.selectOption('[data-testid="project-genre"]', 'Horror');
    await page.fill('[data-testid="episode-count"]', '6');
    await page.click('[data-testid="create-project-submit"]');
    
    const projectId = page.url().split('/').pop()!;

    // Test direct URL access to project detail
    await page.goto(`/dashboard/projects/${projectId}`);
    await expect(page.locator('[data-testid="project-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-title"]')).toContainText('Deep Link Test Project');

    // Test direct URL access to chat interface
    await page.goto(`/dashboard/projects/${projectId}/chat`);
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    
    // Breadcrumb should reflect correct navigation path
    await expect(page.locator('[data-testid="breadcrumb-projects"]')).toBeVisible();
    await expect(page.locator('[data-testid="breadcrumb-current-project"]')).toContainText('Deep Link Test Project');

    // Test invalid project ID handling
    await page.goto('/dashboard/projects/invalid-id');
    await expect(page.locator('[data-testid="project-not-found"]')).toBeVisible();
    await expect(page.locator('[data-testid="return-to-projects"]')).toBeVisible();

    // Return to projects should work
    await page.click('[data-testid="return-to-projects"]');
    await expect(page).toHaveURL(/\/dashboard\/projects$/);
  });

  test('should provide keyboard navigation support', async ({ page }) => {
    await page.goto('/dashboard');

    // Test Tab navigation through main elements
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-projects"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-media"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-settings"]')).toBeFocused();

    // Test Enter key activation
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/dashboard\/settings/);

    // Test Escape key for closing dropdowns
    await page.click('[data-testid="user-profile-menu"]');
    await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="profile-dropdown"]')).not.toBeVisible();
  });

  test('should display appropriate loading states during navigation', async ({ page }) => {
    await page.goto('/dashboard/projects');

    // Test loading state during project creation
    await page.click('[data-testid="create-project-button"]');
    await page.fill('[data-testid="project-title"]', 'Loading Test Project');
    await page.selectOption('[data-testid="project-genre"]', 'Mystery');
    await page.fill('[data-testid="episode-count"]', '7');

    // Click submit and check for loading indicator
    await page.click('[data-testid="create-project-submit"]');
    await expect(page.locator('[data-testid="creation-loading"]')).toBeVisible();

    // Wait for completion
    await expect(page).toHaveURL(/\/dashboard\/projects\/[a-zA-Z0-9]+$/);
    await expect(page.locator('[data-testid="creation-loading"]')).not.toBeVisible();

    // Test loading state when navigating to chat
    await page.click('[data-testid="start-chat-button"]');
    await expect(page.locator('[data-testid="chat-loading"]')).toBeVisible();
    
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-loading"]')).not.toBeVisible();
  });

  test('should handle navigation with unsaved changes warning', async ({ page }) => {
    // Navigate to settings
    await page.goto('/dashboard/settings/profile');
    
    // Make changes to profile form
    await page.fill('[data-testid="profile-name"]', 'Changed Name');
    await page.fill('[data-testid="profile-bio"]', 'This is a test bio change');

    // Try to navigate away without saving
    await page.click('[data-testid="nav-projects"]');

    // Should show unsaved changes dialog
    await expect(page.locator('[data-testid="unsaved-changes-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="save-and-continue"]')).toBeVisible();
    await expect(page.locator('[data-testid="discard-changes"]')).toBeVisible();
    await expect(page.locator('[data-testid="stay-on-page"]')).toBeVisible();

    // Test staying on page
    await page.click('[data-testid="stay-on-page"]');
    await expect(page).toHaveURL(/\/dashboard\/settings\/profile/);
    await expect(page.locator('[data-testid="unsaved-changes-dialog"]')).not.toBeVisible();

    // Try navigation again and discard changes
    await page.click('[data-testid="nav-projects"]');
    await expect(page.locator('[data-testid="unsaved-changes-dialog"]')).toBeVisible();
    await page.click('[data-testid="discard-changes"]');
    
    await expect(page).toHaveURL(/\/dashboard\/projects/);
  });

  test.afterEach(async ({ page }) => {
    // Clean up created projects
    try {
      await page.goto('/dashboard/projects');
      
      // Delete any projects created during tests
      const deleteButtons = page.locator('[data-testid="delete-project-button"]');
      const count = await deleteButtons.count();
      
      for (let i = 0; i < count; i++) {
        await deleteButtons.first().click();
        await page.click('[data-testid="confirm-delete"]');
      }
    } catch (error) {
      console.log('Cleanup encountered error:', error);
    }
  });
});