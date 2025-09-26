'use client'

import React from 'react'
import { FormFieldError } from './FormFieldError'

interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  name,
  error,
  required,
  description,
  children,
  className = ''
}: FormFieldProps) {
  const fieldId = `field-${name}`
  const errorId = `${fieldId}-error`
  const descId = `${fieldId}-description`

  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={fieldId}
        className={`block text-sm font-medium text-gray-900 dark:text-gray-100 ${
          required ? "after:content-['*'] after:ml-1 after:text-red-500" : ''
        }`}
      >
        {label}
        {required && (
          <span className="sr-only">
            (required)
          </span>
        )}
      </label>
      
      {description && (
        <p id={descId} className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      
      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          name,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required ? 'true' : 'false',
          'aria-describedby': [
            error ? errorId : null,
            description ? descId : null
          ].filter(Boolean).join(' ') || undefined,
          className: `w-full rounded-md border transition-colors ${
            error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
          } px-3 py-2 text-sm placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed ${
            (children as React.ReactElement).props.className || ''
          }`
        })}
      </div>
      
      <FormFieldError error={error} id={errorId} />
    </div>
  )
}