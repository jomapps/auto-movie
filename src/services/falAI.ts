/**
 * Fal.ai Media Generation Service
 * Handles text-to-image and image-to-image generation for movie production
 */

export interface FalImageRequest {
  prompt: string
  image_size?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9'
  num_inference_steps?: number
  guidance_scale?: number
  num_images?: number
  enable_safety_checker?: boolean
  sync_mode?: boolean
}

export interface FalImageEditRequest extends FalImageRequest {
  image_url: string
  mask_url?: string
  strength?: number
}

export interface FalImageResponse {
  images: Array<{
    url: string
    width: number
    height: number
    content_type: string
  }>
  timings: {
    inference: number
  }
  seed: number
  has_nsfw_concepts: boolean[]
  prompt: string
}

class FalAIService {
  private apiKey: string
  private baseUrl = 'https://fal.run/fal-ai'
  private textToImageModel: string
  private imageToImageModel: string

  constructor() {
    this.apiKey = process.env.FAL_KEY || ''
    this.textToImageModel = process.env.FAL_TEXT_TO_IMAGE_MODEL || 'fal-ai/nano-banana'
    this.imageToImageModel = process.env.FAL_IMAGE_TO_IMAGE_MODEL || 'fal-ai/nano-banana/edit'
  }

  /**
   * Generate images from text prompt
   */
  async generateImage(request: FalImageRequest): Promise<FalImageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.textToImageModel}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          image_size: request.image_size || 'landscape_16_9',
          num_inference_steps: request.num_inference_steps || 28,
          guidance_scale: request.guidance_scale || 7.5,
          num_images: request.num_images || 1,
          enable_safety_checker: request.enable_safety_checker ?? true,
          sync_mode: request.sync_mode ?? true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(`Fal.ai API error: ${response.status} ${errorData?.detail || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Fal.ai image generation error:', error)
      throw new Error('Failed to generate image')
    }
  }

  /**
   * Edit/modify existing images
   */
  async editImage(request: FalImageEditRequest): Promise<FalImageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.imageToImageModel}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Key ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: request.prompt,
          image_url: request.image_url,
          mask_url: request.mask_url,
          strength: request.strength || 0.8,
          image_size: request.image_size || 'landscape_16_9',
          num_inference_steps: request.num_inference_steps || 28,
          guidance_scale: request.guidance_scale || 7.5,
          num_images: request.num_images || 1,
          enable_safety_checker: request.enable_safety_checker ?? true,
          sync_mode: request.sync_mode ?? true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(`Fal.ai API error: ${response.status} ${errorData?.detail || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Fal.ai image edit error:', error)
      throw new Error('Failed to edit image')
    }
  }

  /**
   * Generate storyboard images for movie scenes
   */
  async generateStoryboard(
    scenes: Array<{ description: string; style?: string }>,
    options: {
      imageSize?: FalImageRequest['image_size']
      style?: string
    } = {}
  ): Promise<Array<{ scene: string; images: FalImageResponse['images'] }>> {
    const results = []

    for (const scene of scenes) {
      const prompt = this.buildStoryboardPrompt(scene.description, scene.style || options.style)
      
      try {
        const response = await this.generateImage({
          prompt,
          image_size: options.imageSize || 'landscape_16_9',
          num_images: 1,
          guidance_scale: 8.0, // Higher guidance for more consistent style
        })

        results.push({
          scene: scene.description,
          images: response.images,
        })

        // Add small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to generate storyboard for scene: ${scene.description}`, error)
        // Continue with other scenes even if one fails
        results.push({
          scene: scene.description,
          images: [],
        })
      }
    }

    return results
  }

  /**
   * Generate character concept art
   */
  async generateCharacterArt(
    character: {
      name: string
      description: string
      personality: string
      appearance: string
    },
    options: {
      style?: string
      variations?: number
    } = {}
  ): Promise<FalImageResponse> {
    const prompt = this.buildCharacterPrompt(character, options.style)

    return await this.generateImage({
      prompt,
      image_size: 'portrait_4_3',
      num_images: options.variations || 2,
      guidance_scale: 8.5, // Higher guidance for character consistency
    })
  }

  /**
   * Build optimized prompt for storyboard generation
   */
  private buildStoryboardPrompt(sceneDescription: string, style?: string): string {
    const basePrompt = `Movie storyboard frame: ${sceneDescription}`
    const styleModifier = style ? `, ${style} style` : ', cinematic composition, professional storyboard art'
    const qualityModifiers = ', high quality, detailed, movie pre-production art, concept art'
    
    return basePrompt + styleModifier + qualityModifiers
  }

  /**
   * Build optimized prompt for character generation
   */
  private buildCharacterPrompt(
    character: { name: string; description: string; personality: string; appearance: string },
    style?: string
  ): string {
    const basePrompt = `Character concept art: ${character.name}, ${character.appearance}, ${character.description}`
    const personalityHint = character.personality ? `, personality: ${character.personality}` : ''
    const styleModifier = style ? `, ${style} style` : ', movie character design, professional concept art'
    const qualityModifiers = ', high quality, detailed, character sheet, consistent character design'
    
    return basePrompt + personalityHint + styleModifier + qualityModifiers
  }

  /**
   * Check service health and API key validity
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      if (!this.apiKey) {
        return { status: 'error', message: 'FAL_KEY environment variable not set' }
      }

      // Test with a simple generation request
      await this.generateImage({
        prompt: 'test image',
        num_images: 1,
        image_size: 'square',
        num_inference_steps: 1, // Minimal steps for quick test
      })

      return { status: 'ok', message: 'Fal.ai service is healthy' }
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const falAIService = new FalAIService()
export default falAIService