import { it, expect, beforeEach, afterEach } from 'vitest'
import { io, Socket } from 'socket.io-client'
import { describeContract, getContractBaseUrl } from './utils'

describeContract('WebSocket /api/v1/websocket Contract', () => {
  const BASE_URL = getContractBaseUrl()
  let clientSocket: Socket

  beforeEach((done) => {
    // This test MUST fail initially (no implementation yet)
    clientSocket = io(`${BASE_URL}/api/v1/websocket`, {
      query: {
        projectId: 'test-project-id',
        sessionId: 'test-session-id',
      },
      auth: {
        token: 'test-jwt-token',
      },
    })
    
    clientSocket.on('connect', done)
  })

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect()
    }
  })

  it('should establish connection with valid auth', (done) => {
    clientSocket.on('connected', (data) => {
      expect(data).toHaveProperty('sessionId')
      expect(data).toHaveProperty('projectId')
      expect(data).toHaveProperty('currentStep')
      expect(data.sessionId).toBe('test-session-id')
      expect(data.projectId).toBe('test-project-id')
      done()
    })
  })

  it('should handle join-project event', (done) => {
    clientSocket.emit('join-project', { projectId: 'test-project-id' })
    
    // Should receive confirmation or room-related events
    clientSocket.on('user-joined', (data) => {
      expect(data).toHaveProperty('projectId')
      expect(data).toHaveProperty('user')
      expect(data.projectId).toBe('test-project-id')
      done()
    })
  })

  it('should receive message-received events', (done) => {
    clientSocket.on('message-received', (data) => {
      expect(data).toHaveProperty('sessionId')
      expect(data).toHaveProperty('message')
      expect(data.message).toHaveProperty('id')
      expect(data.message).toHaveProperty('role')
      expect(data.message).toHaveProperty('content')
      expect(data.message).toHaveProperty('timestamp')
      done()
    })

    // Simulate receiving a message
    clientSocket.emit('test-message', { sessionId: 'test-session-id' })
  })

  it('should handle typing indicators', (done) => {
    clientSocket.emit('typing-start', { sessionId: 'test-session-id' })
    
    clientSocket.on('typing-indicator', (data) => {
      expect(data).toHaveProperty('sessionId')
      expect(data).toHaveProperty('userId')
      expect(data).toHaveProperty('userName')
      expect(data).toHaveProperty('isTyping')
      expect(data.isTyping).toBe(true)
      done()
    })
  })

  it('should receive progress updates', (done) => {
    clientSocket.on('progress-updated', (data) => {
      expect(data).toHaveProperty('projectId')
      expect(data).toHaveProperty('progress')
      expect(data.progress).toHaveProperty('currentPhase')
      expect(data.progress).toHaveProperty('overallProgress')
      expect(data.progress).toHaveProperty('completedSteps')
      done()
    })
  })

  it('should respond to ping with pong', (done) => {
    const startTime = Date.now()
    
    clientSocket.emit('ping')
    
    clientSocket.on('pong', (data) => {
      expect(data).toHaveProperty('timestamp')
      expect(typeof data.timestamp).toBe('number')
      expect(data.timestamp).toBeGreaterThan(startTime)
      done()
    })
  })
})