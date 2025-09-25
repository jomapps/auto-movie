import { getServiceUrl } from '@/config/services'

export interface TaskSubmissionData {
  projectId: string
  taskType: string
  taskData: any
  metadata?: {
    userId?: string
    sessionId?: string
  }
}

export interface TaskResponse {
  taskId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  estimatedTime?: number
  result?: any
  error?: string
}

export class TaskServiceClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = getServiceUrl('taskService')
    this.apiKey = process.env.CELERY_TASK_API_KEY || ''
  }

  async submitTask(data: TaskSubmissionData): Promise<TaskResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Task service error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Task service submission error:', error)
      throw new Error(`Failed to submit task: ${error.message}`)
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Task service error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Task status check error:', error)
      throw new Error(`Failed to get task status: ${error.message}`)
    }
  }

  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error('Task cancellation error:', error)
      return false
    }
  }
}