'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/Button'

interface Choice {
  id: string
  title: string
  description: string
  type: 'recommended' | 'alternative' | 'manual'
  metadata?: {
    difficulty?: 'easy' | 'medium' | 'hard'
    timeEstimate?: string
    impact?: 'low' | 'medium' | 'high'
  }
}

interface ChoiceSelectorProps {
  choices: Choice[]
  onSelect: (choiceId: string) => void
  disabled?: boolean
}

export default function ChoiceSelector({ 
  choices, 
  onSelect, 
  disabled = false 
}: ChoiceSelectorProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState<string | null>(null)

  const handleSelect = (choiceId: string) => {
    setSelectedChoice(choiceId)
    onSelect(choiceId)
  }

  const getChoiceIcon = (type: Choice['type']) => {
    switch (type) {
      case 'recommended':
        return '⭐'
      case 'alternative':
        return '🔀'
      case 'manual':
        return '⚙️'
      default:
        return '💡'
    }
  }

  const getChoiceColor = (type: Choice['type']) => {
    switch (type) {
      case 'recommended':
        return 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20'
      case 'alternative':
        return 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20'
      case 'manual':
        return 'border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20'
      default:
        return 'border-slate-600 bg-slate-800 hover:bg-slate-700'
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-400'
      case 'medium':
        return 'text-yellow-400'
      case 'hard':
        return 'text-red-400'
      default:
        return 'text-slate-400'
    }
  }

  if (choices.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Choose Your Next Step</h3>
          <p className="text-slate-400 text-sm">Select an option to continue your project</p>
        </div>
      </div>

      <div className="grid gap-3">
        {choices.map((choice) => (
          <div key={choice.id} className="space-y-2">
            <button
              onClick={() => handleSelect(choice.id)}
              disabled={disabled || selectedChoice === choice.id}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${getChoiceColor(choice.type)} ${
                selectedChoice === choice.id 
                  ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900' 
                  : ''
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{getChoiceIcon(choice.type)}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white text-base">
                        {choice.title}
                      </h4>
                      {choice.type === 'recommended' && (
                        <span className="text-green-400 text-xs font-medium">
                          Recommended
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-slate-300 text-sm mb-3 leading-relaxed">
                    {choice.description}
                  </p>

                  {/* Metadata */}
                  {choice.metadata && (
                    <div className="flex items-center gap-4 text-xs">
                      {choice.metadata.difficulty && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Difficulty:</span>
                          <span className={getDifficultyColor(choice.metadata.difficulty)}>
                            {choice.metadata.difficulty}
                          </span>
                        </div>
                      )}
                      {choice.metadata.timeEstimate && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Time:</span>
                          <span className="text-slate-300">
                            {choice.metadata.timeEstimate}
                          </span>
                        </div>
                      )}
                      {choice.metadata.impact && (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400">Impact:</span>
                          <span className={getDifficultyColor(choice.metadata.impact)}>
                            {choice.metadata.impact}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="ml-4 flex items-center gap-2">
                  {/* Loading indicator for selected choice */}
                  {selectedChoice === choice.id && disabled && (
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  
                  {/* Details toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDetails(showDetails === choice.id ? null : choice.id)
                    }}
                    className="text-slate-400 hover:text-white p-1"
                    title="View details"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </button>

            {/* Expanded details */}
            {showDetails === choice.id && (
              <div className="ml-4 pl-4 border-l-2 border-slate-700 py-2">
                <div className="text-sm text-slate-400 space-y-2">
                  <p>
                    <strong>What happens next:</strong> This choice will guide the AI to focus on 
                    specific aspects of your project and determine the next workflow steps.
                  </p>
                  {choice.type === 'manual' && (
                    <p className="text-orange-400">
                      <strong>Manual Override:</strong> You'll be able to provide custom instructions 
                      instead of following the standard workflow.
                    </p>
                  )}
                  {choice.type === 'recommended' && (
                    <p className="text-green-400">
                      <strong>AI Recommended:</strong> This option follows best practices and 
                      typical workflow patterns for similar projects.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Manual Override Option */}
      <div className="pt-4 border-t border-slate-700">
        <button
          onClick={() => handleSelect('manual_override')}
          disabled={disabled}
          className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">✏️</span>
            <div>
              <div className="font-medium text-white">Manual Override</div>
              <div className="text-sm text-slate-400">
                Provide your own custom instructions
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}