'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent } from './Card'
import { Button } from './Button'
import { cn } from '@/utils/cn'

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

interface ChangeNotificationProps {
  changes: ProjectChange[]
  onDismiss?: (changeId: string) => void
  onDismissAll?: () => void
  onViewChange?: (change: ProjectChange) => void
  className?: string
  maxVisible?: number
}

export function ChangeNotification({
  changes,
  onDismiss,
  onDismissAll,
  onViewChange,
  className,
  maxVisible = 5,
}: ChangeNotificationProps) {
  const [dismissedChanges, setDismissedChanges] = useState<Set<string>>(new Set())

  const visibleChanges = changes
    .filter(change => !dismissedChanges.has(change.id))
    .slice(0, maxVisible)

  const handleDismiss = useCallback((changeId: string) => {
    setDismissedChanges(prev => new Set([...prev, changeId]))
    onDismiss?.(changeId)
  }, [onDismiss])

  const handleDismissAll = useCallback(() => {
    const allChangeIds = new Set(changes.map(c => c.id))
    setDismissedChanges(allChangeIds)
    onDismissAll?.()
  }, [changes, onDismissAll])

  const formatTimestamp = useCallback((timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }, [])

  const getChangeIcon = useCallback((type: ProjectChange['type']) => {
    switch (type) {
      case 'status': return '📊'
      case 'progress': return '📈'
      case 'field': return '✏️'
      case 'create': return '➕'
      case 'delete': return '🗑️'
      default: return '📝'
    }
  }, [])

  const getChangeDescription = useCallback((change: ProjectChange) => {
    switch (change.type) {
      case 'status':
        return `changed status from "${change.oldValue}" to "${change.newValue}"`
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
  }, [])

  const getUserAvatar = useCallback((user: CollaboratorInfo) => {
    if (user.avatar) {
      return (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-8 h-8 rounded-full object-cover"
        />
      )
    }
    
    // Generate a simple avatar from initials
    const initials = user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return (
      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
        {initials}
      </div>
    )
  }, [])

  if (visibleChanges.length === 0) {
    return null
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Recent Changes</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {visibleChanges.length} of {changes.length}
            </span>
            {changes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissAll}
                className="text-xs h-6 px-2"
              >
                Dismiss All
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {visibleChanges.map((change) => (
            <div
              key={change.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/50 border border-slate-600/50"
            >
              <div className="flex-shrink-0">
                {getUserAvatar(change.user)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white truncate">
                    {change.user.name}
                  </span>
                  <span className="text-lg" aria-hidden="true">
                    {getChangeIcon(change.type)}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {formatTimestamp(change.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-slate-300 leading-relaxed">
                  {getChangeDescription(change)}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {onViewChange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewChange(change)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                    title="View change details"
                  >
                    👁️
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(change.id)}
                  className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                  title="Dismiss notification"
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>

        {changes.length > maxVisible && (
          <div className="mt-3 pt-3 border-t border-slate-600">
            <p className="text-xs text-slate-400 text-center">
              {changes.length - maxVisible} more changes not shown
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
