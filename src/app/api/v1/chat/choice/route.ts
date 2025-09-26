import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const { sessionId, choiceId, customInput } = body

    if (!sessionId || !choiceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get session
    const session = await payload.findByID({
      collection: 'sessions',
      id: sessionId,
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get project to access progress
    const project = await payload.findByID({
      collection: 'projects',
      id: session.project,
    })

    // Handle manual override
    if (choiceId === 'manual_override') {
      if (!customInput || customInput.trim() === '') {
        return NextResponse.json(
          { error: 'Manual override requires custom input required' },
          { status: 400 }
        )
      }
    }

    // Process choice selection
    let aiResponse = ''
    let nextStep = session.currentStep

    if (choiceId === 'manual_override') {
      aiResponse = `I understand you want to ${customInput}. Let me help you with that specific direction.`
    } else if (choiceId === 'develop_story') {
      aiResponse = `Great choice! Let's start developing your story structure. I'll help you create a compelling narrative arc.`
      nextStep = 'story_development'
    } else if (choiceId === 'create_characters') {
      aiResponse = `Excellent! Character development is crucial. Let's create memorable characters for your story.`
      nextStep = 'character_creation'
    } else {
      aiResponse = `I'll help you with that selection. Let's continue developing your movie project.`
    }

    // Add to conversation history
    const currentHistory = Array.isArray(session.conversationHistory)
      ? session.conversationHistory
      : []
    const updatedHistory = [
      ...currentHistory,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      },
    ]

    // Generate next choices based on new step
    const choices = [
      {
        id: 'continue_current',
        title: 'Continue Current Step',
        description: 'Keep working on the current aspect',
        isRecommended: true,
        estimatedTime: '5-10 minutes',
        icon: '▶️',
      },
      {
        id: 'review_progress',
        title: 'Review Progress',
        description: 'See what has been completed and what needs work',
        estimatedTime: '3-5 minutes',
        icon: '📊',
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
        currentStep: nextStep,
        lastChoices: choices,
        awaitingUserInput: true,
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      response: aiResponse,
      choices,
      currentStep: nextStep,
      progress: Math.min((project?.progress?.overallProgress || 0) + 10, 100),
    })
  } catch (error) {
    console.error('Chat choice processing error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
