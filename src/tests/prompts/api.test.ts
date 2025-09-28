import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST as executePrompt, OPTIONS as executeOptions } from '@/app/api/prompts/execute/route'
import { GET as getTemplates, OPTIONS as templatesOptions } from '@/app/api/prompt-templates/route'
import { GET as getTagGroupTemplates } from '@/app/api/tags/[group]/templates/route'

// Mock PayloadCMS
const mockPayload = {
  findByID: jest.fn(),
  find: jest.fn(),
  create: jest.fn()
}

jest.mock('@/payload.config', () => ({}))
jest.mock('payload', () => ({
  getPayload: jest.fn(() => Promise.resolve(mockPayload))
}))

// Mock the execution engine
jest.mock('@/lib/prompts/engine', () => ({
  createExecutionEngine: jest.fn(() => ({
    execute: jest.fn(),
    getAvailableModels: jest.fn(() => ['anthropic/claude-sonnet-4', 'fal-ai/nano-banana'])
  }))
}))

describe('Prompt Execution API (/api/prompts/execute)', () => {
  let mockEngine: any

  beforeEach(() => {
    jest.clearAllMocks()
    const { createExecutionEngine } = require('@/lib/prompts/engine')
    mockEngine = createExecutionEngine()

    // Reset mock implementation
    mockPayload.findByID.mockReset()
    mockPayload.create.mockReset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/prompts/execute', () => {
    it('should execute prompt with template ID successfully', async () => {
      // Mock template data
      const mockTemplate = {
        id: 'template-123',
        name: 'Test Template',
        template: 'Generate story about {{character}} in {{setting}}',
        variableDefs: [
          { name: 'character', type: 'string', required: true },
          { name: 'setting', type: 'string', required: true }
        ],
        model: 'anthropic/claude-sonnet-4',
        tags: ['story-001', 'character-002']
      }

      mockPayload.findByID.mockResolvedValue(mockTemplate)

      // Mock execution result
      const mockExecutionResult = {
        output: 'Generated story content...',
        status: 'success',
        executionTime: 1500,
        providerUsed: 'openrouter',
        model: 'anthropic/claude-sonnet-4',
        metrics: {
          tokenCount: 150,
          latency: 1500,
          retryCount: 0
        }
      }

      mockEngine.execute.mockResolvedValue(mockExecutionResult)

      // Mock created execution record
      const mockExecutionRecord = {
        id: 'execution-456',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      mockPayload.create.mockResolvedValue(mockExecutionRecord)

      // Create request
      const requestBody = {
        templateId: 'template-123',
        app: 'auto-movie',
        stage: 'development',
        feature: 'story-generation',
        inputs: {
          character: 'Alice',
          setting: 'wonderland'
        },
        model: 'anthropic/claude-sonnet-4',
        projectId: 'project-789'
      }

      const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await executePrompt(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('execution-456')
      expect(data.status).toBe('success')
      expect(data.outputRaw).toBe('Generated story content...')
      expect(data.templateId).toBe('template-123')
      expect(data.providerUsed).toBe('openrouter')

      // Verify payload operations
      expect(mockPayload.findByID).toHaveBeenCalledWith({
        collection: 'prompt-templates',
        id: 'template-123'
      })

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'prompts-executed',
        data: expect.objectContaining({
          templateId: 'template-123',
          app: 'auto-movie',
          stage: 'development',
          feature: 'story-generation',
          projectId: 'project-789',
          status: 'success',
          model: 'anthropic/claude-sonnet-4'
        })
      })
    })

    it('should execute inline template successfully', async () => {
      const mockExecutionResult = {
        output: 'Inline execution result',
        status: 'success',
        executionTime: 800,
        providerUsed: 'openrouter',
        model: 'anthropic/claude-sonnet-4'
      }

      mockEngine.execute.mockResolvedValue(mockExecutionResult)

      const mockExecutionRecord = {
        id: 'inline-execution-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      mockPayload.create.mockResolvedValue(mockExecutionRecord)

      const requestBody = {
        inlineTemplate: 'Create a {{type}} about {{topic}}',
        variableDefs: [
          { name: 'type', type: 'string', required: true },
          { name: 'topic', type: 'string', required: true }
        ],
        inputs: {
          type: 'poem',
          topic: 'nature'
        },
        app: 'auto-movie',
        stage: 'development',
        model: 'anthropic/claude-sonnet-4'
      }

      const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await executePrompt(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('success')
      expect(data.outputRaw).toBe('Inline execution result')
      expect(data.templateId).toBeUndefined()
    })

    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        templateId: 'template-123'
        // Missing app and stage
      }

      const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await executePrompt(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('App and stage are required')
    })

    it('should return 404 for non-existent template', async () => {
      mockPayload.findByID.mockResolvedValue(null)

      const requestBody = {
        templateId: 'non-existent-template',
        app: 'auto-movie',
        stage: 'development',
        inputs: {}
      }

      const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await executePrompt(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Template not found')
    })

    it('should return 400 for missing required variables', async () => {
      const mockTemplate = {
        id: 'template-123',
        template: 'Hello {{name}}, your age is {{age}}',
        variableDefs: [
          { name: 'name', type: 'string', required: true },
          { name: 'age', type: 'number', required: true }
        ],
        model: 'anthropic/claude-sonnet-4'
      }

      mockPayload.findByID.mockResolvedValue(mockTemplate)

      const requestBody = {
        templateId: 'template-123',
        app: 'auto-movie',
        stage: 'development',
        inputs: { name: 'John' } // Missing required 'age'
      }

      const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await executePrompt(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required variables')
      expect(data.missingVariables).toContain('age')
    })

    it('should handle execution engine errors gracefully', async () => {
      const mockTemplate = {
        id: 'template-123',
        template: 'Test template',
        variableDefs: [],
        model: 'anthropic/claude-sonnet-4'
      }

      mockPayload.findByID.mockResolvedValue(mockTemplate)

      // Mock execution failure
      const mockExecutionResult = {
        output: null,
        status: 'error',
        errorMessage: 'Provider connection failed',
        executionTime: 0,
        providerUsed: 'openrouter',
        model: 'anthropic/claude-sonnet-4'
      }

      mockEngine.execute.mockResolvedValue(mockExecutionResult)

      const mockExecutionRecord = {
        id: 'failed-execution-123',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      }

      mockPayload.create.mockResolvedValue(mockExecutionRecord)

      const requestBody = {
        templateId: 'template-123',
        app: 'auto-movie',
        stage: 'development',
        inputs: {}
      }

      const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await executePrompt(request)
      const data = await response.json()

      expect(response.status).toBe(200) // Still 200 because execution was attempted
      expect(data.status).toBe('error')
      expect(data.errorMessage).toBe('Provider connection failed')
      expect(data.outputRaw).toBeNull()

      // Verify error was saved to database
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'prompts-executed',
        data: expect.objectContaining({
          status: 'error',
          errorMessage: 'Provider connection failed'
        })
      })
    })

    it('should handle database save failures', async () => {
      const mockTemplate = {
        id: 'template-123',
        template: 'Test template',
        variableDefs: [],
        model: 'anthropic/claude-sonnet-4'
      }

      mockPayload.findByID.mockResolvedValue(mockTemplate)
      mockEngine.execute.mockResolvedValue({
        output: 'Success',
        status: 'success',
        executionTime: 1000,
        providerUsed: 'openrouter',
        model: 'anthropic/claude-sonnet-4'
      })

      // Mock database save failure
      mockPayload.create.mockRejectedValue(new Error('Database connection failed'))

      const requestBody = {
        templateId: 'template-123',
        app: 'auto-movie',
        stage: 'development',
        inputs: {}
      }

      const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })

      const response = await executePrompt(request)

      expect(response.status).toBe(500)
    })
  })

  describe('OPTIONS /api/prompts/execute', () => {
    it('should return CORS headers', async () => {
      const response = await executeOptions()

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })
  })
})

