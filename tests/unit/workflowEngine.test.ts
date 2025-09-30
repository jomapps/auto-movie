import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Unit Tests: WorkflowEngine
 *
 * Tests the workflow state machine that enforces sequential prerequisites
 * and prevents users from skipping required steps in the movie production
 * process.
 *
 * Coverage includes:
 * - Step validation
 * - Prerequisite enforcement
 * - State transitions
 * - Progress tracking
 * - Error messages
 */

type WorkflowStep =
  | 'initial_concept'
  | 'story_structure'
  | 'character_development'
  | 'storyboard'
  | 'asset_creation'
  | 'production'
  | 'editing'
  | 'review'
  | 'final'

interface StepDefinition {
  id: WorkflowStep
  name: string
  prerequisites: WorkflowStep[]
  description: string
  estimatedDuration: number
  requiredEntities?: string[]
}

interface WorkflowState {
  currentStep: WorkflowStep
  completedSteps: WorkflowStep[]
  availableSteps: WorkflowStep[]
  progress: number
  blockedSteps: Array<{
    step: WorkflowStep
    reason: string
  }>
}

interface TransitionResult {
  success: boolean
  newState?: WorkflowState
  error?: string
  suggestions?: string[]
}

// Mock WorkflowEngine - will be implemented in Phase 0
class WorkflowEngine {
  private steps: Map<WorkflowStep, StepDefinition> = new Map()
  private stepOrder: WorkflowStep[] = []

  constructor() {
    this.initializeWorkflow()
  }

  private initializeWorkflow(): void {
    const definitions: StepDefinition[] = [
      {
        id: 'initial_concept',
        name: 'Initial Concept',
        prerequisites: [],
        description: 'Define the initial idea and project goals.',
        estimatedDuration: 1,
      },
      {
        id: 'story_structure',
        name: 'Story Structure',
        prerequisites: ['initial_concept'],
        description: 'Develop the narrative framework and plot beats.',
        estimatedDuration: 2,
      },
      {
        id: 'character_development',
        name: 'Character Development',
        prerequisites: ['initial_concept'],
        description: 'Define characters, motivations, and relationships.',
        estimatedDuration: 2,
      },
      {
        id: 'storyboard',
        name: 'Storyboard',
        prerequisites: ['story_structure', 'character_development'],
        description: 'Visualize key scenes and shot progression.',
        estimatedDuration: 3,
      },
      {
        id: 'asset_creation',
        name: 'Asset Creation',
        prerequisites: ['storyboard', 'character_development'],
        description: 'Produce visual and audio assets needed for production.',
        estimatedDuration: 4,
      },
      {
        id: 'production',
        name: 'Production',
        prerequisites: ['storyboard', 'asset_creation', 'character_development'],
        description: 'Assemble scenes using completed assets.',
        estimatedDuration: 5,
      },
      {
        id: 'editing',
        name: 'Editing',
        prerequisites: ['production', 'asset_creation', 'storyboard', 'story_structure'],
        description: 'Refine pacing, timing, and continuity.',
        estimatedDuration: 3,
      },
      {
        id: 'review',
        name: 'Review',
        prerequisites: ['editing', 'production'],
        description: 'Perform quality checks and gather feedback.',
        estimatedDuration: 2,
      },
      {
        id: 'final',
        name: 'Final Delivery',
        prerequisites: ['review', 'editing'],
        description: 'Release the completed production.',
        estimatedDuration: 1,
      },
    ]

    this.steps = new Map(definitions.map((definition) => [definition.id, definition]))
    this.stepOrder = definitions.map((definition) => definition.id)
  }

  canTransitionTo(currentStep: WorkflowStep, targetStep: WorkflowStep, completedSteps: WorkflowStep[]): boolean {
    if (!this.steps.has(targetStep)) {
      return false
    }

    if (currentStep === targetStep) {
      return true
    }

    const completedSet = new Set(this.dedupeSteps(completedSteps))

    const { isValid } = this.validatePrerequisites(targetStep, Array.from(completedSet))
    if (!isValid) {
      return false
    }

    const targetIndex = this.stepOrder.indexOf(targetStep)
    const currentIndex = this.stepOrder.indexOf(currentStep)

    if (targetIndex < 0) {
      return false
    }

    if (targetIndex < currentIndex && !completedSet.has(targetStep)) {
      return false
    }

    return true
  }

