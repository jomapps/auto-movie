/**
 * Workflow Engine Service
 * State machine for workflow steps with validation and progression logic
 */

import type {
  WorkflowPhase,
  WorkflowState,
  ProjectData,
  StepTransitionRequest,
  StepTransitionResult,
  WorkflowValidationResult,
} from '../types/workflow'
import {
  WORKFLOW_STEPS,
  WORKFLOW_PHASE_ORDER,
  getAllPrerequisites,
  getDependentPhases,
  calculateProgress,
  DEFAULT_START_PHASE,
  FINAL_PHASE,
} from '../config/workflows'
import { stepValidator } from './stepValidator'

/**
 * WorkflowEngine class - manages workflow state and transitions
 */
export class WorkflowEngine {
  /**
   * Get current workflow state for a project
   */
  getCurrentState(
    currentStep: WorkflowPhase,
    completedSteps: WorkflowPhase[],
    projectData: ProjectData
  ): WorkflowState {
    const availableNextSteps = this.getAvailableNextSteps(currentStep, completedSteps, projectData)
    const progress = calculateProgress(completedSteps)
    const validation = stepValidator.validateStep(currentStep, projectData, completedSteps)

    return {
      currentStep,
      completedSteps,
      availableNextSteps,
      progress,
      canAdvance: availableNextSteps.length > 0,
      validationErrors: validation.errors.length > 0 ? validation.errors : undefined,
    }
  }

  /**
   * Get the current step from project data
   */
  getCurrentStep(projectData: ProjectData): WorkflowPhase {
    return projectData.progress?.currentPhase || DEFAULT_START_PHASE
  }

  /**
   * Update the current step in project data
   */
  updateStep(projectData: ProjectData, newStep: WorkflowPhase): ProjectData {
    const currentCompleted = projectData.progress?.completedSteps || []
    const currentStep = this.getCurrentStep(projectData)

    // Add current step to completed steps if advancing
    const completedSteps = currentCompleted.includes(currentStep)
      ? currentCompleted
      : [...currentCompleted, currentStep]

    return {
      ...projectData,
      progress: {
        currentPhase: newStep,
        completedSteps,
        overallProgress: calculateProgress(completedSteps),
      },
    }
  }

  /**
   * Check if can advance to a specific step
   */
  canAdvanceToStep(
    targetStep: WorkflowPhase,
    completedSteps: WorkflowPhase[],
    projectData: ProjectData
  ): WorkflowValidationResult {
    return stepValidator.validateStep(targetStep, projectData, completedSteps)
  }

  /**
   * Get available next steps based on current state
   */
  getAvailableNextSteps(
    currentStep: WorkflowPhase,
    completedSteps: WorkflowPhase[],
    projectData: ProjectData
  ): WorkflowPhase[] {
    const currentIndex = WORKFLOW_PHASE_ORDER.indexOf(currentStep)
    const availableSteps: WorkflowPhase[] = []

    // Check if current step can be advanced from
    const currentValidation = stepValidator.validateStepCompletion(currentStep, projectData)
    if (!currentValidation.isValid) {
      // Can't advance if current step isn't complete
      return []
    }

    // Add current step to completed for next step checks
    const effectiveCompleted = completedSteps.includes(currentStep)
      ? completedSteps
      : [...completedSteps, currentStep]

    // Check all steps after current
    for (let i = currentIndex + 1; i < WORKFLOW_PHASE_ORDER.length; i++) {
      const potentialStep = WORKFLOW_PHASE_ORDER[i]
      const validation = stepValidator.validatePrerequisites(potentialStep, effectiveCompleted)

      if (validation.isValid) {
        availableSteps.push(potentialStep)
      }
    }

    return availableSteps
  }

  /**
   * Attempt to transition to a new step
   */
  async transitionToStep(request: StepTransitionRequest): Promise<StepTransitionResult> {
    const { projectId, currentStep, targetStep, projectData } = request
    const completedSteps = projectData.progress?.completedSteps || []

    // Validate the transition
    const validationResult = this.canAdvanceToStep(targetStep, completedSteps, projectData)

    if (!validationResult.isValid) {
      return {
        success: false,
        validationResult,
        message: this.formatValidationMessage(validationResult),
      }
    }

    // Check if current step is complete before allowing transition
    const currentStepValidation = stepValidator.validateStepCompletion(currentStep, projectData)
    if (!currentStepValidation.isValid) {
      return {
        success: false,
        validationResult: currentStepValidation,
        message: `Cannot leave '${WORKFLOW_STEPS[currentStep].name}' - step requirements not met: ${currentStepValidation.errors.map((e) => e.message).join('; ')}`,
      }
    }

    return {
      success: true,
      newStep: targetStep,
      validationResult,
      message: `Successfully transitioned to '${WORKFLOW_STEPS[targetStep].name}'`,
    }
  }

