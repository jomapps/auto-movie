/**
 * LangGraph Bridge Service
 * Bridges chat outputs to LangGraph orchestration for complex multi-step workflows
 * Handles workflow execution, status tracking, and result retrieval
 */

import type {
  WorkflowType,
  WorkflowStatus,
  WorkflowRequest,
  WorkflowResponse,
  WorkflowCheckpoint,
  WorkflowGraph,
  LangGraphWebhookPayload,
  ProductionError,
  LangGraphBridgeConfig,
  CharacterDevelopmentWorkflow,
  SceneBreakdownWorkflow,
  EpisodeAssemblyWorkflow,
} from '@/types/production'

export class LangGraphBridge {
  private config: LangGraphBridgeConfig
  private activeWorkflows: Map<string, WorkflowResponse> = new Map()
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map()
  private webhookHandlers: Map<string, (payload: LangGraphWebhookPayload) => void> = new Map()

  constructor(config?: Partial<LangGraphBridgeConfig>) {
    this.config = {
      baseUrl: process.env.LANGGRAPH_SERVICE_URL || 'http://localhost:8002',
      apiKey: process.env.LANGGRAPH_API_KEY || '',
      timeout: 60000,
      checkpointingEnabled: true,
      maxConcurrentWorkflows: 10,
      ...config,
    }
  }

  // ==================== Workflow Triggering Methods ====================

  /**
   * Start a character development workflow
   * Complex multi-step process for creating multiple characters
   */
  async startCharacterDevelopmentWorkflow(
    projectId: string,
    input: CharacterDevelopmentWorkflow,
    sessionId?: string
  ): Promise<WorkflowResponse> {
    const request: WorkflowRequest = {
      type: 'character_development',
      projectId,
      input,
      config: {
        maxRetries: 3,
        timeout: 300000, // 5 minutes
        parallelExecution: true,
        checkpointing: this.config.checkpointingEnabled,
      },
      metadata: {
        sessionId,
        priority: 'high',
      },
    }

    return this.startWorkflow(request)
  }

  /**
   * Start a scene breakdown workflow
   * Break down story into scenes with detailed descriptions
   */
  async startSceneBreakdownWorkflow(
    projectId: string,
    input: SceneBreakdownWorkflow,
    sessionId?: string
  ): Promise<WorkflowResponse> {
    const request: WorkflowRequest = {
      type: 'scene_breakdown',
      projectId,
      input,
      config: {
        maxRetries: 2,
        timeout: 600000, // 10 minutes
        parallelExecution: false,
        checkpointing: this.config.checkpointingEnabled,
      },
      metadata: {
        sessionId,
        priority: 'normal',
      },
    }

    return this.startWorkflow(request)
  }

  /**
   * Start an episode assembly workflow
   * Assemble scenes into complete episodes
   */
  async startEpisodeAssemblyWorkflow(
    projectId: string,
    input: EpisodeAssemblyWorkflow,
    sessionId?: string
  ): Promise<WorkflowResponse> {
    const request: WorkflowRequest = {
      type: 'episode_assembly',
      projectId,
      input,
      config: {
        maxRetries: 2,
        timeout: 900000, // 15 minutes
        parallelExecution: true,
        checkpointing: this.config.checkpointingEnabled,
      },
      metadata: {
        sessionId,
        priority: 'high',
      },
    }

    return this.startWorkflow(request)
  }

