import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Integration Tests: Production Bridges (Celery & LangGraph)
 *
 * Tests integration with external production services, ensuring
 * that chat-created entities trigger appropriate production workflows
 * in Celery (synchronous tasks) and LangGraph (async workflows).
 *
 * Coverage includes:
 * - Celery task triggering
 * - LangGraph workflow initiation
 * - Task status polling
 * - Error handling and retries
 * - Production pipeline integration
 */

interface CeleryTask {
  taskId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  result?: any
  error?: string
}

interface LangGraphWorkflow {
  workflowId: string
  status: 'initialized' | 'running' | 'completed' | 'failed'
  steps: Array<{
    name: string
    status: string
    output?: any
  }>
}

// Mock CeleryBridge - will be implemented in Phase 0
class CeleryBridge {
  async triggerCharacterSheetGeneration(params: { characterId: string; projectId: string }): Promise<CeleryTask> {
    throw new Error('Not implemented')
  }

  async triggerSceneVisualization(params: { sceneId: string; projectId: string }): Promise<CeleryTask> {
    throw new Error('Not implemented')
  }

  async getTaskStatus(taskId: string): Promise<CeleryTask> {
    throw new Error('Not implemented')
  }

  async pollTaskUntilComplete(taskId: string, timeoutMs?: number): Promise<CeleryTask> {
    throw new Error('Not implemented')
  }

  async cancelTask(taskId: string): Promise<void> {
    throw new Error('Not implemented')
  }
}

// Mock LangGraphBridge - will be implemented in Phase 0
class LangGraphBridge {
  async startStoryDevelopmentWorkflow(params: { projectId: string; concept: string }): Promise<LangGraphWorkflow> {
    throw new Error('Not implemented')
  }

  async startCharacterArcWorkflow(params: { characterId: string; projectId: string }): Promise<LangGraphWorkflow> {
    throw new Error('Not implemented')
  }

  async getWorkflowStatus(workflowId: string): Promise<LangGraphWorkflow> {
    throw new Error('Not implemented')
  }

  async resumeWorkflow(workflowId: string, input?: any): Promise<void> {
    throw new Error('Not implemented')
  }

  async cancelWorkflow(workflowId: string): Promise<void> {
    throw new Error('Not implemented')
  }
}

