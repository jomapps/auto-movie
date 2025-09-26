'use client'

import React, { forwardRef } from 'react'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface FormSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: SelectOption[]
  placeholder?: string
  error?: boolean
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ options, placeholder, error, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={className}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)

FormSelect.displayName = 'FormSelect'