import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const app = searchParams.get('app')
    const stage = searchParams.get('stage')
    const feature = searchParams.get('feature')
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const payload = await getPayload({ config: configPromise })

    // Build the where clause
    const where: any = {}

    if (app) where.app = { equals: app }
    if (stage) where.stage = { equals: stage }
    if (feature) where.feature = { equals: feature }
    if (projectId) where.projectId = { equals: projectId }
    if (status) where.status = { equals: status }

    // Handle date range filtering
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.greater_than_equal = new Date(dateFrom)
      if (dateTo) where.createdAt.less_than_equal = new Date(dateTo)
    }

    // Handle search across resolved prompt and notes
    if (search) {
      where.or = [
        { resolvedPrompt: { like: search } },
        { notes: { like: search } },
        { errorMessage: { like: search } }
      ]
    }

    // Query executions with sorting by most recent first
    const result = await payload.find({
      collection: 'prompts-executed',
      where,
      page,
      limit,
      sort: ['-createdAt'],
      populate: {
        templateId: true // Include template details
      }
    })

    // Transform the data for the response
    const executions = result.docs.map((execution: any) => ({
      id: execution.id,
      templateId: execution.templateId?.id || execution.templateId,
      templateName: execution.templateId?.name || null,
      template: execution.templateId ? {
        id: execution.templateId.id,
        name: execution.templateId.name,
        app: execution.templateId.app,
        stage: execution.templateId.stage,
        feature: execution.templateId.feature
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
    }))

    return NextResponse.json({
      executions,
      pagination: {
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        totalDocs: result.totalDocs,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

  } catch (error) {
    console.error('Error fetching prompt executions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt executions' },
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