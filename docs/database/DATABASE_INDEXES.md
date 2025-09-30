# Database Indexes Strategy

## Overview
This document outlines the MongoDB indexing strategy for optimal query performance in the movie generation platform.

## Index Types

### 1. Single Field Indexes
Standard indexes on individual fields for equality queries and sorting.

### 2. Compound Indexes
Indexes on multiple fields for complex queries. Order matters: most selective fields first.

### 3. Text Indexes
Full-text search indexes for searching within text content.

### 4. Vector Indexes
MongoDB Atlas Search indexes for similarity search on embedding vectors.

## Collection Indexes

### Users Collection

```javascript
// Unique index on email for authentication
db.users.createIndex({ email: 1 }, { unique: true, name: "email_unique" })

// Index on role for authorization queries
db.users.createIndex({ role: 1 }, { name: "role_idx" })

// Index on subscription tier for feature checks
db.users.createIndex({ "subscription.tier": 1 }, { name: "subscription_tier_idx" })

// Compound index for active user queries
db.users.createIndex(
  { role: 1, "subscription.tier": 1 },
  { name: "role_subscription_idx" }
)
```

**Query Patterns**:
- `db.users.findOne({ email: "user@example.com" })` - Uses email_unique
- `db.users.find({ role: "admin" })` - Uses role_idx
- `db.users.find({ "subscription.tier": "pro" })` - Uses subscription_tier_idx

---

### Projects Collection

```javascript
// Index on createdBy for user's projects
db.projects.createIndex({ createdBy: 1 }, { name: "created_by_idx" })

// Index on status for filtering
db.projects.createIndex({ status: 1 }, { name: "status_idx" })

// Index on genre for filtering
db.projects.createIndex({ genre: 1 }, { name: "genre_idx" })

// Compound index for user projects with status filter (HIGH PRIORITY)
db.projects.createIndex(
  { createdBy: 1, status: 1 },
  { name: "user_status_idx" }
)

// Compound index for collaborator queries
db.projects.createIndex(
  { collaborators: 1, status: 1 },
  { name: "collaborators_status_idx" }
)

// Text index for project search
db.projects.createIndex(
  { title: "text", description: "text" },
  { name: "title_description_text_idx" }
)

// Index on updatedAt for sorting recent projects
db.projects.createIndex({ updatedAt: -1 }, { name: "updated_at_desc_idx" })

// Compound index for complex project queries
db.projects.createIndex(
  { createdBy: 1, status: 1, updatedAt: -1 },
  { name: "user_status_time_idx" }
)
```

**Query Patterns**:
- `db.projects.find({ createdBy: userId, status: "production" })` - Uses user_status_idx
- `db.projects.find({ collaborators: userId })` - Uses collaborators_status_idx
- `db.projects.find({ $text: { $search: "sci-fi adventure" } })` - Uses text index

---

### Episodes Collection

```javascript
// Index on project for episode lookup
db.episodes.createIndex({ project: 1 }, { name: "project_idx" })

// Unique compound index on project + episodeNumber (CRITICAL)
db.episodes.createIndex(
  { project: 1, episodeNumber: 1 },
  { unique: true, name: "project_episode_unique" }
)

// Index on status for production filtering
db.episodes.createIndex({ status: 1 }, { name: "status_idx" })

// Compound index for project episodes sorted by number
db.episodes.createIndex(
  { project: 1, episodeNumber: 1 },
  { name: "project_episode_sort_idx" }
)

// Compound index for project status queries
db.episodes.createIndex(
  { project: 1, status: 1 },
  { name: "project_status_idx" }
)
```

**Query Patterns**:
- `db.episodes.find({ project: projectId }).sort({ episodeNumber: 1 })` - Uses project_episode_sort_idx
- `db.episodes.findOne({ project: projectId, episodeNumber: 5 })` - Uses project_episode_unique

---

### Characters Collection

```javascript
// Index on project for character lookup
db.characters.createIndex({ project: 1 }, { name: "project_idx" })

// Compound index on project + name for uniqueness check
db.characters.createIndex(
  { project: 1, name: 1 },
  { name: "project_name_idx" }
)

// Text index for character search
db.characters.createIndex(
  { name: "text", description: "text" },
  { name: "character_text_idx" }
)

// Index on appearances for episode queries
db.characters.createIndex(
  { "appearances.episode": 1 },
  { name: "appearances_episode_idx" }
)
```

**Query Patterns**:
- `db.characters.find({ project: projectId })` - Uses project_idx
- `db.characters.find({ project: projectId, name: "Hero" })` - Uses project_name_idx
- `db.characters.find({ "appearances.episode": episodeId })` - Uses appearances_episode_idx

