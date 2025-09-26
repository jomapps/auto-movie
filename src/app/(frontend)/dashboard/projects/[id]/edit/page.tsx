import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProject } from '@/actions/get-project'
import { updateProject } from '@/actions/update-project'
import { ProjectForm } from '@/components/forms/ProjectForm'
import { ProjectNotFound } from '@/components/ui/EmptyState'
import { ProjectFormErrorBoundary } from '@/components/ui/ErrorBoundary'
import type { Project } from '@/payload-types'

interface EditProjectPageProps {
  params: {
    id: string
  }
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const result = await getProject(params.id)

  if (!result.success || !result.data) {
    if (result.error?.includes('not found')) {
      return <ProjectNotFound />
    }
    return notFound()
  }

  const project = result.data

  const handleUpdateProject = async (data: any) => {
    'use server'
    
    const formData = new FormData()
    
    // Basic information
    if (data.title) formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.genre) formData.append('genre', data.genre)
    if (data.episodeCount) formData.append('episodeCount', data.episodeCount.toString())
    if (data.targetAudience) formData.append('targetAudience', data.targetAudience)
    if (data.status) formData.append('status', data.status)
    
    // Project settings
    if (data.projectSettings) {
      if (data.projectSettings.aspectRatio) formData.append('aspectRatio', data.projectSettings.aspectRatio)
      if (data.projectSettings.episodeDuration) formData.append('episodeDuration', data.projectSettings.episodeDuration.toString())
      if (data.projectSettings.qualityTier) formData.append('qualityTier', data.projectSettings.qualityTier)
    }

    // Progress (if updated)
    if (data.progress) {
      if (data.progress.currentPhase) formData.append('currentPhase', data.progress.currentPhase)
      if (data.progress.overallProgress !== undefined) formData.append('overallProgress', data.progress.overallProgress.toString())
    }

    const updateResult = await updateProject(params.id, null, formData)
    
    if (!updateResult.success) {
      throw new Error(updateResult.error || 'Failed to update project')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link href="/dashboard/projects" className="hover:text-gray-700 dark:hover:text-gray-300">
              Projects
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/dashboard/projects/${params.id}`} className="hover:text-gray-700 dark:hover:text-gray-300">
              {project.title}
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Edit</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Edit Project</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Update your project details and settings.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href={`/dashboard/projects/${params.id}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Project
          </Link>
        </div>
      </div>

      {/* Current Project Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Editing: {project.title}
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <p>Current status: <span className="font-medium">{project.status || 'concept'}</span></p>
              <p>Progress: <span className="font-medium">{project.progress?.overallProgress || 0}%</span></p>
              <p>Last updated: <span className="font-medium">{new Date(project.updatedAt).toLocaleDateString()}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <ProjectFormErrorBoundary>
          <ProjectForm 
            initialData={project as Project}
            onSubmit={handleUpdateProject}
            submitLabel="Update Project"
          />
        </ProjectFormErrorBoundary>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
        <div className="flex">
          <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Editing Tips
            </h3>
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <ul className="list-disc pl-5 space-y-1">
                <li>Changes are saved immediately after successful validation</li>
                <li>Updating the status or progress will help track your project's development</li>
                <li>Technical settings affect how AI assists with content generation</li>
                <li>All team members can see these changes in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}