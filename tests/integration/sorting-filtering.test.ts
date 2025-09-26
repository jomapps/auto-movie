import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getPayload } from "payload"
import config from "@payload-config"

// Integration test for full-attribute sorting/filtering
// Based on clarified requirement: Sort by date, title, status, progress percentage, and genre
// This test MUST fail until the filtering/sorting functionality is implemented

describe("Sorting and Filtering Integration", () => {
  let payload: any
  let testProjectIds: string[] = []

  beforeEach(async () => {
    // Initialize PayloadCMS for testing
    payload = await getPayload({ config })
    
    // Clean up any existing test projects
    await cleanupTestProjects()
    
    // Create comprehensive test dataset for sorting/filtering
    const testProjects = [
      {
        title: "Alpha Action Adventure",
        description: "First action movie",
        genre: "action",
        episodeCount: 10,
        targetAudience: "teen",
        status: "concept",
        progress: { overallProgress: 5 },
        createdBy: "user-1"
      },
      {
        title: "Beta Comedy Classic",
        description: "Funny comedy series",
        genre: "comedy",
        episodeCount: 20,
        targetAudience: "family",
        status: "production",
        progress: { overallProgress: 45 },
        createdBy: "user-1"
      },
      {
        title: "Gamma Drama Deep",
        description: "Serious drama film",
        genre: "drama",
        episodeCount: 5,
        targetAudience: "adult",
        status: "completed",
        progress: { overallProgress: 100 },
        createdBy: "user-2"
      },
      {
        title: "Delta Horror House",
        description: "Scary horror series",
        genre: "horror",
        episodeCount: 15,
        targetAudience: "adult",
        status: "post-production",
        progress: { overallProgress: 85 },
        createdBy: "user-2"
      },
      {
        title: "Epsilon Sci-Fi Space",
        description: "Space exploration story",
        genre: "sci-fi",
        episodeCount: 30,
        targetAudience: "teen",
        status: "pre-production",
        progress: { overallProgress: 25 },
        createdBy: "user-1"
      }
    ]

    // Create projects with slight delays to ensure different timestamps
    for (let i = 0; i < testProjects.length; i++) {
      const result = await payload.create({
        collection: "projects",
        data: testProjects[i]
      })
      testProjectIds.push(result.id)
      
      // Small delay to ensure different timestamps
      if (i < testProjects.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
  })

  afterEach(async () => {
    await cleanupTestProjects()
  })

  async function cleanupTestProjects() {
    const testProjects = await payload.find({
      collection: "projects",
      where: {
        or: [
          { title: { like: "Alpha%" } },
          { title: { like: "Beta%" } },
          { title: { like: "Gamma%" } },
          { title: { like: "Delta%" } },
          { title: { like: "Epsilon%" } }
        ]
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

  describe("Sorting Functionality", () => {
    it("should sort by creation date ascending", async () => {
      const result = await payload.find({
        collection: "projects",
        sort: "createdAt",
        where: {
          title: { like: "%Alpha%|%Beta%|%Gamma%|%Delta%|%Epsilon%" }
        }
      })

      expect(result.docs).toHaveLength(5)
      
      // Should be in chronological order (oldest first)
      const dates = result.docs.map(p => new Date(p.createdAt))
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeLessThanOrEqual(dates[i + 1].getTime())
      }
    })

    it("should sort by creation date descending", async () => {
      const result = await payload.find({
        collection: "projects",
        sort: "-createdAt",
        where: {
          title: { like: "%Alpha%|%Beta%|%Gamma%|%Delta%|%Epsilon%" }
        }
      })

      expect(result.docs).toHaveLength(5)
      
      // Should be in reverse chronological order (newest first)
      const dates = result.docs.map(p => new Date(p.createdAt))
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime())
      }
    })

    it("should sort by title alphabetically", async () => {
      const result = await payload.find({
        collection: "projects",
        sort: "title",
        where: {
          title: { like: "%Alpha%|%Beta%|%Gamma%|%Delta%|%Epsilon%" }
        }
      })

      expect(result.docs).toHaveLength(5)
      
      const titles = result.docs.map(p => p.title)
      expect(titles[0]).toBe("Alpha Action Adventure")
      expect(titles[1]).toBe("Beta Comedy Classic")
      expect(titles[2]).toBe("Delta Horror House")
      expect(titles[3]).toBe("Epsilon Sci-Fi Space")
      expect(titles[4]).toBe("Gamma Drama Deep")
    })

    it("should sort by episode count", async () => {
      const result = await payload.find({
        collection: "projects",
        sort: "episodeCount",
        where: {
          title: { like: "%Alpha%|%Beta%|%Gamma%|%Delta%|%Epsilon%" }
        }
      })

      expect(result.docs).toHaveLength(5)
      
      const episodes = result.docs.map(p => p.episodeCount)
      expect(episodes[0]).toBe(5)   // Gamma Drama
      expect(episodes[1]).toBe(10)  // Alpha Action
      expect(episodes[2]).toBe(15)  // Delta Horror
      expect(episodes[3]).toBe(20)  // Beta Comedy
      expect(episodes[4]).toBe(30)  // Epsilon Sci-Fi
    })

    it("should sort by progress percentage", async () => {
      const result = await payload.find({
        collection: "projects",
        sort: "progress.overallProgress",
        where: {
          title: { like: "%Alpha%|%Beta%|%Gamma%|%Delta%|%Epsilon%" }
        }
      })

      expect(result.docs).toHaveLength(5)
      
      const progressValues = result.docs.map(p => p.progress.overallProgress)
      expect(progressValues[0]).toBe(5)   // Alpha (concept)
      expect(progressValues[1]).toBe(25)  // Epsilon (pre-production)
      expect(progressValues[2]).toBe(45)  // Beta (production)
      expect(progressValues[3]).toBe(85)  // Delta (post-production)
      expect(progressValues[4]).toBe(100) // Gamma (completed)
    })
  })

  describe("Filtering Functionality", () => {
    it("should filter by genre", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          genre: { equals: "action" }
        }
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0].title).toBe("Alpha Action Adventure")
      expect(result.docs[0].genre).toBe("action")
    })

    it("should filter by multiple genres", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          genre: { in: ["action", "comedy", "drama"] }
        }
      })

      expect(result.docs).toHaveLength(3)
      const genres = result.docs.map(p => p.genre)
      expect(genres).toContain("action")
      expect(genres).toContain("comedy")
      expect(genres).toContain("drama")
    })

    it("should filter by status", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          status: { equals: "production" }
        }
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0].title).toBe("Beta Comedy Classic")
      expect(result.docs[0].status).toBe("production")
    })

    it("should filter by target audience", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          targetAudience: { equals: "teen" }
        }
      })

      expect(result.docs).toHaveLength(2)
      const titles = result.docs.map(p => p.title)
      expect(titles).toContain("Alpha Action Adventure")
      expect(titles).toContain("Epsilon Sci-Fi Space")
    })

    it("should filter by progress range", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          "progress.overallProgress": {
            gte: 20,
            lte: 50
          }
        }
      })

      expect(result.docs).toHaveLength(2)
      const titles = result.docs.map(p => p.title)
      expect(titles).toContain("Beta Comedy Classic") // 45%
      expect(titles).toContain("Epsilon Sci-Fi Space") // 25%
    })

    it("should filter by episode count range", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          episodeCount: {
            gte: 15,
            lte: 25
          }
        }
      })

      expect(result.docs).toHaveLength(2)
      const titles = result.docs.map(p => p.title)
      expect(titles).toContain("Beta Comedy Classic") // 20 episodes
      expect(titles).toContain("Delta Horror House") // 15 episodes
    })

    it("should search by title text", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          title: { like: "%Comedy%" }
        }
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0].title).toBe("Beta Comedy Classic")
    })

    it("should search by description text", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          description: { like: "%series%" }
        }
      })

      expect(result.docs).toHaveLength(2)
      const titles = result.docs.map(p => p.title)
      expect(titles).toContain("Beta Comedy Classic")
      expect(titles).toContain("Delta Horror House")
    })
  })

  describe("Combined Sorting and Filtering", () => {
    it("should filter by genre and sort by progress", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          targetAudience: { equals: "adult" }
        },
        sort: "-progress.overallProgress"
      })

      expect(result.docs).toHaveLength(2)
      expect(result.docs[0].title).toBe("Gamma Drama Deep") // 100%
      expect(result.docs[1].title).toBe("Delta Horror House") // 85%
    })

    it("should filter by status and sort by title", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          status: { in: ["concept", "pre-production", "production"] }
        },
        sort: "title"
      })

      expect(result.docs).toHaveLength(3)
      expect(result.docs[0].title).toBe("Alpha Action Adventure")
      expect(result.docs[1].title).toBe("Beta Comedy Classic")
      expect(result.docs[2].title).toBe("Epsilon Sci-Fi Space")
    })

    it("should apply multiple filters with AND logic", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          and: [
            { targetAudience: { equals: "teen" } },
            { "progress.overallProgress": { gte: 20 } }
          ]
        }
      })

      expect(result.docs).toHaveLength(1)
      expect(result.docs[0].title).toBe("Epsilon Sci-Fi Space")
    })

    it("should apply multiple filters with OR logic", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          or: [
            { genre: { equals: "action" } },
            { status: { equals: "completed" } }
          ]
        }
      })

      expect(result.docs).toHaveLength(2)
      const titles = result.docs.map(p => p.title)
      expect(titles).toContain("Alpha Action Adventure")
      expect(titles).toContain("Gamma Drama Deep")
    })

    it("should handle complex nested filters with sorting", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          and: [
            {
              or: [
                { genre: { equals: "comedy" } },
                { genre: { equals: "horror" } }
              ]
            },
            { episodeCount: { gte: 15 } }
          ]
        },
        sort: "-episodeCount"
      })

      expect(result.docs).toHaveLength(2)
      expect(result.docs[0].title).toBe("Beta Comedy Classic") // 20 episodes
      expect(result.docs[1].title).toBe("Delta Horror House") // 15 episodes
    })
  })

  describe("Pagination with Sorting and Filtering", () => {
    it("should paginate filtered and sorted results", async () => {
      const result = await payload.find({
        collection: "projects",
        where: {
          title: { like: "%Alpha%|%Beta%|%Gamma%|%Delta%|%Epsilon%" }
        },
        sort: "title",
        limit: 2,
        page: 1
      })

      expect(result.docs).toHaveLength(2)
      expect(result.totalDocs).toBe(5)
      expect(result.totalPages).toBe(3)
      expect(result.page).toBe(1)
      expect(result.hasNextPage).toBe(true)
      expect(result.hasPrevPage).toBe(false)

      // Should have first 2 alphabetically
      expect(result.docs[0].title).toBe("Alpha Action Adventure")
      expect(result.docs[1].title).toBe("Beta Comedy Classic")
    })

    it("should maintain sort order across pages", async () => {
      const page1 = await payload.find({
        collection: "projects",
        where: {
          title: { like: "%Alpha%|%Beta%|%Gamma%|%Delta%|%Epsilon%" }
        },
        sort: "-progress.overallProgress",
        limit: 2,
        page: 1
      })

      const page2 = await payload.find({
        collection: "projects",
        where: {
          title: { like: "%Alpha%|%Beta%|%Gamma%|%Delta%|%Epsilon%" }
        },
        sort: "-progress.overallProgress",
        limit: 2,
        page: 2
      })

      // Page 1 should have highest progress
      expect(page1.docs[0].progress.overallProgress).toBe(100) // Gamma
      expect(page1.docs[1].progress.overallProgress).toBe(85)  // Delta

      // Page 2 should have next highest
      expect(page2.docs[0].progress.overallProgress).toBe(45)  // Beta
      expect(page2.docs[1].progress.overallProgress).toBe(25)  // Epsilon
    })
  })
})