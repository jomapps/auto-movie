# Chat Missing Components - Developer Reference

**Document Version**: 1.0  
**Last Updated**: 2025-01-30  
**Purpose**: Technical reference for implementing missing chat components

## 📁 Files to Create

### 1. Data Extraction Service

**File**: `apps/auto-movie/src/services/dataExtraction.ts`

```typescript
import { LLMMessage, ProjectContext } from '@/types'
import { openRouterLLMService } from './novelLLM'

export interface ExtractedEntity {
  type: 'character' | 'scene' | 'location' | 'relationship'
  data: Record<string, any>
  confidence: number
}

export interface ExtractedData {
  characters?: CharacterData[]
  scenes?: SceneData[]
  locations?: LocationData[]
  relationships?: RelationshipData[]
  metadata?: {
    extractionMethod: string
    confidence: number
    requiresConfirmation: boolean
  }
}

export class DataExtractionService {
  /**
   * Extract structured entities from conversational text
   */
  async extractStructuredData(
    message: string,
    context: ProjectContext
  ): Promise<ExtractedData> {
    // Use LLM with structured output to parse entities
    const systemPrompt = this.buildExtractionPrompt(context)
    const response = await openRouterLLMService.generateResponse(
      [{ role: 'user', content: message }],
      { ...context, systemPrompt }
    )
    
    // Parse LLM response into structured entities
    const entities = this.parseEntities(response.content)
    
    // Validate and normalize data
    const validated = await this.validateEntities(entities, context)
    
    return validated
  }

  /**
   * Build extraction prompt with schema information
   */
  private buildExtractionPrompt(context: ProjectContext): string {
    return `You are a data extraction assistant for movie production.
    Extract structured entities from user messages.
    
    Available entity types:
    - Character: name, age, occupation, traits, background, motivation
    - Scene: title, location, timeOfDay, characters, description, duration
    - Location: name, type, description, atmosphere
    - Relationship: character1, character2, type, description
    
    Current project context: ${JSON.stringify(context)}
    
    Return entities in JSON format with confidence scores.`
  }

  /**
   * Parse LLM response into structured entities
   */
  private parseEntities(content: string): ExtractedEntity[] {
    // Parse JSON from LLM response
    // Handle multiple entities in one message
    // Assign confidence scores
    // Return structured entities
  }

  /**
   * Validate entities against PayloadCMS schemas
   */
  private async validateEntities(
    entities: ExtractedEntity[],
    context: ProjectContext
  ): Promise<ExtractedData> {
    // Check required fields
    // Validate data types
    // Check for duplicates
    // Normalize values
    // Return validated data
  }
}

export const dataExtractionService = new DataExtractionService()
```

### 2. Schema Mapper

**File**: `apps/auto-movie/src/services/schemaMapper.ts`

```typescript
import { ExtractedData } from './dataExtraction'

export class SchemaMapper {
  /**
   * Map extracted data to PayloadCMS collection schemas
   */
  mapToCollectionSchema(
    entityType: string,
    data: Record<string, any>,
    projectId: string
  ): Record<string, any> {
    switch (entityType) {
      case 'character':
        return this.mapCharacter(data, projectId)
      case 'scene':
        return this.mapScene(data, projectId)
      case 'location':
        return this.mapLocation(data, projectId)
      default:
        throw new Error(`Unknown entity type: ${entityType}`)
    }
  }

  /**
   * Map character data to Character collection schema
   */
  private mapCharacter(data: any, projectId: string) {
    return {
      name: data.name,
      age: data.age,
      occupation: data.occupation,
      traits: data.traits || [],
      background: data.background || '',
      motivation: data.motivation || '',
      project: projectId,
      status: 'draft',
      createdVia: 'chat',
      // Map other fields according to Character collection schema
    }
  }

  /**
   * Map scene data to Scene collection schema
   */
  private mapScene(data: any, projectId: string) {
    return {
      title: data.title,
      description: data.description,
      location: data.location, // Will need to resolve to location ID
      timeOfDay: data.timeOfDay,
      characters: data.characters, // Will need to resolve to character IDs
      duration: data.duration,
      project: projectId,
      status: 'draft',
      createdVia: 'chat',
      // Map other fields according to Scene collection schema
    }
  }

  /**
   * Map location data to Location collection schema
   */
  private mapLocation(data: any, projectId: string) {
    return {
      name: data.name,
      type: data.type,
      description: data.description,
      atmosphere: data.atmosphere,
      project: projectId,
      status: 'draft',
      createdVia: 'chat',
      // Map other fields according to Location collection schema
    }
  }

  /**
   * Resolve entity references (e.g., character names to IDs)
   */
  async resolveReferences(
    mappedData: Record<string, any>,
    projectId: string
  ): Promise<Record<string, any>> {
    // Look up referenced entities by name
    // Replace names with IDs
    // Handle missing references
    // Return resolved data
  }
}

export const schemaMapper = new SchemaMapper()
```

