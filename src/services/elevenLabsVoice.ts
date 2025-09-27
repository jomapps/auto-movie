/**
 * ElevenLabs Voice Generation Service
 * Handles text-to-speech and voice cloning for movie production
 */

export interface VoiceSettings {
  stability: number // 0-1
  similarity_boost: number // 0-1
  style?: number // 0-1
  use_speaker_boost?: boolean
}

export interface VoiceGenerationRequest {
  text: string
  voice_id: string
  model_id?: string
  voice_settings?: VoiceSettings
  output_format?: 'mp3_22050_32' | 'mp3_44100_32' | 'mp3_44100_64' | 'mp3_44100_96' | 'mp3_44100_128' | 'mp3_44100_192'
  optimize_streaming_latency?: number // 0-4
  chunk_length_schedule?: number[]
}

export interface Voice {
  voice_id: string
  name: string
  samples?: Array<{
    sample_id: string
    file_name: string
    mime_type: string
    size_bytes: number
    hash: string
  }>
  category: string
  fine_tuning: {
    is_allowed_to_fine_tune: boolean
    state: Record<string, any>
  }
  labels: Record<string, string>
  description?: string
  preview_url?: string
  available_for_tiers: string[]
  settings?: VoiceSettings
  sharing?: {
    status: string
    history_item_sample_id?: string
    original_voice_id?: string
    public_owner_id?: string
    liked_by_count: number
    cloned_by_count: number
    name: string
    description: string
    labels: Record<string, string>
    created_at: string
  }
}

export interface VoiceResponse {
  audio: ArrayBuffer
  contentType: string
}

class ElevenLabsVoiceService {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'

  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || ''
  }

  /**
   * Generate speech from text using a specific voice
   */
  async generateSpeech(request: VoiceGenerationRequest): Promise<VoiceResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('ELEVENLABS_API_KEY environment variable not set')
      }

      const response = await fetch(
        `${this.baseUrl}/text-to-speech/${request.voice_id}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey,
          },
          body: JSON.stringify({
            text: request.text,
            model_id: request.model_id || 'eleven_monolingual_v1',
            voice_settings: request.voice_settings || {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: true,
            },
            output_format: request.output_format || 'mp3_44100_128',
            optimize_streaming_latency: request.optimize_streaming_latency || 0,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          `ElevenLabs API error: ${response.status} ${errorData?.detail?.message || response.statusText}`
        )
      }

      const audioBuffer = await response.arrayBuffer()
      return {
        audio: audioBuffer,
        contentType: response.headers.get('Content-Type') || 'audio/mpeg',
      }
    } catch (error) {
      console.error('ElevenLabs speech generation error:', error)
      throw new Error('Failed to generate speech')
    }
  }

  /**
   * Get all available voices
   */
  async getVoices(): Promise<Voice[]> {
    try {
      if (!this.apiKey) {
        throw new Error('ELEVENLABS_API_KEY environment variable not set')
      }

      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          `ElevenLabs API error: ${response.status} ${errorData?.detail?.message || response.statusText}`
        )
      }

      const data = await response.json()
      return data.voices || []
    } catch (error) {
      console.error('ElevenLabs get voices error:', error)
      throw new Error('Failed to get voices')
    }
  }

  /**
   * Get details of a specific voice
   */
  async getVoice(voiceId: string): Promise<Voice> {
    try {
      if (!this.apiKey) {
        throw new Error('ELEVENLABS_API_KEY environment variable not set')
      }

      const response = await fetch(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(
          `ElevenLabs API error: ${response.status} ${errorData?.detail?.message || response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error('ElevenLabs get voice error:', error)
      throw new Error('Failed to get voice details')
    }
  }

  /**
   * Generate dialogue for multiple characters in a scene
   */
  async generateDialogue(
    dialogue: Array<{
      character: string
      voiceId: string
      text: string
      emotion?: string
    }>,
    options: {
      outputFormat?: VoiceGenerationRequest['output_format']
      model?: string
    } = {}
  ): Promise<Array<{ character: string; audio: ArrayBuffer; contentType: string }>> {
    const results = []

    for (const line of dialogue) {
      try {
        // Adjust voice settings based on emotion if specified
        const voiceSettings = this.getEmotionalVoiceSettings(line.emotion)

        const response = await this.generateSpeech({
          text: line.text,
          voice_id: line.voiceId,
          model_id: options.model || 'eleven_monolingual_v1',
          voice_settings: voiceSettings,
          output_format: options.outputFormat || 'mp3_44100_128',
        })

        results.push({
          character: line.character,
          audio: response.audio,
          contentType: response.contentType,
        })

        // Add small delay between requests to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Failed to generate voice for ${line.character}:`, error)
        // Continue with other characters even if one fails
        results.push({
          character: line.character,
          audio: new ArrayBuffer(0),
          contentType: 'audio/mpeg',
        })
      }
    }

    return results
  }

  /**
   * Create voice settings based on emotional context
   */
  private getEmotionalVoiceSettings(emotion?: string): VoiceSettings {
    const baseSettings = {
      stability: 0.5,
      similarity_boost: 0.5,
      style: 0.0,
      use_speaker_boost: true,
    }

    if (!emotion) return baseSettings

    switch (emotion.toLowerCase()) {
      case 'excited':
      case 'happy':
        return { ...baseSettings, stability: 0.3, style: 0.4 }
      case 'angry':
      case 'frustrated':
        return { ...baseSettings, stability: 0.7, similarity_boost: 0.7, style: 0.6 }
      case 'sad':
      case 'melancholy':
        return { ...baseSettings, stability: 0.8, style: 0.2 }
      case 'calm':
      case 'peaceful':
        return { ...baseSettings, stability: 0.9, style: 0.1 }
      case 'dramatic':
      case 'intense':
        return { ...baseSettings, stability: 0.4, similarity_boost: 0.8, style: 0.7 }
      case 'whisper':
      case 'quiet':
        return { ...baseSettings, stability: 0.9, similarity_boost: 0.3, style: 0.1 }
      default:
        return baseSettings
    }
  }

  /**
   * Get popular character voice presets
   */
  async getCharacterVoices(): Promise<Array<{ id: string; name: string; category: string; description: string }>> {
    try {
      const voices = await this.getVoices()
      
      // Filter for voices suitable for character work
      return voices
        .filter(voice => 
          voice.category === 'premade' || 
          voice.category === 'cloned' ||
          voice.labels?.['use_case']?.includes('characters')
        )
        .map(voice => ({
          id: voice.voice_id,
          name: voice.name,
          category: voice.category,
          description: voice.description || `${voice.category} voice - ${voice.name}`,
        }))
        .slice(0, 20) // Limit to top 20 character voices
    } catch (error) {
      console.error('Error getting character voices:', error)
      return []
    }
  }

  /**
   * Check service health and API key validity
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; message: string }> {
    try {
      if (!this.apiKey) {
        return { status: 'error', message: 'ELEVENLABS_API_KEY environment variable not set' }
      }

      // Test API connectivity by getting voices (lightweight operation)
      await this.getVoices()

      return { status: 'ok', message: 'ElevenLabs service is healthy' }
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const elevenLabsVoiceService = new ElevenLabsVoiceService()
export default elevenLabsVoiceService