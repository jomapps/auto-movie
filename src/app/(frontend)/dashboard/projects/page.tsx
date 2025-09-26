import React, { Suspense } from 'react'
import Link from 'next/link'
import { listProjects } from '@/actions/list-projects'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectFilters } from '@/components/projects/ProjectFilters'
import { NoProjectsFound, LoadingProjects } from '@/components/ui/EmptyState'
import type { Project } from '@/payload-types'

interface ProjectsPageProps {
  searchParams: {
    page?: string
    search?: string
    genre?: string
    status?: string
    targetAudience?: string
    sort?: string
    progressMin?: string
    progressMax?: string
    episodeCountMin?: string
    episodeCountMax?: string
  }
}

async function ProjectsList({ searchParams }: { searchParams: ProjectsPageProps['searchParams'] }) {
  const page = parseInt(searchParams.page || '1')
  const limit = 12

  const result = await listProjects({
    page,
    limit,
    sort: searchParams.sort,
    search: searchParams.search,
    genre: searchParams.genre,
    status: searchParams.status,
    targetAudience: searchParams.targetAudience,
    progressMin: searchParams.progressMin ? parseInt(searchParams.progressMin) : undefined,
    progressMax: searchParams.progressMax ? parseInt(searchParams.progressMax) : undefined,
    episodeCountMin: searchParams.episodeCountMin ? parseInt(searchParams.episodeCountMin) : undefined,
    episodeCountMax: searchParams.episodeCountMax ? parseInt(searchParams.episodeCountMax) : undefined
  })

  if (!result.success || !result.data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">Failed to load projects</h3>
        <p className="text-red-700 dark:text-red-300">{result.error || 'An unexpected error occurred.'}</p>
      </div>
    )
  }

  const { docs: projects, totalDocs, totalPages, hasNextPage, hasPrevPage } = result.data
  const hasFilters = Object.entries(searchParams).some(([key, value]) => 
    key !== 'page' && key !== 'sort' && value && value !== ''
  )

  if (projects.length === 0) {
    return <NoProjectsFound hasFilters={hasFilters} />
  }

  return (
    <>
      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project as Project} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalDocs)} of {totalDocs} projects
          </div>
          
          <div className="flex items-center space-x-2">
            {hasPrevPage && (
              <Link
                href={`?${new URLSearchParams({ ...searchParams, page: (page - 1).toString() })}`}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Previous
              </Link>
            )}
            
            <span className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              Page {page} of {totalPages}
            </span>
            
            {hasNextPage && (
              <Link
                href={`?${new URLSearchParams({ ...searchParams, page: (page + 1).toString() })}`}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your movie projects</p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {/* Filters */}
      <ProjectFilters initialFilters={searchParams} />

      {/* Projects List with Loading State */}
      <Suspense fallback={<LoadingProjects />}>
        <ProjectsList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}