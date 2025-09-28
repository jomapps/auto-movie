import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'
import type { PromptExecuteRequest, VariableDefinition, ModelType } from '@/types/api'
import { createExecutionEngine, type VariableContext } from '@/lib/prompts/engine'

export async function POST(request: NextRequest) {
  try {
    const body: PromptExecuteRequest = await request.json()
    const {
      templateId,
      inlineTemplate,
      variableDefs,
      inputs,
      model,
      app,
      stage,
      feature,
      projectId
    } = body

    // Validate required fields
    if (!app || !stage) {
      return NextResponse.json(
        { error: 'App and stage are required' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      )
    }

    const payload = await getPayload({ config: configPromise })

    let template = null
    let resolvedPrompt = ''
    let templateVariableDefs: VariableDefinition[] = []
    let tagsSnapshot: any[] = []
    let finalModel: ModelType = model || 'anthropic/claude-sonnet-4'

    const startedAt = new Date()

    try {
      // If templateId is provided, load the template
      if (templateId) {
        template = await payload.findByID({
          collection: 'prompt-templates',
          id: templateId
        })

        if (!template) {
          return NextResponse.json(
            { error: 'Template not found' },
            {
              status: 404,
              headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
              }
            }
          )
        }

        templateVariableDefs = template.variableDefs || []
        tagsSnapshot = template.tags || []
        finalModel = model || template.model

        // Resolve variables in template
        resolvedPrompt = resolveVariables(template.template, templateVariableDefs, inputs)
      } else if (inlineTemplate) {
        // Use inline template
        templateVariableDefs = variableDefs || []
        resolvedPrompt = resolveVariables(inlineTemplate, templateVariableDefs, inputs)
      } else {
        return NextResponse.json(
          { error: 'Either templateId or inlineTemplate must be provided' },
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        )
      }

      // Validate required inputs
      const missingRequired = templateVariableDefs
        .filter(varDef => varDef.required && !(varDef.name in inputs))
        .map(varDef => varDef.name)

      if (missingRequired.length > 0) {
        return NextResponse.json(
          {
            error: 'Missing required variables',
            missingVariables: missingRequired
          },
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        )
      }

      // Route to provider by model and execute using the real execution engine
      const executionEngine = createExecutionEngine()

      const variableContext: VariableContext = {
        variables: inputs,
        variableDefs: templateVariableDefs
      }

      const executionResult = await executionEngine.execute(
        template?.template || inlineTemplate!,
        variableContext,
        finalModel as ModelType
      )

      const finishedAt = new Date()

      // Store execution in PayloadCMS
      const executionRecord = await payload.create({
        collection: 'prompts-executed',
        data: {
          templateId: templateId || undefined,
          app,
          stage,
          feature,
          projectId,
          tagsSnapshot,
          inputs,
          resolvedPrompt: executionResult.status === 'success' ? resolvedPrompt : template?.template || inlineTemplate!,
          model: finalModel,
          status: executionResult.status,
          outputRaw: executionResult.output,
          errorMessage: executionResult.errorMessage,
          startedAt: startedAt.toISOString(),
          finishedAt: finishedAt.toISOString()
        }
      })

      return NextResponse.json({
        id: executionRecord.id,
        templateId,
        app,
        stage,
        feature,
        projectId,
        inputs,
        resolvedPrompt: executionResult.status === 'success' ? resolvedPrompt : template?.template || inlineTemplate!,
        model: finalModel,
        status: executionResult.status,
        outputRaw: executionResult.output,
        errorMessage: executionResult.errorMessage,
        executionTime: executionResult.executionTime,
        providerUsed: executionResult.providerUsed,
        metrics: executionResult.metrics,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        createdAt: executionRecord.createdAt,
        updatedAt: executionRecord.updatedAt
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      })

    } catch (executionError) {
      console.error('Error during prompt execution:', executionError)

      // Store failed execution
      const finishedAt = new Date()
      const errorMessage = executionError instanceof Error ? executionError.message : 'Unknown execution error'

      try {
        const executionRecord = await payload.create({
          collection: 'prompts-executed',
          data: {
            templateId: templateId || undefined,
            app,
            stage,
            feature,
            projectId,
            tagsSnapshot,
            inputs,
            resolvedPrompt,
            model: finalModel,
            status: 'error',
            errorMessage,
            startedAt: startedAt.toISOString(),
            finishedAt: finishedAt.toISOString()
          }
        })

        return NextResponse.json({
          id: executionRecord.id,
          status: 'error',
          errorMessage,
          resolvedPrompt
        }, {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      } catch (saveError) {
        console.error('Error saving failed execution:', saveError)
        return NextResponse.json(
          { error: 'Execution failed and could not be saved' },
          {
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
          }
        )
      }
    }

  } catch (error) {
    console.error('Error in prompt execution endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to execute prompt' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  }
}


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}