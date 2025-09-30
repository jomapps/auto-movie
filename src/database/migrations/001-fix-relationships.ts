/**
 * Migration: Fix Media and Sessions Project Relationships
 *
 * This migration converts the project field in Media and Sessions collections
 * from text strings to proper ObjectId relationships.
 *
 * @date 2025-09-30
 * @author Database Architect Worker
 */

import { getPayloadInstance } from '@/utils/getPayload'

let MongoObjectId: any = null

async function loadObjectId() {
  if (!MongoObjectId) {
    // @ts-ignore - mongodb is provided by the Payload runtime
    const mongodb = await import('mongodb')
    MongoObjectId = (mongodb as any).ObjectId
  }
  return MongoObjectId
}

interface MigrationResult {
  success: boolean
  mediaUpdated: number
  sessionsUpdated: number
  errors: string[]
}

export async function migrateProjectRelationships(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    mediaUpdated: 0,
    sessionsUpdated: 0,
    errors: [],
  }

  try {
    const payload = await getPayloadInstance()
    const ObjectId = await loadObjectId()
    const db = payload.db

    // Phase 1: Fix Media Collection
    console.log('Phase 1: Migrating Media collection project references...')

    // Find all media with string project references
    const mediaToUpdate = await db.collections.media.find({
      project: { $type: 'string' },
    })

    const mediaArray = await mediaToUpdate.toArray()
    console.log(`Found ${mediaArray.length} media documents to update`)

    for (const media of mediaArray) {
      try {
        // Convert string ID to ObjectId
        const projectId = new ObjectId(media.project as string)

        // Verify project exists
        const project = await db.collections.projects.findOne({ _id: projectId })

        if (project) {
          await db.collections.media.updateOne(
            { _id: media._id },
            { $set: { project: projectId } },
          )
          result.mediaUpdated++
        } else {
          result.errors.push(`Media ${media._id}: Project ${media.project} not found`)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        result.errors.push(`Media ${media._id}: ${message}`)
      }
    }

    console.log(`✓ Updated ${result.mediaUpdated} media documents`)

    // Phase 2: Fix Sessions Collection
    console.log('\nPhase 2: Migrating Sessions collection project references...')

    // Find all sessions with string project references
    const sessionsToUpdate = await db.collections.sessions.find({
      project: { $type: 'string' },
    })

    const sessionsArray = await sessionsToUpdate.toArray()
    console.log(`Found ${sessionsArray.length} session documents to update`)

    for (const session of sessionsArray) {
      try {
        // Convert string ID to ObjectId
        const projectId = new ObjectId(session.project as string)

        // Verify project exists
        const project = await db.collections.projects.findOne({ _id: projectId })

        if (project) {
          await db.collections.sessions.updateOne(
            { _id: session._id },
            { $set: { project: projectId } },
          )
          result.sessionsUpdated++
        } else {
          result.errors.push(`Session ${session._id}: Project ${session.project} not found`)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        result.errors.push(`Session ${session._id}: ${message}`)
      }
    }

    console.log(`✓ Updated ${result.sessionsUpdated} session documents`)

    // Phase 3: Verify Migration
    console.log('\nPhase 3: Verifying migration...')

    const remainingMediaStrings = await db.collections.media.countDocuments({
      project: { $type: 'string' },
    })

    const remainingSessionStrings = await db.collections.sessions.countDocuments({
      project: { $type: 'string' },
    })

    if (remainingMediaStrings > 0 || remainingSessionStrings > 0) {
      result.errors.push(
        `Migration incomplete: ${remainingMediaStrings} media, ${remainingSessionStrings} sessions still have string references`,
      )
    }

    result.success = result.errors.length === 0

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('Migration Summary')
    console.log('='.repeat(60))
    console.log(`Media updated: ${result.mediaUpdated}`)
    console.log(`Sessions updated: ${result.sessionsUpdated}`)
    console.log(`Errors: ${result.errors.length}`)

    if (result.errors.length > 0) {
      console.log('\nErrors:')
      result.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`)
      })
    }

    if (result.success) {
      console.log('\n✓ Migration completed successfully!')
    } else {
      console.log('\n✗ Migration completed with errors')
    }

    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    result.errors.push(`Fatal error: ${message}`)
    result.success = false
    console.error('Migration failed:', error)
    return result
  }
}

// Rollback function in case migration needs to be reverted
export async function rollbackProjectRelationships(): Promise<void> {
  console.log('WARNING: Rollback is not recommended as it converts ObjectId back to strings')
  console.log('This should only be used in emergency situations')

  const payload = await getPayloadInstance()
  const ObjectId = await loadObjectId()
  const db = payload.db

  // Rollback Media
  const media = await db.collections.media.find({ project: { $type: 'objectId' } })
  for await (const doc of media) {
    await db.collections.media.updateOne(
      { _id: doc._id },
      { $set: { project: doc.project.toString() } },
    )
  }

  // Rollback Sessions
  const sessions = await db.collections.sessions.find({ project: { $type: 'objectId' } })
  for await (const doc of sessions) {
    await db.collections.sessions.updateOne(
      { _id: doc._id },
      { $set: { project: doc.project.toString() } },
    )
  }

  console.log('✓ Rollback completed')
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === 'rollback') {
    rollbackProjectRelationships()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Rollback failed:', error)
        process.exit(1)
      })
  } else {
    migrateProjectRelationships()
      .then((result) => {
        process.exit(result.success ? 0 : 1)
      })
      .catch((error) => {
        console.error('Migration failed:', error)
        process.exit(1)
      })
  }
}