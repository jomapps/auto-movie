import { NextRequest } from 'next/server'
import { WebSocketServer } from 'ws'

// Global WebSocket server instance (in production, consider using a separate service)
let wss: WebSocketServer | null = null

// Connection management
interface ClientConnection {
  id: string
  userId?: string
  sessionId?: string
  projectId?: string
  ws: any
  lastPing: number
}

const connections = new Map<string, ClientConnection>()

// Initialize WebSocket server if not already created
function initializeWebSocketServer() {
  if (wss) return wss

  // Note: This is a simplified implementation for development
  // In production, you should use a dedicated WebSocket service
  const port = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001
  
  wss = new WebSocketServer({ 
    port,
    verifyClient: (info) => {
      // TODO: Implement proper authentication verification
      // const token = info.req.headers.authorization
      // return verifyToken(token)
      return true // Allow all connections for now
    }
  })

  wss.on('connection', (ws, request) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`)
    const sessionId = url.searchParams.get('sessionId')
    const projectId = url.searchParams.get('projectId')
    const userId = url.searchParams.get('userId') // TODO: Get from authenticated token
    
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const connection: ClientConnection = {
      id: connectionId,
      userId,
      sessionId: sessionId || undefined,
      projectId: projectId || undefined,
      ws,
      lastPing: Date.now()
    }
    
    connections.set(connectionId, connection)
    
    console.log(`WebSocket connection established: ${connectionId}`, {
      sessionId,
      projectId,
      userId,
      totalConnections: connections.size
    })

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connection',
      data: {
        connectionId,
        status: 'connected',
        timestamp: new Date().toISOString()
      }
    }))

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString())
        handleWebSocketMessage(connectionId, data)
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            error: 'Invalid message format',
            timestamp: new Date().toISOString()
          }
        }))
      }
    })

    // Handle ping/pong for keep-alive
    ws.on('ping', () => {
      connection.lastPing = Date.now()
      ws.pong()
    })

    ws.on('pong', () => {
      connection.lastPing = Date.now()
    })

    // Handle connection close
    ws.on('close', (code, reason) => {
      console.log(`WebSocket connection closed: ${connectionId}`, { code, reason: reason.toString() })
      connections.delete(connectionId)
    })

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for connection ${connectionId}:`, error)
      connections.delete(connectionId)
    })
  })

  // Cleanup inactive connections every 30 seconds
  setInterval(() => {
    const now = Date.now()
    const timeout = 60000 // 1 minute timeout
    
    for (const [connectionId, connection] of connections.entries()) {
      if (now - connection.lastPing > timeout) {
        console.log(`Cleaning up inactive connection: ${connectionId}`)
        connection.ws.terminate()
        connections.delete(connectionId)
      }
    }
  }, 30000)

  console.log(`WebSocket server initialized on port ${port}`)
  return wss
}

// Handle incoming WebSocket messages
function handleWebSocketMessage(connectionId: string, message: any) {
  const connection = connections.get(connectionId)
  if (!connection) {
    console.error(`Connection not found: ${connectionId}`)
    return
  }

  const { type, data } = message

  switch (type) {
    case 'ping':
      // Respond to ping
      connection.ws.send(JSON.stringify({
        type: 'pong',
        data: {
          timestamp: new Date().toISOString()
        }
      }))
      break

    case 'join_session':
      // Join a chat session
      const { sessionId } = data
      connection.sessionId = sessionId
      connections.set(connectionId, connection)
      
      // Notify other session participants
      broadcastToSession(sessionId, {
        type: 'user_joined',
        data: {
          userId: connection.userId,
          sessionId,
          timestamp: new Date().toISOString()
        }
      }, connectionId)
      
      connection.ws.send(JSON.stringify({
        type: 'session_joined',
        data: {
          sessionId,
          timestamp: new Date().toISOString()
        }
      }))
      break

    case 'leave_session':
      // Leave a chat session
      const { sessionId: leaveSessionId } = data
      const oldSessionId = connection.sessionId
      connection.sessionId = undefined
      connections.set(connectionId, connection)
      
      if (oldSessionId) {
        broadcastToSession(oldSessionId, {
          type: 'user_left',
          data: {
            userId: connection.userId,
            sessionId: oldSessionId,
            timestamp: new Date().toISOString()
          }
        }, connectionId)
      }
      break

    case 'chat_message':
      // Broadcast chat message to session participants
      if (connection.sessionId) {
        broadcastToSession(connection.sessionId, {
          type: 'chat_message',
          data: {
            ...data,
            userId: connection.userId,
            sessionId: connection.sessionId,
            timestamp: new Date().toISOString()
          }
        }, connectionId)
      }
      break

    case 'typing_start':
      // Broadcast typing indicator
      if (connection.sessionId) {
        broadcastToSession(connection.sessionId, {
          type: 'typing_start',
          data: {
            userId: connection.userId,
            sessionId: connection.sessionId,
            timestamp: new Date().toISOString()
          }
        }, connectionId)
      }
      break

    case 'typing_stop':
      // Broadcast stop typing indicator
      if (connection.sessionId) {
        broadcastToSession(connection.sessionId, {
          type: 'typing_stop',
          data: {
            userId: connection.userId,
            sessionId: connection.sessionId,
            timestamp: new Date().toISOString()
          }
        }, connectionId)
      }
      break

    default:
      console.warn(`Unknown WebSocket message type: ${type}`)
      connection.ws.send(JSON.stringify({
        type: 'error',
        data: {
          error: `Unknown message type: ${type}`,
          timestamp: new Date().toISOString()
        }
      }))
  }
}

