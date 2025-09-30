import { it, expect } from 'vitest'
import { describeContract, getContractBaseUrl } from './utils'

describeContract('POST /api/v1/media/upload Contract', () => {
  it('should upload media files to project', async () => {
    const baseUrl = getContractBaseUrl()
    const formData = new FormData()
    formData.append('projectId', 'test-project-id')
    formData.append('mediaType', 'style_reference')
    formData.append('description', 'Character design reference')
    formData.append('tags', JSON.stringify(['character', 'reference', 'style']))
    
    const testFile = new File(['test image content'], 'character-ref.jpg', {
      type: 'image/jpeg',
    })
    formData.append('files', testFile)

    // This test MUST fail initially (no implementation yet)
    const response = await fetch(`${baseUrl}/api/v1/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
      },
      body: formData,
    })

    expect(response.status).toBe(201)
    
    const responseData = await response.json()
    expect(responseData).toHaveProperty('media')
    expect(responseData.media).toBeInstanceOf(Array)
    
    const uploadedMedia = responseData.media[0]
    expect(uploadedMedia).toHaveProperty('id')
    expect(uploadedMedia).toHaveProperty('url')
    expect(uploadedMedia).toHaveProperty('filename')
    expect(uploadedMedia).toHaveProperty('mediaType')
    expect(uploadedMedia).toHaveProperty('size')
    expect(uploadedMedia).toHaveProperty('mimeType')
    expect(uploadedMedia.status).toBe('processing')
  })

  it('should reject upload without project ID', async () => {
    const baseUrl = getContractBaseUrl()
    const formData = new FormData()
    formData.append('mediaType', 'style_reference')
    
    const testFile = new File(['test content'], 'test.jpg', {
      type: 'image/jpeg',
    })
    formData.append('files', testFile)

    const response = await fetch(`${baseUrl}/api/v1/media/upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
      },
      body: formData,
    })

    expect(response.status).toBe(400)
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('error')
    expect(errorData.error).toContain('Project ID required')
  })

  it('should reject unauthorized upload', async () => {
    const baseUrl = getContractBaseUrl()
    const formData = new FormData()
    formData.append('projectId', 'test-project-id')
    formData.append('mediaType', 'style_reference')
    
    const testFile = new File(['test content'], 'test.jpg', {
      type: 'image/jpeg',
    })
    formData.append('files', testFile)

    const response = await fetch(`${baseUrl}/api/v1/media/upload`, {
      method: 'POST',
      // No Authorization header
      body: formData,
    })

    expect(response.status).toBe(401)
  })
})