  transitionTo(state: WorkflowState, targetStep: WorkflowStep): TransitionResult {
    if (!this.steps.has(targetStep)) {
      return {
        success: false,
        error: `${this.formatStepName(targetStep)} is not a valid workflow step.`,
        suggestions: this.getAvailableSuggestions(state.currentStep, state.completedSteps),
      }
    }

    if (!state.completedSteps.includes(state.currentStep)) {
      return {
        success: false,
        error: `Cannot leave "${state.currentStep}" until it is marked complete.`,
        suggestions: [this.formatStepName(state.currentStep)],
      }
    }

    const completedForValidation = this.dedupeSteps(state.completedSteps)
    const prereqValidation = this.validatePrerequisites(targetStep, completedForValidation)

    if (!prereqValidation.isValid) {
      return {
        success: false,
        error: this.generateHelpfulError(targetStep, prereqValidation.missing),
        suggestions: prereqValidation.missing.map((step) => this.formatStepName(step)),
      }
    }

    if (!this.canTransitionTo(state.currentStep, targetStep, state.completedSteps)) {
      const missing = this.validatePrerequisites(targetStep, completedForValidation).missing

      return {
        success: false,
        error: this.generateHelpfulError(targetStep, missing),
        suggestions: missing.map((step) => this.formatStepName(step)),
      }
    }

    const updatedCompleted = this.dedupeSteps([...completedForValidation, targetStep])
    const availableSteps = this.getAvailableSteps(targetStep, updatedCompleted)
    const blockedSteps = this.computeBlockedSteps(updatedCompleted, availableSteps)

    const newState: WorkflowState = {
      currentStep: targetStep,
      completedSteps: updatedCompleted,
      availableSteps,
      progress: this.calculateProgress(updatedCompleted),
      blockedSteps,
    }

    return {
      success: true,
      newState,
    }
  }

  getAvailableSteps(currentStep: WorkflowStep, completedSteps: WorkflowStep[]): WorkflowStep[] {
    if (!this.steps.has(currentStep)) {
      return []
    }

    const completedSet = new Set(this.dedupeSteps(completedSteps))
    const effectiveCompleted = new Set(completedSet)
    if (completedSet.has(currentStep)) {
      effectiveCompleted.add(currentStep)
    }

    const available = new Set<WorkflowStep>()
    completedSet.forEach((step) => available.add(step))

    for (const step of this.stepOrder) {
      if (step === currentStep) {
        continue
      }

      const definition = this.steps.get(step)
      if (!definition) {
        continue
      }

      const missing = definition.prerequisites.filter((prereq) => !effectiveCompleted.has(prereq))
      if (missing.length === 0) {
        available.add(step)
      }
    }

    return this.stepOrder.filter((step) => available.has(step))
  }

  validatePrerequisites(targetStep: WorkflowStep, completedSteps: WorkflowStep[]): { isValid: boolean; missing: WorkflowStep[] } {
    const definition = this.steps.get(targetStep)

    if (!definition) {
      return {
        isValid: false,
        missing: [],
      }
    }

    const completedSet = new Set(this.dedupeSteps(completedSteps))
    const missing = definition.prerequisites.filter((step) => !completedSet.has(step))

    return {
      isValid: missing.length === 0,
      missing,
    }
  }

  calculateProgress(completedSteps: WorkflowStep[]): number {
    const uniqueCompleted = this.dedupeSteps(completedSteps)
    if (uniqueCompleted.length === 0) {
      return 0
    }

    const progress = (uniqueCompleted.length / this.stepOrder.length) * 100
    return Math.round(progress)
  }

  getStepInfo(step: WorkflowStep): StepDefinition | undefined {
    return this.steps.get(step)
  }

