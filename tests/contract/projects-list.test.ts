import { it, expect } from 'vitest'
import { describeContract, getContractBaseUrl } from './utils'

describeContract('GET /api/v1/projects Contract', () => {
  const BASE_URL = getContractBaseUrl()

  it('should return paginated projects list', async () => {
    // This test MUST fail initially (no implementation yet)
    const response = await fetch(`${BASE_URL}/api/v1/projects`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('projects')
    expect(responseData).toHaveProperty('pagination')
    expect(responseData.projects).toBeInstanceOf(Array)
    
    expect(responseData.pagination).toHaveProperty('page')
    expect(responseData.pagination).toHaveProperty('limit')
    expect(responseData.pagination).toHaveProperty('total')
    expect(responseData.pagination).toHaveProperty('pages')
    
    if (responseData.projects.length > 0) {
      const project = responseData.projects[0]
      expect(project).toHaveProperty('id')
      expect(project).toHaveProperty('title')
      expect(project).toHaveProperty('genre')
      expect(project).toHaveProperty('status')
      expect(project).toHaveProperty('progress')
      expect(project.progress).toHaveProperty('currentPhase')
      expect(project.progress).toHaveProperty('overallProgress')
    }
  })

  it('should filter projects by status', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/projects?status=concept`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    responseData.projects.forEach((project: any) => {
      expect(project.status).toBe('concept')
    })
  })

  it('should respect pagination parameters', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/projects?page=1&limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData.pagination.page).toBe(1)
    expect(responseData.pagination.limit).toBe(5)
    expect(responseData.projects.length).toBeLessThanOrEqual(5)
  })
})