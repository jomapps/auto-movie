import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const app = searchParams.get('app')
    const stage = searchParams.get('stage')
    const feature = searchParams.get('feature')
    const tagGroup = searchParams.get('tagGroup')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const payload = await getPayload({ config: configPromise })

    // Build the where clause
    const where: any = {}

    if (app) where.app = { equals: app }
    if (stage) where.stage = { equals: stage }
    if (feature) where.feature = { equals: feature }

    // Handle tag group filtering
    if (tagGroup) {
      where['tags.value'] = { like: `${tagGroup}%` }
    }

    // Handle search across name and template fields
    if (search) {
      where.or = [
        { name: { like: search } },
        { template: { like: search } },
        { notes: { like: search } }
      ]
    }

    // Query templates with sorting
    const result = await payload.find({
      collection: 'prompt-templates',
      where,
      page,
      limit,
      sort: tagGroup ? ['tags.value', '-updatedAt'] : ['-updatedAt']
    })

    // Transform the data for the response
    const templates = result.docs.map((template: any) => ({
      id: template.id,
      name: template.name,
      app: template.app,
      stage: template.stage,
      feature: template.feature,
      tags: Array.isArray(template.tags) ? template.tags.map((t: any) => typeof t === "string" ? t : t.value) : [],
      template: template.template,
      variableDefs: template.variableDefs || [],
      outputSchema: template.outputSchema,
      model: template.model,
      notes: template.notes,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt
    }))

    return NextResponse.json({
      templates,
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
    console.error('Error fetching prompt templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt templates' },
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


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, app, stage, feature, tags, template, variableDefs, model, notes } = body || {}

    if (!name || !app || !stage || !template || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: name, app, stage, template, model' },
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

    const normalizedTags = Array.isArray(tags)
      ? tags.map((t: any) => (typeof t === 'string' ? { value: t } : t))
      : []

    const created = await payload.create({
      collection: 'prompt-templates',
      data: {
        name,
        app,
        stage,
        feature,
        tags: normalizedTags,
        template,
        variableDefs: Array.isArray(variableDefs) ? variableDefs : [],
        model,
        notes,
      },
    })

    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        app: created.app,
        stage: created.stage,
        feature: created.feature,
        tags: Array.isArray(created.tags) ? created.tags.map((t: any) => (typeof t === 'string' ? t : t.value)) : [],
        template: created.template,
        variableDefs: created.variableDefs || [],
        outputSchema: created.outputSchema,
        model: created.model,
        notes: created.notes,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
    )
  } catch (error) {
    console.error('Error creating prompt template:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt template' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      },
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