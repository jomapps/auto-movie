'use client'

import React from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  className = ''
}: EmptyStateProps) {
  const defaultIcon = (
    <svg 
      className="w-12 h-12 text-gray-400 dark:text-gray-500" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1} 
        d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v14h12V6H6zm3-2V3h6v1H9zm0 4a1 1 0 112 0v8a1 1 0 11-2 0V8zm4 0a1 1 0 112 0v8a1 1 0 11-2 0V8z" 
      />
    </svg>
  )

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex justify-center mb-4">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
        {description}
      </p>
      
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}

// Specific empty states for common scenarios
export function NoProjectsFound({ hasFilters = false }: { hasFilters?: boolean }) {
  const projectIcon = (
    <svg 
      className="w-12 h-12 text-gray-400 dark:text-gray-500" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1} 
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
      />
    </svg>
  )

  if (hasFilters) {
    return (
      <EmptyState
        title="No projects match your filters"
        description="Try adjusting your search criteria or clear the filters to see all projects."
        icon={projectIcon}
      />
    )
  }

  return (
    <EmptyState
      title="No projects yet"
      description="Get started by creating your first movie project. You can add details, track progress, and manage all aspects of your production."
      actionLabel="Create Your First Project"
      actionHref="/dashboard/projects/new"
      icon={projectIcon}
    />
  )
}

export function ProjectNotFound() {
  const notFoundIcon = (
    <svg 
      className="w-12 h-12 text-gray-400 dark:text-gray-500" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1} 
        d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
      />
    </svg>
  )

  return (
    <EmptyState
      title="Project not found"
      description="The project you're looking for doesn't exist or has been removed. It may have been deleted or you may not have access to it."
      actionLabel="Back to Projects"
      actionHref="/dashboard/projects"
      icon={notFoundIcon}
    />
  )
}

export function LoadingProjects() {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
    </div>
  )
}