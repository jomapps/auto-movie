# Data Model Design

**Feature**: AI Movie Platform Core with PayloadCMS and Chat Interface  
**Date**: 2025-01-25  
**Based on**: Feature specification entities and functional requirements

## Entity Overview

The AI Movie Platform uses four core entities managed through PayloadCMS collections with defined relationships and validation rules.

## Core Entities

### User Entity
**Collection**: `users`  
**Purpose**: Authentication, authorization, and user management

**Fields**:
- `id` (string) - Auto-generated unique identifier
- `email` (string, unique, required) - Authentication credential
- `name` (string, required) - Display name
- `role` (select, required) - User role: `user`, `admin`, `producer`
- `preferences` (json) - User-specific settings and preferences
- `activeProjects` (relationship to Projects, hasMany) - Currently active projects
- `subscription` (group) - Subscription tier and limits
  - `tier` (select) - `free`, `pro`, `enterprise`
  - `maxProjects` (number) - Maximum allowed projects
  - `maxEpisodesPerProject` (number) - Maximum episodes per project

**Validation Rules**:
- Email must be valid format and unique across system
- Role must be one of defined values
- Subscription limits enforced at project creation
- Name required for user identification

**Relationships**:
- One-to-many with Projects (as creator)
- Many-to-many with Projects (as collaborators)
- One-to-many with Sessions (active chat sessions)

### Project Entity
**Collection**: `projects`  
**Purpose**: Container for movie production workflow and assets

**Fields**:
- `id` (string) - Auto-generated unique identifier
- `title` (string, required) - Project display name
- `description` (textarea) - Project overview and concept
- `genre` (select, required) - Movie genre classification
- `episodeCount` (number, required, 1-50) - Total planned episodes
- `targetAudience` (select) - Age/content rating classification
- `status` (select, required) - Current project status
- `createdBy` (relationship to Users, required) - Project owner
- `collaborators` (relationship to Users, hasMany) - Additional project users
- `styleReferences` (relationship to Media, hasMany) - Visual style references
- `projectSettings` (group) - Technical and creative settings
  - `aspectRatio` (select) - Video aspect ratio
  - `episodeDuration` (number) - Target duration per episode
  - `qualityTier` (select) - Production quality level
- `progress` (group) - Automated progress tracking
  - `currentPhase` (select) - Current workflow phase
  - `completedSteps` (json array) - List of completed workflow steps
  - `overallProgress` (number, 0-100) - Completion percentage

**Validation Rules**:
- Title required and unique per user
- Episode count between 1-50
- Genre must be from predefined list
- Project settings have default values
- Progress automatically initialized on creation

**Relationships**:
- Many-to-one with Users (creator)
- Many-to-many with Users (collaborators)
- One-to-many with Sessions (chat sessions)
- One-to-many with Media (project assets)

**State Transitions**:
- `concept` → `pre-production` → `production` → `post-production` → `completed`
- `on-hold` available from any state
- Phase progression tracked in progress.currentPhase

### Session Entity
**Collection**: `sessions`  
**Purpose**: Active chat sessions linking users to projects with conversation state

**Fields**:
- `id` (string) - Auto-generated unique identifier
- `project` (relationship to Projects, required) - Associated project
- `user` (relationship to Users, required) - Session owner
- `currentStep` (string, required) - Current workflow step identifier
- `conversationHistory` (json array) - Chat message history
- `contextData` (json) - Current processing context for AI
- `awaitingUserInput` (boolean) - Whether system waits for user response
- `lastChoices` (json) - Last presented choice options
- `sessionState` (select) - Session status: `active`, `paused`, `completed`, `error`

**Validation Rules**:
- Project and user required for session creation
- Current step must be valid workflow identifier
- Session state defaults to 'active'
- Conversation history maintains message structure

**Relationships**:
- Many-to-one with Projects
- Many-to-one with Users
- Implicitly linked to Media through project relationship

**Message Structure** (within conversationHistory):
```json
{
  "id": "string",
  "role": "user|assistant|system",
  "content": "string",
  "timestamp": "ISO 8601",
  "attachments": ["media IDs"],
  "metadata": "object"
}
```

### Media Entity
**Collection**: `media`  
**Purpose**: Digital assets with AI generation metadata and project relationships

**Fields**:
- `id` (string) - Auto-generated unique identifier
- `project` (relationship to Projects, required) - Associated project
- `mediaType` (select, required) - Asset classification
- `agentGenerated` (boolean) - Whether created by AI agent
- `generationMetadata` (group, conditional) - AI generation details
  - `agentId` (string) - ID of generating agent
  - `promptUsed` (textarea) - Generation prompt
  - `modelVersion` (string) - AI model version
  - `generationTime` (datetime) - When generated
  - `taskId` (string) - Background task identifier
- `embedding` (json) - Jina v4 multimodal embedding vector
- `description` (textarea) - Human or AI description
- `tags` (json array) - Categorization tags
- `relatedElements` (group) - Project context relationships
  - `characters` (json array) - Featured character IDs
  - `episode` (number) - Episode number if applicable
  - `scene` (string) - Scene identifier
  - `timestamp` (number) - Time position for video segments
- `technicalData` (group) - Media-specific technical properties
  - `duration` (number) - For audio/video assets
  - `resolution` (string) - For image/video assets
  - `fps` (number) - For video assets
  - `sampleRate` (number) - For audio assets
- `version` (number) - Version for iterative improvements
- `status` (select) - Asset status: `active`, `draft`, `archived`, `processing`, `failed`

**Validation Rules**:
- Project relationship required
- Media type from predefined classification
- Generation metadata only visible when agent-generated
- Technical data fields conditional on media type
- Version defaults to 1

**Relationships**:
- Many-to-one with Projects
- Referenced in Session conversation history
- Self-referential for version relationships

**Media Type Classifications**:
- `style_reference` - User-uploaded visual references
- `character_design` - Character visual designs
- `environment_design` - Location and setting designs
- `concept_art` - General concept illustrations
- `storyboard` - Scene planning boards
- `video_segment` - Generated video clips
- `audio_clip` - Generated audio content
- `voice_profile` - Character voice samples
- `music_track` - Background music
- `sound_effect` - Audio effects
- `final_video` - Completed episode content

## Access Control Patterns

### User Access
- Users can only access their own created projects
- Collaborators can access projects they're invited to
- Admins have full access to all content

### Session Access
- Users can only access their own sessions
- Project collaborators can view session history
- Concurrent sessions allowed per project

### Media Access
- Project-scoped access through project relationships
- Public media requires explicit sharing settings
- Generated content inherits project permissions

## Data Integrity Rules

### Referential Integrity
- Cascade delete: Project deletion removes associated sessions and media
- Soft delete: User deletion preserves created content ownership
- Constraint enforcement: Subscription limits checked at creation

### Validation Hooks
- Project creation validates subscription limits
- Media upload triggers embedding generation
- Session updates maintain conversation structure
- Progress calculation updates automatically

### Performance Optimizations
- Indexed relationships for quick project/user lookups
- Conversation history pagination for large sessions
- Media embedding background generation
- Project progress caching for dashboard views

## Migration Considerations

### Initial Data
- Default admin user creation
- Sample project templates
- Workflow step definitions
- Media type classifications

### Schema Evolution
- Version-controlled collection configurations
- Backward-compatible field additions
- Data migration scripts for breaking changes
- Type generation updates for client code

This data model provides the foundation for all PayloadCMS collection configurations and ensures constitutional compliance with data layer supremacy principles.