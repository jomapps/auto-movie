# Database Schema Design - Movie Generation Platform

## Overview
This document outlines the complete database architecture for the AI-powered movie generation platform using MongoDB via PayloadCMS with Mongoose adapter.

## Technology Stack
- **Database**: MongoDB (via Mongoose)
- **ORM/CMS**: PayloadCMS 3.56.0
- **Storage**: Cloudflare R2 (S3-compatible) for media files
- **Validation**: Zod schemas
- **Language**: TypeScript

## Architecture Principles

### 1. Normalized Data Model
- Relationships via PayloadCMS relationship fields
- Minimize data duplication
- Use references over embedded documents for large datasets

### 2. Flexible Schema
- JSON fields for extensible metadata
- Support for AI-generated content attributes
- Version tracking for iterative content

### 3. Performance Optimization
- Strategic indexing on query patterns
- Compound indexes for common filters
- Text indexes for search functionality

## Core Collections

### 1. Users Collection
**Purpose**: Authentication, authorization, and user management

```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  name: string,
  password: string (hashed),
  role: 'user' | 'admin' | 'producer',
  preferences: {
    theme: string,
    notifications: boolean,
    language: string
  },
  subscription: {
    tier: 'free' | 'pro' | 'enterprise',
    maxProjects: number,
    maxEpisodesPerProject: number,
    features: string[]
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `email` (unique)
- `role`
- `subscription.tier`

**Access Control**:
- Read: Authenticated users (own data) + admins (all)
- Create: Public (registration)
- Update: Self or admin
- Delete: Admin only

---

### 2. Projects Collection
**Purpose**: Movie series/project management

```typescript
{
  _id: ObjectId,
  title: string (indexed),
  description: text,
  genre: 'action' | 'comedy' | 'drama' | 'horror' | 'sci-fi' | 'thriller' | 'romance' | 'documentary',
  episodeCount: number (1-50),
  targetAudience: 'children' | 'family' | 'teen' | 'adult',
  status: 'concept' | 'pre-production' | 'production' | 'post-production' | 'completed' | 'on-hold',

  // Relationships
  createdBy: ObjectId (ref: Users),
  collaborators: ObjectId[] (ref: Users),
  styleReferences: ObjectId[] (ref: Media, filtered by mediaType),

  projectSettings: {
    aspectRatio: '16:9' | '4:3' | '21:9',
    episodeDuration: number, // minutes
    qualityTier: 'draft' | 'standard' | 'premium'
  },

  progress: {
    currentPhase: 'story_development' | 'character_creation' | 'visual_design' |
                  'audio_design' | 'scene_production' | 'post_production' | 'final_assembly',
    completedSteps: string[],
    overallProgress: number (0-100)
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `title` (text index for search)
- `createdBy`
- `status`
- `genre`
- Compound: `createdBy + status`
- Compound: `collaborators + status`

**Access Control**:
- Read: Owner, collaborators, admins
- Create: Authenticated users
- Update: Owner, collaborators, admins
- Delete: Owner, admins

---

### 3. Episodes Collection (NEW)
**Purpose**: Individual episode management within projects

```typescript
{
  _id: ObjectId,
  project: ObjectId (ref: Projects, indexed),
  episodeNumber: number,
  title: string,
  description: text,

  synopsis: {
    logline: string,
    summary: text,
    themes: string[]
  },

  status: 'planning' | 'scripting' | 'storyboarding' | 'production' | 'editing' | 'completed',

  script: {
    content: text,
    version: number,
    wordCount: number,
    estimatedDuration: number // seconds
  },

  production: {
    sceneCount: number,
    completedScenes: number,
    renderProgress: number (0-100)
  },

  metadata: {
    duration: number, // actual duration in seconds
    finalVideo: ObjectId (ref: Media),
    thumbnail: ObjectId (ref: Media)
  },

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `project`
- Compound: `project + episodeNumber` (unique)
- `status`

---

### 4. Characters Collection (NEW)
**Purpose**: Character definitions and tracking

```typescript
{
  _id: ObjectId,
  project: ObjectId (ref: Projects, indexed),
  name: string,
  description: text,

  profile: {
    age: string,
    gender: string,
    personality: string[],
    backstory: text,
    motivations: string[],
    relationships: {
      characterId: ObjectId (ref: Characters),
      relationshipType: string,
      description: string
    }[]
  },

  visualDesign: {
    referenceImages: ObjectId[] (ref: Media),
    finalDesign: ObjectId (ref: Media),
    styleNotes: text,
    colorPalette: string[]
  },

  voiceProfile: {
    voiceId: string,
    audioSample: ObjectId (ref: Media),
    voiceCharacteristics: string[]
  },

  appearances: {
    episodeId: ObjectId (ref: Episodes),
    sceneIds: ObjectId[] (ref: Scenes),
    screenTime: number // seconds
  }[],

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `project`
- `name` (text index)
- Compound: `project + name`

---

### 5. Scenes Collection (NEW)
**Purpose**: Scene-level production management

```typescript
{
  _id: ObjectId,
  project: ObjectId (ref: Projects, indexed),
  episode: ObjectId (ref: Episodes, indexed),
  sceneNumber: number,
  title: string,

  script: {
    action: text,
    dialogue: {
      character: ObjectId (ref: Characters),
      lines: string,
      emotion: string,
      timing: number
    }[],
    duration: number // estimated seconds
  },

  storyboard: {
    panels: {
      panelNumber: number,
      description: text,
      image: ObjectId (ref: Media),
      cameraAngle: string,
      notes: text
    }[]
  },

  production: {
    status: 'pending' | 'generating' | 'reviewing' | 'approved' | 'failed',
    videoSegment: ObjectId (ref: Media),
    audioTrack: ObjectId (ref: Media),
    attempts: number,
    lastAttempt: Date
  },

  characters: ObjectId[] (ref: Characters),
  location: string,
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night',
  mood: string,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `episode`
- Compound: `episode + sceneNumber` (unique)
- `production.status`
- `characters`

---

### 6. Media Collection (ENHANCED)
**Purpose**: All media assets (images, video, audio)

```typescript
{
  _id: ObjectId,

  // File information
  filename: string,
  mimeType: string,
  filesize: number,
  width: number,
  height: number,
  url: string,
  thumbnailURL: string,

  // Relationships (FIXED to use proper ObjectId references)
  project: ObjectId (ref: Projects, indexed),
  episode: ObjectId (ref: Episodes),
  scene: ObjectId (ref: Scenes),
  character: ObjectId (ref: Characters),

  alt: string,
  mediaType: 'style_reference' | 'character_design' | 'environment_design' |
            'concept_art' | 'storyboard' | 'video_segment' | 'audio_clip' |
            'voice_profile' | 'music_track' | 'sound_effect' | 'final_video',

  agentGenerated: boolean,
  generationMetadata: {
    agentId: string,
    promptUsed: text,
    modelVersion: string,
    generationTime: Date,
    taskId: string,
    provider: 'fal' | 'openrouter' | 'elevenlabs' | 'custom',
    cost: number
  },

  embedding: number[], // Jina v4 vector (512 or 1024 dimensions)
  description: text,
  tags: string[],

  relatedElements: {
    characters: ObjectId[] (ref: Characters),
    episode: number,
    scene: string,
    timestamp: number
  },

  technicalData: {
    duration: number, // for audio/video
    resolution: string, // e.g., "1920x1080"
    fps: number, // for video
    sampleRate: number, // for audio
    bitrate: number,
    codec: string
  },

  version: number,
  status: 'active' | 'draft' | 'archived' | 'processing' | 'failed',

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `project`
- `episode`
- `scene`
- `mediaType`
- `status`
- Compound: `project + mediaType`
- Compound: `episode + mediaType`
- Vector index on `embedding` (for similarity search)

---

### 7. Sessions Collection (ENHANCED)
**Purpose**: Conversational UI state and workflow tracking

```typescript
{
  _id: ObjectId,
  project: ObjectId (ref: Projects, indexed), // FIXED: proper relationship
  user: ObjectId (ref: Users, indexed),

  currentStep: string,

  conversationHistory: {
    role: 'user' | 'assistant' | 'system',
    content: text,
    timestamp: Date,
    metadata: object
  }[],

  contextData: {
    currentEpisode: ObjectId (ref: Episodes),
    currentScene: ObjectId (ref: Scenes),
    focusCharacter: ObjectId (ref: Characters),
    workflowState: object,
    userPreferences: object
  },

  awaitingUserInput: boolean,

  lastChoices: {
    choiceId: string,
    label: string,
    action: string,
    metadata: object
  }[],

  sessionState: 'active' | 'paused' | 'completed' | 'error',

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `project`
- `user`
- `sessionState`
- Compound: `user + sessionState`

---

### 8. Tasks Collection (NEW)
**Purpose**: Background job tracking for AI generation

```typescript
{
  _id: ObjectId,
  taskType: 'image_generation' | 'video_generation' | 'audio_generation' |
            'script_generation' | 'embedding_generation' | 'scene_assembly',

  // Relationships
  project: ObjectId (ref: Projects, indexed),
  episode: ObjectId (ref: Episodes),
  scene: ObjectId (ref: Scenes),
  character: ObjectId (ref: Characters),

  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled',
  priority: number (1-10),

  input: {
    promptId: ObjectId (ref: PromptsExecuted),
    parameters: object,
    dependencies: ObjectId[] (ref: Tasks)
  },

  output: {
    mediaId: ObjectId (ref: Media),
    result: object,
    metrics: {
      processingTime: number, // seconds
      cost: number,
      tokensUsed: number
    }
  },

  progress: {
    percentage: number (0-100),
    currentStep: string,
    estimatedCompletion: Date
  },

  error: {
    message: text,
    code: string,
    retryCount: number,
    lastRetry: Date
  },

  worker: {
    workerId: string,
    startedAt: Date,
    heartbeat: Date
  },

  createdAt: Date,
  updatedAt: Date,
  completedAt: Date
}
```

**Indexes**:
- `status`
- `taskType`
- `project`
- `priority`
- Compound: `status + priority` (for queue processing)
- Compound: `project + status`
- `createdAt` (for cleanup of old tasks)

---

### 9. PromptTemplates Collection (EXISTING)
**Purpose**: Reusable prompt templates with versioning

```typescript
{
  _id: ObjectId,
  name: string (indexed),
  app: string,
  feature: string,
  stage: string,

  tags: { value: string }[],

  template: text,
  variableDefs: {
    name: string,
    type: 'string' | 'number' | 'boolean' | 'json' | 'text' | 'url',
    required: boolean,
    description: text,
    defaultValue: any
  }[],

  outputSchema: object,

  model: 'anthropic/claude-sonnet-4' | 'qwen/qwen3-vl-235b-a22b-thinking' |
         'fal-ai/nano-banana' | 'fal-ai/nano-banana/edit',

  notes: text,

  _version: number,
  _versions: object[], // PayloadCMS version history

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `name`
- `app`
- `stage`
- Compound: `app + stage`

---

### 10. PromptsExecuted Collection (EXISTING)
**Purpose**: Audit trail and execution history

```typescript
{
  _id: ObjectId,
  templateId: ObjectId (ref: PromptTemplates),

  app: string,
  feature: string,
  stage: string,
  projectId: string,

  tagsSnapshot: { value: string }[],
  inputs: object,
  resolvedPrompt: text,

  model: string,
  status: 'success' | 'error',

  outputRaw: object,
  errorMessage: text,

  startedAt: Date,
  finishedAt: Date,

  notes: text,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `projectId`
- `status`
- `model`
- `createdAt` (for analytics)
- Compound: `projectId + status`

---

## Entity Relationship Diagram

```
Users
  |
  |-- (1:N) --> Projects (createdBy)
  |-- (N:N) --> Projects (collaborators)
  |-- (1:N) --> Sessions

Projects
  |-- (1:N) --> Episodes
  |-- (1:N) --> Characters
  |-- (1:N) --> Scenes
  |-- (1:N) --> Media
  |-- (1:N) --> Sessions
  |-- (1:N) --> Tasks
  |-- (N:N) --> Media (styleReferences)

Episodes
  |-- (1:N) --> Scenes
  |-- (1:N) --> Media
  |-- (1:N) --> Tasks

Scenes
  |-- (N:N) --> Characters
  |-- (1:N) --> Media
  |-- (1:N) --> Tasks

Characters
  |-- (1:N) --> Media (visualDesign, voiceProfile)
  |-- (N:N) --> Scenes

Media
  |-- (N:1) --> Projects
  |-- (N:1) --> Episodes
  |-- (N:1) --> Scenes
  |-- (N:1) --> Characters

Tasks
  |-- (N:1) --> Projects
  |-- (N:1) --> Episodes
  |-- (N:1) --> Scenes
  |-- (N:1) --> Characters
  |-- (N:1) --> PromptsExecuted

PromptTemplates
  |-- (1:N) --> PromptsExecuted

PromptsExecuted
  |-- (1:N) --> Tasks
```

## Query Patterns and Optimization

### Common Queries

1. **Get all projects for a user**
   ```typescript
   // Compound index: createdBy + status
   db.projects.find({ createdBy: userId, status: 'production' })
   ```

2. **Get scenes for an episode**
   ```typescript
   // Compound index: episode + sceneNumber
   db.scenes.find({ episode: episodeId }).sort({ sceneNumber: 1 })
   ```

3. **Get pending tasks by priority**
   ```typescript
   // Compound index: status + priority
   db.tasks.find({ status: 'queued' }).sort({ priority: -1, createdAt: 1 })
   ```

4. **Search media by project and type**
   ```typescript
   // Compound index: project + mediaType
   db.media.find({ project: projectId, mediaType: 'character_design' })
   ```

5. **Find similar media using embeddings**
   ```typescript
   // Vector index on embedding field
   db.media.aggregate([
     {
       $vectorSearch: {
         queryVector: embeddingVector,
         path: "embedding",
         numCandidates: 100,
         limit: 10,
         index: "media_embedding_index"
       }
     }
   ])
   ```

### Index Strategy Summary

**Critical Indexes (High Performance Impact)**:
- Users: `email` (unique)
- Projects: `createdBy + status`, `collaborators + status`
- Episodes: `project + episodeNumber` (unique)
- Scenes: `episode + sceneNumber` (unique)
- Tasks: `status + priority`
- Media: `project + mediaType`, Vector index on `embedding`

**Secondary Indexes**:
- All foreign key relationships
- Status fields for filtering
- Text indexes on title/name fields for search

## Data Access Layer

### Service Pattern
All database operations should go through service classes:

```typescript
// Example: ProjectService
class ProjectService {
  async create(data: CreateProjectDTO): Promise<Project>
  async findById(id: string): Promise<Project | null>
  async findByUser(userId: string, filters?: object): Promise<Project[]>
  async update(id: string, data: UpdateProjectDTO): Promise<Project>
  async delete(id: string): Promise<boolean>
  async addCollaborator(projectId: string, userId: string): Promise<void>
}
```

### Benefits
- Encapsulates database logic
- Easier to test (mockable)
- Centralized validation
- Consistent error handling
- Cache integration points

## Migration Strategy

### Phase 1: Fix Existing Collections (Week 1)
1. Update Media collection: Convert `project` from text to ObjectId relationship
2. Update Sessions collection: Convert `project` from text to ObjectId relationship
3. Run data migration script to update existing records
4. Add new indexes

### Phase 2: Add New Collections (Week 2)
1. Create Episodes collection
2. Create Characters collection
3. Create Scenes collection
4. Create Tasks collection
5. Migrate episode data from Projects to Episodes

### Phase 3: Data Access Layer (Week 3)
1. Implement service classes for all collections
2. Update API routes to use services
3. Add caching layer
4. Performance testing and optimization

### Phase 4: Advanced Features (Week 4)
1. Implement vector search for media
2. Add full-text search indexes
3. Setup database monitoring
4. Implement backup strategy

## Performance Considerations

### Expected Scale
- Users: 10K-100K
- Projects: 100K-1M
- Episodes: 1M-10M
- Scenes: 10M-100M
- Media: 10M-100M
- Tasks: 100M+ (with retention policy)

### Optimization Strategies

1. **Pagination**: Always paginate large result sets
2. **Projection**: Only select needed fields
3. **Caching**: Cache frequently accessed data (projects, characters)
4. **Archive Old Data**: Move completed tasks to archive collection
5. **Sharding**: Consider sharding on `project` for horizontal scaling

## Backup and Recovery

### Backup Strategy
- Automated daily backups via MongoDB Atlas or mongodump
- Point-in-time recovery enabled
- 30-day retention for production
- Weekly backups retained for 1 year

### Disaster Recovery
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Replicate to secondary region
- Regular restore testing

## Security Considerations

1. **Authentication**: All collections require authentication except Users (for registration)
2. **Authorization**: Row-level access control via PayloadCMS access policies
3. **Encryption**: Encrypt sensitive fields (passwords, API keys)
4. **Audit**: Log all write operations to PromptsExecuted and separate audit collection
5. **Rate Limiting**: Implement rate limiting on expensive queries

## Monitoring and Alerts

### Key Metrics
- Query performance (slow query log)
- Collection sizes
- Index usage statistics
- Connection pool utilization
- Replication lag

### Alerts
- Slow queries > 1000ms
- Failed backups
- Replication lag > 10 seconds
- Disk usage > 80%
- High CPU/memory usage

## Next Steps

1. Review and approve schema design
2. Implement new collections in PayloadCMS
3. Create data migration scripts
4. Implement service layer
5. Update API documentation
6. Performance testing
7. Production deployment

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Author**: Worker Specialist #2 - Database Architect