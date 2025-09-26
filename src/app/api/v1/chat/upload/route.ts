import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Media, Session } from '@/payload-types'

// POST /api/v1/chat/upload - Upload files during chat conversations
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string
    const messageId = formData.get('messageId') as string || null
    const files = formData.getAll('files') as File[]

    // Validate required fields
    if (!sessionId || files.length === 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          sessionId: !sessionId ? 'sessionId is required' : undefined,
          files: files.length === 0 ? 'At least one file is required' : undefined
        }
      }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Verify session exists and user has access
    const session = await payload.findByID({
      collection: 'sessions',
      id: sessionId,
      depth: 1
    }) as Session

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // TODO: Check if user has access to this session
    // const userId = getUserFromAuth(authHeader)
    // if (!hasSessionAccess(session, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Upload files through PayloadCMS Media collection
    const uploadedMedia: Media[] = []
    
    for (const file of files) {
      try {
        // Validate file size (e.g., max 25MB for chat uploads)
        const maxSize = 25 * 1024 * 1024 // 25MB
        if (file.size > maxSize) {
          return NextResponse.json({
            error: 'File too large',
            details: {
              file: `File ${file.name} exceeds maximum size of 25MB`
            }
          }, { status: 400 })
        }

        // Validate file types (images, documents, audio)
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'text/plain', 'text/markdown',
          'audio/mpeg', 'audio/wav', 'audio/ogg'
        ]

        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({
            error: 'Unsupported file type',
            details: {
              file: `File ${file.name} has unsupported type ${file.type}`
            }
          }, { status: 400 })
        }

        // Create media record for chat upload
        const mediaData = {
          filename: file.name,
          mimeType: file.type,
          filesize: file.size,
          project: session.project,
          mediaType: 'chat_upload',
          agentGenerated: false,
          description: `Chat upload from session ${sessionId}`,
          tags: ['chat', 'upload'],
          relatedElements: {
            sessionId: sessionId,
            messageId: messageId
          },
          status: 'active'
        }

        const media = await payload.create({
          collection: 'media',
          data: mediaData
        }) as Media

        uploadedMedia.push(media)

      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError)
        return NextResponse.json({
          error: 'Upload failed',
          details: {
            file: `Failed to upload ${file.name}`
          }
        }, { status: 500 })
      }
    }

    // Format response
    const response = {
      uploads: uploadedMedia.map((media: Media) => ({
        id: media.id,
        url: media.url || '',
        filename: media.filename || file.name,
        size: media.filesize || 0,
        mimeType: media.mimeType || 'application/octet-stream',
        mediaType: media.mediaType
      }))
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error uploading chat files:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}