# Data Model: Projects Interface Management

## Primary Entities

### Project Entity
**Source**: PayloadCMS Projects collection (src/collections/Projects.ts)

**Core Fields**:
- `id: string` - Unique identifier (auto-generated)
- `title: string` - Required project name
- `description?: string` - Optional project description
- `genre: string` - Required genre selection (action, comedy, drama, etc.)
- `episodeCount: number` - Required episode count (1-50, default: 10)
- `targetAudience: string` - Target rating (children, family, teen, adult, default: family)
- `status: string` - Project status (concept, pre-production, production, post-production, completed, on-hold)

**Relationship Fields**:
- `createdBy: User` - Required relationship to Users collection (project owner)
- `collaborators: User[]` - Optional array of Users who can edit project
- `styleReferences: Media[]` - Optional array of Media items for visual style

**Grouped Fields**:
- `projectSettings: ProjectSettings` - Nested settings object
  - `aspectRatio: string` - Video aspect ratio (16:9, 4:3, 21:9, default: 16:9)
  - `episodeDuration: number` - Target minutes per episode (default: 22)
  - `qualityTier: string` - Production quality (draft, standard, premium, default: standard)

**Progress Tracking**:
- `progress: ProjectProgress` - Nested progress object
  - `currentPhase: string` - Current workflow phase (story_development, character_creation, etc.)
  - `completedSteps: any[]` - Array of completed workflow steps
  - `overallProgress: number` - Percentage completion (0-100, default: 0)

**Timestamps**:
- `createdAt: Date` - Auto-generated creation timestamp
- `updatedAt: Date` - Auto-generated update timestamp

### User Entity
**Source**: PayloadCMS Users collection (src/collections/Users.ts)

**Referenced Fields** (for relationships):
- `id: string` - User unique identifier
- `email: string` - User email address
- `name?: string` - Optional display name
- `role?: string` - User role (admin, user)

### Media Entity
**Source**: PayloadCMS Media collection (src/collections/Media.ts)

**Referenced Fields** (for style references):
- `id: string` - Media unique identifier
- `filename: string` - Original filename
- `mimeType: string` - File MIME type
- `filesize: number` - File size in bytes
- `mediaType?: string` - Custom media type classification

## Data Relationships

### One-to-Many Relationships
- `User -> Projects` - One user can create many projects
- `Project -> Media` - One project can have many style reference media items

### Many-to-Many Relationships  
- `Users <-> Projects` - Many users can collaborate on many projects (via collaborators field)

## Validation Rules

### Project Validation
- `title`: Required, non-empty string, max 200 characters
- `description`: Optional, max 1000 characters
- `genre`: Required, must be one of predefined options
- `episodeCount`: Required number, min: 1, max: 50
- `targetAudience`: Optional, must be one of predefined options
- `status`: Required, must be one of predefined options
- `createdBy`: Required, must reference valid User
- `collaborators`: Optional array, each must reference valid User
- `styleReferences`: Optional array, each must reference valid Media with style_reference mediaType

### Project Settings Validation
- `aspectRatio`: Must be one of: '16:9', '4:3', '21:9'
- `episodeDuration`: Positive number, reasonable range (5-120 minutes)
- `qualityTier`: Must be one of: 'draft', 'standard', 'premium'

### Progress Tracking Validation
- `currentPhase`: Must be one of predefined workflow phases
- `completedSteps`: Array structure TBD (flexible JSON)
- `overallProgress`: Number between 0 and 100

## Access Control Model

### Project Access Rules
- **Create**: Any authenticated user can create projects
- **Read**: 
  - Admin users: Can read all projects
  - Regular users: Can read projects where they are creator OR collaborator
- **Update**: 
  - Admin users: Can update all projects
  - Regular users: Can update projects where they are creator OR collaborator
- **Delete**: Creator only (not implemented in current spec)

### Query Patterns
```typescript
// User's own projects (as creator)
{ createdBy: { equals: userId } }

// Projects user can access (creator OR collaborator)
{
  or: [
    { createdBy: { equals: userId } },
    { collaborators: { contains: userId } }
  ]
}
```

## State Transitions

### Project Status Flow
```
concept → pre-production → production → post-production → completed
   ↓              ↓             ↓             ↓
on-hold ←——————————————————————————————————————————————————————————————
```

### Progress Phase Flow
```
story_development → character_creation → visual_design → audio_design 
                                    ↓
final_assembly ← post_production ← scene_production
```

## Data Consistency Rules

### Automatic Data Management
- `overallProgress` auto-calculated based on `completedSteps` length and current phase
- `currentPhase` auto-set to 'story_development' on project creation
- `progress` object initialized with defaults on project creation via beforeChange hook

### Referential Integrity
- All User references must exist and be active
- All Media references must exist and be accessible
- Collaborator array cannot contain duplicate User IDs
- Creator cannot be in collaborators array (redundant)

This data model leverages the existing PayloadCMS collection structure while providing a clear interface contract for the project management functionality.