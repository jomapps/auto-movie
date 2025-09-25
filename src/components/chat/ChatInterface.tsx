'use client'

import { useState, useEffect } from 'react'
import MessageList from './MessageList'
import InputArea from './InputArea'
import ChoiceSelector from './ChoiceSelector'
import FileUpload from './FileUpload'
import ProgressIndicator from './ProgressIndicator'
import { useChat } from '@/src/hooks/useChat'
import { useWebSocket } from '@/src/hooks/useWebSocket'

interface ChatInterfaceProps {
  projectId: string
  projectTitle: string
  activeSession: any | null
}

export default function ChatInterface({ 
  projectId, 
  projectTitle, 
  activeSession 
}: ChatInterfaceProps) {
  const [sessionId, setSessionId] = useState<string | null>(activeSession?.id || null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  
  // Use custom hooks for chat and WebSocket functionality
  const {
    messages,
    isLoading,
    currentChoices,
    currentStep,
    progress,
    sendMessage,
    selectChoice,
    clearMessages,
    initializeSession
  } = useChat(projectId, sessionId)

  const {
    isConnected,
    connectionStatus,
    sendEvent,
    lastMessage
  } = useWebSocket(sessionId)

  // Initialize session if none exists
  useEffect(() => {
    if (!sessionId) {
      initializeSession().then((newSessionId) => {
        if (newSessionId) {
          setSessionId(newSessionId)
        }
      })
    }
  }, [sessionId, initializeSession])

  // Handle WebSocket events
  useEffect(() => {
    if (lastMessage) {
      // Process real-time updates from WebSocket
      console.log('WebSocket message received:', lastMessage)
    }
  }, [lastMessage])

  const handleSendMessage = async (message: string, attachments?: string[]) => {
    if (!sessionId) return
    
    try {
      await sendMessage(message, attachments)
      // Notify other collaborators via WebSocket
      sendEvent('message_sent', { 
        sessionId,
        projectId,
        message,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleChoiceSelect = async (choiceId: string) => {
    if (!sessionId) return
    
    try {
      await selectChoice(choiceId)
      // Notify other collaborators via WebSocket
      sendEvent('choice_selected', {
        sessionId,
        projectId,
        choiceId,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Failed to select choice:', error)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    // Handle file upload logic
    const fileIds: string[] = []
    
    for (const file of files) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('projectId', projectId)
        
        const response = await fetch('/api/v1/media/upload', {
          method: 'POST',
          body: formData,
        })
        
        if (response.ok) {
          const result = await response.json()
          fileIds.push(result.id)
        }
      } catch (error) {
        console.error('File upload failed:', error)
      }
    }
    
    if (fileIds.length > 0) {
      await handleSendMessage('I\'ve uploaded some files for reference.', fileIds)
    }
    
    setShowFileUpload(false)
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Chat Header with Progress */}
      <div className="bg-slate-800 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">
              {projectTitle} - Chat
            </h2>
            {currentStep && (
              <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                {currentStep}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <span className="text-slate-400 text-sm">
                {connectionStatus}
              </span>
            </div>
            
            {/* File Upload Toggle */}
            <button
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="text-slate-400 hover:text-white transition-colors"
              title="Upload files"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Progress Indicator */}
        {progress && (
          <div className="mt-4">
            <ProgressIndicator 
              currentStep={currentStep}
              progress={progress}
              totalSteps={10} // TODO: Get from project settings
            />
          </div>
        )}
      </div>

      {/* File Upload Area */}
      {showFileUpload && (
        <div className="bg-slate-800 border-b border-slate-700">
          <FileUpload 
            onUpload={handleFileUpload}
            onCancel={() => setShowFileUpload(false)}
            projectId={projectId}
          />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <MessageList 
          messages={messages}
          isLoading={isLoading}
          currentStep={currentStep}
        />
      </div>

      {/* Choice Selector */}
      {currentChoices && currentChoices.length > 0 && (
        <div className="bg-slate-800 border-t border-slate-700 px-6 py-4">
          <ChoiceSelector 
            choices={currentChoices}
            onSelect={handleChoiceSelect}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="bg-slate-800 border-t border-slate-700">
        <InputArea 
          onSendMessage={handleSendMessage}
          disabled={isLoading || !isConnected}
          placeholder={
            currentChoices && currentChoices.length > 0 
              ? "Select a choice above or type a custom message..."
              : "Type your message..."
          }
        />
      </div>
    </div>
  )
}