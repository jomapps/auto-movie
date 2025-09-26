'use client'

interface FormFieldErrorProps {
  error?: string
  id?: string
}

export function FormFieldError({ error, id }: FormFieldErrorProps) {
  if (!error) return null

  return (
    <div id={id} role="alert" className="flex items-start gap-2 mt-1">
      <svg 
        className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" 
        fill="currentColor" 
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      </svg>
      <p className="text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    </div>
  )
}