'use client'

// WebSocket client service for real-time communication
export interface WebSocketMessage {
  type: string
  data: any
}

export interface WebSocketEventHandlers {
  onConnection?: (data: any) => void
  onDisconnection?: (data: any) => void
  onMessage?: (message: WebSocketMessage) => void
  onChatMessage?: (data: any) => void
  onUserJoined?: (data: any) => void
  onUserLeft?: (data: any) => void
  onTypingStart?: (data: any) => void
  onTypingStop?: (data: any) => void
  onSessionMessage?: (data: any) => void
  onProjectMessage?: (data: any) => void
  onError?: (error: any) => void
}

export class WebSocketService {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectDelay: number = 1000 // Start with 1 second
  private maxReconnectDelay: number = 30000 // Max 30 seconds
  private handlers: WebSocketEventHandlers = {}
  private connectionId: string | null = null
  private isConnecting: boolean = false
  private shouldReconnect: boolean = true
  private pingInterval: NodeJS.Timeout | null = null

  constructor(sessionId?: string, projectId?: string, userId?: string) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT || '3001'
    const wsHost = process.env.NEXT_PUBLIC_WS_HOST || window.location.hostname

    const params = new URLSearchParams()
    if (sessionId) params.append('sessionId', sessionId)
    if (projectId) params.append('projectId', projectId)
    if (userId) params.append('userId', userId)

    this.url = `${wsProtocol}//${wsHost}:${wsPort}?${params.toString()}`
  }

  // Connect to WebSocket server
  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve()
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = _event => {
          console.log('WebSocket connected')
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.reconnectDelay = 1000
          this.startPingInterval()
          resolve()
        }

        this.ws.onmessage = event => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Error parsing WebSocket message:', error)
            this.handlers.onError?.({ error: 'Failed to parse message', rawData: event.data })
          }
        }

        this.ws.onclose = event => {
          console.log('WebSocket disconnected:', event.code, event.reason)
          this.isConnecting = false
          this.stopPingInterval()
          this.handlers.onDisconnection?.({ code: event.code, reason: event.reason })

          // Attempt to reconnect if enabled and not a normal close
          if (this.shouldReconnect && event.code !== 1000) {
            this.scheduleReconnect()
          }
        }

        this.ws.onerror = event => {
          console.error('WebSocket error:', event)
          this.isConnecting = false
          this.handlers.onError?.({ error: 'WebSocket connection error', event })
          reject(new Error('WebSocket connection failed'))
        }
      } catch (error) {
        this.isConnecting = false
        console.error('Error creating WebSocket connection:', error)
        this.handlers.onError?.({ error: 'Failed to create WebSocket connection' })
        reject(error)
      }
    })
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.shouldReconnect = false
    this.stopPingInterval()

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.connectionId = null
  }

  // Send a message to the WebSocket server
  send(type: string, data: any = {}): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message:', { type, data })
      return false
    }

    try {
      const message = JSON.stringify({ type, data })
      this.ws.send(message)
      return true
    } catch (error) {
      console.error('Error sending WebSocket message:', error)
      this.handlers.onError?.({ error: 'Failed to send message', type, data })
      return false
    }
  }

  // Convenience methods for specific message types
  ping(): boolean {
    return this.send('ping')
  }

  joinSession(sessionId: string): boolean {
    return this.send('join_session', { sessionId })
  }

  leaveSession(sessionId: string): boolean {
    return this.send('leave_session', { sessionId })
  }

  sendChatMessage(message: string, attachments: any[] = []): boolean {
    return this.send('chat_message', { message, attachments })
  }

  sendTypingStart(): boolean {
    return this.send('typing_start')
  }

  sendTypingStop(): boolean {
    return this.send('typing_stop')
  }

  // Set event handlers
  on(event: keyof WebSocketEventHandlers, handler: (...args: any[]) => void): void {
    this.handlers[event] = handler as any
  }

  // Remove event handlers
  off(event: keyof WebSocketEventHandlers): void {
    delete this.handlers[event]
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  getConnectionId(): string | null {
    return this.connectionId
  }

  getReadyState(): number | undefined {
    return this.ws?.readyState
  }

  // Private methods
  private handleMessage(message: WebSocketMessage): void {
    const { type, data } = message

    // Handle connection confirmation
    if (type === 'connection') {
      this.connectionId = data.connectionId
      this.handlers.onConnection?.(data)
      return
    }

    // Route messages to appropriate handlers
    switch (type) {
      case 'pong':
        // Handle ping response (keep-alive)
        break

      case 'chat_message':
        this.handlers.onChatMessage?.(data)
        break

      case 'user_joined':
        this.handlers.onUserJoined?.(data)
        break

      case 'user_left':
        this.handlers.onUserLeft?.(data)
        break

      case 'typing_start':
        this.handlers.onTypingStart?.(data)
        break

      case 'typing_stop':
        this.handlers.onTypingStop?.(data)
        break

      case 'session_message':
        this.handlers.onSessionMessage?.(data)
        break

      case 'project_message':
        this.handlers.onProjectMessage?.(data)
        break

      case 'session_joined':
      case 'session_left':
        // Handle session join/leave confirmations
        break

      case 'error':
        this.handlers.onError?.(data)
        break

      default:
        console.warn('Unhandled WebSocket message type:', type, data)
    }

    // Always call the general message handler
    this.handlers.onMessage?.(message)
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached, giving up')
      this.handlers.onError?.({ error: 'Max reconnection attempts reached' })
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    )

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    )

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
        })
      }
    }, delay)
  }

  private startPingInterval(): void {
    this.stopPingInterval()

    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ping()
      }
    }, 30000)
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }
}

