'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FormSelect } from '@/components/forms/form-fields/FormSelect'
import { showToast } from '@/lib/toast'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Project } from '@/payload-types'

interface BulkProjectActionsProps {
  selectedProjects: Project[]
  onSelectionChange: (projectIds: string[]) => void
  onBulkUpdate: (updates: BulkUpdateData) => Promise<void>
  onBulkDelete: (projectIds: string[]) => Promise<void>
  className?: string
}

interface BulkUpdateData {
  status?: string
  progress?: {
    currentPhase?: string
    overallProgress?: number
  }
}

const STATUS_OPTIONS = [
  { value: 'concept', label: 'Concept' },
  { value: 'pre-production', label: 'Pre-Production' },
  { value: 'production', label: 'Production' },
  { value: 'post-production', label: 'Post-Production' },
  { value: 'completed', label: 'Completed' },
  { value: 'on-hold', label: 'On Hold' },
]

const PHASE_OPTIONS = [
  { value: 'story_development', label: 'Story Development' },
  { value: 'character_creation', label: 'Character Creation' },
  { value: 'visual_design', label: 'Visual Design' },
  { value: 'audio_design', label: 'Audio Design' },
  { value: 'scene_production', label: 'Scene Production' },
  { value: 'post_production', label: 'Post Production' },
  { value: 'final_assembly', label: 'Final Assembly' },
]

export function BulkProjectActions({
  selectedProjects,
  onSelectionChange,
  onBulkUpdate,
  onBulkDelete,
  className = '',
}: BulkProjectActionsProps) {
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form state
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkPhase, setBulkPhase] = useState('')
  const [bulkProgress, setBulkProgress] = useState('')

  const selectedCount = selectedProjects.length
  const selectedIds = selectedProjects.map(p => p.id)

  const handleSelectAll = useCallback(() => {
    // This would be implemented by the parent component
    // For now, we'll just show a toast
    showToast.success('Select All functionality would be implemented by parent component')
  }, [])

  const handleDeselectAll = useCallback(() => {
    onSelectionChange([])
  }, [onSelectionChange])

  const handleBulkStatusUpdate = useCallback(async () => {
    if (!bulkStatus) {
      showToast.error('Please select a status')
      return
    }

    setIsUpdating(true)
    try {
      await onBulkUpdate({ status: bulkStatus })
      showToast.success(`Updated status for ${selectedCount} project${selectedCount !== 1 ? 's' : ''}`)
      setShowStatusModal(false)
      setBulkStatus('')
      onSelectionChange([]) // Clear selection
    } catch (error) {
      showToast.error('Failed to update project status')
      console.error('Bulk status update error:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [bulkStatus, selectedCount, onBulkUpdate, onSelectionChange])

  const handleBulkProgressUpdate = useCallback(async () => {
    if (!bulkPhase && !bulkProgress) {
      showToast.error('Please select a phase or enter progress percentage')
      return
    }

    setIsUpdating(true)
    try {
      const updates: BulkUpdateData = {}
      if (bulkPhase || bulkProgress) {
        updates.progress = {}
        if (bulkPhase) updates.progress.currentPhase = bulkPhase
        if (bulkProgress) {
          // Clamp progress to [0, 100] range
          const progressValue = Math.max(0, Math.min(100, parseInt(bulkProgress, 10)))
          updates.progress.overallProgress = progressValue
        }
      }

      await onBulkUpdate(updates)
      showToast.success(`Updated progress for ${selectedCount} project${selectedCount !== 1 ? 's' : ''}`)
      setShowProgressModal(false)
      setBulkPhase('')
      setBulkProgress('')
      onSelectionChange([]) // Clear selection
    } catch (error) {
      showToast.error('Failed to update project progress')
      console.error('Bulk progress update error:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [bulkPhase, bulkProgress, selectedCount, onBulkUpdate, onSelectionChange])

  const handleBulkDelete = useCallback(async () => {
    setIsDeleting(true)
    try {
      await onBulkDelete(selectedIds)
      showToast.success(`Deleted ${selectedCount} project${selectedCount !== 1 ? 's' : ''}`)
      setShowDeleteModal(false)
      onSelectionChange([]) // Clear selection
    } catch (error) {
      showToast.error('Failed to delete projects')
      console.error('Bulk delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }, [selectedIds, selectedCount, onBulkDelete, onSelectionChange])

  if (selectedCount === 0) {
    return null
  }

  return (
    <>
      <div className={`flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg ${className}`}>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-white">
            {selectedCount} project{selectedCount !== 1 ? 's' : ''} selected
          </span>
          
          <div className="flex items-center gap-2">
            {selectedProjects.slice(0, 3).map((project) => (
              <StatusBadge 
                key={project.id} 
                status={project.status as any || 'concept'} 
                size="sm" 
              />
            ))}
            {selectedCount > 3 && (
              <span className="text-xs text-slate-400">
                +{selectedCount - 3} more
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
          >
            Deselect All
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatusModal(true)}
          >
            Update Status
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProgressModal(true)}
          >
            Update Progress
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Selected
          </Button>
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Project Status"
        description={`Update status for ${selectedCount} selected project${selectedCount !== 1 ? 's' : ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              New Status
            </label>
            <FormSelect
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              options={STATUS_OPTIONS}
              placeholder="Select new status"
            />
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowStatusModal(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={isUpdating || !bulkStatus}
            >
              {isUpdating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Progress Update Modal */}
      <Modal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        title="Update Project Progress"
        description={`Update progress for ${selectedCount} selected project${selectedCount !== 1 ? 's' : ''}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Current Phase
            </label>
            <FormSelect
              value={bulkPhase}
              onChange={(e) => setBulkPhase(e.target.value)}
              options={PHASE_OPTIONS}
              placeholder="Select current phase (optional)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Overall Progress (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={bulkProgress}
              onChange={(e) => setBulkProgress(e.target.value)}
              placeholder="Enter progress percentage (optional)"
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowProgressModal(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkProgressUpdate}
              disabled={isUpdating || (!bulkPhase && !bulkProgress)}
            >
              {isUpdating ? 'Updating...' : 'Update Progress'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Projects"
        description={`Are you sure you want to delete ${selectedCount} selected project${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-red-200">Warning</h4>
                <p className="text-sm text-red-300 mt-1">
                  This will permanently delete all selected projects and their associated data.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Projects'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