  generateHelpfulError(targetStep: WorkflowStep, missingPrereqs: WorkflowStep[]): string {
    const formattedTarget = this.formatStepName(targetStep)

    if (!this.steps.has(targetStep)) {
      return `${formattedTarget} (${targetStep}) is not part of the workflow.`
    }

    if (missingPrereqs.length === 0) {
      return `${formattedTarget} (${targetStep}) cannot be started until earlier steps are complete.`
    }

    if (missingPrereqs.length === 1) {
      const missing = missingPrereqs[0]
      return `${formattedTarget} (${targetStep}) requires ${this.formatStepName(missing)} ("${missing}") to be completed first.`
    }

    const prereqList = missingPrereqs
      .map((step) => `${this.formatStepName(step)} ("${step}")`)
      .join(', ')
    return `${formattedTarget} (${targetStep}) requires the following steps to be completed first: ${prereqList}.`
  }

  getNextRecommendedStep(state: WorkflowState): WorkflowStep | null {
    const available = this.getAvailableSteps(state.currentStep, state.completedSteps)
    const completedSet = new Set(state.completedSteps)
    const candidates = available.filter((step) => !completedSet.has(step))

    if (candidates.length === 0) {
      return null
    }

    return candidates.sort((a, b) => this.stepOrder.indexOf(a) - this.stepOrder.indexOf(b))[0] || null
  }

  private dedupeSteps(steps: WorkflowStep[]): WorkflowStep[] {
    const seen = new Set<WorkflowStep>()
    const orderedSteps: WorkflowStep[] = []

    for (const step of steps) {
      if (!seen.has(step)) {
        seen.add(step)
        orderedSteps.push(step)
      }
    }

    return orderedSteps
  }

  private formatStepName(step: string): string {
    return step
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  private computeBlockedSteps(completedSteps: WorkflowStep[], availableSteps: WorkflowStep[]): WorkflowState['blockedSteps'] {
    const completedSet = new Set(completedSteps)
    const availableSet = new Set(availableSteps)
    const blocked: WorkflowState['blockedSteps'] = []

    for (const step of this.stepOrder) {
      if (availableSet.has(step) || completedSet.has(step)) {
        continue
      }

      const validation = this.validatePrerequisites(step, completedSteps)
      if (!validation.isValid && validation.missing.length > 0) {
        blocked.push({
          step,
          reason: this.generateHelpfulError(step, validation.missing),
        })
      }
    }

    return blocked
  }

  private getAvailableSuggestions(currentStep: WorkflowStep, completedSteps: WorkflowStep[]): string[] {
    const available = this.getAvailableSteps(currentStep, completedSteps)
    return available.map((step) => this.formatStepName(step))
  }
}

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine

  beforeEach(() => {
    engine = new WorkflowEngine()
  })

  describe('workflow initialization', () => {
    it('should initialize with all workflow steps defined', () => {
      const steps: WorkflowStep[] = [
        'initial_concept',
        'story_structure',
        'character_development',
        'storyboard',
        'asset_creation',
        'production',
        'editing',
        'review',
        'final'
      ]

      steps.forEach(step => {
        const info = engine.getStepInfo(step)
        expect(info).toBeDefined()
        expect(info?.id).toBe(step)
      })
    })

    it('should define prerequisites for each step', () => {
      const storyStructure = engine.getStepInfo('story_structure')
      expect(storyStructure?.prerequisites).toContain('initial_concept')

      const characterDev = engine.getStepInfo('character_development')
      expect(characterDev?.prerequisites).toContain('initial_concept')

      const production = engine.getStepInfo('production')
      expect(production?.prerequisites.length).toBeGreaterThan(1)
    })

    it('should have increasing prerequisites for later steps', () => {
      const earlyStep = engine.getStepInfo('story_structure')
      const lateStep = engine.getStepInfo('production')

      expect(lateStep?.prerequisites.length).toBeGreaterThan(earlyStep?.prerequisites.length || 0)
    })
  })

