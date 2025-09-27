'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/utils/cn'

type ProjectStatus = 'concept' | 'pre-production' | 'production' | 'post-production' | 'completed' | 'on-hold'

interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: ProjectStatus
  showIcon?: boolean
  showTransition?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showIcon = true, showTransition = false, size = 'md', className, ...props }, ref) => {
    const statusConfig = {
      concept: {
        label: 'Concept',
        color: 'bg-slate-600 text-slate-200 border-slate-500',
        icon: '💡',
        description: 'Initial idea and planning phase',
      },
      'pre-production': {
        label: 'Pre-Production',
        color: 'bg-blue-600 text-blue-100 border-blue-500',
        icon: '📋',
        description: 'Planning, scripting, and preparation',
      },
      production: {
        label: 'Production',
        color: 'bg-orange-600 text-orange-100 border-orange-500',
        icon: '🎬',
        description: 'Active filming and content creation',
      },
      'post-production': {
        label: 'Post-Production',
        color: 'bg-purple-600 text-purple-100 border-purple-500',
        icon: '✂️',
        description: 'Editing, effects, and final assembly',
      },
      completed: {
        label: 'Completed',
        color: 'bg-green-600 text-green-100 border-green-500',
        icon: '✅',
        description: 'Project finished and delivered',
      },
      'on-hold': {
        label: 'On Hold',
        color: 'bg-red-600 text-red-100 border-red-500',
        icon: '⏸️',
        description: 'Project temporarily paused',
      },
    }

    const config = statusConfig[status]
    
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-2 text-base',
    }

    const iconSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors',
          config.color,
          sizeClasses[size],
          className
        )}
        title={config.description}
        {...props}
      >
        {showIcon && (
          <span className={cn('leading-none', iconSizeClasses[size])} aria-hidden="true">
            {config.icon}
          </span>
        )}
        <span>{config.label}</span>
        {showTransition && (
          <span className="ml-1 opacity-60" aria-label="Status transition indicator">
            →
          </span>
        )}
      </span>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

// Helper function to get next logical status
export const getNextStatus = (currentStatus: ProjectStatus): ProjectStatus | null => {
  const statusFlow: Record<ProjectStatus, ProjectStatus | null> = {
    concept: 'pre-production',
    'pre-production': 'production',
    production: 'post-production',
    'post-production': 'completed',
    completed: null,
    'on-hold': null, // On-hold can transition back to any previous status manually
  }
  
  return statusFlow[currentStatus]
}

// Helper function to get all possible next statuses (workflow-aware)
export const getPossibleNextStatuses = (currentStatus: ProjectStatus): ProjectStatus[] => {
  const statusOrder: ProjectStatus[] = ['concept', 'pre-production', 'production', 'post-production', 'completed']
  const currentIndex = statusOrder.indexOf(currentStatus)

  const possibleStatuses: ProjectStatus[] = []

  // Always include current status (to allow staying in same status)
  possibleStatuses.push(currentStatus)

  // Include next status in workflow if available
  const nextStatus = getNextStatus(currentStatus)
  if (nextStatus) {
    possibleStatuses.push(nextStatus)
  }

  // Always allow moving to 'on-hold'
  if (currentStatus !== 'on-hold') {
    possibleStatuses.push('on-hold')
  }

  // Allow one step backwards for corrections (except from concept)
  if (currentIndex > 0 && currentStatus !== 'on-hold') {
    const previousStatus = statusOrder[currentIndex - 1]
    if (!possibleStatuses.includes(previousStatus)) {
      possibleStatuses.push(previousStatus)
    }
  }

  // From 'on-hold', allow returning to any normal status
  if (currentStatus === 'on-hold') {
    return statusOrder
  }

  return possibleStatuses
}

// Helper function to validate status transition
export const isValidStatusTransition = (from: ProjectStatus, to: ProjectStatus): boolean => {
  // Same status is always valid
  if (from === to) return true

  // Allow any transition to 'on-hold'
  if (to === 'on-hold') return true

  // Allow any transition from 'on-hold' (resuming project)
  if (from === 'on-hold') return true

  const statusOrder: ProjectStatus[] = ['concept', 'pre-production', 'production', 'post-production', 'completed']
  const fromIndex = statusOrder.indexOf(from)
  const toIndex = statusOrder.indexOf(to)

  // Both statuses must be in the normal workflow
  if (fromIndex === -1 || toIndex === -1) return false

  // Allow next step forward
  if (toIndex === fromIndex + 1) return true

  // Allow one step backward for corrections
  if (toIndex === fromIndex - 1) return true

  // Disallow skipping multiple steps
  return false
}

export { StatusBadge }
export type { ProjectStatus }
