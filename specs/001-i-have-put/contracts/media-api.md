# Media API Contract

**Version**: 1.0  
**Base URL**: `/api/v1/media`  
**Authentication**: Required for all endpoints

## Endpoints

### POST /api/v1/media/upload
Upload media files to a project.

**Request**: Multipart form data
- `projectId`: string (required)
- `mediaType`: string (required)
- `files`: file array (required)
- `description`: string (optional)
- `tags`: string array (optional)

**Response Success (201)**:
```json
{
  "media": [
    {
      "id": "string",
      "url": "string",
      "filename": "string",
      "mediaType": "string",
      "size": "number",
      "mimeType": "string",
      "status": "processing"
    }
  ]
}
```

### GET /api/v1/media
List project media with filtering.

**Query Parameters**:
- `projectId`: string (required)
- `mediaType`: string (optional filter)
- `status`: string (optional filter)
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)

**Response Success (200)**:
```json
{
  "media": [
    {
      "id": "string",
      "url": "string",
      "filename": "string",
      "mediaType": "string",
      "agentGenerated": "boolean",
      "description": "string",
      "tags": ["string array"],
      "technicalData": {
        "duration": "number",
        "resolution": "string",
        "fps": "number"
      },
      "status": "string",
      "createdAt": "string (ISO 8601)"
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

### GET /api/v1/media/{id}
Get detailed media information.

**Response Success (200)**:
```json
{
  "id": "string",
  "url": "string",
  "filename": "string",
  "mediaType": "string",
  "agentGenerated": "boolean",
  "generationMetadata": {
    "agentId": "string",
    "promptUsed": "string",
    "modelVersion": "string",
    "generationTime": "string (ISO 8601)",
    "taskId": "string"
  },
  "description": "string",
  "tags": ["string array"],
  "relatedElements": {
    "characters": ["string array"],
    "episode": "number",
    "scene": "string",
    "timestamp": "number"
  },
  "technicalData": {
    "duration": "number",
    "resolution": "string",
    "fps": "number",
    "sampleRate": "number"
  },
  "version": "number",
  "status": "string",
  "embedding": ["number array"],
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

### PUT /api/v1/media/{id}
Update media metadata.

**Request**:
```json
{
  "description": "string (optional)",
  "tags": "string array (optional)",
  "relatedElements": {
    "characters": "string array",
    "episode": "number",
    "scene": "string",
    "timestamp": "number"
  }
}
```

**Response**: Same as GET /api/v1/media/{id}

### DELETE /api/v1/media/{id}
Delete a media file.

**Response Success (204)**: No content

### POST /api/v1/media/search
Search media using text queries and similarity.

**Request**:
```json
{
  "projectId": "string (required)",
  "query": "string (optional)",
  "mediaTypes": "string array (optional)",
  "similarTo": "string (optional, media ID)",
  "limit": "number (optional, default: 10)"
}
```

**Response Success (200)**:
```json
{
  "results": [
    {
      "id": "string",
      "url": "string",
      "filename": "string",
      "mediaType": "string",
      "description": "string",
      "similarity": "number (0-1)",
      "relevanceScore": "number (0-1)"
    }
  ]
}
```

### GET /api/v1/media/{id}/versions
Get all versions of a media file.

**Response Success (200)**:
```json
{
  "versions": [
    {
      "id": "string",
      "version": "number",
      "url": "string",
      "changes": "string",
      "createdAt": "string (ISO 8601)"
    }
  ]
}
```

### POST /api/v1/media/{id}/generate
Request AI generation of new media version.

**Request**:
```json
{
  "prompt": "string (required)",
  "parameters": {
    "style": "string",
    "quality": "string",
    "duration": "number",
    "resolution": "string"
  }
}
```

**Response Success (202)**:
```json
{
  "taskId": "string",
  "estimatedTime": "number (seconds)",
  "status": "queued"
}
```

### GET /api/v1/media/generation/{taskId}
Check status of AI generation task.

**Response Success (200)**:
```json
{
  "taskId": "string",
  "status": "queued|processing|completed|failed",
  "progress": "number (0-100)",
  "result": {
    "mediaId": "string",
    "url": "string"
  },
  "error": "string (if failed)"
}
```