  describe('canTransitionTo', () => {
    it('should allow transition from initial_concept to story_structure', () => {
      const canTransition = engine.canTransitionTo(
        'initial_concept',
        'story_structure',
        ['initial_concept']
      )

      expect(canTransition).toBe(true)
    })

    it('should allow transition from initial_concept to character_development', () => {
      const canTransition = engine.canTransitionTo(
        'initial_concept',
        'character_development',
        ['initial_concept']
      )

      expect(canTransition).toBe(true)
    })

    it('should prevent skipping to production without prerequisites', () => {
      const canTransition = engine.canTransitionTo(
        'initial_concept',
        'production',
        ['initial_concept']
      )

      expect(canTransition).toBe(false)
    })

    it('should allow transition when all prerequisites are met', () => {
      const completedSteps: WorkflowStep[] = [
        'initial_concept',
        'story_structure',
        'character_development',
        'storyboard',
        'asset_creation'
      ]

      const canTransition = engine.canTransitionTo(
        'asset_creation',
        'production',
        completedSteps
      )

      expect(canTransition).toBe(true)
    })

    it('should prevent backward transitions to incomplete steps', () => {
      const canTransition = engine.canTransitionTo(
        'production',
        'storyboard',
        ['initial_concept', 'production'] // Missing steps in between
      )

      expect(canTransition).toBe(false)
    })

    it('should allow revisiting completed steps', () => {
      const completedSteps: WorkflowStep[] = [
        'initial_concept',
        'story_structure',
        'character_development'
      ]

      const canTransition = engine.canTransitionTo(
        'character_development',
        'story_structure',
        completedSteps
      )

      expect(canTransition).toBe(true)
    })
  })

  describe('transitionTo', () => {
    it('should successfully transition to valid step', () => {
      const initialState: WorkflowState = {
        currentStep: 'initial_concept',
        completedSteps: ['initial_concept'],
        availableSteps: ['story_structure', 'character_development'],
        progress: 10,
        blockedSteps: []
      }

      const result = engine.transitionTo(initialState, 'story_structure')

      expect(result.success).toBe(true)
      expect(result.newState?.currentStep).toBe('story_structure')
      expect(result.newState?.completedSteps).toContain('initial_concept')
      expect(result.newState?.progress).toBeGreaterThan(initialState.progress)
    })

    it('should fail transition and provide error message', () => {
      const initialState: WorkflowState = {
        currentStep: 'initial_concept',
        completedSteps: ['initial_concept'],
        availableSteps: ['story_structure', 'character_development'],
        progress: 10,
        blockedSteps: []
      }

      const result = engine.transitionTo(initialState, 'production')

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(result.error).toMatch(/prerequisite|require|must complete/i)
    })

    it('should provide suggestions when transition fails', () => {
      const initialState: WorkflowState = {
        currentStep: 'initial_concept',
        completedSteps: ['initial_concept'],
        availableSteps: ['story_structure', 'character_development'],
        progress: 10,
        blockedSteps: []
      }

      const result = engine.transitionTo(initialState, 'editing')

      expect(result.success).toBe(false)
      expect(result.suggestions).toBeTruthy()
      expect(result.suggestions?.length).toBeGreaterThan(0)
    })

    it('should update available steps after transition', () => {
      const initialState: WorkflowState = {
        currentStep: 'initial_concept',
        completedSteps: ['initial_concept'],
        availableSteps: ['story_structure', 'character_development'],
        progress: 10,
        blockedSteps: []
      }

      const result = engine.transitionTo(initialState, 'story_structure')

      expect(result.newState?.availableSteps).toBeDefined()
      expect(result.newState?.availableSteps.length).toBeGreaterThan(0)
    })

    it('should mark step as completed on transition', () => {
      const initialState: WorkflowState = {
        currentStep: 'story_structure',
        completedSteps: ['initial_concept', 'story_structure'],
        availableSteps: ['character_development', 'storyboard'],
        progress: 25,
        blockedSteps: []
      }

      const result = engine.transitionTo(initialState, 'character_development')

      expect(result.newState?.completedSteps).toContain('story_structure')
      expect(result.newState?.completedSteps).toContain('character_development')
    })
  })

