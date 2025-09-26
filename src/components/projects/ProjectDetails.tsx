'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import type { Project } from '@/payload-types'

interface ProjectDetailsProps {
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

export function ProjectDetails({ project, className = '' }: ProjectDetailsProps) {
  const progress = project.progress?.overallProgress || 0
  const createdDate = new Date(project.createdAt)
  const updatedDate = new Date(project.updatedAt)

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {project.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3 ml-6">
            <Link
              href={`/dashboard/projects/${project.id}/edit`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Project
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Status and Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                STATUS_COLORS[project.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.concept
              }`}>
                {project.status?.replace('-', ' ') || 'concept'}
              </span>
              
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                GENRE_COLORS[project.genre as keyof typeof GENRE_COLORS] || GENRE_COLORS.drama
              }`}>
                {project.genre || 'drama'}
              </span>
            </div>
            
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {progress}% Complete
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          
          {project.progress?.currentPhase && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Current phase: <span className="font-medium">{project.progress.currentPhase.replace('_', ' ')}</span>
            </p>
          )}
        </div>

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Basic Information</h3>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Episode Count</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{project.episodeCount || 0} episodes</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Target Audience</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{project.targetAudience || 'family'}</dd>
            </div>
          </div>

          {project.projectSettings && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Technical Settings</h3>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Aspect Ratio</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{project.projectSettings.aspectRatio || '16:9'}</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Episode Duration</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{project.projectSettings.episodeDuration || 22} minutes</dd>
              </div>
              
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Quality Tier</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 capitalize">{project.projectSettings.qualityTier || 'standard'}</dd>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Timeline</h3>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {format(createdDate, 'PPP')}
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  ({formatDistanceToNow(createdDate, { addSuffix: true })})
                </span>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {format(updatedDate, 'PPP')}
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  ({formatDistanceToNow(updatedDate, { addSuffix: true })})
                </span>
              </dd>
            </div>
            
            {project.createdBy && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{project.createdBy}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Progress Steps */}
        {project.progress?.completedSteps && project.progress.completedSteps.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Completed Steps</h3>
            <div className="space-y-2">
              {project.progress.completedSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {(step as any).step?.replace('_', ' ') || 'Completed step'}
                    </p>
                    {(step as any).completedAt && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date((step as any).completedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}