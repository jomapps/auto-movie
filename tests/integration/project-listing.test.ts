import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getPayload } from "payload"
import config from "@payload-config"

// Integration test for PayloadCMS Local API project listing with full-attribute filtering
// This test MUST fail until the server actions are implemented

describe("Project Listing Integration", () => {
  let payload: any
  let testProjectIds: string[] = []

  beforeEach(async () => {
    // Initialize PayloadCMS for testing
    payload = await getPayload({ config })
    
    // Clean up any existing test projects
    await cleanupTestProjects()
    
    // Create test projects with different attributes for filtering tests
    const testProjects = [
      {
        title: "Test Action Movie A",
        description: "First test action movie",
        genre: "action",
        episodeCount: 8,
        targetAudience: "teen",
        status: "concept",
        createdBy: "mock-user-1"
      },
      {
        title: "Test Comedy Series B",
        description: "Second test comedy series",
        genre: "comedy", 
        episodeCount: 15,
        targetAudience: "family",
        status: "production",
        createdBy: "mock-user-1"
      },
      {
        title: "Test Drama Film C",
        description: "Third test drama film",
        genre: "drama",
        episodeCount: 3,
        targetAudience: "adult",
        status: "completed",
        createdBy: "mock-user-2"
      }
    ]

    for (const projectData of testProjects) {
      const result = await payload.create({
        collection: "projects",
        data: projectData
      })
      testProjectIds.push(result.id)
    }
  })

  afterEach(async () => {
    await cleanupTestProjects()
  })

  async function cleanupTestProjects() {
    const testProjects = await payload.find({
      collection: "projects",
      where: {
        title: {
          like: "Test%"
        }
      }
    })
    
    for (const project of testProjects.docs) {
      await payload.delete({
        collection: "projects",
        id: project.id
      })
    }
    testProjectIds = []
  }

  it("should list all projects for a user", async () => {
    const result = await payload.find({
      collection: "projects",
      where: {
        createdBy: {
          equals: "mock-user-1"
        }
      }
    })

    expect(result.docs).toHaveLength(2)
    expect(result.docs[0].title).toMatch(/Test.+/)
    expect(result.docs[1].title).toMatch(/Test.+/)
  })

  it("should filter projects by genre", async () => {
    const result = await payload.find({
      collection: "projects",
      where: {
        genre: {
          equals: "action"
        }
      }
    })

    expect(result.docs).toHaveLength(1)
    expect(result.docs[0].genre).toBe("action")
    expect(result.docs[0].title).toBe("Test Action Movie A")
  })

  it("should filter projects by status", async () => {
    const result = await payload.find({
      collection: "projects",
      where: {
        status: {
          equals: "production"
        }
      }
    })

    expect(result.docs).toHaveLength(1)
    expect(result.docs[0].status).toBe("production")
    expect(result.docs[0].title).toBe("Test Comedy Series B")
  })

  it("should filter projects by target audience", async () => {
    const result = await payload.find({
      collection: "projects",
      where: {
        targetAudience: {
          equals: "family"
        }
      }
    })

    expect(result.docs).toHaveLength(1)
    expect(result.docs[0].targetAudience).toBe("family")
    expect(result.docs[0].title).toBe("Test Comedy Series B")
  })

  it("should sort projects by creation date descending", async () => {
    const result = await payload.find({
      collection: "projects",
      sort: "-createdAt",
      where: {
        title: {
          like: "Test%"
        }
      }
    })

    expect(result.docs).toHaveLength(3)
    // Most recent should be first
    const dates = result.docs.map(p => new Date(p.createdAt))
    expect(dates[0] >= dates[1]).toBe(true)
    expect(dates[1] >= dates[2]).toBe(true)
  })

  it("should sort projects by title alphabetically", async () => {
    const result = await payload.find({
      collection: "projects",
      sort: "title",
      where: {
        title: {
          like: "Test%"
        }
      }
    })

    expect(result.docs).toHaveLength(3)
    const titles = result.docs.map(p => p.title)
    expect(titles[0]).toBe("Test Action Movie A")
    expect(titles[1]).toBe("Test Comedy Series B") 
    expect(titles[2]).toBe("Test Drama Film C")
  })

  it("should sort projects by episode count", async () => {
    const result = await payload.find({
      collection: "projects",
      sort: "episodeCount",
      where: {
        title: {
          like: "Test%"
        }
      }
    })

    expect(result.docs).toHaveLength(3)
    const episodes = result.docs.map(p => p.episodeCount)
    expect(episodes[0]).toBe(3)  // Drama Film C
    expect(episodes[1]).toBe(8)  // Action Movie A
    expect(episodes[2]).toBe(15) // Comedy Series B
  })

  it("should combine multiple filters", async () => {
    const result = await payload.find({
      collection: "projects",
      where: {
        and: [
          {
            genre: {
              in: ["action", "comedy"]
            }
          },
          {
            targetAudience: {
              in: ["teen", "family"]
            }
          }
        ]
      }
    })

    expect(result.docs).toHaveLength(2)
    const genres = result.docs.map(p => p.genre)
    expect(genres).toContain("action")
    expect(genres).toContain("comedy")
  })

  it("should search projects by title", async () => {
    const result = await payload.find({
      collection: "projects",
      where: {
        title: {
          like: "%Comedy%"
        }
      }
    })

    expect(result.docs).toHaveLength(1)
    expect(result.docs[0].title).toBe("Test Comedy Series B")
  })

  it("should paginate project results", async () => {
    const result = await payload.find({
      collection: "projects",
      limit: 2,
      page: 1,
      where: {
        title: {
          like: "Test%"
        }
      }
    })

    expect(result.docs).toHaveLength(2)
    expect(result.totalDocs).toBe(3)
    expect(result.totalPages).toBe(2)
    expect(result.page).toBe(1)
    expect(result.hasNextPage).toBe(true)
    expect(result.hasPrevPage).toBe(false)
  })

  it("should handle empty results gracefully", async () => {
    const result = await payload.find({
      collection: "projects",
      where: {
        genre: {
          equals: "horror"
        }
      }
    })

    expect(result.docs).toHaveLength(0)
    expect(result.totalDocs).toBe(0)
    expect(result.totalPages).toBe(1)
  })
})