### 3. PayloadCMS Integration Service

**File**: `apps/auto-movie/src/services/payloadIntegration.ts`

```typescript
import { getPayload } from 'payload'
import config from '@payload-config'
import { ExtractedData } from './dataExtraction'
import { schemaMapper } from './schemaMapper'

export class PayloadIntegrationService {
  /**
   * Create collection entries from extracted data
   */
  async createFromExtractedData(
    extractedData: ExtractedData,
    projectId: string
  ): Promise<CreationResult> {
    const payload = await getPayload({ config })
    const results: CreationResult = {
      characters: [],
      scenes: [],
      locations: [],
      errors: [],
    }

    // Create characters
    if (extractedData.characters) {
      for (const character of extractedData.characters) {
        try {
          const mapped = schemaMapper.mapToCollectionSchema(
            'character',
            character,
            projectId
          )
          const created = await payload.create({
            collection: 'characters',
            data: mapped,
          })
          results.characters.push(created)
        } catch (error) {
          results.errors.push({
            type: 'character',
            data: character,
            error: error.message,
          })
        }
      }
    }

    // Create scenes
    if (extractedData.scenes) {
      for (const scene of extractedData.scenes) {
        try {
          const mapped = schemaMapper.mapToCollectionSchema(
            'scene',
            scene,
            projectId
          )
          // Resolve character and location references
          const resolved = await schemaMapper.resolveReferences(mapped, projectId)
          const created = await payload.create({
            collection: 'scenes',
            data: resolved,
          })
          results.scenes.push(created)
        } catch (error) {
          results.errors.push({
            type: 'scene',
            data: scene,
            error: error.message,
          })
        }
      }
    }

    // Create locations
    if (extractedData.locations) {
      for (const location of extractedData.locations) {
        try {
          const mapped = schemaMapper.mapToCollectionSchema(
            'location',
            location,
            projectId
          )
          const created = await payload.create({
            collection: 'locations',
            data: mapped,
          })
          results.locations.push(created)
        } catch (error) {
          results.errors.push({
            type: 'location',
            data: location,
            error: error.message,
          })
        }
      }
    }

    return results
  }

  /**
   * Check for duplicate entities before creation
   */
  async checkDuplicates(
    entityType: string,
    data: Record<string, any>,
    projectId: string
  ): Promise<any | null> {
    const payload = await getPayload({ config })
    
    // Search for existing entity with same name in project
    const existing = await payload.find({
      collection: entityType as any,
      where: {
        and: [
          { project: { equals: projectId } },
          { name: { equals: data.name } },
        ],
      },
    })

    return existing.docs.length > 0 ? existing.docs[0] : null
  }
}

export const payloadIntegrationService = new PayloadIntegrationService()

interface CreationResult {
  characters: any[]
  scenes: any[]
  locations: any[]
  errors: Array<{
    type: string
    data: any
    error: string
  }>
}
```

### 4. Workflow Engine

**File**: `apps/auto-movie/src/services/workflowEngine.ts`

