import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })

    // Get the execution record with populated template
    const execution = await payload.findByID({
      collection: 'prompts-executed',
      id: id,
      depth: 2 // Include related documents
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

    const templateData = typeof execution.templateId === 'object' ? execution.templateId : null;

    const response = {
      id: execution.id,
      templateId: templateData?.id || execution.templateId,
      templateName: templateData?.name || null,
      template: templateData ? {
        id: templateData.id,
        name: templateData.name,
        app: templateData.app,
        stage: templateData.stage,
        feature: templateData.feature,
        tags: Array.isArray(templateData.tags) ? templateData.tags.map((t: any) => (typeof t === "string" ? t : t.value)) : [],
        template: templateData.template,
        variableDefs: templateData.variableDefs || [],
        outputSchema: templateData.outputSchema,
        model: templateData.model,
        notes: templateData.notes
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