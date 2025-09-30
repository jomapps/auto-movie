import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { OpenRouterLLMService } from '@/services/OpenRouterLLMService'
import { DataExtractionService } from '@/services/DataExtractionService'
import { PayloadIntegrationService } from '@/services/PayloadIntegrationService'
import { CeleryBridge } from '@/services/CeleryBridge'
import { authenticateRequest, validateResourceOwnership } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user with PayloadCMS
    const authResult = await authenticateRequest(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      )
    }

    const user = authResult.user
    const payload = await getPayload({ config })
    const body = await request.json()
    const { projectId, sessionId, message } = body

    if (!projectId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user has access to the project
    const hasAccess = await validateResourceOwnership(user.id, 'project', projectId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this project' },
        { status: 403 }
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
          user: user.id,
          currentStep: 'initial_concept',
          conversationHistory: [],
          contextData: {},
          awaitingUserInput: true,
        },
      })
    }

    // Add message to conversation history
    const currentHistory = Array.isArray(session.conversationHistory)
      ? session.conversationHistory
      : []
    const updatedHistory = [
      ...currentHistory,
      {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
    ]

    // PHASE 0 INTEGRATION: Generate AI response with OpenRouter
    const llmService = new OpenRouterLLMService()
    const llmResponse = await llmService.generateResponse(
      updatedHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        projectId,
        currentStep: session.currentStep,
        sessionId: session.id,
      }
    )

    const aiResponse = llmResponse.message

    updatedHistory.push({
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString(),
    })

    // PHASE 0 INTEGRATION: Extract structured data from message
    const extractionService = new DataExtractionService()
    const extracted = await extractionService.extractStructuredData(message, {
      projectId,
      currentStep: session.currentStep,
    })

    console.log('[Chat Message] Extracted entities:', {
      count: extracted.entities.length,
      types: extracted.entities.map((e) => e.type),
    })

    // PHASE 0 INTEGRATION: Create entities in PayloadCMS
    let createdEntities = {
      characters: [],
      scenes: [],
      locations: [],
      props: [],
      events: [],
    }

    if (extracted.entities.length > 0) {
      const payloadService = new PayloadIntegrationService()
      createdEntities = await payloadService.createFromExtractedData(
        extracted.entities,
        projectId
      )

      // Update project entity counts
      await payloadService.updateProjectEntities(projectId, createdEntities)

      console.log('[Chat Message] Created entities:', {
        characters: createdEntities.characters.length,
        scenes: createdEntities.scenes.length,
        locations: createdEntities.locations.length,
      })
    }

    // PHASE 0 INTEGRATION: Trigger production workflows
    const productionTasks: string[] = []

    if (createdEntities.characters.length > 0) {
      const celeryBridge = new CeleryBridge()

      for (const character of createdEntities.characters) {
        try {
          const task = await celeryBridge.triggerCharacterSheetGeneration({
            characterId: character.id,
            projectId,
          })
          productionTasks.push(task.taskId)
          console.log('[Chat Message] Triggered character sheet generation:', {
            characterId: character.id,
            taskId: task.taskId,
          })
        } catch (error) {
          console.error('[Chat Message] Failed to trigger character sheet:', error)
        }
      }
    }

    // Generate contextual choices (enhanced with AI suggestions)
    const suggestedActions = llmResponse.suggestedActions || []
    const choices = [
      {
        id: 'develop_story',
        title: 'Develop Story Structure',
        description: 'Create detailed narrative arc and episode breakdown',
        isRecommended: suggestedActions.includes('develop_story'),
        estimatedTime: '10-15 minutes',
        icon: '📚',
      },
      {
        id: 'create_characters',
        title: 'Design Main Characters',
        description: 'Develop protagonist, antagonist, and key supporting characters',
        isRecommended: suggestedActions.includes('create_characters'),
        estimatedTime: '15-20 minutes',
        icon: '👥',
      },
      {
        id: 'develop_scenes',
        title: 'Plan Scenes',
        description: 'Create and organize scenes for your story',
        isRecommended: suggestedActions.includes('develop_scenes'),
        estimatedTime: '10-15 minutes',
        icon: '🎬',
      },
      {
        id: 'manual_override',
        title: 'Manual Override',
        description: 'I want to specify exactly what to do next',
        isManualOverride: true,
        icon: '✏️',
      },
    ]

    // Update session with conversation history and extraction data
    await payload.update({
      collection: 'sessions',
      id: session.id,
      data: {
        conversationHistory: updatedHistory,
        lastChoices: choices,
        awaitingUserInput: true,
        contextData: {
          ...(session.contextData || {}),
          lastExtraction: {
            entities: extracted.entities.map((e) => ({
              type: e.type,
              confidence: e.confidence,
            })),
            summary: extracted.summary,
          },
          createdEntities,
          productionTasks,
        },
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      response: aiResponse,
      choices,
      currentStep: session.currentStep,
      progress: 5, // Basic progress increment
      createdEntities: {
        characters: createdEntities.characters.map((c) => ({ id: c.id, name: c.name })),
        scenes: createdEntities.scenes.map((s) => ({ id: s.id, title: s.title })),
        locations: createdEntities.locations.map((l) => ({ id: l.id, name: l.name })),
      },
      productionTasks: productionTasks.map((taskId) => ({
        taskId,
        status: 'pending',
        type: 'character_sheet',
      })),
      extraction: {
        summary: extracted.summary,
        entityCount: extracted.entities.length,
      },
    })
  } catch (error) {
    console.error('Chat message processing error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
