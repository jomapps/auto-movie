import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get the execution record with populated template
    const execution = await payload.findByID({
      collection: 'prompts-executed',
      id: params.id,
      populate: {
        templateId: true // Include full template details
      }
    })

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution record not found' },
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

    const response = {
      id: execution.id,
      templateId: execution.templateId?.id || execution.templateId,
      templateName: execution.templateId?.name || null,
      template: execution.templateId ? {
        id: execution.templateId.id,
        name: execution.templateId.name,
        app: execution.templateId.app,
        stage: execution.templateId.stage,
        feature: execution.templateId.feature,
        tags: Array.isArray(execution.templateId.tags) ? execution.templateId.tags.map((t: any) => (typeof t === "string" ? t : t.value)) : [],
        template: execution.templateId.template,
        variableDefs: execution.templateId.variableDefs || [],
        outputSchema: execution.templateId.outputSchema,
        model: execution.templateId.model,
        notes: execution.templateId.notes
      } : null,
      app: execution.app,
      stage: execution.stage,
      feature: execution.feature,
      projectId: execution.projectId,
      tags: Array.isArray(execution.tagsSnapshot) ? execution.tagsSnapshot.map((t: any) => (typeof t === "string" ? t : t.value)) : [],
      inputs: execution.inputs || {},
      resolvedPrompt: execution.resolvedPrompt,
      model: execution.model,
      status: execution.status,
      outputRaw: execution.outputRaw,
      errorMessage: execution.errorMessage,
      executionTime: (execution.startedAt && execution.finishedAt) ? (new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) : undefined,
      startedAt: execution.startedAt,
      finishedAt: execution.finishedAt,
      notes: execution.notes,
      createdAt: execution.createdAt,
      updatedAt: execution.updatedAt
    }

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

  } catch (error) {
    console.error('Error fetching prompt execution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt execution' },
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