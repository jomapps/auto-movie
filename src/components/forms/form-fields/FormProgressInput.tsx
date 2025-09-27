'use client'

import React, { forwardRef, useState, useCallback } from 'react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { cn } from '@/utils/cn'

interface FormProgressInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'min' | 'max'> {
  error?: boolean
  showSlider?: boolean
  showNumberInput?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const FormProgressInput = forwardRef<HTMLInputElement, FormProgressInputProps>(
  ({ 
    error = false, 
    showSlider = true, 
    showNumberInput = true, 
    size = 'md',
    value = 0,
    onChange,
    className,
    disabled,
    ...props 
  }, ref) => {
    const [localValue, setLocalValue] = useState(Number(value) || 0)
    
    // Ensure value is between 0 and 100
    const clampedValue = Math.max(0, Math.min(100, Number(value) || 0))

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      setLocalValue(newValue)
      
      // Create a synthetic event for the hidden input
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: newValue.toString(),
          name: props.name || '',
        }
      }
      onChange?.(syntheticEvent as any)
    }, [onChange, props.name])

    const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Math.max(0, Math.min(100, Number(e.target.value) || 0))
      setLocalValue(newValue)
      
      // Create a synthetic event for the hidden input
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: newValue.toString(),
          name: props.name || '',
        }
      }
      onChange?.(syntheticEvent as any)
    }, [onChange, props.name])

    const handleProgressBarChange = useCallback((newValue: number) => {
      setLocalValue(newValue)
      
      // Create a synthetic event for the hidden input
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: newValue.toString(),
            name: props.name || '',
          }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }, [onChange, props.name])

    const sizeClasses = {
      sm: {
        input: 'h-8 px-2 text-sm',
        slider: 'h-2',
      },
      md: {
        input: 'h-10 px-3 text-sm',
        slider: 'h-3',
      },
      lg: {
        input: 'h-12 px-4 text-base',
        slider: 'h-4',
      },
    }

    return (
      <div className={cn('space-y-3', className)}>
        {/* Hidden input for form submission */}
        <input
          ref={ref}
          type="hidden"
          value={clampedValue}
          {...props}
        />

        {/* Progress Bar with visual feedback */}
        <ProgressBar
          value={clampedValue}
          editable={!disabled}
          onChange={handleProgressBarChange}
          showPercentage={true}
          size={size}
          className="w-full"
        />

        <div className="flex items-center gap-3">
          {/* Range Slider */}
          {showSlider && (
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={clampedValue}
                onChange={handleSliderChange}
                disabled={disabled}
                className={cn(
                  'w-full appearance-none bg-transparent cursor-pointer',
                  'range-slider',
                  // Webkit styles
                  '[&::-webkit-slider-track]:bg-slate-700 [&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:border-0',
                  '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-purple-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0',
                  '[&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:cursor-pointer',
                  '[&::-webkit-slider-thumb]:hover:bg-purple-700 [&::-webkit-slider-thumb]:focus:bg-purple-700',
                  // Firefox styles
                  '[&::-moz-range-track]:bg-slate-700 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:border-0',
                  '[&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0',
                  '[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:cursor-pointer',
                  '[&::-moz-range-thumb]:hover:bg-purple-700 [&::-moz-range-thumb]:focus:bg-purple-700',
                  // Disabled state
                  disabled && 'opacity-50 cursor-not-allowed',
                  error && '[&::-webkit-slider-thumb]:bg-red-600 [&::-moz-range-thumb]:bg-red-600',
                  sizeClasses[size].slider
                )}
                aria-label="Progress percentage"
              />
            </div>
          )}

          {/* Number Input */}
          {showNumberInput && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={clampedValue}
                onChange={handleNumberChange}
                disabled={disabled}
                className={cn(
                  'w-20 rounded-md border transition-colors text-center',
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-slate-600 focus:border-purple-500 focus:ring-purple-500',
                  'bg-slate-800 text-slate-100 placeholder-slate-400',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  sizeClasses[size].input
                )}
                aria-label="Progress percentage input"
              />
              <span className="text-sm text-slate-400">%</span>
            </div>
          )}
        </div>

        {/* Accessibility description */}
        <div className="sr-only" id={`${props.name}-description`}>
          Use the slider or number input to set progress percentage between 0 and 100.
          Current value: {clampedValue}%
        </div>
      </div>
    )
  }
)

FormProgressInput.displayName = 'FormProgressInput'
