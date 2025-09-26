'use client'

import React, { forwardRef } from 'react'

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  showCharacterCount?: boolean
  maxLength?: number
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ error: _error, showCharacterCount, maxLength, className = '', value, ...props }, ref) => {
    const characterCount = typeof value === 'string' ? value.length : 0
    const showCount = showCharacterCount && maxLength && characterCount > maxLength * 0.8

    return (
      <div className="relative">
        <textarea ref={ref} className={className} maxLength={maxLength} value={value} {...props} />
        {showCount && (
          <div
            className={`absolute -bottom-6 right-0 text-xs ${
              characterCount > maxLength
                ? 'text-red-500'
                : characterCount > maxLength * 0.9
                  ? 'text-yellow-600'
                  : 'text-gray-500'
            }`}
          >
            {characterCount}/{maxLength}
          </div>
        )}
      </div>
    )
  }
)

FormTextarea.displayName = 'FormTextarea'
