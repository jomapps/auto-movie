'use client'

import { useState, useCallback, useRef } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  attachments?: string[]
  metadata?: any
}

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

interface ChatState {
  messages: Message[]
  isLoading: boolean
  currentChoices: Choice[] | null
  currentStep: string | null
  progress: number
  sessionId: string | null
}

export function useChat(projectId: string, initialSessionId?: string | null) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    currentChoices: null,
    currentStep: null,
    progress: 0,
    sessionId: initialSessionId || null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const initializeSession = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/v1/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          currentStep: 'initialization',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const session = await response.json()
      updateState({ sessionId: session.id })
      return session.id
    } catch (error) {
      console.error('Failed to initialize session:', error)
      return null
    }
  }, [projectId, updateState])

  const loadChatHistory = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/v1/chat/session/${sessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to load chat history')
      }

      const sessionData = await response.json()
      updateState({
        messages: sessionData.conversationHistory || [],
        currentStep: sessionData.currentStep,
        currentChoices: sessionData.lastChoices || null,
        progress: sessionData.project?.progress?.overallProgress || 0,
      })
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }, [updateState])

  const sendMessage = useCallback(async (content: string, attachments?: string[]) => {
    if (!state.sessionId || !content.trim()) return

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      attachments,
    }

    // Add user message immediately
    updateState({ 
      messages: [...state.messages, userMessage],
      isLoading: true,
      currentChoices: null 
    })

    try {
      const response = await fetch('/api/v1/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: state.sessionId,
          message: content.trim(),
          attachments,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Chat request failed: ${response.statusText}`)
      }

      const result = await response.json()

      // Add AI response
      const aiMessage: Message = {
        id: result.messageId || Date.now().toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
        metadata: result.metadata,
      }

      updateState({
        messages: [...state.messages, userMessage, aiMessage],
        isLoading: false,
        currentChoices: result.choices || null,
        currentStep: result.currentStep || state.currentStep,
        progress: result.progress || state.progress,
      })

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was cancelled
      }

      console.error('Failed to send message:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
        metadata: { type: 'error' },
      }

      updateState({
        messages: [...state.messages, userMessage, errorMessage],
        isLoading: false,
      })
    }
  }, [state.sessionId, state.messages, state.currentStep, state.progress, updateState])

  const selectChoice = useCallback(async (choiceId: string) => {
    if (!state.sessionId) return

    updateState({ isLoading: true })

    try {
      const response = await fetch('/api/v1/chat/choice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: state.sessionId,
          choiceId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process choice')
      }

      const result = await response.json()

      // Add choice confirmation message
      const choiceMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: result.message || 'Choice selected successfully.',
        timestamp: new Date().toISOString(),
        metadata: { type: 'choice_result', choiceId },
      }

      updateState({
        messages: [...state.messages, choiceMessage],
        isLoading: false,
        currentChoices: result.nextChoices || null,
        currentStep: result.nextStep || state.currentStep,
        progress: result.progress || state.progress,
      })

    } catch (error) {
      console.error('Failed to select choice:', error)
      updateState({ isLoading: false })
    }
  }, [state.sessionId, state.messages, state.currentStep, state.progress, updateState])

  const clearMessages = useCallback(() => {
    updateState({ messages: [], currentChoices: null })
  }, [updateState])

  return {
    // State
    messages: state.messages,
    isLoading: state.isLoading,
    currentChoices: state.currentChoices,
    currentStep: state.currentStep,
    progress: state.progress,
    sessionId: state.sessionId,

    // Actions
    initializeSession,
    loadChatHistory,
    sendMessage,
    selectChoice,
    clearMessages,
  }
}