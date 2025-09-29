/**
 * Enhanced Task Service Client
 * Manages both background tasks and workflow progression
 */

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

export interface WorkflowTask {
  id: string
  title: string
  description: string
  step: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  progress: number
  dependencies?: string[]
  metadata?: Record<string, any>
  estimatedTime?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface WorkflowStep {
  id: string
  title: string
  description: string
  order: number
  tasks: WorkflowTask[]
  completed: boolean
  estimatedDuration: string
}

export class TaskServiceClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.TASK_SERVICE_URL || process.env.NEXT_PUBLIC_TASK_SERVICE_URL || '/api/v1'
    this.apiKey = (process.env.TASK_SERVICE_API_KEY || process.env.CELERY_TASK_API_KEY || '')
  }

  async submitTask(data: TaskSubmissionData): Promise<TaskResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Task service error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Task service submission error:', error)
      throw new Error(
        `Failed to submit task: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/status`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Task service error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Task status check error:', error)
      throw new Error(
        `Failed to get task status: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  async cancelTask(taskId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
        },
      })

      return response.ok
    } catch (error) {
      console.error('Task cancellation error:', error)
      return false
    }
  }

  /**
   * Get workflow steps for a project
   */
  async getWorkflowSteps(projectId: string): Promise<WorkflowStep[]> {
    try {
      const response = await fetch(`${this.baseUrl}/projects/${projectId}/workflow`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.statusText}`)
      }

      const data = await response.json()
      return data.steps || []
    } catch (error) {
      console.error('Error fetching workflow steps:', error)
      return []
    }
  }

  /**
   * Update workflow task progress
   */
  async updateTaskProgress(
    projectId: string,
    taskId: string,
    progress: number,
    status?: WorkflowTask['status']
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/projects/${projectId}/workflow/tasks/${taskId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
          body: JSON.stringify({
            progress,
            status,
          }),
        }
      )

      return response.ok
    } catch (error) {
      console.error('Error updating task progress:', error)
      return false
    }
  }

  /**
   * Generate workflow template for movie production
   */
  generateWorkflowTemplate(genre: string, episodeCount: number): WorkflowStep[] {
    return [
      {
        id: 'concept',
        title: 'Concept Development',
        description: 'Define the core concept, theme, and vision',
        order: 1,
        completed: false,
        estimatedDuration: '2-3 days',
        tasks: this.generateStepTasks('concept', genre, episodeCount),
      },
      {
        id: 'story',
        title: 'Story Structure',
        description: 'Develop plot, narrative arc, and episode breakdown',
        order: 2,
        completed: false,
        estimatedDuration: '5-7 days',
        tasks: this.generateStepTasks('story', genre, episodeCount),
      },
      {
        id: 'characters',
        title: 'Character Design',
        description: 'Create characters, personalities, and relationships',
        order: 3,
        completed: false,
        estimatedDuration: '3-4 days',
        tasks: this.generateStepTasks('characters', genre, episodeCount),
      },
      {
        id: 'production',
        title: 'Production',
        description: 'Generate scenes and assemble content',
        order: 4,
        completed: false,
        estimatedDuration: '10-14 days',
        tasks: this.generateStepTasks('production', genre, episodeCount),
      },
      {
        id: 'review',
        title: 'Review & Polish',
        description: 'Quality check and final improvements',
        order: 5,
        completed: false,
        estimatedDuration: '2-3 days',
        tasks: this.generateStepTasks('review', genre, episodeCount),
      },
    ]
  }

  private generateStepTasks(stepId: string, genre: string, episodeCount: number): WorkflowTask[] {
    const taskTemplates = {
      concept: [
        {
          title: 'Define Core Concept',
          description: 'Establish the main theme and unique selling proposition',
          difficulty: 'medium' as const,
          estimatedTime: '2-4 hours',
        },
        {
          title: `${genre} Research`,
          description: `Research ${genre} conventions and audience expectations`,
          difficulty: 'easy' as const,
          estimatedTime: '1-2 hours',
        },
      ],
      story: [
        {
          title: 'Episode Breakdown',
          description: `Create detailed breakdown for all ${episodeCount} episodes`,
          difficulty: 'hard' as const,
          estimatedTime: '4-6 hours',
        },
        {
          title: 'Story Arc Development',
          description: 'Develop overarching narrative and plot progression',
          difficulty: 'hard' as const,
          estimatedTime: '3-5 hours',
        },
      ],
      characters: [
        {
          title: 'Main Character Design',
          description: 'Create detailed profiles for main characters',
          difficulty: 'medium' as const,
          estimatedTime: '3-4 hours',
        },
        {
          title: 'Character Relationships',
          description: 'Design character interactions and dynamics',
          difficulty: 'medium' as const,
          estimatedTime: '2-3 hours',
        },
      ],
      production: [
        {
          title: 'Scene Generation',
          description: 'Generate individual scenes using AI',
          difficulty: 'easy' as const,
          estimatedTime: '1-2 hours per episode',
        },
        {
          title: 'Content Assembly',
          description: 'Assemble scenes into complete episodes',
          difficulty: 'medium' as const,
          estimatedTime: '2-3 hours per episode',
        },
      ],
      review: [
        {
          title: 'Quality Review',
          description: 'Review all content for quality and consistency',
          difficulty: 'medium' as const,
          estimatedTime: '1-2 hours per episode',
        },
        {
          title: 'Final Polish',
          description: 'Apply final improvements and optimizations',
          difficulty: 'easy' as const,
          estimatedTime: '30 minutes per episode',
        },
      ],
    }

    const stepTasks = taskTemplates[stepId as keyof typeof taskTemplates] || []

    return stepTasks.map((task, index) => ({
      id: `${stepId}_${index + 1}`,
      step: stepId,
      status: 'pending' as const,
      progress: 0,
      metadata: { genre, episodeCount },
      ...task,
    }))
  }
}

// Export singleton instance
export const taskService = new TaskServiceClient()
export default taskService
