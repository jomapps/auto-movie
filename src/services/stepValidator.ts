/**
 * Step Validator Service
 * Validates step prerequisites, data completeness, and quality thresholds
 */

import type {
  WorkflowValidationResult,
  ValidationError,
  ValidationWarning,
  RequiredDataRule,
  ProjectData,
  WorkflowPhase,
} from '../types/workflow'
import { WORKFLOW_STEPS } from '../config/workflows'

/**
 * StepValidator class for validating workflow step transitions
 */
export class StepValidator {
  /**
   * Validate if a step can be completed based on required data
   */
  validateStepCompletion(
    phase: WorkflowPhase,
    projectData: ProjectData
  ): WorkflowValidationResult {
    const stepDefinition = WORKFLOW_STEPS[phase]
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!stepDefinition) {
      return {
        isValid: false,
        errors: [
          {
            field: 'phase',
            rule: 'existence',
            message: `Invalid workflow phase: ${phase}`,
            severity: 'critical',
          },
        ],
      }
    }

    // Validate each required data rule
    for (const rule of stepDefinition.requiredData) {
      const validationError = this.validateDataRule(rule, projectData)
      if (validationError) {
        errors.push(validationError)
      }
    }

    // Check optional data for warnings
    if (stepDefinition.optionalData) {
      for (const optionalField of stepDefinition.optionalData) {
        const value = this.getNestedValue(projectData, optionalField)
        if (!value || (Array.isArray(value) && value.length === 0)) {
          warnings.push({
            field: optionalField,
            message: `Optional field '${optionalField}' is not set`,
            suggestion: `Consider adding ${optionalField} for better results`,
          })
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Validate a single data rule
   */
  private validateDataRule(
    rule: RequiredDataRule,
    projectData: ProjectData
  ): ValidationError | null {
    const value = this.getNestedValue(projectData, rule.field)

    switch (rule.type) {
      case 'exists':
        if (!value) {
          return {
            field: rule.field,
            rule: 'exists',
            message: rule.errorMessage,
            severity: 'error',
          }
        }
        break

      case 'count':
        const count = Array.isArray(value) ? value.length : 0
        if (rule.condition?.min && count < rule.condition.min) {
          return {
            field: rule.field,
            rule: 'count',
            message: rule.errorMessage,
            severity: 'error',
          }
        }
        if (rule.condition?.max && count > rule.condition.max) {
          return {
            field: rule.field,
            rule: 'count',
            message: `Too many ${rule.field}: maximum ${rule.condition.max} allowed`,
            severity: 'error',
          }
        }
        break

      case 'value':
        if (value === undefined || value === null) {
          return {
            field: rule.field,
            rule: 'value',
            message: rule.errorMessage,
            severity: 'error',
          }
        }
        if (rule.condition?.min !== undefined && value < rule.condition.min) {
          return {
            field: rule.field,
            rule: 'value',
            message: rule.errorMessage,
            severity: 'error',
          }
        }
        if (rule.condition?.max !== undefined && value > rule.condition.max) {
          return {
            field: rule.field,
            rule: 'value',
            message: `Value for ${rule.field} exceeds maximum of ${rule.condition.max}`,
            severity: 'error',
          }
        }
        if (rule.condition?.equals !== undefined && value !== rule.condition.equals) {
          return {
            field: rule.field,
            rule: 'value',
            message: rule.errorMessage,
            severity: 'error',
          }
        }
        break

      case 'relationship':
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return {
              field: rule.field,
              rule: 'relationship',
              message: rule.errorMessage,
              severity: 'error',
            }
          }
        } else if (!value) {
          return {
            field: rule.field,
            rule: 'relationship',
            message: rule.errorMessage,
            severity: 'error',
          }
        }
        break
    }

    return null
  }

  /**
   * Check prerequisites for a step
   */
  validatePrerequisites(
    phase: WorkflowPhase,
    completedSteps: WorkflowPhase[]
  ): WorkflowValidationResult {
    const stepDefinition = WORKFLOW_STEPS[phase]
    const errors: ValidationError[] = []
    const missingPrerequisites: WorkflowPhase[] = []

    for (const prerequisite of stepDefinition.prerequisites) {
      if (!completedSteps.includes(prerequisite)) {
        missingPrerequisites.push(prerequisite)
        const prereqDef = WORKFLOW_STEPS[prerequisite]
        errors.push({
          field: 'prerequisites',
          rule: 'prerequisite',
          message: `Step '${prereqDef.name}' must be completed before '${stepDefinition.name}'`,
          severity: 'critical',
        })
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      missingPrerequisites: missingPrerequisites.length > 0 ? missingPrerequisites : undefined,
    }
  }

  /**
   * Validate data quality thresholds
   */
  validateDataQuality(
    phase: WorkflowPhase,
    projectData: ProjectData
  ): WorkflowValidationResult {
    const warnings: ValidationWarning[] = []

    // Quality checks based on phase
    switch (phase) {
      case 'story_development':
        if (!projectData.description || projectData.description.length < 50) {
          warnings.push({
            field: 'description',
            message: 'Story description is very short',
            suggestion: 'Add more details about the plot and themes for better AI generation',
          })
        }
        break

      case 'character_creation':
        // Could check character detail completeness
        break

      case 'visual_design':
        if (
          projectData.styleReferences &&
          Array.isArray(projectData.styleReferences) &&
          projectData.styleReferences.length < 3
        ) {
          warnings.push({
            field: 'styleReferences',
            message: 'Few style references provided',
            suggestion: 'Add more style references (3-5 recommended) for consistent visual design',
          })
        }
        break

      case 'scene_production':
        // Could check scene script quality
        break
    }

    return {
      isValid: true,
      errors: [],
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Comprehensive validation combining all checks
   */
  validateStep(
    phase: WorkflowPhase,
    projectData: ProjectData,
    completedSteps: WorkflowPhase[]
  ): WorkflowValidationResult {
    const prereqValidation = this.validatePrerequisites(phase, completedSteps)
    const dataValidation = this.validateStepCompletion(phase, projectData)
    const qualityValidation = this.validateDataQuality(phase, projectData)

    const allErrors = [
      ...prereqValidation.errors,
      ...dataValidation.errors,
      ...qualityValidation.errors,
    ]

    const allWarnings = [
      ...(prereqValidation.warnings || []),
      ...(dataValidation.warnings || []),
      ...(qualityValidation.warnings || []),
    ]

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
      missingPrerequisites: prereqValidation.missingPrerequisites,
    }
  }

  /**
   * Get nested value from object using dot notation
   * e.g., "progress.overallProgress" -> projectData.progress.overallProgress
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.')
    let value = obj

    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined
      }
      value = value[key]
    }

    return value
  }

  /**
   * Generate helpful error message for missing prerequisites
   */
  getPrerequisiteErrorMessage(phase: WorkflowPhase, missingSteps: WorkflowPhase[]): string {
    const stepDef = WORKFLOW_STEPS[phase]
    const missingNames = missingSteps.map((step) => WORKFLOW_STEPS[step].name).join(', ')

    return `Cannot advance to '${stepDef.name}' yet. Please complete these steps first: ${missingNames}`
  }

  /**
   * Get actionable suggestions for validation errors
   */
  getSuggestions(validationResult: WorkflowValidationResult): string[] {
    const suggestions: string[] = []

    for (const error of validationResult.errors) {
      switch (error.rule) {
        case 'exists':
          suggestions.push(`Add required field: ${error.field}`)
          break
        case 'count':
          suggestions.push(`Create more ${error.field} (minimum requirement not met)`)
          break
        case 'value':
          suggestions.push(`Update ${error.field} to meet minimum requirements`)
          break
        case 'prerequisite':
          suggestions.push(`Complete prerequisite steps first`)
          break
      }
    }

    if (validationResult.warnings) {
      for (const warning of validationResult.warnings) {
        if (warning.suggestion) {
          suggestions.push(warning.suggestion)
        }
      }
    }

    return suggestions
  }
}

// Export singleton instance
export const stepValidator = new StepValidator()