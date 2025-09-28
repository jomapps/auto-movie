import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

export async function GET(
  request: NextRequest,
  { params }: { params: { group: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const payload = await getPayload({ config: configPromise })

    // Find templates that have tags starting with the group prefix
    const result = await payload.find({
      collection: 'prompt-templates',
      where: {
        'tags.value': {
          like: `${params.group}%`
        }
      },
      page,
      limit,
      sort: ['tags.value', '-updatedAt'] // Sort by tag value first for grouping
    })

    // Transform and sort the results by numeric suffix
    const templates = result.docs
      .map((template: any) => {
        // Find the relevant tag for this group
        const relevantTag = template.tags?.find((tag: any) =>
          tag.value?.startsWith(params.group)
        )

        return {
          id: template.id,
          name: template.name,
          app: template.app,
          stage: template.stage,
          feature: template.feature,
          tags: Array.isArray(template.tags) ? template.tags.map((t: any) => typeof t === "string" ? t : t.value) : [],
          relevantTag: relevantTag?.value,
          template: template.template,
          variableDefs: template.variableDefs || [],
          outputSchema: template.outputSchema,
          model: template.model,
          notes: template.notes,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt
        }
      })
      .sort((a: any, b: any) => {
        // Extract numeric suffix for proper ordering
        const extractNumber = (tag: string) => {
          const match = tag?.match(/-(\d+)$/)
          return match ? parseInt(match[1]) : 0
        }

        const aNum = extractNumber(a.relevantTag)
        const bNum = extractNumber(b.relevantTag)

        return aNum - bNum
      })

    return NextResponse.json({
      templates,
      group: params.group,
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
    console.error('Error fetching templates by tag group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates by tag group' },
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