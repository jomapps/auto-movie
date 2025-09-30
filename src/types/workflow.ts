/**
 * Workflow Type Definitions
 * Defines the structure and types for the 7-phase movie production workflow
 */

export type WorkflowPhase =
  | 'initial_concept'
  | 'story_development'
  | 'character_creation'
  | 'visual_design'
  | 'audio_design'
  | 'scene_production'
  | 'post_production'
  | 'final_assembly'

export interface WorkflowStepDefinition {
  id: WorkflowPhase
  name: string
  description: string
  prerequisites: WorkflowPhase[]
  requiredData: RequiredDataRule[]
  optionalData?: string[]
  estimatedDuration?: string
  order: number
}

export interface RequiredDataRule {
  field: string
  type: 'exists' | 'count' | 'value' | 'relationship'
  condition?: {
    min?: number
    max?: number
    equals?: any
    oneOf?: any[]
  }
  errorMessage: string
}

export interface WorkflowValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
  missingPrerequisites?: WorkflowPhase[]
}

export interface ValidationError {
  field: string
  rule: string
  message: string
  severity: 'error' | 'critical'
}

export interface ValidationWarning {
  field: string
  message: string
  suggestion?: string
}

export interface WorkflowState {
  currentStep: WorkflowPhase
  completedSteps: WorkflowPhase[]
  availableNextSteps: WorkflowPhase[]
  progress: number // 0-100
  canAdvance: boolean
  validationErrors?: ValidationError[]
}

export interface ProjectData {
  id: string
  title: string
  genre?: string
  targetAudience?: string
  status?: string
  styleReferences?: any[]
  progress?: {
    currentPhase: WorkflowPhase
    completedSteps: WorkflowPhase[]
    overallProgress: number
  }
  [key: string]: any
}

export interface StepTransitionRequest {
  projectId: string
  currentStep: WorkflowPhase
  targetStep: WorkflowPhase
  projectData: ProjectData
}

export interface StepTransitionResult {
  success: boolean
  newStep?: WorkflowPhase
  validationResult: WorkflowValidationResult
  message: string
}

export interface WorkflowConfig {
  steps: Map<WorkflowPhase, WorkflowStepDefinition>
  defaultStartStep: WorkflowPhase
  finalStep: WorkflowPhase
}