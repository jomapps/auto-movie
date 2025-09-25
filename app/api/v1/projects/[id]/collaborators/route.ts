import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/utils/getPayload'
import type { Project, User } from '@/payload-types'

interface RouteParams {
  params: {
    id: string
  }
}

// POST /api/v1/projects/[id]/collaborators - Add collaborators to a project
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate request data
    if (!data.userIds || !Array.isArray(data.userIds) || data.userIds.length === 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          userIds: 'userIds must be a non-empty array'
        }
      }, { status: 400 })
    }

    const payload = await getPayload()

    // Check if project exists
    const project = await payload.findByID({
      collection: 'projects',
      id: params.id,
      depth: 1
    }) as Project & { createdBy: User; collaborators: User[] }

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // TODO: Check if user has permission to add collaborators (owner or admin)
    // const userId = getUserFromAuth(authHeader)
    // if (project.createdBy.id !== userId) {
    //   return NextResponse.json({ 
    //     error: 'Insufficient permissions',
    //     message: 'Only project creators can add collaborators'
    //   }, { status: 403 })
    // }

    // Validate that all userIds exist
    const users = await Promise.all(
      data.userIds.map(async (userId: string) => {
        try {
          return await payload.findByID({
            collection: 'users',
            id: userId
          })
        } catch (error) {
          return null
        }
      })
    )

    const validUsers = users.filter(user => user !== null) as User[]
    const invalidUserIds = data.userIds.filter((userId: string, index: number) => users[index] === null)

    if (invalidUserIds.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          userIds: `Invalid user IDs: ${invalidUserIds.join(', ')}`
        }
      }, { status: 400 })
    }

    // Get current collaborators and add new ones (avoid duplicates)
    const existingCollaboratorIds = (project.collaborators || []).map(c => c.id)
    const newCollaboratorIds = data.userIds.filter((userId: string) => 
      !existingCollaboratorIds.includes(userId) && userId !== project.createdBy.id
    )

    if (newCollaboratorIds.length === 0) {
      return NextResponse.json({
        error: 'No new collaborators to add',
        message: 'All specified users are already collaborators or the project creator'
      }, { status: 400 })
    }

    // Update project with new collaborators
    const updatedCollaborators = [...existingCollaboratorIds, ...newCollaboratorIds]
    
    await payload.update({
      collection: 'projects',
      id: params.id,
      data: {
        collaborators: updatedCollaborators
      }
    })

    // Get the added collaborators with full user data
    const addedCollaborators = validUsers.filter(user => newCollaboratorIds.includes(user.id))

    // Format response according to contract
    const response = {
      collaborators: addedCollaborators.map((user: User) => ({
        id: user.id,
        name: user.name || 'Unknown User',
        email: user.email,
        addedAt: new Date().toISOString()
      }))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error adding collaborators:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}