import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/utils/getPayload'
import type { Project, User, Media } from '@/payload-types'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/v1/projects/[id] - Get detailed project information
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload()
    
    // Find project with all related data
    const project = await payload.findByID({
      collection: 'projects',
      id: params.id,
      depth: 3 // Include deeply nested relations
    }) as Project & {
      createdBy: User
      collaborators: User[]
      styleReferences: Media[]
    }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // TODO: Check if user has access to this project
    // const userId = getUserFromAuth(authHeader)
    // if (project.createdBy.id !== userId && !project.collaborators.find(c => c.id === userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Format response according to contract
    const response = {
      id: project.id,
      title: project.title,
      description: project.description,
      genre: project.genre,
      episodeCount: project.episodeCount,
      targetAudience: project.targetAudience,
      status: project.status,
      createdBy: {
        id: project.createdBy?.id || 'unknown',
        name: (project.createdBy as User)?.name || 'Unknown User',
        email: (project.createdBy as User)?.email || 'unknown@example.com'
      },
      collaborators: (project.collaborators || []).map((collaborator: User) => ({
        id: collaborator.id,
        name: collaborator.name || 'Unknown User',
        email: collaborator.email
      })),
      styleReferences: (project.styleReferences || []).map((media: Media) => ({
        id: media.id,
        url: media.url || '',
        filename: media.filename || 'unknown'
      })),
      projectSettings: project.projectSettings || {
        aspectRatio: '16:9',
        episodeDuration: 30,
        qualityTier: 'standard'
      },
      progress: project.progress || {
        currentPhase: 'concept',
        completedSteps: [],
        overallProgress: 0
      },
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching project:', error)
    
    // Handle specific MongoDB/Payload errors
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/projects/[id] - Update project information
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    const payload = await getPayload()

    // First check if project exists and user has access
    const existingProject = await payload.findByID({
      collection: 'projects',
      id: params.id,
      depth: 1
    })

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // TODO: Check permissions
    // const userId = getUserFromAuth(authHeader)
    // if (existingProject.createdBy !== userId && !existingProject.collaborators.includes(userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Prepare update data (only allow certain fields to be updated)
    const updateData: any = {}
    
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.status !== undefined) updateData.status = data.status
    if (data.projectSettings !== undefined) updateData.projectSettings = {
      ...existingProject.projectSettings,
      ...data.projectSettings
    }

    // Update project
    const updatedProject = await payload.update({
      collection: 'projects',
      id: params.id,
      data: updateData
    })

    // Return the updated project using the same format as GET
    return GET(request, { params })

  } catch (error) {
    console.error('Error updating project:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/projects/[id] - Delete project and all associated data  
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload()

    // Check if project exists and user is the creator
    const project = await payload.findByID({
      collection: 'projects',
      id: params.id,
      depth: 0
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // TODO: Check if user is the creator (only creators can delete)
    // const userId = getUserFromAuth(authHeader)
    // if (project.createdBy !== userId) {
    //   return NextResponse.json({ 
    //     error: 'Insufficient permissions',
    //     message: 'Only project creators can delete projects'
    //   }, { status: 403 })
    // }

    // Delete project (PayloadCMS will handle cascading deletes via hooks if configured)
    await payload.delete({
      collection: 'projects',
      id: params.id
    })

    // Return 204 No Content
    return new NextResponse(null, { status: 204 })

  } catch (error) {
    console.error('Error deleting project:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}