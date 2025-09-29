'use client'

import React, { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema } from '@/lib/validations/project-schema'
import { showToast } from '@/lib/toast'
import { FormField, FormInput, FormSelect, FormTextarea, FormNumberInput, FormProgressInput, ConditionalFormSection, projectFormConditions } from './form-fields'
import { ErrorDisplay, StatusBadge, ChangeNotification } from '../ui'
import { getPossibleNextStatuses, isValidStatusTransition, getNextStatus } from '../ui/StatusBadge'
import { useCollaboration } from '@/hooks/useCollaboration'
import { useRetryState } from '../../hooks/useRetryState'
import { createProjectError } from '../../lib/utils/error-handling'
import type { z } from 'zod'
import type { Project } from '@/payload-types'

type ProjectFormData = z.input<typeof projectSchema>

interface ProjectFormProps {
  initialData?: Partial<Project>
  onSubmit: (data: ProjectFormData) => Promise<string | void>
  submitLabel?: string
  isSubmitting?: boolean
  className?: string
  projectId?: string
  enableCollaboration?: boolean
}

const GENRE_OPTIONS = [
  { value: 'action', label: 'Action' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'drama', label: 'Drama' },
  { value: 'horror', label: 'Horror' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'romance', label: 'Romance' },
  { value: 'documentary', label: 'Documentary' },
]

const TARGET_AUDIENCE_OPTIONS = [
  { value: 'family', label: 'Family' },
  { value: 'teen', label: 'Teen' },
  { value: 'adult', label: 'Adult' },
  { value: 'children', label: 'Children' },
]

const STATUS_OPTIONS = [
  { value: 'concept', label: 'Concept' },
  { value: 'pre-production', label: 'Pre-Production' },
  { value: 'production', label: 'Production' },
  { value: 'post-production', label: 'Post-Production' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
]

const CURRENT_PHASE_OPTIONS = [
  { value: 'story_development', label: 'Story Development' },
  { value: 'character_creation', label: 'Character Creation' },
  { value: 'visual_design', label: 'Visual Design' },
  { value: 'audio_design', label: 'Audio Design' },
  { value: 'scene_production', label: 'Scene Production' },
  { value: 'post_production', label: 'Post Production' },
  { value: 'final_assembly', label: 'Final Assembly' },
]

const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '21:9', label: '21:9 (Ultra-wide)' },
  { value: '4:3', label: '4:3 (Standard)' },
]

const QUALITY_TIER_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
]