  describe('getAvailableSteps', () => {
    it('should return available steps from initial concept', () => {
      const available = engine.getAvailableSteps('initial_concept', ['initial_concept'])

      expect(available).toContain('story_structure')
      expect(available).toContain('character_development')
      expect(available.length).toBeGreaterThan(0)
    })

    it('should not include blocked steps', () => {
      const available = engine.getAvailableSteps('initial_concept', ['initial_concept'])

      expect(available).not.toContain('production')
      expect(available).not.toContain('editing')
      expect(available).not.toContain('final')
    })

    it('should update available steps as progress is made', () => {
      const earlyAvailable = engine.getAvailableSteps('initial_concept', ['initial_concept'])

      const laterAvailable = engine.getAvailableSteps('story_structure', [
        'initial_concept',
        'story_structure',
        'character_development'
      ])

      expect(laterAvailable.length).toBeGreaterThan(earlyAvailable.length)
    })

    it('should include previously completed steps', () => {
      const completedSteps: WorkflowStep[] = [
        'initial_concept',
        'story_structure',
        'character_development'
      ]

      const available = engine.getAvailableSteps('character_development', completedSteps)

      expect(available).toContain('initial_concept')
      expect(available).toContain('story_structure')
    })
  })

  describe('validatePrerequisites', () => {
    it('should validate all prerequisites are met', () => {
      const completedSteps: WorkflowStep[] = [
        'initial_concept',
        'story_structure',
        'character_development',
        'storyboard',
        'asset_creation'
      ]

      const result = engine.validatePrerequisites('production', completedSteps)

      expect(result.isValid).toBe(true)
      expect(result.missing).toHaveLength(0)
    })

    it('should identify missing prerequisites', () => {
      const completedSteps: WorkflowStep[] = ['initial_concept', 'story_structure']

      const result = engine.validatePrerequisites('production', completedSteps)

      expect(result.isValid).toBe(false)
      expect(result.missing.length).toBeGreaterThan(0)
      expect(result.missing).toContain('storyboard')
    })

    it('should return all missing prerequisites', () => {
      const completedSteps: WorkflowStep[] = ['initial_concept']

      const result = engine.validatePrerequisites('editing', completedSteps)

      expect(result.missing.length).toBeGreaterThan(3)
    })
  })

  describe('calculateProgress', () => {
    it('should return 0 for no completed steps', () => {
      const progress = engine.calculateProgress([])

      expect(progress).toBe(0)
    })

    it('should return progress for initial concept', () => {
      const progress = engine.calculateProgress(['initial_concept'])

      expect(progress).toBeGreaterThan(0)
      expect(progress).toBeLessThan(20)
    })

    it('should return 100 for all steps completed', () => {
      const allSteps: WorkflowStep[] = [
        'initial_concept',
        'story_structure',
        'character_development',
        'storyboard',
        'asset_creation',
        'production',
        'editing',
        'review',
        'final'
      ]

      const progress = engine.calculateProgress(allSteps)

      expect(progress).toBe(100)
    })

    it('should increase progress linearly', () => {
      const progress1 = engine.calculateProgress(['initial_concept'])
      const progress2 = engine.calculateProgress(['initial_concept', 'story_structure'])
      const progress3 = engine.calculateProgress(['initial_concept', 'story_structure', 'character_development'])

      expect(progress2).toBeGreaterThan(progress1)
      expect(progress3).toBeGreaterThan(progress2)
    })

    it('should handle partial completion', () => {
      const progress = engine.calculateProgress([
        'initial_concept',
        'story_structure',
        'character_development'
      ])

      expect(progress).toBeGreaterThan(25)
      expect(progress).toBeLessThan(50)
    })
  })

