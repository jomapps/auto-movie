import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/utils/getPayload'
import type { Media, Project } from '@/payload-types'

// POST /api/v1/media/search - Search media using text queries and similarity
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const data = await request.json()
    const { projectId, query, mediaTypes = [], similarTo, limit = 10 } = data

    // Validate required fields
    if (!projectId) {
      return NextResponse.json({
        error: 'Validation failed',
        details: {
          projectId: 'projectId is required'
        }
      }, { status: 400 })
    }

    // Validate limit
    const searchLimit = Math.min(Math.max(limit, 1), 50) // Between 1-50

    const payload = await getPayload()

    // Verify project exists and user has access
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
      depth: 0
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // TODO: Check if user has access to this project
    // const userId = getUserFromAuth(authHeader)
    // if (!hasProjectAccess(project, userId)) {
    //   return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    // }

    // Build search query
    const where: any = {
      project: { equals: projectId }
    }

    // Add media type filters
    if (mediaTypes.length > 0) {
      where.mediaType = { in: mediaTypes }
    }

    let results = []

    if (similarTo) {
      // Find similar media based on another media item
      try {
        const referenceMedia = await payload.findByID({
          collection: 'media',
          id: similarTo,
          depth: 0
        }) as Media

        if (!referenceMedia || referenceMedia.project !== projectId) {
          return NextResponse.json({ error: 'Reference media not found or not in project' }, { status: 404 })
        }

        // If reference media has embeddings, use vector similarity
        if (referenceMedia.embedding && referenceMedia.embedding.length > 0) {
          // TODO: Implement vector similarity search
          // For now, fall back to tag/description similarity
          const similarityWhere = {
            ...where,
            id: { not_equals: similarTo }, // Exclude the reference media itself
            or: []
          }

          // Add tag similarity if reference has tags
          if (referenceMedia.tags && referenceMedia.tags.length > 0) {
            similarityWhere.or.push({
              tags: { in: referenceMedia.tags }
            })
          }

          // Add media type similarity
          if (referenceMedia.mediaType) {
            similarityWhere.or.push({
              mediaType: { equals: referenceMedia.mediaType }
            })
          }

          if (similarityWhere.or.length === 0) {
            similarityWhere.or.push({
              mediaType: { exists: true } // Fallback to any media
            })
          }

          const similarResults = await payload.find({
            collection: 'media',
            where: similarityWhere,
            limit: searchLimit,
            depth: 1,
            sort: '-createdAt'
          })

          results = similarResults.docs.map((media: Media) => ({
            id: media.id,
            url: media.url || '',
            filename: media.filename || 'unknown',
            mediaType: media.mediaType,
            description: media.description || '',
            similarity: calculateSimilarity(referenceMedia, media),
            relevanceScore: 0.8 // Default similarity score
          }))
        } else {
          return NextResponse.json({
            error: 'Reference media has no embeddings for similarity search',
            results: []
          }, { status: 200 })
        }

      } catch (error) {
        console.error('Error in similarity search:', error)
        return NextResponse.json({ error: 'Invalid reference media ID' }, { status: 400 })
      }

    } else if (query) {
      // Text-based search using description and tags
      const searchWhere = {
        ...where,
        or: [
          {
            description: { contains: query, mode: 'insensitive' }
          },
          {
            filename: { contains: query, mode: 'insensitive' }
          },
          {
            tags: { contains: query, mode: 'insensitive' }
          }
        ]
      }

      const searchResults = await payload.find({
        collection: 'media',
        where: searchWhere,
        limit: searchLimit,
        depth: 1,
        sort: '-createdAt'
      })

      results = searchResults.docs.map((media: Media) => ({
        id: media.id,
        url: media.url || '',
        filename: media.filename || 'unknown',
        mediaType: media.mediaType,
        description: media.description || '',
        similarity: calculateTextRelevance(query, media),
        relevanceScore: calculateTextRelevance(query, media)
      }))

      // Sort by relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    } else {
      // No query or similarTo provided, return recent media from project
      const recentResults = await payload.find({
        collection: 'media',
        where,
        limit: searchLimit,
        depth: 1,
        sort: '-createdAt'
      })

      results = recentResults.docs.map((media: Media) => ({
        id: media.id,
        url: media.url || '',
        filename: media.filename || 'unknown',
        mediaType: media.mediaType,
        description: media.description || '',
        similarity: 1.0, // All equally relevant for recent search
        relevanceScore: 1.0
      }))
    }

    // Format response according to contract
    const response = {
      results: results
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error searching media:', error)
    
    if (error.message?.includes('Invalid ObjectId')) {
      return NextResponse.json({ error: 'Invalid project or media ID' }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate similarity between media items
function calculateSimilarity(reference: Media, candidate: Media): number {
  let similarity = 0
  let factors = 0

  // Media type match (high weight)
  if (reference.mediaType === candidate.mediaType) {
    similarity += 0.4
  }
  factors += 0.4

  // Tag overlap (medium weight)
  const refTags = reference.tags || []
  const candTags = candidate.tags || []
  if (refTags.length > 0 && candTags.length > 0) {
    const commonTags = refTags.filter(tag => candTags.includes(tag))
    const tagSimilarity = commonTags.length / Math.max(refTags.length, candTags.length)
    similarity += tagSimilarity * 0.3
  }
  factors += 0.3

  // Description similarity (lower weight, basic)
  if (reference.description && candidate.description) {
    const refWords = reference.description.toLowerCase().split(/\s+/)
    const candWords = candidate.description.toLowerCase().split(/\s+/)
    const commonWords = refWords.filter(word => candWords.includes(word))
    const descSimilarity = commonWords.length / Math.max(refWords.length, candWords.length)
    similarity += descSimilarity * 0.2
  }
  factors += 0.2

  // Agent generation status (low weight)
  if (reference.agentGenerated === candidate.agentGenerated) {
    similarity += 0.1
  }
  factors += 0.1

  return factors > 0 ? similarity / factors : 0
}

// Helper function to calculate text relevance for search queries
function calculateTextRelevance(query: string, media: Media): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2)
  if (queryWords.length === 0) return 0

  let relevance = 0
  let maxRelevance = 0

  // Check filename (high weight)
  if (media.filename) {
    const filenameWords = media.filename.toLowerCase().split(/[^a-z0-9]+/).filter(word => word.length > 0)
    const filenameMatches = queryWords.filter(word => filenameWords.some(fw => fw.includes(word) || word.includes(fw)))
    relevance += (filenameMatches.length / queryWords.length) * 0.4
  }
  maxRelevance += 0.4

  // Check description (medium weight)
  if (media.description) {
    const descWords = media.description.toLowerCase().split(/\s+/)
    const descMatches = queryWords.filter(word => descWords.some(dw => dw.includes(word) || word.includes(dw)))
    relevance += (descMatches.length / queryWords.length) * 0.3
  }
  maxRelevance += 0.3

  // Check tags (medium weight)
  if (media.tags && media.tags.length > 0) {
    const tagText = media.tags.join(' ').toLowerCase()
    const tagMatches = queryWords.filter(word => tagText.includes(word))
    relevance += (tagMatches.length / queryWords.length) * 0.3
  }
  maxRelevance += 0.3

  return maxRelevance > 0 ? relevance / maxRelevance : 0
}