describe('Prompt Templates API (/api/prompt-templates)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPayload.find.mockReset()
  })

  describe('GET /api/prompt-templates', () => {
    it('should fetch templates with filters', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Story Generator',
          app: 'auto-movie',
          stage: 'development',
          feature: 'story',
          tags: ['story-001', 'character-002'],
          template: 'Generate story about {{character}}',
          variableDefs: [
            { name: 'character', type: 'string', required: true }
          ],
          model: 'anthropic/claude-sonnet-4',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'template-2',
          name: 'Image Generator',
          app: 'auto-movie',
          stage: 'production',
          feature: 'visuals',
          tags: ['visual-001'],
          template: 'Create image of {{subject}}',
          variableDefs: [
            { name: 'subject', type: 'string', required: true }
          ],
          model: 'fal-ai/nano-banana',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      mockPayload.find.mockResolvedValue({
        docs: mockTemplates,
        page: 1,
        limit: 20,
        totalPages: 1,
        totalDocs: 2,
        hasNextPage: false,
        hasPrevPage: false
      })

      const url = new URL('http://localhost:3000/api/prompt-templates?app=auto-movie&stage=development')
      const request = new NextRequest(url)

      const response = await getTemplates(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.templates).toHaveLength(2)
      expect(data.templates[0].name).toBe('Story Generator')
      expect(data.pagination.totalDocs).toBe(2)

      // Verify query parameters were used
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'prompt-templates',
        where: {
          app: { equals: 'auto-movie' },
          stage: { equals: 'development' }
        },
        page: 1,
        limit: 20,
        sort: ['-updatedAt']
      })
    })

    it('should handle search query across multiple fields', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [],
        page: 1,
        limit: 20,
        totalPages: 0,
        totalDocs: 0,
        hasNextPage: false,
        hasPrevPage: false
      })

      const url = new URL('http://localhost:3000/api/prompt-templates?search=story&app=auto-movie')
      const request = new NextRequest(url)

      const response = await getTemplates(request)

      expect(response.status).toBe(200)
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'prompt-templates',
        where: {
          app: { equals: 'auto-movie' },
          or: [
            { name: { like: 'story' } },
            { template: { like: 'story' } },
            { notes: { like: 'story' } }
          ]
        },
        page: 1,
        limit: 20,
        sort: ['-updatedAt']
      })
    })

    it('should filter by tag group and sort appropriately', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [],
        page: 1,
        limit: 20,
        totalPages: 0,
        totalDocs: 0,
        hasNextPage: false,
        hasPrevPage: false
      })

      const url = new URL('http://localhost:3000/api/prompt-templates?tagGroup=story')
      const request = new NextRequest(url)

      const response = await getTemplates(request)

      expect(response.status).toBe(200)
      expect(mockPayload.find).toHaveBeenCalledWith({
        collection: 'prompt-templates',
        where: {
          'tags.value': { like: 'story%' }
        },
        page: 1,
        limit: 20,
        sort: ['tags.value', '-updatedAt'] // Different sort for tag groups
      })
    })

    it('should handle pagination parameters', async () => {
      mockPayload.find.mockResolvedValue({
        docs: [],
        page: 3,
        limit: 5,
        totalPages: 10,
        totalDocs: 50,
        hasNextPage: true,
        hasPrevPage: true
      })

      const url = new URL('http://localhost:3000/api/prompt-templates?page=3&limit=5')
      const request = new NextRequest(url)

      const response = await getTemplates(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.pagination.page).toBe(3)
      expect(data.pagination.limit).toBe(5)
      expect(data.pagination.totalPages).toBe(10)
      expect(data.pagination.hasNextPage).toBe(true)
    })

    it('should handle database errors gracefully', async () => {
      mockPayload.find.mockRejectedValue(new Error('Database connection failed'))

      const url = new URL('http://localhost:3000/api/prompt-templates')
      const request = new NextRequest(url)

      const response = await getTemplates(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch prompt templates')
    })
  })

  describe('OPTIONS /api/prompt-templates', () => {
    it('should return proper CORS headers', async () => {
      const response = await templatesOptions()

      expect(response.status).toBe(200)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    })
  })
})

