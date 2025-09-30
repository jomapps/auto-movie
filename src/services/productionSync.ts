/**
 * Production Sync Service
 * Polls production services for updates and synchronizes status with chat sessions
 * Handles real-time notifications and batch status updates
 */

import type {
  ProductionUpdate,
  ProductionNotification,
  ProductionStatusSummary,
  ProductionSyncConfig,
  CeleryTaskStatusResponse,
  WorkflowResponse,
} from '@/types/production'
import { CeleryBridge } from './celeryBridge'
import { LangGraphBridge } from './langgraphBridge'
import { WebSocketService } from './websocket'

interface SyncSubscription {
  sessionId: string
  projectId?: string
  taskIds: Set<string>
  workflowIds: Set<string>
  lastUpdate: Date
}

export class ProductionSync {
  private config: ProductionSyncConfig
  private celeryBridge: CeleryBridge
  private langgraphBridge: LangGraphBridge
  private subscriptions: Map<string, SyncSubscription> = new Map()
  private notifications: Map<string, ProductionNotification[]> = new Map()
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map()
  private websockets: Map<string, WebSocketService> = new Map()

  constructor(
    config?: Partial<ProductionSyncConfig>,
    celeryBridge?: CeleryBridge,
    langgraphBridge?: LangGraphBridge
  ) {
    this.config = {
      celeryPollingInterval: 3000,
      langgraphPollingInterval: 5000,
      batchSize: 10,
      notificationTTL: 3600000, // 1 hour
      enableWebhooks: true,
      ...config,
    }

    this.celeryBridge = celeryBridge || new CeleryBridge()
    this.langgraphBridge = langgraphBridge || new LangGraphBridge()
  }

  // ==================== Subscription Management ====================

  /**
   * Subscribe to production updates for a session
   */
  subscribe(sessionId: string, projectId?: string, websocket?: WebSocketService): void {
    if (this.subscriptions.has(sessionId)) {
      return
    }

    const subscription: SyncSubscription = {
      sessionId,
      projectId,
      taskIds: new Set(),
      workflowIds: new Set(),
      lastUpdate: new Date(),
    }

    this.subscriptions.set(sessionId, subscription)
    this.notifications.set(sessionId, [])

    if (websocket) {
      this.websockets.set(sessionId, websocket)
    }

    // Start polling for this session
    this.startPolling(sessionId)
  }

  /**
   * Unsubscribe from production updates
   */
  unsubscribe(sessionId: string): void {
    this.stopPolling(sessionId)
    this.subscriptions.delete(sessionId)
    this.notifications.delete(sessionId)
    this.websockets.delete(sessionId)
  }

  /**
   * Track a task for updates
   */
  trackTask(sessionId: string, taskId: string): void {
    const subscription = this.subscriptions.get(sessionId)
    if (subscription) {
      subscription.taskIds.add(taskId)
    }
  }

  /**
   * Track a workflow for updates
   */
  trackWorkflow(sessionId: string, workflowId: string): void {
    const subscription = this.subscriptions.get(sessionId)
    if (subscription) {
      subscription.workflowIds.add(workflowId)
    }
  }

  /**
   * Untrack a task
   */
  untrackTask(sessionId: string, taskId: string): void {
    const subscription = this.subscriptions.get(sessionId)
    if (subscription) {
      subscription.taskIds.delete(taskId)
    }
  }

  /**
   * Untrack a workflow
   */
  untrackWorkflow(sessionId: string, workflowId: string): void {
    const subscription = this.subscriptions.get(sessionId)
    if (subscription) {
      subscription.workflowIds.delete(workflowId)
    }
  }

  // ==================== Polling Methods ====================

  /**
   * Start polling for production updates
   */
  private startPolling(sessionId: string): void {
    // Task polling
    const taskInterval = setInterval(async () => {
      await this.pollTasks(sessionId)
    }, this.config.celeryPollingInterval)

    // Workflow polling
    const workflowInterval = setInterval(async () => {
      await this.pollWorkflows(sessionId)
    }, this.config.langgraphPollingInterval)

    this.syncIntervals.set(sessionId, taskInterval)
    this.syncIntervals.set(`${sessionId}_workflow`, workflowInterval)
  }

  /**
   * Stop polling for a session
   */
  private stopPolling(sessionId: string): void {
    const taskInterval = this.syncIntervals.get(sessionId)
    if (taskInterval) {
      clearInterval(taskInterval)
      this.syncIntervals.delete(sessionId)
    }

    const workflowInterval = this.syncIntervals.get(`${sessionId}_workflow`)
    if (workflowInterval) {
      clearInterval(workflowInterval)
      this.syncIntervals.delete(`${sessionId}_workflow`)
    }
  }