---

### Scenes Collection

```javascript
// Index on episode for scene lookup (HIGH PRIORITY)
db.scenes.createIndex({ episode: 1 }, { name: "episode_idx" })

// Unique compound index on episode + sceneNumber (CRITICAL)
db.scenes.createIndex(
  { episode: 1, sceneNumber: 1 },
  { unique: true, name: "episode_scene_unique" }
)

// Index on project for project-wide scene queries
db.scenes.createIndex({ project: 1 }, { name: "project_idx" })

// Index on production status for rendering pipeline
db.scenes.createIndex(
  { "production.status": 1 },
  { name: "production_status_idx" }
)

// Compound index for episode scenes with status
db.scenes.createIndex(
  { episode: 1, "production.status": 1 },
  { name: "episode_production_idx" }
)

// Index on characters for character appearance queries
db.scenes.createIndex({ characters: 1 }, { name: "characters_idx" })

// Compound index for rendering queue (status + scene order)
db.scenes.createIndex(
  { "production.status": 1, episode: 1, sceneNumber: 1 },
  { name: "render_queue_idx" }
)
```

**Query Patterns**:
- `db.scenes.find({ episode: episodeId }).sort({ sceneNumber: 1 })` - Uses episode_scene_unique
- `db.scenes.find({ "production.status": "pending" }).sort({ episode: 1, sceneNumber: 1 })` - Uses render_queue_idx
- `db.scenes.find({ characters: characterId })` - Uses characters_idx

---

### Media Collection

```javascript
// Index on project for media lookup
db.media.createIndex({ project: 1 }, { name: "project_idx" })

// Index on episode for episode media
db.media.createIndex({ episode: 1 }, { name: "episode_idx" })

// Index on scene for scene media
db.media.createIndex({ scene: 1 }, { name: "scene_idx" })

// Index on mediaType for filtering
db.media.createIndex({ mediaType: 1 }, { name: "media_type_idx" })

// Index on status for active media filtering
db.media.createIndex({ status: 1 }, { name: "status_idx" })

// Compound index for project media by type (HIGH PRIORITY)
db.media.createIndex(
  { project: 1, mediaType: 1 },
  { name: "project_type_idx" }
)

// Compound index for episode media by type
db.media.createIndex(
  { episode: 1, mediaType: 1 },
  { name: "episode_type_idx" }
)

// Compound index for scene media lookup
db.media.createIndex(
  { scene: 1, mediaType: 1 },
  { name: "scene_type_idx" }
)

// Index on character for character media
db.media.createIndex({ character: 1 }, { name: "character_idx" })

// Vector index for similarity search (MongoDB Atlas)
// This must be created via Atlas UI or Atlas API
/*
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "embedding": {
        "dimensions": 512,
        "similarity": "cosine",
        "type": "knnVector"
      }
    }
  }
}
*/

// Index on agentGenerated for filtering AI-generated content
db.media.createIndex({ agentGenerated: 1 }, { name: "agent_generated_idx" })

// Index on tags for tag-based filtering
db.media.createIndex({ tags: 1 }, { name: "tags_idx" })

// Index on createdAt for temporal queries
db.media.createIndex({ createdAt: -1 }, { name: "created_at_desc_idx" })
```

**Query Patterns**:
- `db.media.find({ project: projectId, mediaType: "character_design" })` - Uses project_type_idx
- `db.media.find({ episode: episodeId, status: "active" })` - Uses episode_idx + status_idx
- Vector search using Atlas Search aggregation pipeline

---

### Tasks Collection

```javascript
// Index on status for task queue (CRITICAL)
db.tasks.createIndex({ status: 1 }, { name: "status_idx" })

// Compound index for priority queue (CRITICAL - HIGH PRIORITY)
db.tasks.createIndex(
  { status: 1, priority: -1, createdAt: 1 },
  { name: "task_queue_idx" }
)

// Index on taskType for filtering by job type
db.tasks.createIndex({ taskType: 1 }, { name: "task_type_idx" })

// Index on project for project task queries
db.tasks.createIndex({ project: 1 }, { name: "project_idx" })

// Compound index for project task status
db.tasks.createIndex(
  { project: 1, status: 1 },
  { name: "project_status_idx" }
)

// Index on episode for episode tasks
db.tasks.createIndex({ episode: 1 }, { name: "episode_idx" })

// Index on scene for scene tasks
db.tasks.createIndex({ scene: 1 }, { name: "scene_idx" })

// Index on worker.workerId for worker queries
db.tasks.createIndex(
  { "worker.workerId": 1 },
  { name: "worker_id_idx" }
)

// TTL index for automatic cleanup of old completed tasks (90 days)
db.tasks.createIndex(
  { completedAt: 1 },
  { expireAfterSeconds: 7776000, name: "completed_ttl_idx" }
)

// Index on createdAt for temporal queries and cleanup
db.tasks.createIndex({ createdAt: -1 }, { name: "created_at_desc_idx" })

// Compound index for worker heartbeat monitoring
db.tasks.createIndex(
  { status: 1, "worker.heartbeat": 1 },
  { name: "worker_heartbeat_idx" }
)
```

