/**
 * Workflow Configuration
 * Defines all workflow steps, prerequisites, and validation rules for the 7-phase production pipeline
 */

import type { WorkflowStepDefinition, WorkflowPhase } from '../types/workflow'

/**
 * Complete workflow step definitions for movie production pipeline
 */
export const WORKFLOW_STEPS: Record<WorkflowPhase, WorkflowStepDefinition> = {
  initial_concept: {
    id: 'initial_concept',
    name: 'Initial Concept',
    description: 'Define the basic project concept and goals',
    prerequisites: [],
    requiredData: [
      {
        field: 'title',
        type: 'exists',
        errorMessage: 'Project title is required',
      },
    ],
    optionalData: ['description'],
    estimatedDuration: '5-10 minutes',
    order: 0,
  },

  story_development: {
    id: 'story_development',
    name: 'Story Development',
    description: 'Develop the narrative structure, plot, and story arcs',
    prerequisites: ['initial_concept'],
    requiredData: [
      {
        field: 'genre',
        type: 'exists',
        errorMessage: 'Genre must be selected to develop the story',
      },
      {
        field: 'targetAudience',
        type: 'exists',
        errorMessage: 'Target audience must be defined for appropriate story development',
      },
    ],
    optionalData: ['episodeCount', 'description'],
    estimatedDuration: '15-30 minutes',
    order: 1,
  },

  character_creation: {
    id: 'character_creation',
    name: 'Character Creation',
    description: 'Design and develop main characters and their personalities',
    prerequisites: ['story_development'],
    requiredData: [
      {
        field: 'characters',
        type: 'count',
        condition: { min: 2 },
        errorMessage: 'At least 2 characters are required to proceed with production',
      },
    ],
    optionalData: ['characterRelationships', 'characterBackstories'],
    estimatedDuration: '20-40 minutes',
    order: 2,
  },

  visual_design: {
    id: 'visual_design',
    name: 'Visual Design',
    description: 'Define visual style, color palette, and aesthetic direction',
    prerequisites: ['character_creation'],
    requiredData: [
      {
        field: 'styleReferences',
        type: 'count',
        condition: { min: 1 },
        errorMessage: 'At least 1 style reference is required to establish visual direction',
      },
    ],
    optionalData: ['colorPalette', 'visualThemes'],
    estimatedDuration: '15-25 minutes',
    order: 3,
  },

  audio_design: {
    id: 'audio_design',
    name: 'Audio Design',
    description: 'Plan voice acting, sound effects, and music direction',
    prerequisites: ['character_creation'],
    requiredData: [
      {
        field: 'characters',
        type: 'count',
        condition: { min: 1 },
        errorMessage: 'Characters must exist before designing audio',
      },
    ],
    optionalData: ['voiceActors', 'soundEffects', 'musicStyle'],
    estimatedDuration: '10-20 minutes',
    order: 4,
  },

  scene_production: {
    id: 'scene_production',
    name: 'Scene Production',
    description: 'Create individual scenes with dialogue, visuals, and audio',
    prerequisites: ['character_creation', 'visual_design'],
    requiredData: [
      {
        field: 'scenes',
        type: 'count',
        condition: { min: 1 },
        errorMessage: 'At least 1 scene must be created before moving to post-production',
      },
      {
        field: 'characters',
        type: 'count',
        condition: { min: 2 },
        errorMessage: 'Characters must be fully defined before scene production',
      },
      {
        field: 'styleReferences',
        type: 'count',
        condition: { min: 1 },
        errorMessage: 'Visual style must be established before scene production',
      },
    ],
    optionalData: ['sceneNotes', 'storyboards'],
    estimatedDuration: '30-60 minutes per scene',
    order: 5,
  },

  post_production: {
    id: 'post_production',
    name: 'Post Production',
    description: 'Edit, refine, and enhance completed scenes',
    prerequisites: ['scene_production'],
    requiredData: [
      {
        field: 'videoSegments',
        type: 'count',
        condition: { min: 1 },
        errorMessage: 'At least 1 video segment must be completed before post-production',
      },
      {
        field: 'scenes',
        type: 'count',
        condition: { min: 1 },
        errorMessage: 'Scenes must be produced before post-production',
      },
    ],
    optionalData: ['transitions', 'effects', 'colorGrading'],
    estimatedDuration: '20-40 minutes',
    order: 6,
  },

  final_assembly: {
    id: 'final_assembly',
    name: 'Final Assembly',
    description: 'Compile all elements into the final deliverable product',
    prerequisites: ['post_production'],
    requiredData: [
      {
        field: 'videoSegments',
        type: 'count',
        condition: { min: 1 },
        errorMessage: 'Post-production must be complete before final assembly',
      },
      {
        field: 'progress.overallProgress',
        type: 'value',
        condition: { min: 80 },
        errorMessage: 'Project must be at least 80% complete before final assembly',
      },
    ],
    optionalData: ['finalNotes', 'exportSettings'],
    estimatedDuration: '10-20 minutes',
    order: 7,
  },
}

/**
 * Get ordered list of all workflow phases
 */
export const WORKFLOW_PHASE_ORDER: WorkflowPhase[] = [
  'initial_concept',
  'story_development',
  'character_creation',
  'visual_design',
  'audio_design',
  'scene_production',
  'post_production',
  'final_assembly',
]

/**
 * Get step definition by phase ID
 */
export function getStepDefinition(phase: WorkflowPhase): WorkflowStepDefinition {
  return WORKFLOW_STEPS[phase]
}

/**
 * Get all prerequisites for a given phase (includes transitive dependencies)
 */
export function getAllPrerequisites(phase: WorkflowPhase): WorkflowPhase[] {
  const step = WORKFLOW_STEPS[phase]
  const prerequisites = new Set<WorkflowPhase>()

  function addPrerequisites(p: WorkflowPhase) {
    const stepDef = WORKFLOW_STEPS[p]
    stepDef.prerequisites.forEach((prereq) => {
      if (!prerequisites.has(prereq)) {
        prerequisites.add(prereq)
        addPrerequisites(prereq)
      }
    })
  }

  step.prerequisites.forEach((prereq) => {
    prerequisites.add(prereq)
    addPrerequisites(prereq)
  })

  return Array.from(prerequisites).sort(
    (a, b) => WORKFLOW_STEPS[a].order - WORKFLOW_STEPS[b].order
  )
}

/**
 * Get all phases that directly depend on the given phase
 */
export function getDependentPhases(phase: WorkflowPhase): WorkflowPhase[] {
  return WORKFLOW_PHASE_ORDER.filter((p) =>
    WORKFLOW_STEPS[p].prerequisites.includes(phase)
  )
}

/**
 * Calculate progress percentage for a set of completed steps
 */
export function calculateProgress(completedSteps: WorkflowPhase[]): number {
  if (completedSteps.length === 0) return 0
  const totalSteps = WORKFLOW_PHASE_ORDER.length
  const completedCount = completedSteps.length
  return Math.round((completedCount / totalSteps) * 100)
}

/**
 * Get the default starting phase
 */
export const DEFAULT_START_PHASE: WorkflowPhase = 'initial_concept'

/**
 * Get the final phase
 */
export const FINAL_PHASE: WorkflowPhase = 'final_assembly'