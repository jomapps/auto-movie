import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/utils/getPayload'
import type { Session, Project } from '@/payload-types'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/v1/chat/session/[id] - Get detailed session information with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload()
    
    // Find session with related data
    const session = await payload.findByID({
      collection: 'sessions',
      id: params.id,
      depth: 2 // Include project and participants
    }) as Session

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // TODO: Check if user has access to this session
    // const userId = getUserFromAuth(authHeader)
    // if (!hasSessionAccess(session, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Format response according to contract
    const response = {
      id: session.id,
      title: session.title || `Session ${session.id}`,
      projectId: typeof session.project === 'object' ? session.project.id : session.project,
      projectName: typeof session.project === 'object' ? session.project.title : '',
      status: session.status || 'active',
      messageCount: session.messageCount || 0,
      participants: session.participants || [],
      conversationHistory: session.conversationHistory || [],
      metadata: session.metadata || {},
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching session:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/chat/session/[id] - Send a message to the session
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    const { message, role = 'user', attachments = [] } = data

    // Validate required fields
    if (!message) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          message: 'message is required'
        }
      }, { status: 400 })
    }

    const payload = await getPayload()

    // Check if session exists and user has access
    const session = await payload.findByID({
      collection: 'sessions',
      id: params.id,
      depth: 1
    }) as Session

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // TODO: Check permissions
    // const userId = getUserFromAuth(authHeader)
    // if (!hasSessionAccess(session, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Create new message
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: role,
      content: message,
      attachments: attachments,
      timestamp: new Date().toISOString(),
      // userId: userId // TODO: Set from authenticated user
    }

    // Update session with new message
    const updatedConversationHistory = [
      ...(session.conversationHistory || []),
      newMessage
    ]

    await payload.update({
      collection: 'sessions',
      id: params.id,
      data: {
        conversationHistory: updatedConversationHistory,
        messageCount: updatedConversationHistory.length,
        lastActivity: new Date().toISOString()
      }
    })

    // Return the new message
    return NextResponse.json({
      message: newMessage,
      sessionId: session.id,
      messageCount: updatedConversationHistory.length
    }, { status: 201 })

  } catch (error) {
    console.error('Error sending message:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/chat/session/[id] - Update session metadata
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    const payload = await getPayload()

    // First check if session exists
    const existingSession = await payload.findByID({
      collection: 'sessions',
      id: params.id,
      depth: 1
    })

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // TODO: Check permissions
    // const userId = getUserFromAuth(authHeader)
    // if (!hasSessionAccess(existingSession, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Prepare update data (only allow certain fields to be updated)
    const updateData: any = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.status !== undefined) updateData.status = data.status
    if (data.metadata !== undefined) {
      updateData.metadata = {
        ...existingSession.metadata,
        ...data.metadata
      }
    }

    // Update session
    await payload.update({
      collection: 'sessions',
      id: params.id,
      data: updateData
    })

    // Return the updated session using the same format as GET
    return GET(request, { params })

  } catch (error) {
    console.error('Error updating session:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/chat/session/[id] - Delete a session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload()

    // Check if session exists and user has access
    const session = await payload.findByID({
      collection: 'sessions',
      id: params.id,
      depth: 1
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // TODO: Check permissions
    // const userId = getUserFromAuth(authHeader)
    // if (!hasSessionAccess(session, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Delete session
    await payload.delete({
      collection: 'sessions',
      id: params.id
    })

    // Return 204 No Content
    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error('Error deleting session:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}