export function ProjectForm({
  initialData,
  onSubmit,
  submitLabel = 'Create Project',
  isSubmitting: externalIsSubmitting = false,
  className = '',
  projectId,
  enableCollaboration = true,
}: ProjectFormProps) {
  const [isPending, startTransition] = useTransition()
  const isSubmitting = externalIsSubmitting || isPending

  // Initialize collaboration features
  const collaboration = useCollaboration(enableCollaboration ? projectId : undefined)

  // Initialize retry state management
  const {
    error: retryError,
    isLoading: isRetrying,
    retryCount,
    maxRetries,
    setError,
    setLoading,
    retry,
    reset: resetRetry,
    canRetry,
  } = useRetryState({
    maxRetries: 3,
    onRetrySuccess: () => {
      showToast.success('Project saved successfully after retry!')
    },
    onRetryFailure: (error) => {
      console.error('Retry failed:', error)
    },
    onMaxRetriesReached: (error) => {
      showToast.error('Maximum retry attempts reached. Please try again later.')
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onBlur', // Validate on blur for immediate feedback
    reValidateMode: 'onChange', // Re-validate on change after initial validation
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      genre: (initialData?.genre as any) || '',
      status: (initialData?.status as any) || 'concept',
      episodeCount: initialData?.episodeCount || 10,
      targetAudience: (initialData?.targetAudience as any) || 'family',
      progress: {
        currentPhase: (initialData?.progress?.currentPhase as any) || 'story_development',
        overallProgress: initialData?.progress?.overallProgress || 0,
        completedSteps: Array.isArray(initialData?.progress?.completedSteps) ? (initialData.progress.completedSteps as string[]) : [],
      },
      projectSettings: {
        aspectRatio: initialData?.projectSettings?.aspectRatio || '16:9',
        episodeDuration: initialData?.projectSettings?.episodeDuration || 22,
        qualityTier: initialData?.projectSettings?.qualityTier || 'standard',
      },
    },
  })

  // Watch description for character count and collaboration
  const description = watch('description')
  const currentStatus = watch('status')
  const currentProgress = watch('progress.overallProgress')

  // Get workflow-aware status options
  const getStatusOptions = () => {
    if (!initialData || !currentStatus) {
      return STATUS_OPTIONS // Show all options for new projects
    }

    // For existing projects, show only valid transitions
    const possibleStatuses = getPossibleNextStatuses(currentStatus as any)

    return STATUS_OPTIONS.filter(opt => possibleStatuses.includes(opt.value as any))
  }

  // Handle status change with validation
  const handleStatusChange = (newStatus: string) => {
    const oldStatus = currentStatus as any

    if (initialData && !isValidStatusTransition(oldStatus, newStatus as any)) {
      showToast.error(`Invalid status transition from ${oldStatus} to ${newStatus}`)
      return
    }

    setValue('status', newStatus as any)
  }

  // Move to next status in workflow
  const moveToNextStatus = () => {
    if (!currentStatus) return

    const nextStatus = getNextStatus(currentStatus as any)
    if (nextStatus) {
      setValue('status', nextStatus)
      showToast.success(`Status updated to ${nextStatus}`)
    }
  }

  const handleFormSubmit = (data: ProjectFormData) => {
    startTransition(async () => {
      try {
        // Clear any previous errors
        setError(null)
        setLoading(true)

        const result = await onSubmit(data)

        // Broadcast changes to collaborators
        if (enableCollaboration) {
          if (initialData && projectId) {
            // For updates, broadcast specific changes
            if (initialData.status !== data.status) {
              collaboration.broadcastChange({
                type: 'status',
                oldValue: initialData.status,
                newValue: data.status,
                projectId,
              })
            }
            if (initialData.progress?.overallProgress !== data.progress?.overallProgress) {
              collaboration.broadcastChange({
                type: 'progress',
                oldValue: initialData.progress?.overallProgress,
                newValue: data.progress?.overallProgress,
                projectId,
              })
            }
          } else if (!initialData && result) {
            // For new projects, broadcast creation with the returned project ID
            const newProjectId = typeof result === 'string' ? result : undefined
            if (newProjectId) {
              // Broadcast the create event with the actual project ID
              collaboration.broadcastChangeWithId(newProjectId, {
                type: 'create',
              })
            }
          }
        }

        showToast.success('Project saved successfully!')
        if (!initialData) {
          reset() // Only reset for new projects, not edits
        }
        resetRetry() // Clear retry state on success
      } catch (error) {
        console.error('Form submission error:', error)

        // Create a ProjectError for proper error handling
        let projectError;
        if (error instanceof Error) {
          // Determine error category based on error message/type
          if (error.message.includes('fetch') || error.message.includes('network')) {
            projectError = createProjectError('NETWORK_ERROR', error.message, { originalError: error });
          } else if (error.message.includes('500') || error.message.includes('server')) {
            projectError = createProjectError('SERVER_ERROR', error.message, { originalError: error });
          } else if (error.message.includes('validation')) {
            projectError = createProjectError('VALIDATION_ERROR', error.message, { originalError: error });
          } else {
            projectError = createProjectError('FORM_SUBMISSION_ERROR', error.message, { originalError: error });
          }
        } else {
          projectError = createProjectError('FORM_SUBMISSION_ERROR', 'An unexpected error occurred', { originalError: error });
        }

        setError(projectError)

        // Show appropriate toast based on error type
        if (projectError.retryable) {
          showToast.error('Failed to save project. You can retry the operation.');
        } else {
          showToast.error('Failed to save project. Please check your input and try again.');
        }
      } finally {
        setLoading(false)
      }
    })
  }

  const handleRetry = async () => {
    const formData = watch() // Get current form data
    await retry(async () => {
      await onSubmit(formData)
      if (!initialData) {
        reset() // Only reset for new projects, not edits
      }
    })
  }

  const handleReset = () => {
    reset()
    resetRetry() // Also clear retry state
    showToast.success('Form cleared')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Collaboration Features */}
      {enableCollaboration && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {collaboration.hasActiveCollaborators && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-slate-400">
                  {collaboration.collaborators.length} collaborator{collaboration.collaborators.length !== 1 ? 's' : ''} active
                </span>
              </div>
            )}
            {currentStatus && (
              <StatusBadge status={currentStatus as any} size="sm" />
            )}
          </div>

          {collaboration.recentChanges.length > 0 && (
            <ChangeNotification
              changes={collaboration.recentChanges}
              onDismiss={(changeId) => {/* Handle dismiss */}}
              onDismissAll={collaboration.clearRecentChanges}
              maxVisible={3}
              className="max-w-sm"
            />
          )}
        </div>
      )}

      {/* Error Display with Retry */}
      {retryError && (
        <ErrorDisplay
          error={retryError}
          onRetry={handleRetry}
          isLoading={isRetrying}
          retryCount={retryCount}
          maxRetries={maxRetries}
          showRetryButton={canRetry}
        />
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
      {/* Basic Information */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Basic Information
        </h3>

        <FormField label="Project Title" name="title" required error={errors.title?.message}>
          <FormInput
            {...register('title')}
            placeholder="Enter your project title"
            autoComplete="off"
            disabled={isSubmitting}
            onFocus={() => collaboration.broadcastFieldEdit('title')}
            onBlur={() => collaboration.broadcastFieldEditEnd('title')}
          />
        </FormField>

        <FormField
          label="Description"
          name="description"
          error={errors.description?.message}
          description="Describe your project (optional)"
        >
          <FormTextarea
            {...register('description')}
            placeholder="Describe your project..."
            rows={4}
            disabled={isSubmitting}
            showCharacterCount
            maxLength={1000}
            value={description}
          />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Genre" name="genre" required error={errors.genre?.message}>
            <FormSelect
              {...register('genre')}
              options={GENRE_OPTIONS}
              placeholder="Select genre"
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Episode Count"
            name="episodeCount"
            error={errors.episodeCount?.message}
            description="Number of episodes (1-50)"
          >
            <FormNumberInput
              {...register('episodeCount', { valueAsNumber: true })}
              min={1}
              max={50}
              disabled={isSubmitting}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Target Audience"
            name="targetAudience"
            error={errors.targetAudience?.message}
          >
            <FormSelect
              {...register('targetAudience')}
              options={TARGET_AUDIENCE_OPTIONS}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Project Status"
            name="status"
            required
            error={errors.status?.message}
            description="Current phase of the project"
          >
            <div className="flex gap-2">
              <div className="flex-1">
                <FormSelect
                  {...register('status', {
                    onChange: (e) => handleStatusChange(e.target.value)
                  })}
                  options={getStatusOptions()}
                  disabled={isSubmitting}
                  onFocus={() => collaboration.broadcastFieldEdit('status')}
                  onBlur={() => collaboration.broadcastFieldEditEnd('status')}
                />
              </div>
              {initialData && currentStatus && getNextStatus(currentStatus as any) && (
                <button
                  type="button"
                  onClick={moveToNextStatus}
                  disabled={isSubmitting}
                  className="px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  title={`Move to ${getNextStatus(currentStatus as any)}`}
                >
                  <span>Next</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </FormField>
        </div>
      </div>

      {/* Progress Tracking */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Progress Tracking
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Current Phase"
            name="progress.currentPhase"
            error={errors.progress?.currentPhase?.message}
            description="What phase is currently being worked on"
          >
            <FormSelect
              {...register('progress.currentPhase')}
              options={CURRENT_PHASE_OPTIONS}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Overall Progress"
            name="progress.overallProgress"
            error={errors.progress?.overallProgress?.message}
            description="Overall completion percentage"
          >
            <FormProgressInput
              {...register('progress.overallProgress', { valueAsNumber: true })}
              disabled={isSubmitting}
              size="md"
              onFocus={() => collaboration.broadcastFieldEdit('progress.overallProgress')}
              onBlur={() => collaboration.broadcastFieldEditEnd('progress.overallProgress')}
            />
          </FormField>
        </div>

        {/* Conditional Advanced Progress Settings */}
        <ConditionalFormSection
          control={control}
          {...projectFormConditions.advancedProgressSettings}
        >
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              Advanced Progress Settings
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Additional progress tracking options are available when your project reaches 50% completion.
            </p>
          </div>
        </ConditionalFormSection>
      </div>

      {/* Project Settings */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Technical Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            label="Aspect Ratio"
            name="projectSettings.aspectRatio"
            error={errors.projectSettings?.aspectRatio?.message}
          >
            <FormSelect
              {...register('projectSettings.aspectRatio')}
              options={ASPECT_RATIO_OPTIONS}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Episode Duration"
            name="projectSettings.episodeDuration"
            error={errors.projectSettings?.episodeDuration?.message}
            description="Minutes per episode"
          >
            <FormNumberInput
              {...register('projectSettings.episodeDuration', { valueAsNumber: true })}
              min={5}
              max={120}
              disabled={isSubmitting}
            />
          </FormField>

          <FormField
            label="Quality Tier"
            name="projectSettings.qualityTier"
            error={errors.projectSettings?.qualityTier?.message}
          >
            <FormSelect
              {...register('projectSettings.qualityTier')}
              options={QUALITY_TIER_OPTIONS}
              disabled={isSubmitting}
            />
          </FormField>
        </div>
      </div>

      {/* Conditional Production Settings */}
      <ConditionalFormSection
        control={control}
        {...projectFormConditions.productionSettings}
      >
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Production Settings
          </h3>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-md font-medium text-blue-900 dark:text-blue-100 mb-2">
              Production Phase Active
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your project is now in the production phase. Additional production-specific settings and tools are available.
            </p>
          </div>
        </div>
      </ConditionalFormSection>

      {/* Conditional Post-Production Settings */}
      <ConditionalFormSection
        control={control}
        {...projectFormConditions.postProductionSettings}
      >
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Post-Production Settings
          </h3>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h4 className="text-md font-medium text-purple-900 dark:text-purple-100 mb-2">
              Post-Production Phase
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Your project is in post-production or completed. Final editing and assembly tools are available.
            </p>
          </div>
        </div>
      </ConditionalFormSection>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>

        <button
          type="submit"
          disabled={isSubmitting || isRetrying || !isValid}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {(isSubmitting || isRetrying) && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {isRetrying ? 'Retrying...' : isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>

      {/* Submission blocked warning */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Please correct the errors below
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Form submission is blocked until all validation errors are resolved.
              </p>
            </div>
          </div>
        </div>
      )}
      </form>
    </div>
  )
}