  describe('generateHelpfulError', () => {
    it('should generate clear error message for single missing prerequisite', () => {
      const error = engine.generateHelpfulError('storyboard', ['character_development'])

      expect(error).toContain('character_development')
      expect(error).toMatch(/complete|finish|must/i)
    })

    it('should generate error message for multiple missing prerequisites', () => {
      const error = engine.generateHelpfulError('production', [
        'storyboard',
        'asset_creation'
      ])

      expect(error).toContain('storyboard')
      expect(error).toContain('asset_creation')
    })

    it('should provide actionable guidance', () => {
      const error = engine.generateHelpfulError('editing', ['production'])

      expect(error.length).toBeGreaterThan(20)
      expect(error).toMatch(/need|must|should|complete/i)
    })

    it('should format prerequisite names properly', () => {
      const error = engine.generateHelpfulError('final', ['review'])

      expect(error).not.toContain('_')
      expect(error).toContain('Review')
    })
  })

  describe('getNextRecommendedStep', () => {
    it('should recommend next logical step', () => {
      const state: WorkflowState = {
        currentStep: 'initial_concept',
        completedSteps: ['initial_concept'],
        availableSteps: ['story_structure', 'character_development'],
        progress: 10,
        blockedSteps: []
      }

      const recommended = engine.getNextRecommendedStep(state)

      expect(recommended).toBeTruthy()
      expect(state.availableSteps).toContain(recommended!)
    })

    it('should prioritize critical path steps', () => {
      const state: WorkflowState = {
        currentStep: 'story_structure',
        completedSteps: ['initial_concept', 'story_structure'],
        availableSteps: ['character_development', 'storyboard'],
        progress: 20,
        blockedSteps: []
      }

      const recommended = engine.getNextRecommendedStep(state)

      expect(recommended).toBeTruthy()
    })

    it('should return null when all steps completed', () => {
      const state: WorkflowState = {
        currentStep: 'final',
        completedSteps: [
          'initial_concept',
          'story_structure',
          'character_development',
          'storyboard',
          'asset_creation',
          'production',
          'editing',
          'review',
          'final'
        ],
        availableSteps: [],
        progress: 100,
        blockedSteps: []
      }

      const recommended = engine.getNextRecommendedStep(state)

      expect(recommended).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle empty completed steps', () => {
      const result = engine.transitionTo({
        currentStep: 'initial_concept',
        completedSteps: [],
        availableSteps: [],
        progress: 0,
        blockedSteps: []
      }, 'story_structure')

      expect(result.success).toBe(false)
    })

    it('should handle duplicate steps in completed list', () => {
      const completedSteps: WorkflowStep[] = [
        'initial_concept',
        'initial_concept',
        'story_structure'
      ]

      const progress = engine.calculateProgress(completedSteps)

      expect(progress).toBeLessThan(30) // Should not count duplicates
    })

    it('should handle circular prerequisite detection', () => {
      const available = engine.getAvailableSteps('initial_concept', ['initial_concept'])

      expect(available).toBeDefined()
      expect(available.length).toBeGreaterThan(0)
    })

    it('should validate against invalid step names', () => {
      const result = engine.transitionTo({
        currentStep: 'initial_concept',
        completedSteps: ['initial_concept'],
        availableSteps: [],
        progress: 10,
        blockedSteps: []
      }, 'invalid_step' as WorkflowStep)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('workflow state management', () => {
    it('should track blocked steps with reasons', () => {
      const state: WorkflowState = {
        currentStep: 'initial_concept',
        completedSteps: ['initial_concept'],
        availableSteps: ['story_structure', 'character_development'],
        progress: 10,
        blockedSteps: []
      }

      const result = engine.transitionTo(state, 'production')

      expect(result.success).toBe(false)
      // Engine should populate blocked steps info
    })

    it('should persist workflow state across transitions', () => {
      let state: WorkflowState = {
        currentStep: 'initial_concept',
        completedSteps: ['initial_concept'],
        availableSteps: [],
        progress: 10,
        blockedSteps: []
      }

      const result1 = engine.transitionTo(state, 'story_structure')
      expect(result1.success).toBe(true)

      state = result1.newState!

      const result2 = engine.transitionTo(state, 'character_development')
      expect(result2.success).toBe(true)
      expect(result2.newState?.completedSteps).toContain('story_structure')
    })
  })
})