  /**
   * Start a generic workflow
   */
  async startWorkflow(request: WorkflowRequest): Promise<WorkflowResponse> {
    try {
      // Check concurrent workflow limit
      const runningWorkflows = Array.from(this.activeWorkflows.values()).filter(
        w => w.status === 'running'
      )

      if (runningWorkflows.length >= this.config.maxConcurrentWorkflows) {
        throw this.createProductionError(
          'WORKFLOW_LIMIT_EXCEEDED',
          `Maximum concurrent workflows (${this.config.maxConcurrentWorkflows}) exceeded`,
          { activeCount: runningWorkflows.length }
        )
      }

      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.config.timeout),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }))
        throw this.createProductionError(
          'WORKFLOW_START_FAILED',
          error.error || 'Failed to start workflow',
          { status: response.status, request }
        )
      }

      const workflow: WorkflowResponse = await response.json()
      this.activeWorkflows.set(workflow.workflowId, workflow)

      return workflow
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw this.createProductionError('WORKFLOW_TIMEOUT', 'Workflow start request timed out', {
          request,
        })
      }

      if ((error as ProductionError).source === 'langgraph') {
        throw error
      }

      throw this.createProductionError(
        'WORKFLOW_START_FAILED',
        error instanceof Error ? error.message : 'Unknown error',
        { request }
      )
    }
  }

  // ==================== Workflow Status Methods ====================

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<WorkflowResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/status`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.config.apiKey,
        },
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        throw this.createProductionError(
          'WORKFLOW_STATUS_FAILED',
          `Failed to get workflow status: ${response.statusText}`,
          { workflowId, status: response.status }
        )
      }

      const workflow: WorkflowResponse = await response.json()
      this.activeWorkflows.set(workflowId, workflow)

      return workflow
    } catch (error) {
      if ((error as ProductionError).source === 'langgraph') {
        throw error
      }

      throw this.createProductionError(
        'WORKFLOW_STATUS_FAILED',
        error instanceof Error ? error.message : 'Failed to get workflow status',
        { workflowId }
      )
    }
  }

  /**
   * Get workflow graph (execution tree)
   */
  async getWorkflowGraph(workflowId: string): Promise<WorkflowGraph> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/graph`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      })

      if (!response.ok) {
        throw this.createProductionError(
          'WORKFLOW_GRAPH_FAILED',
          'Failed to get workflow graph',
          { workflowId }
        )
      }

      return await response.json()
    } catch (error) {
      throw this.createProductionError(
        'WORKFLOW_GRAPH_FAILED',
        error instanceof Error ? error.message : 'Failed to get workflow graph',
        { workflowId }
      )
    }
  }

  /**
   * Poll workflow status until completion
   */
  async pollWorkflowStatus(
    workflowId: string,
    options?: {
      maxAttempts?: number
      interval?: number
      timeout?: number
      onProgress?: (workflow: WorkflowResponse) => void
    }
  ): Promise<WorkflowResponse> {
    const maxAttempts = options?.maxAttempts || 600 // 20 minutes at 2s interval
    const interval = options?.interval || 2000
    const timeout = options?.timeout || 1200000 // 20 minutes
    const startTime = Date.now()

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (Date.now() - startTime > timeout) {
        throw this.createProductionError('WORKFLOW_TIMEOUT', 'Workflow polling timeout', {
          workflowId,
          timeout,
        })
      }

      try {
        const workflow = await this.getWorkflowStatus(workflowId)

        if (options?.onProgress) {
          options.onProgress(workflow)
        }

        if (workflow.status === 'completed' || workflow.status === 'failed') {
          return workflow
        }

        await this.sleep(interval)
      } catch (error) {
        if ((error as ProductionError).code === 'WORKFLOW_TIMEOUT') {
          throw error
        }
        await this.sleep(interval)
      }
    }

    throw this.createProductionError('WORKFLOW_TIMEOUT', 'Max polling attempts exceeded', {
      workflowId,
      maxAttempts,
    })
  }

  /**
   * Start background polling with callbacks
   */
  startWorkflowPolling(
    workflowId: string,
    callbacks: {
      onProgress?: (workflow: WorkflowResponse) => void
      onComplete?: (workflow: WorkflowResponse) => void
      onError?: (error: ProductionError) => void
    }
  ): void {
    this.stopWorkflowPolling(workflowId)

    const interval = setInterval(async () => {
      try {
        const workflow = await this.getWorkflowStatus(workflowId)

        if (callbacks.onProgress) {
          callbacks.onProgress(workflow)
        }

        if (workflow.status === 'completed' || workflow.status === 'failed') {
          this.stopWorkflowPolling(workflowId)

          if (workflow.status === 'completed' && callbacks.onComplete) {
            callbacks.onComplete(workflow)
          } else if (workflow.status === 'failed' && callbacks.onError) {
            callbacks.onError(
              this.createProductionError(
                'WORKFLOW_FAILED',
                workflow.error?.message || 'Workflow failed',
                { workflowId, error: workflow.error }
              )
            )
          }
        }
      } catch (error) {
        this.stopWorkflowPolling(workflowId)
        if (callbacks.onError) {
          callbacks.onError(error as ProductionError)
        }
      }
    }, 2000)

    this.pollingIntervals.set(workflowId, interval)
  }

  /**
   * Stop workflow polling
   */
  stopWorkflowPolling(workflowId: string): void {
    const interval = this.pollingIntervals.get(workflowId)
    if (interval) {
      clearInterval(interval)
      this.pollingIntervals.delete(workflowId)
    }
  }

  // ==================== Workflow Control Methods ====================

  /**
   * Pause a running workflow
   */
  async pauseWorkflow(workflowId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/pause`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      })

      return response.ok
    } catch (error) {
      console.error('Failed to pause workflow:', error)
      return false
    }
  }

  /**
   * Resume a paused workflow
   */
  async resumeWorkflow(workflowId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/resume`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      })

      return response.ok
    } catch (error) {
      console.error('Failed to resume workflow:', error)
      return false
    }
  }

  /**
   * Cancel a workflow
   */
  async cancelWorkflow(workflowId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/workflows/${workflowId}/cancel`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.config.apiKey,
        },
      })

      if (response.ok) {
        this.activeWorkflows.delete(workflowId)
        this.stopWorkflowPolling(workflowId)
      }

      return response.ok
    } catch (error) {
      console.error('Failed to cancel workflow:', error)
      return false
    }
  }

  // ==================== Checkpoint Methods ====================

  /**
   * Get workflow checkpoints
   */
  async getWorkflowCheckpoints(workflowId: string): Promise<WorkflowCheckpoint[]> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/workflows/${workflowId}/checkpoints`,
        {
          method: 'GET',
          headers: {
            'X-API-Key': this.config.apiKey,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to get checkpoints')
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get workflow checkpoints:', error)
      return []
    }
  }

  /**
   * Restore workflow from checkpoint
   */
  async restoreFromCheckpoint(workflowId: string, checkpointId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api/v1/workflows/${workflowId}/restore/${checkpointId}`,
        {
          method: 'POST',
          headers: {
            'X-API-Key': this.config.apiKey,
          },
        }
      )

      return response.ok
    } catch (error) {
      console.error('Failed to restore from checkpoint:', error)
      return false
    }
  }

  // ==================== Result Retrieval ====================

  /**
   * Get workflow result
   */
  async getWorkflowResult(workflowId: string): Promise<any> {
    const workflow = await this.getWorkflowStatus(workflowId)

    if (workflow.status !== 'completed') {
      throw this.createProductionError(
        'WORKFLOW_NOT_COMPLETED',
        `Workflow is ${workflow.status}, not completed`,
        { workflowId, currentStatus: workflow.status }
      )
    }

    return workflow.result
  }

  // ==================== Webhook Handling ====================

  /**
   * Register webhook handler
   */
  registerWebhookHandler(
    workflowId: string,
    handler: (payload: LangGraphWebhookPayload) => void
  ): void {
    this.webhookHandlers.set(workflowId, handler)
  }

  /**
   * Unregister webhook handler
   */
  unregisterWebhookHandler(workflowId: string): void {
    this.webhookHandlers.delete(workflowId)
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(payload: LangGraphWebhookPayload): Promise<void> {
    const handler = this.webhookHandlers.get(payload.workflowId)
    if (handler) {
      try {
        handler(payload)

        if (payload.status === 'completed' || payload.status === 'failed') {
          this.unregisterWebhookHandler(payload.workflowId)
        }
      } catch (error) {
        console.error('Webhook handler error:', error)
      }
    }
  }

  // ==================== Utility Methods ====================

  /**
   * Get active workflows for a project
   */
  getActiveWorkflowsForProject(projectId: string): WorkflowResponse[] {
    return Array.from(this.activeWorkflows.values()).filter(w => w.projectId === projectId)
  }

  /**
   * Create production error
   */
  private createProductionError(
    code: string,
    message: string,
    details?: any
  ): ProductionError {
    return {
      code,
      message,
      source: 'langgraph',
      details,
      timestamp: new Date().toISOString(),
      recoverable: code !== 'WORKFLOW_FAILED',
      retryable: code === 'WORKFLOW_START_FAILED' || code === 'WORKFLOW_STATUS_FAILED',
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    for (const [workflowId] of this.pollingIntervals) {
      this.stopWorkflowPolling(workflowId)
    }

    this.activeWorkflows.clear()
    this.webhookHandlers.clear()
  }
}

// Export singleton instance
export const langgraphBridge = new LangGraphBridge()
export default langgraphBridge