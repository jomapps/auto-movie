'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWebSocket } from './useWebSocket'
import { showToast } from '@/lib/toast'

interface CollaboratorInfo {
  id: string
  name: string
  email?: string
  avatar?: string
  lastSeen: number
  isActive: boolean
}

interface ProjectChange {
  id: string
  type: 'status' | 'progress' | 'field' | 'create' | 'delete'
  field?: string
  oldValue?: any
  newValue?: any
  user: CollaboratorInfo
  timestamp: number
  projectId: string
}

interface EditConflict {
  field: string
  conflictingUser: CollaboratorInfo
  timestamp: number
}

interface CollaborationState {
  collaborators: CollaboratorInfo[]
  recentChanges: ProjectChange[]
  editConflicts: EditConflict[]
  isConnected: boolean
}

export function useCollaboration(projectId?: string) {
  const [state, setState] = useState<CollaborationState>({
    collaborators: [],
    recentChanges: [],
    editConflicts: [],
    isConnected: false,
  })

  const { isConnected, sendEvent, lastMessage } = useWebSocket(
    projectId ? `project-${projectId}` : 'projects-global'
  )
  const changeHistoryRef = useRef<ProjectChange[]>([])
  const conflictTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Update connection state
  useEffect(() => {
    setState(prev => ({ ...prev, isConnected }))
  }, [isConnected])

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return

    const { type, payload } = lastMessage

    switch (type) {
      case 'collaborator_joined':
        handleCollaboratorJoined(payload)
        break
      case 'collaborator_left':
        handleCollaboratorLeft(payload)
        break
      case 'project_changed':
        handleProjectChanged(payload)
        break
      case 'edit_conflict':
        handleEditConflict(payload)
        break
      case 'collaborators_list':
        handleCollaboratorsList(payload)
        break
    }
  }, [lastMessage])

  const handleCollaboratorJoined = useCallback((collaborator: CollaboratorInfo) => {
    setState(prev => ({
      ...prev,
      collaborators: [...prev.collaborators.filter(c => c.id !== collaborator.id), collaborator],
    }))
    
    showToast.success(`${collaborator.name} joined the project`)
  }, [])

  const handleCollaboratorLeft = useCallback((collaboratorId: string) => {
    setState(prev => {
      const collaborator = prev.collaborators.find(c => c.id === collaboratorId)
      return {
        ...prev,
        collaborators: prev.collaborators.filter(c => c.id !== collaboratorId),
      }
    })
  }, [])

  const handleProjectChanged = useCallback((change: ProjectChange) => {
    // Add to recent changes
    setState(prev => ({
      ...prev,
      recentChanges: [change, ...prev.recentChanges.slice(0, 9)], // Keep last 10 changes
    }))

    // Store in ref for history
    changeHistoryRef.current = [change, ...changeHistoryRef.current.slice(0, 49)] // Keep last 50 changes

    // Show notification
    const changeDescription = getChangeDescription(change)
    showToast.success(`${change.user.name} ${changeDescription}`, { duration: 3000 })
  }, [])

  const handleEditConflict = useCallback((conflict: EditConflict) => {
    setState(prev => ({
      ...prev,
      editConflicts: [...prev.editConflicts.filter(c => c.field !== conflict.field), conflict],
    }))

    showToast.error(
      `Edit conflict: ${conflict.conflictingUser.name} is also editing ${conflict.field}`,
      { duration: 5000 }
    )

    // Auto-resolve conflict after 30 seconds
    if (conflictTimeoutRef.current) {
      clearTimeout(conflictTimeoutRef.current)
    }
    conflictTimeoutRef.current = setTimeout(() => {
      resolveEditConflict(conflict.field)
    }, 30000)
  }, [])

  const handleCollaboratorsList = useCallback((collaborators: CollaboratorInfo[]) => {
    setState(prev => ({
      ...prev,
      collaborators,
    }))
  }, [])

  // Broadcast project change to other collaborators
  const broadcastChange = useCallback((change: Omit<ProjectChange, 'id' | 'timestamp' | 'user'>) => {
    if (!isConnected) return

    const fullChange: ProjectChange = {
      ...change,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      projectId: change.projectId || projectId || 'unknown',
      user: {
        id: 'current-user', // This would come from auth context
        name: 'You',
        isActive: true,
        lastSeen: Date.now(),
      },
    }

    sendEvent('project_changed', fullChange)
  }, [isConnected, projectId, sendEvent])

  // Broadcast project change with specific project ID (for new projects)
  const broadcastChangeWithId = useCallback((projectIdOverride: string, change: Omit<ProjectChange, 'id' | 'timestamp' | 'user' | 'projectId'>) => {
    if (!isConnected) return

    const fullChange: ProjectChange = {
      ...change,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      projectId: projectIdOverride,
      user: {
        id: 'current-user', // This would come from auth context
        name: 'You',
        isActive: true,
        lastSeen: Date.now(),
      },
    }

    sendEvent('project_changed', fullChange)
  }, [isConnected, sendEvent])

  // Broadcast field edit start (for conflict detection)
  const broadcastFieldEdit = useCallback((field: string) => {
    if (!isConnected) return

    sendEvent('field_edit_start', {
      field,
      projectId: projectId || 'new-project',
      timestamp: Date.now(),
    })
  }, [isConnected, projectId, sendEvent])

  // Broadcast field edit end
  const broadcastFieldEditEnd = useCallback((field: string) => {
    if (!isConnected) return

    sendEvent('field_edit_end', {
      field,
      projectId: projectId || 'new-project',
      timestamp: Date.now(),
    })
  }, [isConnected, projectId, sendEvent])

  // Resolve edit conflict
  const resolveEditConflict = useCallback((field: string) => {
    setState(prev => ({
      ...prev,
      editConflicts: prev.editConflicts.filter(c => c.field !== field),
    }))
  }, [])

  // Get change history
  const getChangeHistory = useCallback(() => {
    return changeHistoryRef.current
  }, [])

  // Clear recent changes
  const clearRecentChanges = useCallback(() => {
    setState(prev => ({
      ...prev,
      recentChanges: [],
    }))
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conflictTimeoutRef.current) {
        clearTimeout(conflictTimeoutRef.current)
      }
    }
  }, [])

  return {
    // State
    collaborators: state.collaborators,
    recentChanges: state.recentChanges,
    editConflicts: state.editConflicts,
    isConnected: state.isConnected,

    // Actions
    broadcastChange,
    broadcastChangeWithId,
    broadcastFieldEdit,
    broadcastFieldEditEnd,
    resolveEditConflict,
    clearRecentChanges,

    // Utilities
    getChangeHistory,
    hasActiveCollaborators: state.collaborators.length > 0,
    hasEditConflicts: state.editConflicts.length > 0,
  }
}

// Helper function to generate human-readable change descriptions
function getChangeDescription(change: ProjectChange): string {
  switch (change.type) {
    case 'status':
      return `changed status from ${change.oldValue} to ${change.newValue}`
    case 'progress':
      return `updated progress to ${change.newValue}%`
    case 'field':
      return `updated ${change.field}`
    case 'create':
      return 'created the project'
    case 'delete':
      return 'deleted the project'
    default:
      return 'made changes'
  }
}