describe('Production Bridges Integration', () => {
  let celeryBridge: CeleryBridge
  let langGraphBridge: LangGraphBridge

  beforeEach(() => {
    celeryBridge = new CeleryBridge()
    langGraphBridge = new LangGraphBridge()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('CeleryBridge - Character Sheet Generation', () => {
    it('should trigger character sheet generation task', async () => {
      const params = {
        characterId: 'char-123',
        projectId: 'proj-456'
      }

      const task = await celeryBridge.triggerCharacterSheetGeneration(params)

      expect(task).toBeTruthy()
      expect(task.taskId).toBeDefined()
      expect(task.status).toBe('pending')
    })

    it('should return unique task IDs for each trigger', async () => {
      const params1 = { characterId: 'char-1', projectId: 'proj-1' }
      const params2 = { characterId: 'char-2', projectId: 'proj-1' }

      const task1 = await celeryBridge.triggerCharacterSheetGeneration(params1)
      const task2 = await celeryBridge.triggerCharacterSheetGeneration(params2)

      expect(task1.taskId).not.toBe(task2.taskId)
    })

    it('should handle Celery connection errors', async () => {
      // Simulate connection error
      const params = { characterId: 'char-123', projectId: 'proj-456' }

      // Mock implementation should throw
      await expect(async () => {
        await celeryBridge.triggerCharacterSheetGeneration(params)
      }).rejects.toThrow()
    })

    it('should include metadata in task parameters', async () => {
      const params = {
        characterId: 'char-123',
        projectId: 'proj-456'
      }

      const task = await celeryBridge.triggerCharacterSheetGeneration(params)

      // Task should be created with proper parameters
      expect(task).toBeTruthy()
    })
  })

  describe('CeleryBridge - Scene Visualization', () => {
    it('should trigger scene visualization task', async () => {
      const params = {
        sceneId: 'scene-789',
        projectId: 'proj-456'
      }

      const task = await celeryBridge.triggerSceneVisualization(params)

      expect(task).toBeTruthy()
      expect(task.taskId).toBeDefined()
      expect(task.status).toBe('pending')
    })

    it('should handle scene data validation', async () => {
      const invalidParams = {
        sceneId: '',
        projectId: 'proj-456'
      }

      await expect(async () => {
        await celeryBridge.triggerSceneVisualization(invalidParams)
      }).rejects.toThrow(/sceneId|invalid/i)
    })
  })

  describe('CeleryBridge - Task Status Polling', () => {
    it('should get task status', async () => {
      const task = await celeryBridge.triggerCharacterSheetGeneration({
        characterId: 'char-123',
        projectId: 'proj-456'
      })

      const status = await celeryBridge.getTaskStatus(task.taskId)

      expect(status).toBeTruthy()
      expect(status.taskId).toBe(task.taskId)
      expect(['pending', 'running', 'completed', 'failed']).toContain(status.status)
    })

    it('should return null for non-existent task', async () => {
      await expect(async () => {
        await celeryBridge.getTaskStatus('non-existent-task-id')
      }).rejects.toThrow(/not found/i)
    })

    it('should poll until task completes', async () => {
      const task = await celeryBridge.triggerCharacterSheetGeneration({
        characterId: 'char-123',
        projectId: 'proj-456'
      })

      const completed = await celeryBridge.pollTaskUntilComplete(task.taskId, 10000)

      expect(completed.status).toBe('completed')
      expect(completed.result).toBeDefined()
    }, 15000) // Longer timeout for polling test

    it('should timeout if task takes too long', async () => {
      const task = await celeryBridge.triggerCharacterSheetGeneration({
        characterId: 'char-slow',
        projectId: 'proj-456'
      })

      await expect(async () => {
        await celeryBridge.pollTaskUntilComplete(task.taskId, 1000) // Short timeout
      }).rejects.toThrow(/timeout/i)
    }, 5000)

    it('should handle task failures gracefully', async () => {
      const task = await celeryBridge.triggerCharacterSheetGeneration({
        characterId: 'char-fail',
        projectId: 'proj-456'
      })

      const result = await celeryBridge.pollTaskUntilComplete(task.taskId, 10000)

      if (result.status === 'failed') {
        expect(result.error).toBeDefined()
        expect(result.error!.length).toBeGreaterThan(0)
      }
    }, 15000)
  })

  describe('CeleryBridge - Task Cancellation', () => {
    it('should cancel pending task', async () => {
      const task = await celeryBridge.triggerCharacterSheetGeneration({
        characterId: 'char-123',
        projectId: 'proj-456'
      })

      await celeryBridge.cancelTask(task.taskId)

      const status = await celeryBridge.getTaskStatus(task.taskId)
      expect(['cancelled', 'failed']).toContain(status.status)
    })

    it('should not allow canceling completed task', async () => {
      const task = await celeryBridge.triggerCharacterSheetGeneration({
        characterId: 'char-complete',
        projectId: 'proj-456'
      })

      // Wait for completion
      await celeryBridge.pollTaskUntilComplete(task.taskId, 10000)

      await expect(async () => {
        await celeryBridge.cancelTask(task.taskId)
      }).rejects.toThrow(/already completed|cannot cancel/i)
    }, 15000)
  })

  describe('LangGraphBridge - Story Development Workflow', () => {
    it('should start story development workflow', async () => {
      const params = {
        projectId: 'proj-123',
        concept: 'A sci-fi thriller about time travel'
      }

      const workflow = await langGraphBridge.startStoryDevelopmentWorkflow(params)

      expect(workflow).toBeTruthy()
      expect(workflow.workflowId).toBeDefined()
      expect(workflow.status).toBe('initialized')
      expect(workflow.steps).toBeDefined()
    })

    it('should include workflow steps', async () => {
      const params = {
        projectId: 'proj-123',
        concept: 'Fantasy adventure'
      }

      const workflow = await langGraphBridge.startStoryDevelopmentWorkflow(params)

      expect(workflow.steps.length).toBeGreaterThan(0)
      expect(workflow.steps[0]).toHaveProperty('name')
      expect(workflow.steps[0]).toHaveProperty('status')
    })

    it('should validate concept before starting workflow', async () => {
      const invalidParams = {
        projectId: 'proj-123',
        concept: '' // Empty concept
      }

      await expect(async () => {
        await langGraphBridge.startStoryDevelopmentWorkflow(invalidParams)
      }).rejects.toThrow(/concept.*required/i)
    })
  })

  describe('LangGraphBridge - Character Arc Workflow', () => {
    it('should start character arc workflow', async () => {
      const params = {
        characterId: 'char-456',
        projectId: 'proj-123'
      }

      const workflow = await langGraphBridge.startCharacterArcWorkflow(params)

      expect(workflow).toBeTruthy()
      expect(workflow.workflowId).toBeDefined()
      expect(workflow.status).toBe('initialized')
    })

    it('should track multi-step workflow progress', async () => {
      const params = {
        characterId: 'char-456',
        projectId: 'proj-123'
      }

      const workflow = await langGraphBridge.startCharacterArcWorkflow(params)

      // Wait a bit for workflow to progress
      await new Promise(resolve => setTimeout(resolve, 2000))

      const status = await langGraphBridge.getWorkflowStatus(workflow.workflowId)

      expect(status.steps.some(s => s.status === 'completed')).toBe(true)
    }, 5000)
  })

  describe('LangGraphBridge - Workflow Status', () => {
    it('should get workflow status', async () => {
      const workflow = await langGraphBridge.startStoryDevelopmentWorkflow({
        projectId: 'proj-123',
        concept: 'Test concept'
      })

      const status = await langGraphBridge.getWorkflowStatus(workflow.workflowId)

      expect(status).toBeTruthy()
      expect(status.workflowId).toBe(workflow.workflowId)
    })

    it('should show step outputs when available', async () => {
      const workflow = await langGraphBridge.startStoryDevelopmentWorkflow({
        projectId: 'proj-123',
        concept: 'Test concept'
      })

      // Poll until some steps complete
      await new Promise(resolve => setTimeout(resolve, 3000))

      const status = await langGraphBridge.getWorkflowStatus(workflow.workflowId)

      const completedSteps = status.steps.filter(s => s.status === 'completed')
      if (completedSteps.length > 0) {
        expect(completedSteps[0].output).toBeDefined()
      }
    }, 5000)
  })

  describe('LangGraphBridge - Workflow Control', () => {
    it('should resume paused workflow', async () => {
      const workflow = await langGraphBridge.startStoryDevelopmentWorkflow({
        projectId: 'proj-123',
        concept: 'Test concept'
      })

      await langGraphBridge.resumeWorkflow(workflow.workflowId, { action: 'continue' })

      const status = await langGraphBridge.getWorkflowStatus(workflow.workflowId)
      expect(status.status).not.toBe('paused')
    })

    it('should cancel running workflow', async () => {
      const workflow = await langGraphBridge.startStoryDevelopmentWorkflow({
        projectId: 'proj-123',
        concept: 'Test concept'
      })

      await langGraphBridge.cancelWorkflow(workflow.workflowId)

      const status = await langGraphBridge.getWorkflowStatus(workflow.workflowId)
      expect(['cancelled', 'failed']).toContain(status.status)
    })
  })

  describe('End-to-End Production Pipeline', () => {
    it('should trigger both Celery and LangGraph on character creation', async () => {
      const characterId = 'new-char-789'
      const projectId = 'proj-123'

      // Trigger Celery task
      const celeryTask = await celeryBridge.triggerCharacterSheetGeneration({
        characterId,
        projectId
      })

      // Trigger LangGraph workflow
      const workflow = await langGraphBridge.startCharacterArcWorkflow({
        characterId,
        projectId
      })

      expect(celeryTask.taskId).toBeDefined()
      expect(workflow.workflowId).toBeDefined()

      // Both should be running in parallel
      expect(celeryTask.status).toBe('pending')
      expect(workflow.status).toBe('initialized')
    })

    it('should handle production failures gracefully', async () => {
      const characterId = 'fail-char'
      const projectId = 'proj-123'

      try {
        await celeryBridge.triggerCharacterSheetGeneration({
          characterId,
          projectId
        })
      } catch (error) {
        expect(error).toBeDefined()
        // Should not prevent other operations
      }

      // LangGraph should still work
      const workflow = await langGraphBridge.startCharacterArcWorkflow({
        characterId,
        projectId
      })

      expect(workflow).toBeTruthy()
    })

    it('should coordinate multiple production tasks', async () => {
      const projectId = 'proj-multi-123'

      // Trigger multiple tasks
      const tasks = await Promise.all([
        celeryBridge.triggerCharacterSheetGeneration({
          characterId: 'char-1',
          projectId
        }),
        celeryBridge.triggerCharacterSheetGeneration({
          characterId: 'char-2',
          projectId
        }),
        celeryBridge.triggerSceneVisualization({
          sceneId: 'scene-1',
          projectId
        })
      ])

      expect(tasks).toHaveLength(3)
      tasks.forEach(task => {
        expect(task.taskId).toBeDefined()
      })

      // All tasks should have unique IDs
      const taskIds = tasks.map(t => t.taskId)
      const uniqueIds = new Set(taskIds)
      expect(uniqueIds.size).toBe(taskIds.length)
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should retry failed Celery tasks', async () => {
      const params = {
        characterId: 'flaky-char',
        projectId: 'proj-123'
      }

      // May fail on first attempt but retry
      const task = await celeryBridge.triggerCharacterSheetGeneration(params)

      // Should eventually succeed or fail definitively
      const result = await celeryBridge.pollTaskUntilComplete(task.taskId, 30000)

      expect(['completed', 'failed']).toContain(result.status)
    }, 35000)

    it('should handle LangGraph workflow errors', async () => {
      const params = {
        projectId: 'proj-123',
        concept: 'Error concept'
      }

      const workflow = await langGraphBridge.startStoryDevelopmentWorkflow(params)

      // Wait for workflow to potentially fail
      await new Promise(resolve => setTimeout(resolve, 3000))

      const status = await langGraphBridge.getWorkflowStatus(workflow.workflowId)

      if (status.status === 'failed') {
        expect(status.steps.some(s => s.status === 'failed')).toBe(true)
      }
    }, 5000)

    it('should provide detailed error information', async () => {
      try {
        await celeryBridge.triggerCharacterSheetGeneration({
          characterId: 'error-char',
          projectId: 'proj-123'
        })

        const task = await celeryBridge.triggerCharacterSheetGeneration({
          characterId: 'error-char',
          projectId: 'proj-123'
        })

        const result = await celeryBridge.pollTaskUntilComplete(task.taskId, 10000)

        if (result.status === 'failed') {
          expect(result.error).toBeTruthy()
          expect(result.error!.length).toBeGreaterThan(10)
        }
      } catch (error) {
        expect(error instanceof Error).toBe(true)
      }
    }, 15000)
  })

  describe('Performance and Scalability', () => {
    it('should handle concurrent task triggers', async () => {
      const projectId = 'proj-concurrent-123'

      const promises = Array.from({ length: 10 }, (_, i) =>
        celeryBridge.triggerCharacterSheetGeneration({
          characterId: `char-${i}`,
          projectId
        })
      )

      const tasks = await Promise.all(promises)

      expect(tasks).toHaveLength(10)
      tasks.forEach(task => {
        expect(task.taskId).toBeDefined()
      })
    })

    it('should efficiently poll multiple tasks', async () => {
      const projectId = 'proj-poll-123'

      const tasks = await Promise.all([
        celeryBridge.triggerCharacterSheetGeneration({ characterId: 'c1', projectId }),
        celeryBridge.triggerCharacterSheetGeneration({ characterId: 'c2', projectId }),
        celeryBridge.triggerCharacterSheetGeneration({ characterId: 'c3', projectId })
      ])

      const startTime = Date.now()

      await Promise.all(
        tasks.map(task => celeryBridge.pollTaskUntilComplete(task.taskId, 20000))
      )

      const duration = Date.now() - startTime

      // Should poll in parallel, not sequentially
      expect(duration).toBeLessThan(25000)
    }, 30000)
  })
})