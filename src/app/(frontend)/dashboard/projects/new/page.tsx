import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createProject } from '@/actions/create-project'
import { ProjectForm } from '@/components/forms/ProjectForm'
import { ProjectFormErrorBoundary } from '@/components/ui/ErrorBoundary'
// import { showToast } from '@/lib/toast'

export default async function NewProjectPage() {
  const handleCreateProject = async (data: any): Promise<string> => {
    'use server'

    const formData = new FormData()

    // Basic information
    formData.append('title', data.title)
    formData.append('description', data.description || '')
    formData.append('genre', data.genre)
    formData.append('episodeCount', data.episodeCount.toString())
    formData.append('targetAudience', data.targetAudience)
    formData.append('status', data.status)

    // Project settings
    formData.append('aspectRatio', data.projectSettings.aspectRatio)
    formData.append('episodeDuration', data.projectSettings.episodeDuration.toString())
    formData.append('qualityTier', data.projectSettings.qualityTier)

    const result = await createProject(null, formData)

    if (!result.success) {
      throw new Error(result.error || 'Failed to create project')
    }

    // Return the project ID for collaboration broadcasting
    const projectId = result.data?.id
    if (!projectId) {
      throw new Error('Project created but ID not returned')
    }

    // Redirect to the new project page
    if (result.redirectTo) {
      redirect(result.redirectTo)
    }

    return projectId
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <Link
              href="/dashboard/projects"
              className="hover:text-gray-700 dark:hover:text-gray-300"
            >
              Projects
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>New Project</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Create New Project
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Set up your new movie project with all the details and settings.
          </p>
        </div>

        <Link
          href="/dashboard/projects"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Projects
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <ProjectFormErrorBoundary>
          <ProjectForm onSubmit={handleCreateProject} submitLabel="Create Project" />
        </ProjectFormErrorBoundary>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <svg
            className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Getting Started Tips
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc pl-5 space-y-1">
                <li>Choose a descriptive title that captures your project&apos;s essence</li>
                <li>Select the appropriate genre and target audience for better recommendations</li>
                <li>Episode count and duration settings help plan your production timeline</li>
                <li>You can always edit these details later as your project evolves</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
