'use client'

import React, { forwardRef } from 'react'

interface FormNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
}

export const FormNumberInput = forwardRef<HTMLInputElement, FormNumberInputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="number"
        className={className}
        {...props}
      />
    )
  }
)

FormNumberInput.displayName = 'FormNumberInput'