# Projects API Contract

**Version**: 1.0  
**Base URL**: `/api/v1/projects`  
**Authentication**: Required for all endpoints

## Endpoints

### GET /api/v1/projects
List user's projects with filtering and pagination.

**Query Parameters**:
- `status`: string (optional filter)
- `genre`: string (optional filter)
- `page`: number (default: 1)
- `limit`: number (default: 10, max: 50)

**Response Success (200)**:
```json
{
  "projects": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "genre": "string",
      "status": "string",
      "episodeCount": "number",
      "targetAudience": "string",
      "progress": {
        "currentPhase": "string",
        "overallProgress": "number"
      },
      "createdAt": "string (ISO 8601)",
      "updatedAt": "string (ISO 8601)"
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number"
  }
}
```

### POST /api/v1/projects
Create a new project.

**Request**:
```json
{
  "title": "string (required)",
  "description": "string (optional)",
  "genre": "string (required)",
  "episodeCount": "number (required, 1-50)",
  "targetAudience": "string (optional)",
  "projectSettings": {
    "aspectRatio": "string",
    "episodeDuration": "number",
    "qualityTier": "string"
  }
}
```

**Response Success (201)**:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "genre": "string",
  "episodeCount": "number",
  "targetAudience": "string",
  "status": "concept",
  "createdBy": "string",
  "collaborators": [],
  "projectSettings": {
    "aspectRatio": "string",
    "episodeDuration": "number",
    "qualityTier": "string"
  },
  "progress": {
    "currentPhase": "story_development",
    "completedSteps": [],
    "overallProgress": 0
  },
  "createdAt": "string (ISO 8601)"
}
```

**Response Error (400)**:
```json
{
  "error": "Validation failed",
  "details": {
    "field": "error message"
  }
}
```

**Response Error (403)**:
```json
{
  "error": "Subscription limit exceeded",
  "message": "Maximum projects reached for current subscription tier"
}
```

### GET /api/v1/projects/{id}
Get detailed project information.

**Response Success (200)**:
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "genre": "string",
  "episodeCount": "number",
  "targetAudience": "string",
  "status": "string",
  "createdBy": {
    "id": "string",
    "name": "string",
    "email": "string"
  },
  "collaborators": [
    {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  ],
  "styleReferences": [
    {
      "id": "string",
      "url": "string",
      "filename": "string"
    }
  ],
  "projectSettings": {
    "aspectRatio": "string",
    "episodeDuration": "number",
    "qualityTier": "string"
  },
  "progress": {
    "currentPhase": "string",
    "completedSteps": ["string array"],
    "overallProgress": "number"
  },
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### PUT /api/v1/projects/{id}
Update project information.

**Request**:
```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "status": "string (optional)",
  "projectSettings": {
    "aspectRatio": "string",
    "episodeDuration": "number",
    "qualityTier": "string"
  }
}
```

**Response**: Same as GET /api/v1/projects/{id}

### DELETE /api/v1/projects/{id}
Delete a project and all associated data.

**Response Success (204)**: No content

**Response Error (403)**:
```json
{
  "error": "Insufficient permissions",
  "message": "Only project creators can delete projects"
}
```

### POST /api/v1/projects/{id}/collaborators
Add collaborators to a project.

**Request**:
```json
{
  "userIds": ["string array (required)"]
}
```

**Response Success (200)**:
```json
{
  "collaborators": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "addedAt": "string (ISO 8601)"
    }
  ]
}
```

### DELETE /api/v1/projects/{id}/collaborators/{userId}
Remove a collaborator from a project.

**Response Success (204)**: No content