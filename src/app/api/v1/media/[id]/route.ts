import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Media } from '@/payload-types'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/v1/media/[id] - Get detailed media information
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Find media with related data
    const media = (await payload.findByID({
      collection: 'media',
      id: id,
      depth: 2, // Include project and other relationships
    })) as Media

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // TODO: Check if user has access to this media via project access
    // const userId = getUserFromAuth(authHeader)
    // if (!hasProjectAccess(media.project, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Format response according to contract
    const response = {
      id: media.id,
      url: media.url || '',
      filename: media.filename || 'unknown',
      mediaType: media.mediaType || 'style_reference',
      agentGenerated: media.agentGenerated || false,
      generationMetadata: media.agentGenerated
        ? {
            agentId: media.generationMetadata?.agentId || '',
            promptUsed: media.generationMetadata?.promptUsed || '',
            modelVersion: media.generationMetadata?.modelVersion || '',
            generationTime: media.generationMetadata?.generationTime || media.createdAt,
            taskId: media.generationMetadata?.taskId || '',
          }
        : null,
      description: media.description || '',
      tags: media.tags || [],
      relatedElements: {
        characters: media.relatedElements?.characters || [],
        episode: media.relatedElements?.episode || null,
        scene: media.relatedElements?.scene || '',
        timestamp: media.relatedElements?.timestamp || null,
      },
      technicalData: {
        duration: media.technicalData?.duration || null,
        resolution: media.technicalData?.resolution || '',
        fps: media.technicalData?.fps || null,
        sampleRate: media.technicalData?.sampleRate || null,
      },
      version: media.version || 1,
      status: media.status || 'active',
      embedding: media.embedding || [],
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching media:', error)

    if (error instanceof Error && error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/v1/media/[id] - Update media metadata
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    const payload = await getPayload({ config })

    // First check if media exists
    const existingMedia = await payload.findByID({
      collection: 'media',
      id: id,
      depth: 1,
    })

    if (!existingMedia) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // TODO: Check permissions
    // const userId = getUserFromAuth(authHeader)
    // if (!hasProjectAccess(existingMedia.project, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Prepare update data (only allow certain fields to be updated)
    const updateData: any = {}

    if (data.description !== undefined) updateData.description = data.description
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.relatedElements !== undefined) {
      updateData.relatedElements = {
        ...existingMedia.relatedElements,
        ...data.relatedElements,
      }
    }

    // Update media
    await payload.update({
      collection: 'media',
      id: id,
      data: updateData,
    })

    // Return the updated media using the same format as GET
    return GET(request, { params })
  } catch (error) {
    console.error('Error updating media:', error)

    if (error instanceof Error && error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/v1/media/[id] - Delete a media file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Check if media exists and user has access
    const media = await payload.findByID({
      collection: 'media',
      id: id,
      depth: 1,
    })

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // TODO: Check permissions
    // const userId = getUserFromAuth(authHeader)
    // if (!hasProjectAccess(media.project, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Delete media (PayloadCMS will handle file cleanup via hooks)
    await payload.delete({
      collection: 'media',
      id: id,
    })

    // Return 204 No Content
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting media:', error)

    if (error instanceof Error && error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