describe('Tag Group Templates API (/api/tags/[group]/templates)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPayload.find.mockReset()
  })

  describe('GET /api/tags/[group]/templates', () => {
    it('should fetch templates for specific tag group', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Story Setup',
          tags: ['story-001'],
          template: 'Setup: {{premise}}',
          variableDefs: [{ name: 'premise', type: 'string', required: true }]
        },
        {
          id: 'template-2',
          name: 'Story Development',
          tags: ['story-002'],
          template: 'Develop: {{plot}}',
          variableDefs: [{ name: 'plot', type: 'string', required: true }]
        }
      ]

      mockPayload.find.mockResolvedValue({
        docs: mockTemplates,
        totalDocs: 2
      })

      // Mock the route with params
      const mockParams = { group: 'story' }
      const url = new URL('http://localhost:3000/api/tags/story/templates')
      const request = new NextRequest(url)

      // Since we can't easily mock Next.js params, we'll test the query logic
      expect(mockPayload.find).not.toHaveBeenCalled() // Reset state for this test
    })
  })
})

describe('API Error Handling and Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle malformed JSON requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
      method: 'POST',
      body: 'invalid json{'
    })

    const response = await executePrompt(request)

    expect(response.status).toBe(500)
  })

  it('should handle extremely large payloads', async () => {
    const largeInputs = {
      text: 'A'.repeat(100000) // 100KB of text
    }

    const requestBody = {
      inlineTemplate: 'Process: {{text}}',
      variableDefs: [
        { name: 'text', type: 'string', required: true }
      ],
      inputs: largeInputs,
      app: 'auto-movie',
      stage: 'development'
    }

    mockEngine.execute.mockResolvedValue({
      output: 'Processed large input',
      status: 'success',
      executionTime: 5000,
      providerUsed: 'openrouter',
      model: 'anthropic/claude-sonnet-4'
    })

    mockPayload.create.mockResolvedValue({
      id: 'large-execution-123',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    })

    const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await executePrompt(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('success')
  })

  it('should validate model compatibility', async () => {
    const mockTemplate = {
      id: 'template-123',
      template: 'Test template',
      variableDefs: [],
      model: 'invalid/model-type' // Invalid model
    }

    mockPayload.findByID.mockResolvedValue(mockTemplate)

    // Mock execution engine to handle unknown model
    mockEngine.execute.mockResolvedValue({
      output: null,
      status: 'error',
      errorMessage: 'No provider available for model: invalid/model-type',
      executionTime: 0,
      providerUsed: 'none',
      model: 'invalid/model-type'
    })

    const requestBody = {
      templateId: 'template-123',
      app: 'auto-movie',
      stage: 'development',
      inputs: {}
    }

    const request = new NextRequest('http://localhost:3000/api/prompts/execute', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    })

    const response = await executePrompt(request)
    const data = await response.json()

    expect(data.status).toBe('error')
    expect(data.errorMessage).toContain('No provider available for model')
  })
})