  /**
   * Get suggested next step based on workflow order
   */
  getSuggestedNextStep(
    currentStep: WorkflowPhase,
    completedSteps: WorkflowPhase[],
    projectData: ProjectData
  ): WorkflowPhase | null {
    const availableSteps = this.getAvailableNextSteps(currentStep, completedSteps, projectData)

    if (availableSteps.length === 0) {
      return null
    }

    // Return the step with the lowest order number (most logical progression)
    return availableSteps.reduce((prev, curr) =>
      WORKFLOW_STEPS[curr].order < WORKFLOW_STEPS[prev].order ? curr : prev
    )
  }

  /**
   * Check if a step can be revisited
   */
  canRevisitStep(
    targetStep: WorkflowPhase,
    currentStep: WorkflowPhase,
    completedSteps: WorkflowPhase[]
  ): boolean {
    // Can always revisit completed steps
    if (completedSteps.includes(targetStep)) {
      return true
    }

    // Can't revisit future steps that aren't unlocked
    const targetIndex = WORKFLOW_PHASE_ORDER.indexOf(targetStep)
    const currentIndex = WORKFLOW_PHASE_ORDER.indexOf(currentStep)

    return targetIndex <= currentIndex
  }

  /**
   * Get step progress details
   */
  getStepProgress(
    phase: WorkflowPhase,
    projectData: ProjectData
  ): {
    isComplete: boolean
    completionPercentage: number
    missingRequirements: string[]
  } {
    const validation = stepValidator.validateStepCompletion(phase, projectData)
    const stepDef = WORKFLOW_STEPS[phase]

    const totalRequirements = stepDef.requiredData.length
    const completedRequirements = totalRequirements - validation.errors.length

    return {
      isComplete: validation.isValid,
      completionPercentage: Math.round((completedRequirements / totalRequirements) * 100),
      missingRequirements: validation.errors.map((e) => e.message),
    }
  }

  /**
   * Check if workflow is complete
   */
  isWorkflowComplete(completedSteps: WorkflowPhase[]): boolean {
    return completedSteps.includes(FINAL_PHASE)
  }

  /**
   * Get workflow completion percentage
   */
  getWorkflowCompletion(completedSteps: WorkflowPhase[]): number {
    return calculateProgress(completedSteps)
  }

  /**
   * Get all prerequisites for a step (including transitive)
   */
  getStepPrerequisites(phase: WorkflowPhase): WorkflowPhase[] {
    return getAllPrerequisites(phase)
  }

  /**
   * Get steps that depend on this step
   */
  getStepDependents(phase: WorkflowPhase): WorkflowPhase[] {
    return getDependentPhases(phase)
  }

  /**
   * Format validation result into user-friendly message
   */
  private formatValidationMessage(validation: WorkflowValidationResult): string {
    if (validation.isValid) {
      return 'All requirements met'
    }

    const errorMessages = validation.errors.map((e) => e.message)

    if (validation.missingPrerequisites && validation.missingPrerequisites.length > 0) {
      const prereqNames = validation.missingPrerequisites.map(
        (p) => WORKFLOW_STEPS[p].name
      )
      return `Prerequisites not met: ${prereqNames.join(', ')}. ${errorMessages.join('; ')}`
    }

    return `Requirements not met: ${errorMessages.join('; ')}`
  }

  /**
   * Get workflow roadmap - all steps with their status
   */
  getWorkflowRoadmap(
    currentStep: WorkflowPhase,
    completedSteps: WorkflowPhase[],
    projectData: ProjectData
  ): Array<{
    phase: WorkflowPhase
    name: string
    status: 'completed' | 'current' | 'locked' | 'available'
    canAccess: boolean
    order: number
  }> {
    return WORKFLOW_PHASE_ORDER.map((phase) => {
      const isCompleted = completedSteps.includes(phase)
      const isCurrent = phase === currentStep
      const stepDef = WORKFLOW_STEPS[phase]

      let status: 'completed' | 'current' | 'locked' | 'available'
      let canAccess = false

      if (isCompleted) {
        status = 'completed'
        canAccess = true
      } else if (isCurrent) {
        status = 'current'
        canAccess = true
      } else {
        const validation = stepValidator.validatePrerequisites(phase, completedSteps)
        if (validation.isValid) {
          status = 'available'
          canAccess = true
        } else {
          status = 'locked'
          canAccess = false
        }
      }

      return {
        phase,
        name: stepDef.name,
        status,
        canAccess,
        order: stepDef.order,
      }
    })
  }

  /**
   * Reset workflow to start
   */
  resetWorkflow(projectData: ProjectData): ProjectData {
    return {
      ...projectData,
      progress: {
        currentPhase: DEFAULT_START_PHASE,
        completedSteps: [],
        overallProgress: 0,
      },
    }
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine()