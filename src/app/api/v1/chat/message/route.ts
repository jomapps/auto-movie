import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { projectId, sessionId, message } = body

    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create session
    let session
    if (sessionId) {
      session = await payload.findByID({
        collection: 'sessions',
        id: sessionId,
      })
    }

    if (!session) {
      session = await payload.create({
        collection: 'sessions',
        data: {
          project: projectId,
          user: 'temp-user-id', // TODO: Get from auth
          currentStep: 'initial_concept',
          conversationHistory: [],
          contextData: {},
          awaitingUserInput: true,
        },
      })
    }

    // Add message to conversation history
    const updatedHistory = [
      ...(session.conversationHistory || []),
      {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
    ]

    // Generate AI response (placeholder)
    const aiResponse = `Thank you for your message about the movie concept. I understand you want to ${message.toLowerCase()}. Let me help you develop this further.`
    
    updatedHistory.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    })

    // Generate contextual choices
    const choices = [
      {
        id: 'develop_story',
        title: 'Develop Story Structure',
        description: 'Create detailed narrative arc and episode breakdown',
        isRecommended: true,
        estimatedTime: '10-15 minutes',
        icon: '📚',
      },
      {
        id: 'create_characters',
        title: 'Design Main Characters',
        description: 'Develop protagonist, antagonist, and key supporting characters',
        estimatedTime: '15-20 minutes',
        icon: '👥',
      },
      {
        id: 'manual_override',
        title: 'Manual Override',
        description: 'I want to specify exactly what to do next',
        isManualOverride: true,
        icon: '✏️',
      },
    ]

    // Update session
    await payload.update({
      collection: 'sessions',
      id: session.id,
      data: {
        conversationHistory: updatedHistory,
        lastChoices: choices,
        awaitingUserInput: true,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      response: aiResponse,
      choices,
      currentStep: session.currentStep,
      progress: 5, // Basic progress increment
    })

  } catch (error) {
    console.error('Chat message processing error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}