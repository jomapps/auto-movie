'use client'

import React, { forwardRef, useState, useCallback } from 'react'
import { cn } from '@/utils/cn'

interface ProgressBarProps {
  value: number // 0-100
  editable?: boolean
  onChange?: (value: number) => void
  showPercentage?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ 
    value, 
    editable = false, 
    onChange, 
    showPercentage = true, 
    className,
    size = 'md',
    variant = 'default',
    ...props 
  }, ref) => {
    const [isEditing, setIsEditing] = useState(false)
    const [inputValue, setInputValue] = useState(value.toString())

    // Clamp value between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, value))

    // Determine color based on value and variant
    const getProgressColor = useCallback(() => {
      if (variant !== 'default') {
        return {
          'success': 'bg-green-500',
          'warning': 'bg-yellow-500',
          'danger': 'bg-red-500',
        }[variant]
      }

      // Auto color based on progress value
      if (clampedValue <= 25) return 'bg-red-500'
      if (clampedValue <= 75) return 'bg-yellow-500'
      return 'bg-green-500'
    }, [clampedValue, variant])

    const handleEdit = useCallback(() => {
      if (!editable) return
      setIsEditing(true)
      setInputValue(clampedValue.toString())
    }, [editable, clampedValue])

    const handleSave = useCallback(() => {
      const newValue = parseInt(inputValue, 10)
      if (!isNaN(newValue) && newValue >= 0 && newValue <= 100) {
        onChange?.(newValue)
      }
      setIsEditing(false)
    }, [inputValue, onChange])

    const handleCancel = useCallback(() => {
      setIsEditing(false)
      setInputValue(clampedValue.toString())
    }, [clampedValue])

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave()
      } else if (e.key === 'Escape') {
        handleCancel()
      }
    }, [handleSave, handleCancel])

    const sizeClasses = {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
    }

    return (
      <div 
        ref={ref} 
        className={cn('w-full', className)} 
        {...props}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {showPercentage && !isEditing && (
              <span 
                className={cn(
                  'text-sm font-medium text-slate-300',
                  editable && 'cursor-pointer hover:text-white transition-colors'
                )}
                onClick={handleEdit}
                onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
                tabIndex={editable ? 0 : -1}
                role={editable ? 'button' : undefined}
                aria-label={editable ? 'Click to edit progress' : undefined}
              >
                {clampedValue}%
              </span>
            )}
            {isEditing && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-16 px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <span className="text-xs text-slate-400">%</span>
                <button
                  onClick={handleSave}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancel}
                  className="px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div 
          className={cn(
            'w-full bg-slate-700 rounded-full overflow-hidden',
            sizeClasses[size]
          )}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${clampedValue}%`}
        >
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out',
              getProgressColor()
            )}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

export { ProgressBar }
