'use client'

import { useEffect, useRef } from 'react'
import { Loading } from '@/src/components/ui/Loading'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  attachments?: string[]
  metadata?: any
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  currentStep?: string
}

export default function MessageList({ 
  messages, 
  isLoading, 
  currentStep 
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderMessageContent = (message: Message) => {
    // Handle different message types
    if (message.metadata?.type === 'choice_result') {
      return (
        <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-3 mb-2">
          <div className="text-purple-400 text-sm font-medium mb-1">
            Choice Selected
          </div>
          <div className="text-white">{message.content}</div>
        </div>
      )
    }

    if (message.metadata?.type === 'step_transition') {
      return (
        <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 mb-2">
          <div className="text-blue-400 text-sm font-medium mb-1">
            Workflow Progress
          </div>
          <div className="text-white">{message.content}</div>
        </div>
      )
    }

    // Regular message content
    return (
      <div className="prose prose-invert max-w-none">
        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
    )
  }

  const renderAttachments = (attachments: string[]) => {
    if (!attachments || attachments.length === 0) return null

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {attachments.map((attachmentId) => (
          <div 
            key={attachmentId}
            className="bg-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            Attachment {attachmentId.slice(-8)}
          </div>
        ))}
      </div>
    )
  }

  const MessageBubble = ({ message, isBot }: { message: Message, isBot: boolean }) => (
    <div className={`flex gap-4 ${isBot ? 'justify-start' : 'justify-end'} mb-6`}>
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      <div className={`max-w-3xl ${isBot ? 'mr-12' : 'ml-12'}`}>
        <div className={`rounded-2xl px-6 py-4 ${
          isBot 
            ? 'bg-slate-800 border border-slate-700' 
            : 'bg-purple-600'
        }`}>
          {renderMessageContent(message)}
          {message.attachments && renderAttachments(message.attachments)}
        </div>
        
        <div className={`mt-2 text-xs text-slate-500 ${isBot ? 'text-left' : 'text-right'}`}>
          {formatTimestamp(message.timestamp)}
          {message.role === 'system' && (
            <span className="ml-2 bg-slate-700 px-2 py-1 rounded text-xs">
              System
            </span>
          )}
        </div>
      </div>
      
      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  )

  return (
    <div 
      ref={containerRef}
      className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
    >
      <div className="p-6">
        {/* Welcome Message */}
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Welcome to AI Movie Chat!
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              I'm your AI assistant ready to help guide you through the movie production process. 
              Start by telling me about your project or ask any questions.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors">
                "Help me develop my story"
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors">
                "I need character design ideas"
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors">
                "What should I do next?"
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isBot={message.role === 'assistant' || message.role === 'system'}
          />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-4 justify-start mb-6">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            
            <div className="max-w-3xl mr-12">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4">
                <Loading message="AI is thinking..." />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}