```typescript
import { ProjectContext } from '@/types'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface WorkflowStep {
  id: string
  name: string
  description: string
  prerequisites: string[] // IDs of required previous steps
  requiredData: RequiredData[]
  validation: (context: ProjectContext) => Promise<ValidationResult>
}

export interface RequiredData {
  collection: string
  minimumCount: number
  conditions?: Record<string, any>
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  missingData: RequiredData[]
}

export class WorkflowEngine {
  private steps: Map<string, WorkflowStep> = new Map()

  constructor() {
    this.initializeSteps()
  }

  /**
   * Initialize workflow steps with dependencies
   */
  private initializeSteps() {
    // Define all workflow steps
    this.steps.set('initial_concept', {
      id: 'initial_concept',
      name: 'Initial Concept',
      description: 'Define the basic concept and premise',
      prerequisites: [],
      requiredData: [],
      validation: async () => ({ valid: true, errors: [], warnings: [], missingData: [] }),
    })

    this.steps.set('character_development', {
      id: 'character_development',
      name: 'Character Development',
      description: 'Create and develop characters',
      prerequisites: ['initial_concept'],
      requiredData: [
        { collection: 'characters', minimumCount: 1 },
      ],
      validation: this.validateCharacterDevelopment,
    })

    this.steps.set('scene_breakdown', {
      id: 'scene_breakdown',
      name: 'Scene Breakdown',
      description: 'Break down story into scenes',
      prerequisites: ['character_development'],
      requiredData: [
        { collection: 'characters', minimumCount: 2 },
        { collection: 'scenes', minimumCount: 1 },
      ],
      validation: this.validateSceneBreakdown,
    })

    // Add more steps...
  }

  /**
   * Check if user can advance to a specific step
   */
  async canAdvanceToStep(
    stepId: string,
    context: ProjectContext
  ): Promise<ValidationResult> {
    const step = this.steps.get(stepId)
    if (!step) {
      return {
        valid: false,
        errors: [`Unknown step: ${stepId}`],
        warnings: [],
        missingData: [],
      }
    }

    // Check prerequisites
    const prerequisiteCheck = await this.checkPrerequisites(step, context)
    if (!prerequisiteCheck.valid) {
      return prerequisiteCheck
    }

    // Check required data
    const dataCheck = await this.checkRequiredData(step, context)
    if (!dataCheck.valid) {
      return dataCheck
    }

    // Run step-specific validation
    return await step.validation(context)
  }

  /**
   * Check if all prerequisite steps are completed
   */
  private async checkPrerequisites(
    step: WorkflowStep,
    context: ProjectContext
  ): Promise<ValidationResult> {
    // Implementation
  }

  /**
   * Check if required data exists
   */
  private async checkRequiredData(
    step: WorkflowStep,
    context: ProjectContext
  ): Promise<ValidationResult> {
    // Implementation
  }

  /**
   * Validate character development step
   */
  private async validateCharacterDevelopment(
    context: ProjectContext
  ): Promise<ValidationResult> {
    // Check if characters have required fields
    // Validate character relationships
    // Check for character diversity
    // Return validation result
  }

  /**
   * Validate scene breakdown step
   */
  private async validateSceneBreakdown(
    context: ProjectContext
  ): Promise<ValidationResult> {
    // Check if scenes reference valid characters
    // Validate scene structure
    // Check for scene continuity
    // Return validation result
  }
}

export const workflowEngine = new WorkflowEngine()
```

## 🔗 Integration Points

### Update Chat Message Route

**File**: `apps/auto-movie/src/app/api/v1/chat/message/route.ts`

```typescript
import { dataExtractionService } from '@/services/dataExtraction'
import { payloadIntegrationService } from '@/services/payloadIntegration'
import { workflowEngine } from '@/services/workflowEngine'

export async function POST(request: NextRequest) {
  // ... existing code ...

  // NEW: Extract structured data from message
  const extractedData = await dataExtractionService.extractStructuredData(
    message,
    { projectId, currentStep: session.currentStep }
  )

  // NEW: Create PayloadCMS entries
  const creationResult = await payloadIntegrationService.createFromExtractedData(
    extractedData,
    projectId
  )

  // NEW: Validate workflow progression
  const validation = await workflowEngine.canAdvanceToStep(
    nextStep,
    { projectId, currentStep: session.currentStep }
  )

  // Include creation results in response
  return NextResponse.json({
    sessionId: session.id,
    response: aiResponse,
    choices,
    currentStep: session.currentStep,
    progress: 5,
    createdEntities: {
      characters: creationResult.characters.map(c => c.id),
      scenes: creationResult.scenes.map(s => s.id),
      locations: creationResult.locations.map(l => l.id),
    },
    validationErrors: validation.errors,
  })
}
```

## 📝 Implementation Checklist

- [ ] Create `dataExtraction.ts` service
- [ ] Create `schemaMapper.ts` service
- [ ] Create `payloadIntegration.ts` service
- [ ] Create `workflowEngine.ts` service
- [ ] Update chat message route to use new services
- [ ] Add error handling and user feedback
- [ ] Create tests for each service
- [ ] Update UI to display created entities
- [ ] Add validation error display in chat
- [ ] Document API changes

## 🧪 Testing Strategy

1. **Unit Tests**: Test each service independently
2. **Integration Tests**: Test service interactions
3. **E2E Tests**: Test complete chat → data → production flow
4. **Manual Testing**: Test with real user scenarios

---

**This reference provides the technical foundation for implementing the missing chat components. Follow the structure and adapt to specific project needs.**

