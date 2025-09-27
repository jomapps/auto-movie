'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useWatch, Control } from 'react-hook-form'
import { cn } from '@/utils/cn'

interface ConditionalFormSectionProps {
  condition: (watchedValues: any) => boolean
  watchFields: string[]
  children: React.ReactNode
  control: Control<any>
  className?: string
  animationDuration?: number
  fallback?: React.ReactNode
}

export function ConditionalFormSection({
  condition,
  watchFields,
  children,
  control,
  className,
  animationDuration = 300,
  fallback,
}: ConditionalFormSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  
  // Watch the specified fields
  const watchedValues = useWatch({
    control,
    name: watchFields,
  })

  // Create an object with field names as keys for easier condition checking
  // Memoized to prevent unnecessary re-renders and effects
  const watchedObject = useMemo(() => {
    return watchFields.reduce((acc, field, index) => {
      acc[field] = Array.isArray(watchedValues) ? watchedValues[index] : watchedValues
      return acc
    }, {} as Record<string, any>)
  }, [watchFields, watchedValues])

  // Check condition whenever watched values change
  useEffect(() => {
    const shouldShow = condition(watchedObject)
    
    if (shouldShow && !isVisible) {
      // Show: render first, then animate in
      setShouldRender(true)
      // Small delay to ensure DOM is updated before animation
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else if (!shouldShow && isVisible) {
      // Hide: animate out first, then stop rendering
      setIsVisible(false)
      const timer = setTimeout(() => setShouldRender(false), animationDuration)
      return () => clearTimeout(timer)
    }
  }, [watchedObject, condition, isVisible, animationDuration])

  // Initial render check
  useEffect(() => {
    const shouldShow = condition(watchedObject)
    if (shouldShow) {
      setShouldRender(true)
      setIsVisible(true)
    }
  }, []) // Only run on mount

  if (!shouldRender) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <div
      className={cn(
        'transition-all ease-in-out overflow-hidden',
        isVisible 
          ? 'opacity-100 max-h-screen transform translate-y-0' 
          : 'opacity-0 max-h-0 transform -translate-y-2',
        className
      )}
      style={{
        transitionDuration: `${animationDuration}ms`,
      }}
      role="region"
      aria-hidden={!isVisible}
    >
      <div className={cn(
        'transition-all ease-in-out',
        isVisible ? 'py-0' : 'py-0'
      )}>
        {children}
      </div>
    </div>
  )
}

// Helper hook for common condition patterns
export function useConditionalDisplay(control: Control<any>) {
  return {
    // Show when field equals specific value
    whenEquals: (field: string, value: any) => ({
      condition: (values: any) => values[field] === value,
      watchFields: [field],
    }),

    // Show when field is one of multiple values
    whenIn: (field: string, values: any[]) => ({
      condition: (watchedValues: any) => values.includes(watchedValues[field]),
      watchFields: [field],
    }),

    // Show when field is not empty
    whenNotEmpty: (field: string) => ({
      condition: (values: any) => {
        const value = values[field]
        return value !== undefined && value !== null && value !== ''
      },
      watchFields: [field],
    }),

    // Show when multiple fields meet conditions
    whenMultiple: (conditions: Array<{ field: string; condition: (value: any) => boolean }>) => ({
      condition: (values: any) => conditions.every(({ field, condition }) => condition(values[field])),
      watchFields: conditions.map(c => c.field),
    }),

    // Show when field value is greater than threshold
    whenGreaterThan: (field: string, threshold: number) => ({
      condition: (values: any) => Number(values[field]) > threshold,
      watchFields: [field],
    }),

    // Show when field value is less than threshold
    whenLessThan: (field: string, threshold: number) => ({
      condition: (values: any) => Number(values[field]) < threshold,
      watchFields: [field],
    }),

    // Show when field value is within range
    whenInRange: (field: string, min: number, max: number) => ({
      condition: (values: any) => {
        const value = Number(values[field])
        return value >= min && value <= max
      },
      watchFields: [field],
    }),
  }
}

// Preset conditions for common project form scenarios
export const projectFormConditions = {
  // Show production settings when status is 'production'
  productionSettings: {
    condition: (values: any) => values.status === 'production',
    watchFields: ['status'],
  },

  // Show post-production settings when status is 'post-production' or 'completed'
  postProductionSettings: {
    condition: (values: any) => ['post-production', 'completed'].includes(values.status),
    watchFields: ['status'],
  },

  // Show advanced progress settings when overall progress > 50%
  advancedProgressSettings: {
    condition: (values: any) => Number(values['progress.overallProgress']) > 50,
    watchFields: ['progress.overallProgress'],
  },

  // Show completion settings when progress is 100%
  completionSettings: {
    condition: (values: any) => Number(values['progress.overallProgress']) === 100,
    watchFields: ['progress.overallProgress'],
  },

  // Show episode settings when episode count > 1
  episodeSettings: {
    condition: (values: any) => Number(values.episodeCount) > 1,
    watchFields: ['episodeCount'],
  },

  // Show quality settings when not in concept phase
  qualitySettings: {
    condition: (values: any) => values.status !== 'concept',
    watchFields: ['status'],
  },
}
