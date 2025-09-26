'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormField, FormInput, FormSelect, FormNumberInput } from '../forms/form-fields'

interface FilterState {
  search?: string
  genre?: string
  status?: string
  targetAudience?: string
  sort?: string
  progressMin?: number
  progressMax?: number
  episodeCountMin?: number
  episodeCountMax?: number
}

interface ProjectFiltersProps {
  initialFilters?: FilterState
  className?: string
}

const GENRE_OPTIONS = [
  { value: '', label: 'All Genres' },
  { value: 'action', label: 'Action' },
  { value: 'comedy', label: 'Comedy' },
  { value: 'drama', label: 'Drama' },
  { value: 'horror', label: 'Horror' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'romance', label: 'Romance' },
  { value: 'documentary', label: 'Documentary' }
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'concept', label: 'Concept' },
  { value: 'pre-production', label: 'Pre-production' },
  { value: 'production', label: 'Production' },
  { value: 'post-production', label: 'Post-production' },
  { value: 'completed', label: 'Completed' }
]

const TARGET_AUDIENCE_OPTIONS = [
  { value: '', label: 'All Audiences' },
  { value: 'family', label: 'Family' },
  { value: 'teen', label: 'Teen' },
  { value: 'adult', label: 'Adult' },
  { value: 'children', label: 'Children' }
]

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: 'title', label: 'Title A-Z' },
  { value: '-title', label: 'Title Z-A' },
  { value: '-progress.overallProgress', label: 'Progress High-Low' },
  { value: 'progress.overallProgress', label: 'Progress Low-High' },
  { value: '-updatedAt', label: 'Recently Updated' },
  { value: 'episodeCount', label: 'Episodes Low-High' },
  { value: '-episodeCount', label: 'Episodes High-Low' }
]

export function ProjectFilters({ initialFilters = {}, className = '' }: ProjectFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || initialFilters.search || '',
    genre: searchParams.get('genre') || initialFilters.genre || '',
    status: searchParams.get('status') || initialFilters.status || '',
    targetAudience: searchParams.get('targetAudience') || initialFilters.targetAudience || '',
    sort: searchParams.get('sort') || initialFilters.sort || '-createdAt',
    progressMin: searchParams.get('progressMin') ? Number(searchParams.get('progressMin')) : initialFilters.progressMin,
    progressMax: searchParams.get('progressMax') ? Number(searchParams.get('progressMax')) : initialFilters.progressMax,
    episodeCountMin: searchParams.get('episodeCountMin') ? Number(searchParams.get('episodeCountMin')) : initialFilters.episodeCountMin,
    episodeCountMax: searchParams.get('episodeCountMax') ? Number(searchParams.get('episodeCountMax')) : initialFilters.episodeCountMax
  })

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams)
      
      // Update URL params
      Object.entries(updatedFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.set(key, String(value))
        } else {
          params.delete(key)
        }
      })
      
      // Reset to page 1 when filters change
      params.delete('page')
      
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }

  const clearFilters = () => {
    const clearedFilters = { sort: '-createdAt' }
    setFilters(clearedFilters)
    
    startTransition(() => {
      router.push('?sort=-createdAt', { scroll: false })
    })
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sort' && value === '-createdAt') return false
    return value && value !== ''
  })

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${className}`}>
      {/* Main Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <FormField label="Search" name="search">
          <FormInput
            value={filters.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
            placeholder="Search projects..."
            disabled={isPending}
          />
        </FormField>

        <FormField label="Genre" name="genre">
          <FormSelect
            value={filters.genre || ''}
            onChange={(e) => updateFilters({ genre: e.target.value })}
            options={GENRE_OPTIONS}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Status" name="status">
          <FormSelect
            value={filters.status || ''}
            onChange={(e) => updateFilters({ status: e.target.value })}
            options={STATUS_OPTIONS}
            disabled={isPending}
          />
        </FormField>

        <FormField label="Sort By" name="sort">
          <FormSelect
            value={filters.sort || '-createdAt'}
            onChange={(e) => updateFilters({ sort: e.target.value })}
            options={SORT_OPTIONS}
            disabled={isPending}
          />
        </FormField>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-controls="advanced-filters"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
        >
          <span>Advanced Filters</span>
          <svg 
            className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            disabled={isPending}
            aria-label="Clear all active filters"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div 
          id="advanced-filters"
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          role="region"
          aria-label="Advanced filter options"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Target Audience" name="targetAudience">
              <FormSelect
                value={filters.targetAudience || ''}
                onChange={(e) => updateFilters({ targetAudience: e.target.value })}
                options={TARGET_AUDIENCE_OPTIONS}
                disabled={isPending}
              />
            </FormField>

            <FormField label="Min Progress %" name="progressMin">
              <FormNumberInput
                value={filters.progressMin || ''}
                onChange={(e) => updateFilters({ progressMin: e.target.value ? Number(e.target.value) : undefined })}
                min={0}
                max={100}
                placeholder="0"
                disabled={isPending}
              />
            </FormField>

            <FormField label="Max Progress %" name="progressMax">
              <FormNumberInput
                value={filters.progressMax || ''}
                onChange={(e) => updateFilters({ progressMax: e.target.value ? Number(e.target.value) : undefined })}
                min={0}
                max={100}
                placeholder="100"
                disabled={isPending}
              />
            </FormField>

            <FormField label="Min Episodes" name="episodeCountMin">
              <FormNumberInput
                value={filters.episodeCountMin || ''}
                onChange={(e) => updateFilters({ episodeCountMin: e.target.value ? Number(e.target.value) : undefined })}
                min={1}
                max={50}
                placeholder="1"
                disabled={isPending}
              />
            </FormField>

            <FormField label="Max Episodes" name="episodeCountMax">
              <FormNumberInput
                value={filters.episodeCountMax || ''}
                onChange={(e) => updateFilters({ episodeCountMax: e.target.value ? Number(e.target.value) : undefined })}
                min={1}
                max={50}
                placeholder="50"
                disabled={isPending}
              />
            </FormField>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isPending && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
          <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
    </div>
  )
}