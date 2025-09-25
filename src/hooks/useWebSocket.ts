'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
  sessionId?: string
}

interface WebSocketState {
  isConnected: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
  lastMessage: WebSocketMessage | null
  error: string | null
}

export function useWebSocket(sessionId?: string | null) {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    connectionStatus: 'disconnected',
    lastMessage: null,
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const updateState = useCallback((updates: Partial<WebSocketState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    updateState({ connectionStatus: 'connecting' })

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/v1/websocket`
      
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
        updateState({
          isConnected: true,
          connectionStatus: 'connected',
          error: null,
        })
        reconnectAttemptsRef.current = 0

        // Join session if provided
        if (sessionId) {
          sendEvent('join_session', { sessionId })
        }
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          updateState({ lastMessage: message })
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        updateState({
          isConnected: false,
          connectionStatus: 'disconnected',
        })

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            updateState({ connectionStatus: 'reconnecting' })
            connect()
          }, delay)
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        updateState({
          connectionStatus: 'error',
          error: 'Connection error occurred',
        })
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      updateState({
        connectionStatus: 'error',
        error: 'Failed to establish connection',
      })
    }
  }, [sessionId, updateState])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated')
      wsRef.current = null
    }

    updateState({
      isConnected: false,
      connectionStatus: 'disconnected',
      lastMessage: null,
      error: null,
    })
  }, [updateState])

  const sendEvent = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now(),
        sessionId: sessionId || undefined,
      }
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message:', type)
    }
  }, [sessionId])

  const sendMessage = useCallback((message: any) => {
    sendEvent('message', message)
  }, [sendEvent])

  // Effect to handle session changes
  useEffect(() => {
    if (state.isConnected && sessionId) {
      sendEvent('join_session', { sessionId })
    }
  }, [sessionId, state.isConnected, sendEvent])

  // Effect to manage connection lifecycle
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, []) // Empty dependency array - only run once

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting')
      }
    }
  }, [])

  return {
    // State
    isConnected: state.isConnected,
    connectionStatus: state.connectionStatus,
    lastMessage: state.lastMessage,
    error: state.error,

    // Actions
    connect,
    disconnect,
    sendEvent,
    sendMessage,

    // Utilities
    isReady: state.connectionStatus === 'connected',
    isReconnecting: state.connectionStatus === 'reconnecting',
  }
}