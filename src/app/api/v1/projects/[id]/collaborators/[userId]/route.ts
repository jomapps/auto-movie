import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Project, User } from '@/payload-types'

interface RouteParams {
  params: Promise<{
    id: string
    userId: string
  }>
}

// DELETE /api/v1/projects/[id]/collaborators/[userId] - Remove a collaborator from a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id, userId } = await params
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Check if project exists
    const project = (await payload.findByID({
      collection: 'projects',
      id: id,
      depth: 1,
    })) as Project & { createdBy: User; collaborators: User[] }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // TODO: Check if user has permission to remove collaborators (owner or admin)
    // const currentUserId = getUserFromAuth(authHeader)
    // if (project.createdBy.id !== currentUserId) {
    //   return NextResponse.json({
    //     error: 'Insufficient permissions',
    //     message: 'Only project creators can remove collaborators'
    //   }, { status: 403 })
    // }

    // Check if the user is actually a collaborator
    const currentCollaborators = project.collaborators || []
    const collaboratorExists = currentCollaborators.some(
      c => (typeof c === 'string' ? c : c.id) === userId
    )

    if (!collaboratorExists) {
      return NextResponse.json(
        {
          error: 'Collaborator not found',
          message: 'The specified user is not a collaborator on this project',
        },
        { status: 404 }
      )
    }

    // Remove the collaborator
    const updatedCollaborators = currentCollaborators
      .filter(c => (typeof c === 'string' ? c : c.id) !== userId)
      .map(c => (typeof c === 'string' ? c : c.id))

    await payload.update({
      collection: 'projects',
      id: id,
      data: {
        collaborators: updatedCollaborators,
      },
    })

    // Return 204 No Content
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error removing collaborator:', error)

    if (error instanceof Error && error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project or user ID' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
