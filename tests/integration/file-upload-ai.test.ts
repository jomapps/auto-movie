import { describe, it, expect, beforeEach } from 'vitest'

describe('File Upload with AI Processing Integration', () => {
  let projectId: string
  let sessionId: string
  let authToken: string

  beforeEach(async () => {
    authToken = 'test-auth-token'
    projectId = 'test-project-id'
    sessionId = 'test-session-id'
  })

  it('should upload file and incorporate into AI suggestions', async () => {
    // Step 1: User uploads reference image
    const formData = new FormData()
    formData.append('projectId', projectId)
    formData.append('sessionId', sessionId)
    
    const referenceImage = new File(['reference image content'], 'style-ref.jpg', {
      type: 'image/jpeg',
    })
    formData.append('files', referenceImage)

    const uploadResponse = await fetch('http://localhost:3010/api/v1/chat/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    })

    expect(uploadResponse.status).toBe(200)
    const uploadData = await uploadResponse.json()
    expect(uploadData).toHaveProperty('files')
    expect(uploadData.files.length).toBeGreaterThan(0)
    
    // Step 2: System processes and stores file
    const uploadedFile = uploadData.files[0]
    expect(uploadedFile).toHaveProperty('id')
    expect(uploadedFile).toHaveProperty('url')
    expect(uploadedFile).toHaveProperty('mediaType')
    
    // Step 3: User sends chat message
    const chatResponse = await fetch('http://localhost:3010/api/v1/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        projectId,
        sessionId,
        message: 'Please analyze the reference image I uploaded and suggest character designs',
      }),
    })

    expect(chatResponse.status).toBe(200)
    const chatData = await chatResponse.json()
    
    // Step 4: AI incorporates uploaded reference
    // Expected: File stored, AI mentions reference in response
    expect(chatData).toHaveProperty('response')
    expect(chatData.response.toLowerCase()).toMatch(/reference|image|upload|style/)
    expect(chatData).toHaveProperty('choices')
    expect(chatData.choices.length).toBeGreaterThan(0)
  })

  it('should handle unsupported file types gracefully', async () => {
    const formData = new FormData()
    formData.append('projectId', projectId)
    
    const unsupportedFile = new File(['executable content'], 'malware.exe', {
      type: 'application/x-msdownload',
    })
    formData.append('files', unsupportedFile)

    const response = await fetch('http://localhost:3010/api/v1/chat/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    })

    expect(response.status).toBe(415) // Unsupported Media Type
    
    const errorData = await response.json()
    expect(errorData).toHaveProperty('error')
    expect(errorData.error).toContain('file type not supported')
  })

  it('should process multiple reference files', async () => {
    const formData = new FormData()
    formData.append('projectId', projectId)
    
    const file1 = new File(['image 1'], 'ref1.jpg', { type: 'image/jpeg' })
    const file2 = new File(['image 2'], 'ref2.png', { type: 'image/png' })
    formData.append('files', file1)
    formData.append('files', file2)

    const response = await fetch('http://localhost:3010/api/v1/chat/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    })

    expect(response.status).toBe(200)
    
    const uploadData = await response.json()
    expect(uploadData.files).toHaveLength(2)
    expect(uploadData.message).toContain('2 file(s)')
  })
})