// Singleton instance for default WebSocket connection
let defaultWebSocketService: WebSocketService | null = null

export function getWebSocketService(
  sessionId?: string,
  projectId?: string,
  userId?: string
): WebSocketService {
  if (!defaultWebSocketService || (sessionId && !defaultWebSocketService.isConnected())) {
    defaultWebSocketService = new WebSocketService(sessionId, projectId, userId)
  }
  return defaultWebSocketService
}

// Cleanup function for when component unmounts
export function cleanupWebSocket(): void {
  if (defaultWebSocketService) {
    defaultWebSocketService.disconnect()
    defaultWebSocketService = null
  }
}

// React Hook for easier WebSocket integration
export function useWebSocket(sessionId?: string, projectId?: string, userId?: string) {
  const [ws, setWs] = React.useState<WebSocketService | null>(null)
  const [isConnected, setIsConnected] = React.useState(false)
  const [connectionId, setConnectionId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<any>(null)

  React.useEffect(() => {
    const wsService = getWebSocketService(sessionId, projectId, userId)
    setWs(wsService)

    // Set up event handlers
    wsService.on('onConnection', data => {
      setIsConnected(true)
      setConnectionId(data.connectionId)
      setError(null)
    })

    wsService.on('onDisconnection', () => {
      setIsConnected(false)
      setConnectionId(null)
    })

    wsService.on('onError', error => {
      setError(error)
    })

    // Connect
    wsService.connect().catch(err => {
      setError(err)
    })

    // Cleanup on unmount
    return () => {
      wsService.off('onConnection')
      wsService.off('onDisconnection')
      wsService.off('onError')
    }
  }, [sessionId, projectId, userId])

  return {
    ws,
    isConnected,
    connectionId,
    error,
    send: ws?.send.bind(ws),
    joinSession: ws?.joinSession.bind(ws),
    leaveSession: ws?.leaveSession.bind(ws),
    sendChatMessage: ws?.sendChatMessage.bind(ws),
    sendTypingStart: ws?.sendTypingStart.bind(ws),
    sendTypingStop: ws?.sendTypingStop.bind(ws),
  }
}

// Export React for the hook
import React from 'react'
