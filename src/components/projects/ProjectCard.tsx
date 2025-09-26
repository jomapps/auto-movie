'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type { Project } from '@/payload-types'

interface ProjectCardProps {
  project: Project
  className?: string
}

const GENRE_COLORS = {
  action: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
  comedy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  drama: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  horror: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  'sci-fi': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  thriller: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
  romance: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
  documentary: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
}

const STATUS_COLORS = {
  concept: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  'pre-production': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
  production: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  'post-production': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
}

export function ProjectCard({ project, className = '' }: ProjectCardProps) {
  const progress = project.progress?.overallProgress || 0
  const createdDate = new Date(project.createdAt)

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="p-6">
        {/* Header with title and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="block group"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.title}
              </h3>
            </Link>
          </div>
          
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-3 ${
            STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.concept
          }`}>
            {project.status?.replace('-', ' ') || 'concept'}
          </span>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300">Progress</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-4">
            <span>{project.episodeCount || 0} episodes</span>
            <span>•</span>
            <span>{project.targetAudience || 'family'}</span>
          </div>
          <time dateTime={project.createdAt} title={createdDate.toLocaleDateString()}>
            {formatDistanceToNow(createdDate, { addSuffix: true })}
          </time>
        </div>

        {/* Tags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              GENRE_COLORS[project.genre as keyof typeof GENRE_COLORS] || GENRE_COLORS.drama
            }`}>
              {project.genre || 'drama'}
            </span>
            
            {project.projectSettings?.qualityTier && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">
                {project.projectSettings.qualityTier}
              </span>
            )}
          </div>

          {/* Action menu */}
          <div className="flex items-center space-x-1">
            <Link
              href={`/dashboard/projects/${project.id}`}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="View project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </Link>
            
            <Link
              href={`/dashboard/projects/${project.id}/edit`}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Edit project"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}