**Query Patterns**:
- `db.tasks.find({ status: "queued" }).sort({ priority: -1, createdAt: 1 })` - Uses task_queue_idx
- `db.tasks.find({ project: projectId, status: "completed" })` - Uses project_status_idx
- `db.tasks.find({ status: "processing", "worker.heartbeat": { $lt: staleDate } })` - Detects stale workers

---

### Sessions Collection

```javascript
// Index on project for session lookup
db.sessions.createIndex({ project: 1 }, { name: "project_idx" })

// Index on user for user sessions
db.sessions.createIndex({ user: 1 }, { name: "user_idx" })

// Index on sessionState for active session queries
db.sessions.createIndex({ sessionState: 1 }, { name: "session_state_idx" })

// Compound index for user active sessions (HIGH PRIORITY)
db.sessions.createIndex(
  { user: 1, sessionState: 1 },
  { name: "user_state_idx" }
)

// Compound index for project sessions
db.sessions.createIndex(
  { project: 1, user: 1 },
  { name: "project_user_idx" }
)

// Index on updatedAt for recent session queries
db.sessions.createIndex({ updatedAt: -1 }, { name: "updated_at_desc_idx" })

// TTL index for automatic cleanup of completed sessions (30 days)
db.sessions.createIndex(
  { updatedAt: 1 },
  { expireAfterSeconds: 2592000, partialFilterExpression: { sessionState: "completed" }, name: "session_ttl_idx" }
)
```

**Query Patterns**:
- `db.sessions.find({ user: userId, sessionState: "active" })` - Uses user_state_idx
- `db.sessions.find({ project: projectId })` - Uses project_idx

---

### PromptTemplates Collection

```javascript
// Index on name for template lookup
db.prompt_templates.createIndex({ name: 1 }, { name: "name_idx" })

// Index on app for application filtering
db.prompt_templates.createIndex({ app: 1 }, { name: "app_idx" })

// Index on stage for workflow stage filtering
db.prompt_templates.createIndex({ stage: 1 }, { name: "stage_idx" })

// Compound index for app + stage queries
db.prompt_templates.createIndex(
  { app: 1, stage: 1 },
  { name: "app_stage_idx" }
)

// Index on tags for tag-based filtering
db.prompt_templates.createIndex({ "tags.value": 1 }, { name: "tags_idx" })
```

**Query Patterns**:
- `db.prompt_templates.find({ app: "auto-movie", stage: "character_design" })` - Uses app_stage_idx

---

### PromptsExecuted Collection

```javascript
// Index on projectId for audit queries
db.prompts_executed.createIndex({ projectId: 1 }, { name: "project_id_idx" })

// Index on status for success/error filtering
db.prompts_executed.createIndex({ status: 1 }, { name: "status_idx" })

// Index on model for model analytics
db.prompts_executed.createIndex({ model: 1 }, { name: "model_idx" })

// Index on createdAt for temporal analytics (descending for recent first)
db.prompts_executed.createIndex({ createdAt: -1 }, { name: "created_at_desc_idx" })

// Compound index for project audit trail
db.prompts_executed.createIndex(
  { projectId: 1, createdAt: -1 },
  { name: "project_audit_idx" }
)

// Compound index for status + time analytics
db.prompts_executed.createIndex(
  { status: 1, createdAt: -1 },
  { name: "status_time_idx" }
)

// TTL index for automatic cleanup of old executions (180 days)
db.prompts_executed.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 15552000, name: "execution_ttl_idx" }
)
```

**Query Patterns**:
- `db.prompts_executed.find({ projectId: projectId }).sort({ createdAt: -1 })` - Uses project_audit_idx
- `db.prompts_executed.find({ status: "error" }).sort({ createdAt: -1 })` - Uses status_time_idx

---

## Index Creation Script

Run this script to create all indexes:

```javascript
// Create indexes for Users
db.users.createIndex({ email: 1 }, { unique: true, name: "email_unique" })
db.users.createIndex({ role: 1 }, { name: "role_idx" })
db.users.createIndex({ "subscription.tier": 1 }, { name: "subscription_tier_idx" })

// Create indexes for Projects
db.projects.createIndex({ createdBy: 1 }, { name: "created_by_idx" })
db.projects.createIndex({ status: 1 }, { name: "status_idx" })
db.projects.createIndex({ createdBy: 1, status: 1 }, { name: "user_status_idx" })
db.projects.createIndex({ collaborators: 1, status: 1 }, { name: "collaborators_status_idx" })
db.projects.createIndex({ title: "text", description: "text" }, { name: "title_description_text_idx" })

// Create indexes for Episodes
db.episodes.createIndex({ project: 1 }, { name: "project_idx" })
db.episodes.createIndex({ project: 1, episodeNumber: 1 }, { unique: true, name: "project_episode_unique" })
db.episodes.createIndex({ status: 1 }, { name: "status_idx" })

// Create indexes for Characters
db.characters.createIndex({ project: 1 }, { name: "project_idx" })
db.characters.createIndex({ project: 1, name: 1 }, { name: "project_name_idx" })

// Create indexes for Scenes
db.scenes.createIndex({ episode: 1 }, { name: "episode_idx" })
db.scenes.createIndex({ episode: 1, sceneNumber: 1 }, { unique: true, name: "episode_scene_unique" })
db.scenes.createIndex({ "production.status": 1 }, { name: "production_status_idx" })
db.scenes.createIndex({ characters: 1 }, { name: "characters_idx" })

// Create indexes for Media
db.media.createIndex({ project: 1 }, { name: "project_idx" })
db.media.createIndex({ project: 1, mediaType: 1 }, { name: "project_type_idx" })
db.media.createIndex({ episode: 1, mediaType: 1 }, { name: "episode_type_idx" })
db.media.createIndex({ scene: 1 }, { name: "scene_idx" })

// Create indexes for Tasks (CRITICAL)
db.tasks.createIndex({ status: 1, priority: -1, createdAt: 1 }, { name: "task_queue_idx" })
db.tasks.createIndex({ project: 1, status: 1 }, { name: "project_status_idx" })
db.tasks.createIndex({ completedAt: 1 }, { expireAfterSeconds: 7776000, name: "completed_ttl_idx" })

// Create indexes for Sessions
db.sessions.createIndex({ user: 1, sessionState: 1 }, { name: "user_state_idx" })
db.sessions.createIndex({ project: 1 }, { name: "project_idx" })

// Create indexes for PromptTemplates
db.prompt_templates.createIndex({ app: 1, stage: 1 }, { name: "app_stage_idx" })

// Create indexes for PromptsExecuted
db.prompts_executed.createIndex({ projectId: 1, createdAt: -1 }, { name: "project_audit_idx" })
db.prompts_executed.createIndex({ createdAt: 1 }, { expireAfterSeconds: 15552000, name: "execution_ttl_idx" })
```

## Index Monitoring

### Check Index Usage
```javascript
db.collection.aggregate([{ $indexStats: {} }])
```

### Identify Unused Indexes
```javascript
db.collection.aggregate([
  { $indexStats: {} },
  { $match: { "accesses.ops": { $lt: 10 } } }
])
```

### Slow Query Analysis
Enable slow query logging:
```javascript
db.setProfilingLevel(1, { slowms: 100 })
```

## Performance Testing

After creating indexes, run these queries to verify performance:

1. **Project List Query** (Should use user_status_idx):
   ```javascript
   db.projects.find({ createdBy: ObjectId("..."), status: "production" }).explain("executionStats")
   ```

2. **Task Queue Query** (Should use task_queue_idx):
   ```javascript
   db.tasks.find({ status: "queued" }).sort({ priority: -1, createdAt: 1 }).limit(10).explain("executionStats")
   ```

3. **Scene Rendering Pipeline** (Should use render_queue_idx):
   ```javascript
   db.scenes.find({ "production.status": "pending" }).sort({ episode: 1, sceneNumber: 1 }).explain("executionStats")
   ```

## Maintenance Schedule

- **Weekly**: Review slow query log
- **Monthly**: Analyze index usage statistics
- **Quarterly**: Review and optimize indexes based on usage patterns
- **Annually**: Complete index audit and reindex if necessary

---

**Document Version**: 1.0
**Last Updated**: 2025-09-30
**Author**: Worker Specialist #2 - Database Architect