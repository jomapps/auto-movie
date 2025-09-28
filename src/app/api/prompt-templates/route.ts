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
      tags: template.tags || [],
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