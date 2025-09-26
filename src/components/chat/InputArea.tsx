'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface InputAreaProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export default function InputArea({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Type your message..."
}: InputAreaProps) {
  const [message, setMessage] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!message.trim() || disabled || isComposing) return
    
    onSendMessage(message.trim())
    setMessage('')
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  const quickActions = [
    { label: "Manual Override", icon: "⚙️", action: () => setMessage("I want to manually override the current step: ") },
    { label: "Ask Question", icon: "❓", action: () => setMessage("I have a question about ") },
    { label: "Request Help", icon: "🆘", action: () => setMessage("I need help with ") },
  ]

  return (
    <div className="px-6 py-4">
      {/* Quick Actions */}
      <div className="flex gap-2 mb-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.action}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '48px',
              maxHeight: '120px',
              overflow: 'hidden'
            }}
          />
          
          {/* Character Count */}
          {message.length > 200 && (
            <div className="absolute bottom-2 right-2 text-xs text-slate-500">
              {message.length}/500
            </div>
          )}
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!message.trim() || disabled || isComposing}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 px-6 py-3 h-12"
        >
          {disabled ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Send</span>
            </div>
          )}
        </Button>
      </form>

      {/* Input Hints */}
      <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {disabled && (
            <span className="text-orange-400">Chat is currently disabled</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span>AI-powered assistance</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}