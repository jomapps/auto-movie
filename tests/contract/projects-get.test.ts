import { it, expect } from 'vitest'
import { describeContract, getContractBaseUrl } from './utils'

describeContract('GET /api/v1/projects/{id} Contract', () => {
  it('should return detailed project information', async () => {
    const baseUrl = getContractBaseUrl()
    const projectId = 'test-project-id'

    // This test MUST fail initially (no implementation yet)
    const response = await fetch(`${baseUrl}/api/v1/projects/${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(200)
    
    const project = await response.json()
    expect(project).toHaveProperty('id')
    expect(project).toHaveProperty('title')
    expect(project).toHaveProperty('description')
    expect(project).toHaveProperty('genre')
    expect(project).toHaveProperty('episodeCount')
    expect(project).toHaveProperty('targetAudience')
    expect(project).toHaveProperty('status')
    expect(project).toHaveProperty('createdBy')
    expect(project).toHaveProperty('collaborators')
    expect(project).toHaveProperty('styleReferences')
    expect(project).toHaveProperty('projectSettings')
    expect(project).toHaveProperty('progress')
    expect(project).toHaveProperty('createdAt')
    expect(project).toHaveProperty('updatedAt')
    
    // Validate nested objects
    expect(project.createdBy).toHaveProperty('id')
    expect(project.createdBy).toHaveProperty('name')
    expect(project.createdBy).toHaveProperty('email')
    
    expect(project.projectSettings).toHaveProperty('aspectRatio')
    expect(project.projectSettings).toHaveProperty('episodeDuration')
    expect(project.projectSettings).toHaveProperty('qualityTier')
    
    expect(project.progress).toHaveProperty('currentPhase')
    expect(project.progress).toHaveProperty('completedSteps')
    expect(project.progress).toHaveProperty('overallProgress')
  })

  it('should return 404 for non-existent project', async () => {
    const baseUrl = getContractBaseUrl()
    const response = await fetch(`${baseUrl}/api/v1/projects/non-existent-id`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(404)
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('error')
  })

  it('should reject access to unauthorized project', async () => {
    const baseUrl = getContractBaseUrl()
    const response = await fetch(`${baseUrl}/api/v1/projects/unauthorized-project-id`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer other-user-token',
      },
    })

    expect(response.status).toBe(403)
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('error')
  })
})