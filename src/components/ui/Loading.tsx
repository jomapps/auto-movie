'use client'

import { cn } from '@/src/utils/cn'

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  className?: string
}

export function Loading({ 
  message = 'Loading...', 
  size = 'md', 
  variant = 'spinner',
  className 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  const renderSpinner = () => (
    <div className={cn(
      'border-2 border-slate-600 border-t-purple-600 rounded-full animate-spin',
      sizeClasses[size]
    )} />
  )

  const renderDots = () => (
    <div className="flex space-x-1">
      <div className={cn(
        'bg-purple-600 rounded-full animate-bounce',
        size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
      )} style={{ animationDelay: '0ms' }} />
      <div className={cn(
        'bg-purple-600 rounded-full animate-bounce',
        size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
      )} style={{ animationDelay: '150ms' }} />
      <div className={cn(
        'bg-purple-600 rounded-full animate-bounce',
        size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
      )} style={{ animationDelay: '300ms' }} />
    </div>
  )

  const renderPulse = () => (
    <div className={cn(
      'bg-purple-600 rounded-full animate-pulse',
      sizeClasses[size]
    )} />
  )

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return renderDots()
      case 'pulse':
        return renderPulse()
      default:
        return renderSpinner()
    }
  }

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      {renderLoader()}
      {message && (
        <span className="text-slate-400 text-sm animate-pulse">
          {message}
        </span>
      )}
    </div>
  )
}

// Specific loading components for common use cases
export function ChatLoading() {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-slate-400 text-sm">AI is thinking...</span>
    </div>
  )
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-slate-600 border-t-purple-600 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400">Loading your content...</p>
      </div>
    </div>
  )
}

export function ButtonLoading() {
  return (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  )
}