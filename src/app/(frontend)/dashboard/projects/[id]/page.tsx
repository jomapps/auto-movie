import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProject } from '@/actions/get-project'
import { ProjectDetails } from '@/components/projects/ProjectDetails'
import { ProjectNotFound } from '@/components/ui/EmptyState'
import type { Project } from '@/payload-types'

interface ProjectDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params
  const result = await getProject(id)

  if (!result.success || !result.data) {
    if (result.error?.includes('not found')) {
      return <ProjectNotFound />
    }
    return notFound()
  }

  const project = result.data

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/dashboard/projects" className="hover:text-gray-700 dark:hover:text-gray-300">
          Projects
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-medium text-gray-900 dark:text-gray-100">{project.title}</span>
      </div>

      {/* Project Details */}
      <ProjectDetails project={project as Project} />

      {/* Additional Actions */}
      <div className="flex items-center justify-center space-x-4 pt-6">
        <Link
          href={`/dashboard/projects/${project.id}/chat`}
          className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Open Chat
        </Link>

        <Link
          href={`/dashboard/projects/${project.id}/edit`}
          className="inline-flex items-center px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit Project
        </Link>
      </div>
    </div>
  )
}
