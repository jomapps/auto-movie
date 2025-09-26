import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Media, Project } from '@/payload-types'

// POST /api/v1/media/upload - Upload media files to a project
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const projectId = formData.get('projectId') as string
    const mediaType = formData.get('mediaType') as string
    const description = formData.get('description') as string || ''
    const tags = formData.get('tags') as string || ''
    const files = formData.getAll('files') as File[]

    // Validate required fields
    if (!projectId || !mediaType || files.length === 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          projectId: !projectId ? 'projectId is required' : undefined,
          mediaType: !mediaType ? 'mediaType is required' : undefined,
          files: files.length === 0 ? 'At least one file is required' : undefined
        }
      }, { status: 400 })
    }

    // Validate mediaType
    const validMediaTypes = [
      'style_reference', 'character_design', 'environment_design', 'concept_art',
      'storyboard', 'video_segment', 'audio_clip', 'voice_profile', 'music_track',
      'sound_effect', 'final_video'
    ]
    
    if (!validMediaTypes.includes(mediaType)) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          mediaType: `mediaType must be one of: ${validMediaTypes.join(', ')}`
        }
      }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Verify project exists and user has access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // TODO: Check if user has access to upload to this project
    // const userId = getUserFromAuth(authHeader)
    // if (!hasProjectAccess(project, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Process tags
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []

    // Upload files through PayloadCMS Media collection
    const uploadedMedia: Media[] = []
    
    for (const file of files) {
      try {
        // Validate file size (e.g., max 50MB)
        const maxSize = 50 * 1024 * 1024 // 50MB
        if (file.size > maxSize) {
          return NextResponse.json({
            error: 'File too large',
            details: {
              file: `File ${file.name} exceeds maximum size of 50MB`
            }
          }, { status: 400 })
        }

        // Convert File to Buffer for PayloadCMS
        const buffer = Buffer.from(await file.arrayBuffer())
        
        // Create media record via PayloadCMS
        const mediaData = {
          filename: file.name,
          mimeType: file.type,
          filesize: file.size,
          project: projectId,
          mediaType: mediaType,
          agentGenerated: false,
          description: description,
          tags: tagsArray,
          status: 'processing', // Will be updated after processing
          // uploader: userId, // TODO: Set from authenticated user
          // The file buffer will be handled by PayloadCMS upload functionality
        }

        // Note: This is a simplified version. In a real implementation,
        // you would need to properly integrate with PayloadCMS file upload system
        const media = await payload.create({
          collection: 'media',
          data: mediaData,
          // file: buffer, // PayloadCMS handles file storage
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

    // Format response according to contract
    const response = {
      media: uploadedMedia.map((media: Media) => ({
        id: media.id,
        url: media.url || '', // PayloadCMS will generate this
        filename: media.filename || file.name,
        mediaType: media.mediaType,
        size: media.filesize || 0,
        mimeType: media.mimeType || 'application/octet-stream',
        status: media.status || 'processing'
      }))
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error uploading media:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}