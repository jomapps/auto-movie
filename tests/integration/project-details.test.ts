import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getPayload } from "payload"
import config from "@payload-config"

// Integration test for PayloadCMS Local API project details retrieval
// This test MUST fail until the server actions are implemented

describe("Project Details Integration", () => {
  let payload: any
  let testProjectId: string

  beforeEach(async () => {
    // Initialize PayloadCMS for testing
    payload = await getPayload({ config })
    
    // Clean up any existing test projects
    await cleanupTestProjects()
    
    // Create a test project for detail tests
    const testProject = {
      title: "Test Project Details",
      description: "A comprehensive test project for testing details retrieval",
      genre: "sci-fi",
      episodeCount: 12,
      targetAudience: "teen",
      status: "pre-production",
      projectSettings: {
        aspectRatio: "21:9",
        episodeDuration: 45,
        qualityTier: "premium"
      },
      progress: {
        currentPhase: "character_creation",
        completedSteps: [
          { step: "story_outline", completedAt: new Date().toISOString() },
          { step: "character_sketches", completedAt: new Date().toISOString() }
        ],
        overallProgress: 25
      },
      createdBy: "mock-user-details"
    }

    const result = await payload.create({
      collection: "projects",
      data: testProject
    })
    testProjectId = result.id
  })

  afterEach(async () => {
    await cleanupTestProjects()
  })

  async function cleanupTestProjects() {
    const testProjects = await payload.find({
      collection: "projects",
      where: {
        or: [
          { title: { like: "Test Project Details%" } },
          { createdBy: { equals: "mock-user-details" } }
        ]
      }
    })
    
    for (const project of testProjects.docs) {
      await payload.delete({
        collection: "projects",
        id: project.id
      })
    }
  }

  it("should retrieve complete project details by ID", async () => {
    const result = await payload.findByID({
      collection: "projects",
      id: testProjectId
    })

    expect(result).toBeDefined()
    expect(result.id).toBe(testProjectId)
    expect(result.title).toBe("Test Project Details")
    expect(result.description).toBe("A comprehensive test project for testing details retrieval")
    expect(result.genre).toBe("sci-fi")
    expect(result.episodeCount).toBe(12)
    expect(result.targetAudience).toBe("teen")
    expect(result.status).toBe("pre-production")
  })

  it("should include project settings in details", async () => {
    const result = await payload.findByID({
      collection: "projects",
      id: testProjectId
    })

    expect(result.projectSettings).toBeDefined()
    expect(result.projectSettings.aspectRatio).toBe("21:9")
    expect(result.projectSettings.episodeDuration).toBe(45)
    expect(result.projectSettings.qualityTier).toBe("premium")
  })

  it("should include progress tracking in details", async () => {
    const result = await payload.findByID({
      collection: "projects",
      id: testProjectId
    })

    expect(result.progress).toBeDefined()
    expect(result.progress.currentPhase).toBe("character_creation")
    expect(result.progress.completedSteps).toHaveLength(2)
    expect(result.progress.overallProgress).toBe(25)
    expect(result.progress.completedSteps[0].step).toBe("story_outline")
    expect(result.progress.completedSteps[1].step).toBe("character_sketches")
  })

  it("should include user relationship in details", async () => {
    const result = await payload.findByID({
      collection: "projects",
      id: testProjectId
    })

    expect(result.createdBy).toBe("mock-user-details")
  })

  it("should include timestamps in details", async () => {
    const result = await payload.findByID({
      collection: "projects",
      id: testProjectId
    })

    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined()
    expect(new Date(result.createdAt)).toBeInstanceOf(Date)
    expect(new Date(result.updatedAt)).toBeInstanceOf(Date)
  })

  it("should throw error for non-existent project ID", async () => {
    const nonExistentId = "507f1f77bcf86cd799439011" // Valid MongoDB ObjectId format

    await expect(
      payload.findByID({
        collection: "projects",
        id: nonExistentId
      })
    ).rejects.toThrow()
  })

  it("should throw error for invalid project ID format", async () => {
    const invalidId = "invalid-id-format"

    await expect(
      payload.findByID({
        collection: "projects",
        id: invalidId
      })
    ).rejects.toThrow()
  })

  it("should retrieve project with populated user relationship", async () => {
    // First create a test user
    const testUser = await payload.create({
      collection: "users",
      data: {
        email: "testuser.details@example.com",
        password: "testpassword123",
        name: "Test Details User"
      }
    })

    // Create project with actual user ID
    const projectWithUser = {
      title: "Test Project With User",
      genre: "drama",
      episodeCount: 8,
      createdBy: testUser.id
    }

    const projectResult = await payload.create({
      collection: "projects",
      data: projectWithUser
    })

    // Retrieve project with populated user
    const result = await payload.findByID({
      collection: "projects",
      id: projectResult.id,
      populate: {
        createdBy: true
      }
    })

    expect(result.createdBy).toBeDefined()
    if (typeof result.createdBy === 'object') {
      expect(result.createdBy.email).toBe("testuser.details@example.com")
      expect(result.createdBy.name).toBe("Test Details User")
    }

    // Cleanup
    await payload.delete({
      collection: "projects",
      id: projectResult.id
    })
    await payload.delete({
      collection: "users",
      id: testUser.id
    })
  })

  it("should retrieve project with all computed fields", async () => {
    const result = await payload.findByID({
      collection: "projects",
      id: testProjectId
    })

    // Check that all expected fields are present
    const requiredFields = [
      'id', 'title', 'description', 'genre', 'episodeCount', 
      'targetAudience', 'status', 'projectSettings', 'progress',
      'createdBy', 'createdAt', 'updatedAt'
    ]

    for (const field of requiredFields) {
      expect(result).toHaveProperty(field)
    }
  })

  it("should handle concurrent access to same project details", async () => {
    // Simulate multiple concurrent requests for the same project
    const promises = Array(5).fill(null).map(() => 
      payload.findByID({
        collection: "projects",
        id: testProjectId
      })
    )

    const results = await Promise.all(promises)

    // All requests should succeed and return the same data
    expect(results).toHaveLength(5)
    results.forEach(result => {
      expect(result.id).toBe(testProjectId)
      expect(result.title).toBe("Test Project Details")
    })
  })
})