import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { workflowEngine } from '@/services/workflowEngine'
import { CeleryBridge } from '@/services/celeryBridge'
import type { WorkflowPhase } from '@/types/workflow'
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

    // Verify user has access to this session (via project access)
    const hasAccess = await validateResourceOwnership(user.id, 'session', sessionId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this session' },
        { status: 403 }
      )
    }

    // Get project to access progress and entity counts
    const project = await payload.findByID({
      collection: 'projects',
      id: session.project,
      depth: 2,
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

    // PHASE 0 INTEGRATION: Determine next step based on choice
    let nextStep = session.currentStep
    const stepMapping: Record<string, WorkflowPhase> = {
      develop_story: 'story_development',
      create_characters: 'character_creation',
      develop_scenes: 'scene_production',
      define_locations: 'visual_design',
      start_production: 'post_production',
    }

    if (choiceId !== 'manual_override' && stepMapping[choiceId]) {
      nextStep = stepMapping[choiceId]
    }

    // PHASE 0 INTEGRATION: Validate step advancement with WorkflowEngine
    if (nextStep !== session.currentStep) {
      const completedSteps = (project?.progress?.completedSteps || []) as WorkflowPhase[]

      // Count entities from project
      const characterCount = await payload.count({
        collection: 'characters',
        where: { project: { equals: project.id } },
      })

      const sceneCount = await payload.count({
        collection: 'scenes',
        where: { project: { equals: project.id } },
      })

      // Note: Locations collection not yet implemented
      const locationCount = { totalDocs: 0 }

      const episodeCount = await payload.count({
        collection: 'episodes',
        where: { project: { equals: project.id } },
      })

      // TODO: Implement workflow validation when validateStepAdvancement is available
      // Basic validation - ensure we have minimum entities for production phases
      const requiresProduction = ['post_production', 'final_assembly'].includes(nextStep)
      const hasMinimumEntities = characterCount.totalDocs > 0 && sceneCount.totalDocs > 0
      
      if (requiresProduction && !hasMinimumEntities) {
        return NextResponse.json(
          {
            error: 'Cannot advance to production phase',
            validationErrors: ['Missing required entities: Need at least one character and scene'],
            currentStep: session.currentStep,
          },
          { status: 400 }
        )
      }
    }

    // Process choice selection
    let aiResponse = ''

    if (choiceId === 'manual_override') {
      aiResponse = `I understand you want to ${customInput}. Let me help you with that specific direction.`
    } else if (choiceId === 'develop_story') {
      aiResponse = `Great choice! Let's start developing your story structure. I'll help you create a compelling narrative arc.`
    } else if (choiceId === 'create_characters') {
      aiResponse = `Excellent! Character development is crucial. Let's create memorable characters for your story.`
    } else if (choiceId === 'develop_scenes') {
      aiResponse = `Perfect! Let's plan out the scenes for your story. We'll structure them to create maximum impact.`
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

    // PHASE 0 INTEGRATION: Trigger production workflows if advancing to production
    const productionTasks: string[] = []

    if (nextStep === 'production' && session.currentStep !== 'production') {
      const celeryBridge = new CeleryBridge()

      // Get all scenes for the project
      const scenes = await payload.find({
        collection: 'scenes',
        where: { project: { equals: project.id } },
        limit: 100,
      })

      console.log('[Chat Choice] Starting production for', scenes.docs.length, 'scenes')

      // Trigger scene generation for each scene
      for (const scene of scenes.docs) {
        try {
          const task = await celeryBridge.triggerSceneGeneration({
            sceneId: scene.id,
            projectId: project.id,
          })
          productionTasks.push(task.taskId)
        } catch (error) {
          console.error('[Chat Choice] Failed to trigger scene generation:', error)
        }
      }
    }

    // Update session
    await payload.update({
      collection: 'sessions',
      id: session.id,
      data: {
        conversationHistory: updatedHistory,
        currentStep: nextStep,
        lastChoices: choices,
        awaitingUserInput: true,
        contextData: {
          ...(session.contextData as Record<string, any> || {}),
          lastChoice: choiceId,
          productionTasks: [
            ...(((session.contextData as Record<string, any>)?.productionTasks as string[]) || []),
            ...productionTasks,
          ],
        },
      },
    })

    // Update project workflow progress
    if (nextStep !== session.currentStep) {
      const completedSteps = (project?.progress?.completedSteps || []) as WorkflowPhase[]

      if (!completedSteps.includes(session.currentStep as WorkflowPhase)) {
        completedSteps.push(session.currentStep as WorkflowPhase)
      }

      await payload.update({
        collection: 'projects',
        id: project.id,
        data: {
          progress: {
            currentPhase: nextStep as any, // TODO: Update Project collection to include all WorkflowPhase values
            completedSteps,
            overallProgress: Math.min((project?.progress?.overallProgress || 0) + 10, 100),
          },
        },
      })
    }

    return NextResponse.json({
      sessionId: session.id,
      response: aiResponse,
      choices,
      currentStep: nextStep,
      progress: Math.min((project?.progress?.overallProgress || 0) + 10, 100),
      productionTasks: productionTasks.map((taskId) => ({
        taskId,
        status: 'pending',
        type: 'scene_generation',
      })),
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