// Broadcast message to all connections in a session
function broadcastToSession(sessionId: string, message: any, excludeConnectionId?: string) {
  let broadcastCount = 0
  
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.sessionId === sessionId && connectionId !== excludeConnectionId) {
      try {
        connection.ws.send(JSON.stringify(message))
        broadcastCount++
      } catch (error) {
        console.error(`Error broadcasting to connection ${connectionId}:`, error)
        // Remove failed connection
        connections.delete(connectionId)
      }
    }
  }
  
  console.log(`Broadcasted message to ${broadcastCount} connections in session ${sessionId}`)
}

// Broadcast message to all connections in a project
function broadcastToProject(projectId: string, message: any, excludeConnectionId?: string) {
  let broadcastCount = 0
  
  for (const [connectionId, connection] of connections.entries()) {
    if (connection.projectId === projectId && connectionId !== excludeConnectionId) {
      try {
        connection.ws.send(JSON.stringify(message))
        broadcastCount++
      } catch (error) {
        console.error(`Error broadcasting to connection ${connectionId}:`, error)
        connections.delete(connectionId)
      }
    }
  }
  
  console.log(`Broadcasted message to ${broadcastCount} connections in project ${projectId}`)
}

// HTTP endpoint for WebSocket server status and management
export async function GET(request: NextRequest) {
  // Initialize WebSocket server if not already running
  if (!wss) {
    try {
      initializeWebSocketServer()
    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error)
      return Response.json({ 
        error: 'Failed to initialize WebSocket server',
        details: error.message
      }, { status: 500 })
    }
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  switch (action) {
    case 'status':
      return Response.json({
        status: 'running',
        connections: connections.size,
        port: process.env.WS_PORT || 3001,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      })

    case 'connections':
      // Return connection stats (without sensitive data)
      const connectionStats = Array.from(connections.values()).map(conn => ({
        id: conn.id,
        sessionId: conn.sessionId,
        projectId: conn.projectId,
        lastPing: new Date(conn.lastPing).toISOString(),
        connected: true
      }))
      
      return Response.json({
        totalConnections: connections.size,
        connections: connectionStats
      })

    default:
      return Response.json({
        message: 'WebSocket server endpoint',
        status: wss ? 'running' : 'not initialized',
        connections: connections.size,
        availableActions: ['status', 'connections']
      })
  }
}

// POST endpoint for sending messages via HTTP (for server-side events)
export async function POST(request: NextRequest) {
  try {
    if (!wss) {
      initializeWebSocketServer()
    }

    const data = await request.json()
    const { type, sessionId, projectId, message, excludeUserId } = data

    switch (type) {
      case 'session_message':
        if (!sessionId) {
          return Response.json({ error: 'sessionId is required' }, { status: 400 })
        }
        
        broadcastToSession(sessionId, {
          type: 'session_message',
          data: {
            ...message,
            sessionId,
            timestamp: new Date().toISOString()
          }
        })
        
        return Response.json({ success: true, broadcast: 'session' })

      case 'project_message':
        if (!projectId) {
          return Response.json({ error: 'projectId is required' }, { status: 400 })
        }
        
        broadcastToProject(projectId, {
          type: 'project_message',
          data: {
            ...message,
            projectId,
            timestamp: new Date().toISOString()
          }
        })
        
        return Response.json({ success: true, broadcast: 'project' })

      default:
        return Response.json({ error: 'Invalid message type' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error handling WebSocket HTTP message:', error)
    return Response.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}

// Utility functions for external use
export {
  broadcastToSession,
  broadcastToProject,
  connections
}