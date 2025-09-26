'use client'

import React, { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema } from '@/lib/validations/project-schema'
import { showToast } from '@/lib/toast'
import { FormField, FormInput, FormSelect, FormTextarea, FormNumberInput } from './form-fields'
import type { z } from 'zod'
import type { Project } from '@/payload-types'

type ProjectFormData = z.input<typeof projectSchema>

interface ProjectFormProps {
  initialData?: Partial<Project>
  onSubmit: (data: ProjectFormData) => Promise<void>
  submitLabel?: string
  isSubmitting?: boolean
  className?: string
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

const ASPECT_RATIO_OPTIONS = [
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '21:9', label: '21:9 (Ultra-wide)' },
  { value: '4:3', label: '4:3 (Standard)' },
  { value: '1:1', label: '1:1 (Square)' },
]

const QUALITY_TIER_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
  { value: 'professional', label: 'Professional' },
]

export function ProjectForm({
  initialData,
  onSubmit,
  submitLabel = 'Create Project',
  isSubmitting: externalIsSubmitting = false,
  className = '',
}: ProjectFormProps) {
  const [isPending, startTransition] = useTransition()
  const isSubmitting = externalIsSubmitting || isPending

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onBlur', // Validate on blur for immediate feedback
    reValidateMode: 'onChange', // Re-validate on change after initial validation
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      genre: (initialData?.genre as any) || '',
      episodeCount: initialData?.episodeCount || 10,
      targetAudience: (initialData?.targetAudience as any) || 'family',
      projectSettings: {
        aspectRatio: initialData?.projectSettings?.aspectRatio || '16:9',
        episodeDuration: initialData?.projectSettings?.episodeDuration || 22,
        qualityTier: initialData?.projectSettings?.qualityTier || 'standard',
      },
    },
  })

  // Watch description for character count
  const description = watch('description')

  const handleFormSubmit = (data: ProjectFormData) => {
    startTransition(async () => {
      try {
        await onSubmit(data)
        showToast.success('Project saved successfully!')
        if (!initialData) {
          reset() // Only reset for new projects, not edits
        }
      } catch (error) {
        console.error('Form submission error:', error)
        showToast.error('Failed to save project. Please try again.')
      }
    })
  }

  const handleReset = () => {
    reset()
    showToast.success('Form cleared')
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className={`space-y-6 ${className}`} noValidate>
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
        </div>
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
              min={1}
              max={180}
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
          disabled={isSubmitting || !isValid}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && (
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
          {isSubmitting ? 'Saving...' : submitLabel}
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
  )
}
