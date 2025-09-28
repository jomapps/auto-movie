// API Types for Prompt Management System

export interface VariableDefinition {
  name: string
  type: 'string' | 'number' | 'boolean' | 'json' | 'text' | 'url'
  required: boolean
  description?: string
  defaultValue?: any
}

export interface Tag {
  value: string
}

export interface PromptTemplate {
  id: string
  name: string
  app: string
  stage: string
  feature?: string
  tags: Tag[]
  template: string
  variableDefs: VariableDefinition[]
  outputSchema?: any
  model: string
  notes?: string
  createdAt: string
  updatedAt: string
  versions?: PromptTemplateVersion[]
}

export interface PromptTemplateVersion {
  id: string
  version: any
  createdAt: string
  updatedAt: string
}

export interface PromptExecution {
  id: string
  templateId?: string
  template?: {
    id: string
    name: string
    app: string
    stage: string
    feature?: string
  }
  app: string
  stage: string
  feature?: string
  projectId?: string
  tagsSnapshot: Tag[]
  inputs: Record<string, any>
  resolvedPrompt: string
  model: string
  status: 'success' | 'error'
  outputRaw?: any
  errorMessage?: string
  startedAt?: string
  finishedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PaginationInfo {
  page: number
  limit: number
  totalPages: number
  totalDocs: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// API Request Types
export interface PromptExecuteRequest {
  templateId?: string
  inlineTemplate?: string
  variableDefs?: VariableDefinition[]
  inputs: Record<string, any>
  model?: string
  app: string
  stage: string
  feature?: string
  projectId?: string
}

export interface PromptTemplatesQueryParams {
  app?: string
  stage?: string
  feature?: string
  tagGroup?: string
  search?: string
  page?: number
  limit?: number
}

export interface PromptsQueryParams {
  app?: string
  stage?: string
  feature?: string
  projectId?: string
  status?: 'success' | 'error'
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  limit?: number
}

// API Response Types
export interface PromptTemplatesResponse {
  templates: PromptTemplate[]
  pagination: PaginationInfo
}

export interface TagGroupTemplatesResponse {
  templates: (PromptTemplate & { relevantTag?: string })[]
  group: string
  pagination: PaginationInfo
}

export interface PromptExecutionsResponse {
  executions: PromptExecution[]
  pagination: PaginationInfo
}

export interface ApiError {
  error: string
  details?: any
}

// Model Types
export type ModelType =
  | 'anthropic/claude-sonnet-4'
  | 'qwen/qwen3-vl-235b-a22b-thinking'
  | 'fal-ai/nano-banana'
  | 'fal-ai/nano-banana/edit'

// Variable resolution utility types
export interface VariableResolutionResult {
  resolvedPrompt: string
  errors: string[]
  missingVariables: string[]
}