import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const includeVersions = searchParams.get('includeVersions') === 'true'
    const { id } = await params

    const payload = await getPayload({ config: configPromise })

    // Get the template
    const template = await payload.findByID({
      collection: 'prompt-templates',
      id: id
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

    let versions = null
    if (includeVersions) {
      try {
        const versionsResult = await payload.findVersions({
          collection: 'prompt-templates',
          where: { parent: { equals: id } },
          sort: '-createdAt',
          limit: 10
        })
        versions = versionsResult.docs
      } catch (versionError) {
        console.warn('Error fetching versions:', versionError)
        // Continue without versions if there's an error
      }
    }

    const response = {
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
      updatedAt: template.updatedAt,
      ...(versions && { versions })
    }

    return NextResponse.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

  } catch (error) {
    console.error('Error fetching prompt template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt template' },
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