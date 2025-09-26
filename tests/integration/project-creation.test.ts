import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getPayload } from "payload"
import config from "@payload-config"

// Integration test for PayloadCMS Local API project creation
// This test MUST fail until the server actions are implemented

describe("Project Creation Integration", () => {
  let payload: any

  beforeEach(async () => {
    // Initialize PayloadCMS for testing
    payload = await getPayload({ config })
    
    // Clean up any existing test projects
    const testProjects = await payload.find({
      collection: "projects",
      where: {
        title: {
          like: "Test Project%"
        }
      }
    })
    
    for (const project of testProjects.docs) {
      await payload.delete({
        collection: "projects",
        id: project.id
      })
    }
  })

  afterEach(async () => {
    // Clean up test data
    const testProjects = await payload.find({
      collection: "projects",
      where: {
        title: {
          like: "Test Project%"
        }
      }
    })
    
    for (const project of testProjects.docs) {
      await payload.delete({
        collection: "projects",
        id: project.id
      })
    }
  })

  it("should create a project with valid data using PayloadCMS Local API", async () => {
    const projectData = {
      title: "Test Project Creation",
      description: "A test project for integration testing",
      genre: "drama",
      episodeCount: 12,
      targetAudience: "family",
      projectSettings: {
        aspectRatio: "16:9",
        episodeDuration: 25,
        qualityTier: "standard"
      },
      // Mock user relationship - this will need actual user ID in implementation
      createdBy: "mock-user-id"
    }

    const result = await payload.create({
      collection: "projects",
      data: projectData
    })

    expect(result).toBeDefined()
    expect(result.title).toBe(projectData.title)
    expect(result.description).toBe(projectData.description)
    expect(result.genre).toBe(projectData.genre)
    expect(result.episodeCount).toBe(projectData.episodeCount)
    expect(result.targetAudience).toBe(projectData.targetAudience)
    expect(result.projectSettings.aspectRatio).toBe(projectData.projectSettings.aspectRatio)
    expect(result.id).toBeDefined()
    expect(result.createdAt).toBeDefined()
    expect(result.updatedAt).toBeDefined()
  })

  it("should fail to create project with missing required fields", async () => {
    const invalidProjectData = {
      description: "Missing title and genre",
      episodeCount: 10
    }

    await expect(
      payload.create({
        collection: "projects",
        data: invalidProjectData
      })
    ).rejects.toThrow()
  })

  it("should fail to create project with invalid genre", async () => {
    const invalidProjectData = {
      title: "Test Project Invalid Genre",
      genre: "invalid-genre",
      episodeCount: 10,
      createdBy: "mock-user-id"
    }

    await expect(
      payload.create({
        collection: "projects",
        data: invalidProjectData
      })
    ).rejects.toThrow()
  })

  it("should fail to create project with episode count out of range", async () => {
    const invalidProjectData = {
      title: "Test Project Invalid Episodes",
      genre: "drama",
      episodeCount: 100, // Exceeds maximum of 50
      createdBy: "mock-user-id"
    }

    await expect(
      payload.create({
        collection: "projects",
        data: invalidProjectData
      })
    ).rejects.toThrow()
  })

  it("should create project with default values for optional fields", async () => {
    const minimalProjectData = {
      title: "Test Project Minimal",
      genre: "comedy",
      createdBy: "mock-user-id"
    }

    const result = await payload.create({
      collection: "projects",
      data: minimalProjectData
    })

    expect(result.title).toBe(minimalProjectData.title)
    expect(result.genre).toBe(minimalProjectData.genre)
    expect(result.episodeCount).toBe(10) // Default value
    expect(result.targetAudience).toBe("family") // Default value
    expect(result.projectSettings.aspectRatio).toBe("16:9") // Default value
    expect(result.projectSettings.episodeDuration).toBe(22) // Default value
    expect(result.projectSettings.qualityTier).toBe("standard") // Default value
  })

  it("should initialize progress tracking with default values", async () => {
    const projectData = {
      title: "Test Project Progress",
      genre: "action",
      createdBy: "mock-user-id"
    }

    const result = await payload.create({
      collection: "projects",
      data: projectData
    })

    expect(result.progress).toBeDefined()
    expect(result.progress.currentPhase).toBe("story_development") // Default phase
    expect(result.progress.completedSteps).toEqual([]) // Empty array initially
    expect(result.progress.overallProgress).toBe(0) // 0% initially
  })
})