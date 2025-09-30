import { it, expect } from 'vitest'
import { describeContract, getContractBaseUrl } from './utils'

describeContract('GET /api/v1/media Contract', () => {
  const BASE_URL = getContractBaseUrl()

  it('should return project media with pagination', async () => {
    const projectId = 'test-project-id'

    // This test MUST fail initially (no implementation yet)
    const response = await fetch(`${BASE_URL}/api/v1/media?projectId=${projectId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('media')
    expect(responseData).toHaveProperty('pagination')
    expect(responseData.media).toBeInstanceOf(Array)
    
    if (responseData.media.length > 0) {
      const media = responseData.media[0]
      expect(media).toHaveProperty('id')
      expect(media).toHaveProperty('url')
      expect(media).toHaveProperty('filename')
      expect(media).toHaveProperty('mediaType')
      expect(media).toHaveProperty('agentGenerated')
      expect(media).toHaveProperty('description')
      expect(media).toHaveProperty('tags')
      expect(media).toHaveProperty('status')
      expect(media).toHaveProperty('createdAt')
    }
  })

  it('should filter media by type', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/media?projectId=test-project-id&mediaType=character_design`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(200)
    
    const responseData = await response.json()
    responseData.media.forEach((media: any) => {
      expect(media.mediaType).toBe('character_design')
    })
  })

  it('should require project ID parameter', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/media`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
      },
    })

    expect(response.status).toBe(400)
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('error')
    expect(errorData.error).toContain('projectId required')
  })
})