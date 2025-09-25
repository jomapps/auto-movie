'use client'

import { forwardRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/src/utils/cn'

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ className, isOpen, onClose, title, description, size = 'md', children, ...props }, ref) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      if (isOpen) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
      }

      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const modalContent = (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div
          ref={ref}
          className={cn(
            'relative bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-[90vh] overflow-y-auto',
            {
              'w-full max-w-sm': size === 'sm',
              'w-full max-w-md': size === 'md',
              'w-full max-w-lg': size === 'lg',
              'w-full max-w-4xl': size === 'xl',
              'w-full h-full max-w-none max-h-none rounded-none': size === 'full',
            },
            className
          )}
          {...props}
        >
          {/* Header */}
          {(title || description) && (
            <div className="flex items-start justify-between p-6 border-b border-slate-700">
              <div className="space-y-1">
                {title && (
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-slate-400">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    )

    return createPortal(modalContent, document.body)
  }
)

Modal.displayName = 'Modal'

export { Modal }