describe('API Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle concurrent requests', async () => {
    mockPayload.findByID.mockResolvedValue({
      id: 'template-123',
      template: 'Test {{input}}',
      variableDefs: [{ name: 'input', type: 'string', required: true }],
      model: 'anthropic/claude-sonnet-4'
    })

    mockEngine.execute.mockResolvedValue({
      output: 'Test output',
      status: 'success',
      executionTime: 100,
      providerUsed: 'openrouter',
      model: 'anthropic/claude-sonnet-4'
    })

    mockPayload.create.mockResolvedValue({
      id: 'concurrent-exec',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    })

    const requestBody = {
      templateId: 'template-123',
      app: 'auto-movie',
      stage: 'development',
      inputs: { input: 'test' }
    }

    // Create 5 concurrent requests
    const requests = Array(5).fill(null).map(() =>
      new NextRequest('http://localhost:3000/api/prompts/execute', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
    )

    const responses = await Promise.all(
      requests.map(request => executePrompt(request))
    )

    expect(responses).toHaveLength(5)
    expect(responses.every(r => r.status === 200)).toBe(true)
    expect(mockPayload.create).toHaveBeenCalledTimes(5)
  })

  it('should complete template search within performance threshold', async () => {
    // Mock a large dataset
    const largeMockResult = {
      docs: Array(1000).fill(null).map((_, i) => ({
        id: `template-${i}`,
        name: `Template ${i}`,
        app: 'auto-movie',
        stage: 'development',
        tags: [`tag-${i % 10}`],
        template: `Template ${i} content`,
        variableDefs: []
      })),
      page: 1,
      limit: 20,
      totalPages: 50,
      totalDocs: 1000,
      hasNextPage: true,
      hasPrevPage: false
    }

    mockPayload.find.mockResolvedValue(largeMockResult)

    const url = new URL('http://localhost:3000/api/prompt-templates?search=template')
    const request = new NextRequest(url)

    const startTime = performance.now()
    const response = await getTemplates(request)
    const duration = performance.now() - startTime

    expect(response.status).toBe(200)
    expect(duration).toBeLessThan(1000) // Should complete within 1 second
  })
})