  /**
   * Poll Celery tasks for updates
   */
  private async pollTasks(sessionId: string): Promise<void> {
    const subscription = this.subscriptions.get(sessionId)
    if (!subscription || subscription.taskIds.size === 0) {
      return
    }

    const taskIds = Array.from(subscription.taskIds).slice(0, this.config.batchSize)
    const updates: ProductionUpdate[] = []

    for (const taskId of taskIds) {
      try {
        const status = await this.celeryBridge.getTaskStatus(taskId)

        if (!status) {
          continue
        }

        const taskDetails = status as any
        const normalizedStatusValue = String(status.status).toLowerCase()
        const progressValue =
          typeof taskDetails.progress === 'number'
            ? taskDetails.progress
            : typeof taskDetails.metadata?.progress === 'number'
              ? taskDetails.metadata.progress
              : undefined
        const progressMessage =
          taskDetails.progressMessage || taskDetails.metadata?.progressMessage || undefined

        const update: ProductionUpdate = {
          type: 'task_update',
          source: 'celery',
          entityId: taskId,
          entityType: 'task',
          status: normalizedStatusValue,
          progress: progressValue,
          message: progressMessage,
          data: status.metadata || taskDetails.result,
          timestamp: new Date().toISOString(),
        }

        updates.push(update)

        // Remove completed/failed tasks from tracking
        if (['success', 'completed', 'failure', 'failed'].includes(normalizedStatusValue)) {
          this.untrackTask(sessionId, taskId)

          // Create completion notification
          this.addNotification(sessionId, {
            id: `task_${taskId}_${Date.now()}`,
            sessionId,
            projectId: subscription.projectId,
            type: ['success', 'completed'].includes(normalizedStatusValue) ? 'success' : 'error',
            title: ['success', 'completed'].includes(normalizedStatusValue)
              ? 'Task Completed'
              : 'Task Failed',
            message:
              ['success', 'completed'].includes(normalizedStatusValue)
                ? 'Production task completed successfully'
                : taskDetails.error?.message || taskDetails.error || taskDetails.metadata?.error || 'Task failed',
            createdAt: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error(`Failed to poll task ${taskId}:`, error)
      }
    }

    if (updates.length > 0) {
      await this.sendUpdates(sessionId, updates)
      subscription.lastUpdate = new Date()
    }
  }

  /**
   * Poll LangGraph workflows for updates
   */
  private async pollWorkflows(sessionId: string): Promise<void> {
    const subscription = this.subscriptions.get(sessionId)
    if (!subscription || subscription.workflowIds.size === 0) {
      return
    }

    const workflowIds = Array.from(subscription.workflowIds).slice(0, this.config.batchSize)
    const updates: ProductionUpdate[] = []

    for (const workflowId of workflowIds) {
      try {
        const workflow = await this.langgraphBridge.getWorkflowStatus(workflowId)

        const update: ProductionUpdate = {
          type: 'workflow_update',
          source: 'langgraph',
          entityId: workflowId,
          entityType: 'workflow',
          status: workflow.status,
          progress: workflow.progress,
          message: workflow.currentStep,
          data: { graph: workflow.graph, result: workflow.result },
          timestamp: new Date().toISOString(),
        }

        updates.push(update)

        // Remove completed/failed workflows from tracking
        if (workflow.status === 'completed' || workflow.status === 'failed') {
          this.untrackWorkflow(sessionId, workflowId)

          // Create completion notification
          this.addNotification(sessionId, {
            id: `workflow_${workflowId}_${Date.now()}`,
            sessionId,
            projectId: subscription.projectId,
            type: workflow.status === 'completed' ? 'success' : 'error',
            title: workflow.status === 'completed' ? 'Workflow Completed' : 'Workflow Failed',
            message:
              workflow.status === 'completed'
                ? `${workflow.type} workflow completed successfully`
                : workflow.error?.message || 'Workflow failed',
            createdAt: new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error(`Failed to poll workflow ${workflowId}:`, error)
      }
    }

    if (updates.length > 0) {
      await this.sendUpdates(sessionId, updates)
      subscription.lastUpdate = new Date()
    }
  }

  // ==================== Update Distribution ====================

  /**
   * Send updates to session via WebSocket
   */
  private async sendUpdates(sessionId: string, updates: ProductionUpdate[]): Promise<void> {
    const websocket = this.websockets.get(sessionId)

    if (websocket && websocket.isConnected()) {
      for (const update of updates) {
        websocket.send('production_update', update)
      }
    } else {
      // Store updates for later retrieval if WebSocket not available
      console.log(`No WebSocket for session ${sessionId}, updates stored`)
    }
  }

  /**
   * Get production status summary for a session
   */
  async getStatusSummary(sessionId: string): Promise<ProductionStatusSummary | null> {
    const subscription = this.subscriptions.get(sessionId)
    if (!subscription || !subscription.projectId) {
      return null
    }

    const taskStatuses = await this.getTaskStatusBatch(Array.from(subscription.taskIds))
    const workflowStatuses = await this.getWorkflowStatusBatch(Array.from(subscription.workflowIds))

    const summary: ProductionStatusSummary = {
      projectId: subscription.projectId,
      tasks: {
        total: taskStatuses.length,
        pending: taskStatuses.filter(t => t.status === 'PENDING').length,
        running: taskStatuses.filter(t => t.status === 'STARTED').length,
        completed: taskStatuses.filter(t => t.status === 'SUCCESS').length,
        failed: taskStatuses.filter(t => t.status === 'FAILURE').length,
      },
      workflows: {
        total: workflowStatuses.length,
        running: workflowStatuses.filter(w => w.status === 'running').length,
        completed: workflowStatuses.filter(w => w.status === 'completed').length,
        failed: workflowStatuses.filter(w => w.status === 'failed').length,
      },
      lastUpdated: subscription.lastUpdate.toISOString(),
    }

    return summary
  }

  /**
   * Get batch of task statuses
   */
  private async getTaskStatusBatch(taskIds: string[]): Promise<CeleryTaskStatusResponse[]> {
    const statuses: CeleryTaskStatusResponse[] = []

    for (const taskId of taskIds) {
      try {
        const status = await this.celeryBridge.getTaskStatus(taskId)
        if (status) {
          statuses.push(status as any)
        }
      } catch (error) {
        console.error(`Failed to get status for task ${taskId}:`, error)
      }
    }

    return statuses
  }

  /**
   * Get batch of workflow statuses
   */
  private async getWorkflowStatusBatch(workflowIds: string[]): Promise<WorkflowResponse[]> {
    const statuses: WorkflowResponse[] = []

    for (const workflowId of workflowIds) {
      try {
        const status = await this.langgraphBridge.getWorkflowStatus(workflowId)
        statuses.push(status)
      } catch (error) {
        console.error(`Failed to get status for workflow ${workflowId}:`, error)
      }
    }

    return statuses
  }

  // ==================== Notification Management ====================

  /**
   * Add notification for session
   */
  private addNotification(sessionId: string, notification: ProductionNotification): void {
    const notifications = this.notifications.get(sessionId) || []
    notifications.push(notification)
    this.notifications.set(sessionId, notifications)

    // Send notification via WebSocket
    const websocket = this.websockets.get(sessionId)
    if (websocket && websocket.isConnected()) {
      websocket.send('production_notification', notification)
    }

    // Cleanup old notifications
    this.cleanupNotifications(sessionId)
  }

  /**
   * Get notifications for session
   */
  getNotifications(sessionId: string, includeRead: boolean = false): ProductionNotification[] {
    const notifications = this.notifications.get(sessionId) || []

    if (includeRead) {
      return notifications
    }

    return notifications.filter(n => !n.dismissed)
  }

  /**
   * Dismiss notification
   */
  dismissNotification(sessionId: string, notificationId: string): void {
    const notifications = this.notifications.get(sessionId)
    if (!notifications) return

    const notification = notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.dismissed = true
    }
  }

  /**
   * Clear all notifications for session
   */
  clearNotifications(sessionId: string): void {
    this.notifications.set(sessionId, [])
  }

  /**
   * Cleanup expired notifications
   */
  private cleanupNotifications(sessionId: string): void {
    const notifications = this.notifications.get(sessionId)
    if (!notifications) return

    const now = Date.now()
    const validNotifications = notifications.filter(n => {
      if (n.expiresAt) {
        return new Date(n.expiresAt).getTime() > now
      }
      return new Date(n.createdAt).getTime() + this.config.notificationTTL > now
    })

    this.notifications.set(sessionId, validNotifications)
  }

  // ==================== Cleanup ====================

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    // Stop all polling
    for (const [sessionId] of this.subscriptions) {
      this.stopPolling(sessionId)
    }

    // Clear all data
    this.subscriptions.clear()
    this.notifications.clear()
    this.websockets.clear()
    this.syncIntervals.clear()
  }
}

// Export singleton instance
export const productionSync = new ProductionSync()
export default productionSync