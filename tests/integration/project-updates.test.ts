import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getPayload } from "payload"
import config from "@payload-config"

// Integration test for PayloadCMS Local API project updates
// This test MUST fail until the server actions are implemented

describe("Project Updates Integration", () => {
  let payload: any
  let testProjectId: string

  beforeEach(async () => {
    // Initialize PayloadCMS for testing
    payload = await getPayload({ config })
    
    // Clean up any existing test projects
    await cleanupTestProjects()
    
    // Create a test project for update tests
    const testProject = {
      title: "Test Project Updates",
      description: "A test project for testing updates",
      genre: "action",
      episodeCount: 10,
      targetAudience: "family",
      status: "concept",
      projectSettings: {
        aspectRatio: "16:9",
        episodeDuration: 22,
        qualityTier: "standard"
      },
      progress: {
        currentPhase: "story_development",
        completedSteps: [],
        overallProgress: 0
      },
      createdBy: "mock-user-updates"
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
          { title: { like: "Test Project Updates%" } },
          { createdBy: { equals: "mock-user-updates" } }
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

  it("should update basic project fields", async () => {
    const updateData = {
      title: "Updated Test Project",
      description: "Updated description for the test project",
      genre: "comedy",
      episodeCount: 15
    }

    const result = await payload.update({
      collection: "projects",
      id: testProjectId,
      data: updateData
    })

    expect(result.title).toBe(updateData.title)
    expect(result.description).toBe(updateData.description)
    expect(result.genre).toBe(updateData.genre)
    expect(result.episodeCount).toBe(updateData.episodeCount)
    expect(result.updatedAt).not.toBe(result.createdAt)
  })

  it("should update project settings", async () => {
    const updateData = {
      projectSettings: {
        aspectRatio: "21:9",
        episodeDuration: 45,
        qualityTier: "premium"
      }
    }

    const result = await payload.update({
      collection: "projects",
      id: testProjectId,
      data: updateData
    })

    expect(result.projectSettings.aspectRatio).toBe("21:9")
    expect(result.projectSettings.episodeDuration).toBe(45)
    expect(result.projectSettings.qualityTier).toBe("premium")
  })

  it("should update project progress", async () => {
    const updateData = {
      progress: {
        currentPhase: "character_creation",
        completedSteps: [
          { step: "story_outline", completedAt: new Date().toISOString() }
        ],
        overallProgress: 15
      }
    }

    const result = await payload.update({
      collection: "projects",
      id: testProjectId,
      data: updateData
    })

    expect(result.progress.currentPhase).toBe("character_creation")
    expect(result.progress.completedSteps).toHaveLength(1)
    expect(result.progress.completedSteps[0].step).toBe("story_outline")
    expect(result.progress.overallProgress).toBe(15)
  })

  it("should update project status", async () => {
    const updateData = {
      status: "production"
    }

    const result = await payload.update({
      collection: "projects",
      id: testProjectId,
      data: updateData
    })

    expect(result.status).toBe("production")
  })

  it("should preserve unchanged fields during partial update", async () => {
    const originalProject = await payload.findByID({
      collection: "projects",
      id: testProjectId
    })

    const updateData = {
      title: "Partially Updated Project"
    }

    const result = await payload.update({
      collection: "projects",
      id: testProjectId,
      data: updateData
    })

    expect(result.title).toBe("Partially Updated Project")
    expect(result.description).toBe(originalProject.description)
    expect(result.genre).toBe(originalProject.genre)
    expect(result.episodeCount).toBe(originalProject.episodeCount)
    expect(result.createdBy).toBe(originalProject.createdBy)
  })

  it("should fail to update with invalid data", async () => {
    const invalidUpdateData = {
      genre: "invalid-genre",
      episodeCount: 100 // Exceeds maximum
    }

    await expect(
      payload.update({
        collection: "projects",
        id: testProjectId,
        data: invalidUpdateData
      })
    ).rejects.toThrow()
  })

  it("should fail to update non-existent project", async () => {
    const nonExistentId = "507f1f77bcf86cd799439011" // Valid MongoDB ObjectId format
    const updateData = {
      title: "This should fail"
    }

    await expect(
      payload.update({
        collection: "projects",
        id: nonExistentId,
        data: updateData
      })
    ).rejects.toThrow()
  })

  it("should update multiple fields atomically", async () => {
    const updateData = {
      title: "Atomic Update Test",
      genre: "thriller",
      episodeCount: 20,
      status: "pre-production",
      projectSettings: {
        aspectRatio: "4:3",
        episodeDuration: 30,
        qualityTier: "draft"
      }
    }

    const result = await payload.update({
      collection: "projects",
      id: testProjectId,
      data: updateData
    })

    expect(result.title).toBe(updateData.title)
    expect(result.genre).toBe(updateData.genre)
    expect(result.episodeCount).toBe(updateData.episodeCount)
    expect(result.status).toBe(updateData.status)
    expect(result.projectSettings.aspectRatio).toBe(updateData.projectSettings.aspectRatio)
    expect(result.projectSettings.episodeDuration).toBe(updateData.projectSettings.episodeDuration)
    expect(result.projectSettings.qualityTier).toBe(updateData.projectSettings.qualityTier)
  })

  it("should handle empty update data gracefully", async () => {
    const originalProject = await payload.findByID({
      collection: "projects",
      id: testProjectId
    })

    const result = await payload.update({
      collection: "projects",
      id: testProjectId,
      data: {}
    })

    // Should return the same project with updated timestamp
    expect(result.title).toBe(originalProject.title)
    expect(result.description).toBe(originalProject.description)
    expect(result.genre).toBe(originalProject.genre)
    expect(new Date(result.updatedAt)).toBeInstanceOf(Date)
  })

  it("should update timestamp on every update", async () => {
    const originalProject = await payload.findByID({
      collection: "projects",
      id: testProjectId
    })

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10))

    const updateData = {
      title: "Timestamp Test Update"
    }

    const result = await payload.update({
      collection: "projects",
      id: testProjectId,
      data: updateData
    })

    expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(
      new Date(originalProject.updatedAt).getTime()
    )
  })

  it("should maintain data relationships during update", async () => {
    const updateData = {
      title: "Relationship Test Update",
      description: "Testing that relationships are preserved"
    }

    const result = await payload.update({
      collection: "projects",
      id: testProjectId,
      data: updateData
    })

    expect(result.createdBy).toBe("mock-user-updates")
    expect(result.title).toBe(updateData.title)
    expect(result.description).toBe(updateData.description)
  })
})