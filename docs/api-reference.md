# AI Movie Platform API Reference

**Version**: 1.0.0  
**Base URL**: `/api/v1`  
**Authentication**: Bearer JWT tokens  
**Content-Type**: `application/json`

This document provides comprehensive API documentation for all endpoints in the AI Movie Platform, following constitutional routing principles with `/api/v1/*` structure.

## Authentication

All API endpoints require authentication via JWT Bearer tokens in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST /api/auth/login
Authenticate user and obtain JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

## Chat API Endpoints

### POST /api/v1/chat/message
Send a message in a project chat session.

**Request Body**:
```json
{
  "projectId": "project-123",
  "sessionId": "session-456", 
  "message": "I want to create an action movie with fast-paced scenes",
  "attachments": ["media-789"] // Optional media references
}
```

**Response** (200):
```json
{
  "success": true,
  "messageId": "msg-abc123",
  "aiResponse": {
    "content": "Great! Let's develop an action-packed movie concept...",
    "choices": [
      {
        "id": "choice-1",
        "title": "Urban Setting",
        "description": "City-based action sequences",
        "metadata": { "difficulty": "medium", "duration": "2-3 episodes" }
      },
      {
        "id": "choice-2", 
        "title": "Military Theme",
        "description": "Combat and tactical operations",
        "metadata": { "difficulty": "high", "duration": "4-5 episodes" }
      }
    ],
    "nextStep": "setting-selection"
  },
  "session": {
    "currentStep": "concept-development",
    "progress": 15
  }
}
```

**Error Responses**:
- `400`: Invalid message format or missing required fields
- `401`: Authentication required
- `403`: Access denied to project
- `404`: Project or session not found
- `429`: Rate limit exceeded

### POST /api/v1/chat/choice
Submit a choice selection to advance the workflow.

**Request Body**:
```json
{
  "sessionId": "session-456",
  "choiceId": "choice-1",
  "customInput": "I want urban rooftop chase scenes" // Optional override
}
```

**Response** (200):
```json
{
  "success": true,
  "workflowAdvanced": true,
  "newStep": "character-development",
  "progressUpdate": {
    "percentage": 25,
    "completedSteps": ["concept-development", "setting-selection"],
    "nextSteps": ["character-design", "plot-outline"]
  },
  "aiResponse": {
    "content": "Excellent choice! Urban rooftop scenes offer great cinematic potential...",
    "choices": [...] // New choices for next step
  }
}
```

### POST /api/v1/chat/upload
Upload and attach media files to chat session.

**Request** (multipart/form-data):
```
projectId: "project-123"
sessionId: "session-456" 
file: [binary file data]
description: "Character reference image"
mediaType: "style_reference"
```

**Response** (200):
```json
{
  "success": true,
  "mediaId": "media-xyz789",
  "processingStatus": "analyzing",
  "aiAnalysis": {
    "description": "A dynamic action hero character in urban setting",
    "tags": ["action", "urban", "hero", "leather jacket"],
    "styleElements": ["dark palette", "dramatic lighting", "modern clothing"],
    "suitableFor": ["character-design", "costume-reference"]
  },
  "embedding": {
    "status": "generating",
    "estimatedCompletion": "30s"
  }
}
```

### GET /api/v1/chat/session/[id]
Retrieve chat session details and conversation history.

**Response** (200):
```json
{
  "success": true,
  "session": {
    "id": "session-456",
    "projectId": "project-123",
    "userId": "user-789",
    "currentStep": "character-development",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastActivity": "2024-01-15T14:45:00Z",
    "conversationHistory": [
      {
        "id": "msg-001",
        "role": "user",
        "content": "I want to create an action movie",
        "timestamp": "2024-01-15T10:30:00Z",
        "attachments": []
      },
      {
        "id": "msg-002", 
        "role": "assistant",
        "content": "Great! Let's develop an action-packed concept...",
        "timestamp": "2024-01-15T10:30:15Z",
        "choices": [...],
        "metadata": { "processingTime": 1500 }
      }
    ],
    "contextData": {
      "genre": "action",
      "currentFocus": "character-development",
      "mediaReferences": ["media-xyz789"]
    }
  }
}
```

### GET /api/v1/chat/sessions
List all chat sessions for authenticated user.

**Query Parameters**:
- `projectId` (optional): Filter by specific project
- `status` (optional): active | paused | completed
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response** (200):
```json
{
  "success": true,
  "sessions": [
    {
      "id": "session-456",
      "projectId": "project-123",
      "projectTitle": "Action Movie Project",
      "currentStep": "character-development",
      "status": "active",
      "progress": 25,
      "lastActivity": "2024-01-15T14:45:00Z",
      "messageCount": 12
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

## Projects API Endpoints

### GET /api/v1/projects
List projects for authenticated user.

**Query Parameters**:
- `status` (optional): active | completed | on-hold | archived
- `genre` (optional): Filter by genre
- `search` (optional): Search in title/description
- `sort` (optional): title | created_at | updated_at | progress
- `order` (optional): asc | desc (default: desc)
- `page`, `limit`: Pagination

**Response** (200):
```json
{
  "success": true,
  "projects": [
    {
      "id": "project-123",
      "title": "Action Movie Project", 
      "description": "Fast-paced urban action thriller",
      "genre": "Action",
      "episodeCount": 5,
      "targetAudience": "PG-13",
      "status": "active",
      "progress": {
        "percentage": 25,
        "currentPhase": "character-development",
        "completedSteps": 3,
        "totalSteps": 12
      },
      "createdAt": "2024-01-15T09:00:00Z",
      "updatedAt": "2024-01-15T14:45:00Z",
      "mediaCount": 2,
      "activeSessionsCount": 1
    }
  ],
  "pagination": {...}
}
```

### POST /api/v1/projects
Create a new project.

**Request Body**:
```json
{
  "title": "My Amazing Movie",
  "description": "An epic adventure story about courage and friendship",
  "genre": "Adventure", 
  "episodeCount": 8,
  "targetAudience": "PG",
  "projectSettings": {
    "aspectRatio": "16:9",
    "episodeDuration": 25,
    "qualityTier": "professional"
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "project": {
    "id": "project-456",
    "title": "My Amazing Movie",
    "description": "An epic adventure story about courage and friendship", 
    "genre": "Adventure",
    "episodeCount": 8,
    "targetAudience": "PG",
    "status": "active",
    "progress": {
      "percentage": 0,
      "currentPhase": "initial",
      "completedSteps": 0,
      "totalSteps": 15
    },
    "createdBy": "user-789",
    "createdAt": "2024-01-15T15:00:00Z",
    "projectSettings": {
      "aspectRatio": "16:9",
      "episodeDuration": 25,
      "qualityTier": "professional"
    }
  }
}
```

**Error Responses**:
- `400`: Invalid project data or validation errors
- `402`: Subscription limit exceeded (free tier allows 3 projects)
- `409`: Project title already exists for user

### GET /api/v1/projects/[id]
Get specific project details.

**Response** (200):
```json
{
  "success": true,
  "project": {
    "id": "project-123",
    "title": "Action Movie Project",
    "description": "Fast-paced urban action thriller",
    "genre": "Action",
    "episodeCount": 5,
    "targetAudience": "PG-13", 
    "status": "active",
    "progress": {
      "percentage": 25,
      "currentPhase": "character-development",
      "completedSteps": ["concept", "genre-selection", "setting"],
      "nextSteps": ["character-design", "plot-outline"],
      "workflowSteps": [...]
    },
    "createdBy": "user-789",
    "collaborators": [
      {
        "userId": "user-456",
        "role": "collaborator", 
        "addedAt": "2024-01-15T12:00:00Z"
      }
    ],
    "media": [
      {
        "id": "media-123",
        "filename": "character-ref.jpg",
        "mediaType": "style_reference",
        "uploadedAt": "2024-01-15T13:00:00Z"
      }
    ],
    "activeSessions": [
      {
        "id": "session-456",
        "userId": "user-789",
        "currentStep": "character-development",
        "lastActivity": "2024-01-15T14:45:00Z"
      }
    ],
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T14:45:00Z"
  }
}
```

### PUT /api/v1/projects/[id]
Update project details.

**Request Body** (partial updates allowed):
```json
{
  "title": "Updated Movie Title",
  "description": "Updated description with more details",
  "status": "on-hold",
  "targetAudience": "PG-13"
}
```

**Response** (200):
```json
{
  "success": true,
  "project": {
    // Updated project object
  }
}
```

### POST /api/v1/projects/[id]/collaborators
Add collaborator to project.

**Request Body**:
```json
{
  "email": "collaborator@example.com",
  "role": "collaborator" // collaborator | viewer
}
```

**Response** (200):
```json
{
  "success": true,
  "invitation": {
    "id": "invite-789",
    "email": "collaborator@example.com",
    "role": "collaborator",
    "status": "pending",
    "sentAt": "2024-01-15T15:30:00Z",
    "expiresAt": "2024-01-22T15:30:00Z"
  }
}
```

## Media API Endpoints

### POST /api/v1/media/upload
Upload media files for projects.

**Request** (multipart/form-data):
```
projectId: "project-123"
files: [file1, file2, file3] // Multiple files supported
mediaType: "style_reference" | "character_design" | "concept_art" | etc.
description: "Optional description"
tags: ["tag1", "tag2"] // Optional JSON array
```

**Response** (200):
```json
{
  "success": true,
  "uploads": [
    {
      "mediaId": "media-456",
      "filename": "character-sketch.jpg",
      "size": 1048576,
      "mimeType": "image/jpeg",
      "mediaType": "character_design",
      "status": "processing",
      "aiAnalysis": {
        "status": "analyzing",
        "estimatedCompletion": "30s"
      },
      "embedding": {
        "status": "generating",
        "progress": 0
      }
    }
  ],
  "rejected": [] // Files that failed validation
}
```

### GET /api/v1/media
List media files with filtering and search.

**Query Parameters**:
- `projectId` (optional): Filter by project
- `mediaType` (optional): Filter by media type
- `search` (optional): Search in filenames and descriptions
- `tags` (optional): Comma-separated tag filter
- `status` (optional): active | processing | failed | archived
- `sort` (optional): filename | upload_date | size
- `page`, `limit`: Pagination

**Response** (200):
```json
{
  "success": true,
  "media": [
    {
      "id": "media-456",
      "filename": "character-sketch.jpg", 
      "displayName": "Character Sketch - Hero Design",
      "mediaType": "character_design",
      "mimeType": "image/jpeg",
      "size": 1048576,
      "sizeFormatted": "1.0 MB",
      "projectId": "project-123",
      "status": "active",
      "description": "Main character design with urban styling",
      "tags": ["character", "hero", "urban", "leather"],
      "aiGenerated": false,
      "uploadedAt": "2024-01-15T13:00:00Z",
      "metadata": {
        "dimensions": { "width": 1920, "height": 1080 },
        "colorPalette": ["#2c3e50", "#34495e", "#7f8c8d"],
        "embedding": {
          "status": "complete",
          "vector": [0.123, -0.456, ...] // Truncated for brevity
        }
      },
      "relatedElements": {
        "characters": ["hero-001"],
        "episode": null,
        "scene": "character-introduction" 
      }
    }
  ],
  "pagination": {...}
}
```

### GET /api/v1/media/[id]
Get specific media file details.

**Response** (200):
```json
{
  "success": true,
  "media": {
    "id": "media-456",
    "filename": "character-sketch.jpg",
    "projectId": "project-123",
    "mediaType": "character_design",
    "status": "active",
    "description": "Main character design with urban styling",
    "tags": ["character", "hero", "urban", "leather"],
    "aiGenerated": false,
    "agentGenerated": false,
    "uploadedAt": "2024-01-15T13:00:00Z",
    "technicalData": {
      "mimeType": "image/jpeg",
      "size": 1048576,
      "dimensions": { "width": 1920, "height": 1080 },
      "colorDepth": 24,
      "compression": "JPEG"
    },
    "aiAnalysis": {
      "description": "A dynamic character design featuring...",
      "detectedObjects": ["person", "clothing", "urban background"],
      "styleAnalysis": {
        "mood": "serious", 
        "lighting": "dramatic",
        "colorTone": "cool"
      },
      "suitability": ["character-reference", "costume-design", "mood-boarding"]
    },
    "embedding": {
      "status": "complete",
      "model": "jina-v4-multimodal",
      "vector": [0.123, -0.456, ...],
      "generatedAt": "2024-01-15T13:05:00Z"
    },
    "usage": {
      "referencedInSessions": ["session-456"],
      "referencedInMessages": 3,
      "lastReferenced": "2024-01-15T14:30:00Z"
    },
    "downloadUrl": "https://media.example.com/signed-url",
    "thumbnailUrl": "https://media.example.com/thumbnails/media-456",
    "version": 1
  }
}
```

### POST /api/v1/media/search
Semantic search through media using embeddings.

**Request Body**:
```json
{
  "query": "urban action hero with dark clothing",
  "projectId": "project-123", // Optional: limit to specific project
  "mediaTypes": ["character_design", "concept_art"], // Optional filter
  "limit": 10,
  "threshold": 0.7 // Similarity threshold (0-1)
}
```

**Response** (200):
```json
{
  "success": true,
  "results": [
    {
      "media": {
        "id": "media-456",
        "filename": "character-sketch.jpg",
        "mediaType": "character_design",
        "description": "Main character design with urban styling",
        "thumbnailUrl": "https://media.example.com/thumbnails/media-456"
      },
      "similarity": 0.89,
      "matchingElements": ["urban", "dark clothing", "action hero"]
    },
    {
      "media": {
        "id": "media-789", 
        "filename": "concept-art-city.jpg",
        "mediaType": "concept_art",
        "description": "Urban cityscape with dramatic lighting"
      },
      "similarity": 0.74,
      "matchingElements": ["urban", "dark atmosphere"]
    }
  ],
  "queryEmbedding": {
    "model": "jina-v4-multimodal",
    "processingTime": 250
  }
}
```

## WebSocket API

### Connection: /api/v1/websocket
Real-time communication for chat sessions and collaboration.

**Connection Parameters**:
```javascript
const ws = new WebSocket('ws://localhost:3010/api/v1/websocket', {
  headers: {
    'Authorization': 'Bearer <jwt-token>'
  }
});
```

**Message Types**:

#### Join Session
```json
{
  "type": "join-session",
  "sessionId": "session-456",
  "userId": "user-789"
}
```

#### Chat Message
```json
{
  "type": "chat-message", 
  "sessionId": "session-456",
  "message": "I want to add more action scenes",
  "attachments": []
}
```

#### Typing Indicator
```json
{
  "type": "typing",
  "sessionId": "session-456",
  "userId": "user-789",
  "isTyping": true
}
```

#### Choice Selection
```json
{
  "type": "choice-selected",
  "sessionId": "session-456",
  "choiceId": "choice-1",
  "userId": "user-789"
}
```

**Server Events**:

#### Message Received
```json
{
  "type": "message-received",
  "sessionId": "session-456", 
  "messageId": "msg-123",
  "sender": {
    "id": "user-789",
    "name": "John Doe",
    "role": "user"
  },
  "content": "I want to add more action scenes",
  "timestamp": "2024-01-15T15:45:00Z"
}
```

#### AI Response
```json
{
  "type": "ai-response",
  "sessionId": "session-456",
  "content": "Great idea! Here are some action scene options...",
  "choices": [...],
  "processingTime": 1500
}
```

#### User Typing
```json
{
  "type": "user-typing",
  "sessionId": "session-456",
  "user": {
    "id": "user-456",
    "name": "Jane Smith"
  },
  "isTyping": true
}
```

#### Progress Update
```json
{
  "type": "progress-update",
  "sessionId": "session-456",
  "projectId": "project-123",
  "progress": {
    "percentage": 30,
    "stepCompleted": "character-development",
    "nextStep": "plot-outline"
  }
}
```

## Error Responses

All API endpoints follow consistent error response format:

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "episodeCount",
        "message": "Episode count must be between 1 and 50"
      }
    ]
  },
  "requestId": "req-abc123",
  "timestamp": "2024-01-15T15:30:00Z"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (access denied)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

### Error Codes
- `VALIDATION_ERROR`: Request data validation failed
- `AUTH_REQUIRED`: Authentication token required
- `ACCESS_DENIED`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `SUBSCRIPTION_LIMIT`: Subscription tier limit exceeded
- `FILE_TOO_LARGE`: Uploaded file exceeds size limit
- `UNSUPPORTED_FORMAT`: File format not supported
- `AI_SERVICE_ERROR`: AI processing service unavailable
- `WEBSOCKET_ERROR`: WebSocket connection issue

## Rate Limiting

API endpoints are rate limited based on user subscription tier:

### Free Tier
- 100 requests/hour
- 5 concurrent WebSocket connections
- 10MB file upload limit

### Pro Tier  
- 1000 requests/hour
- 20 concurrent WebSocket connections
- 100MB file upload limit

### Enterprise Tier
- 10000 requests/hour
- Unlimited WebSocket connections
- 1GB file upload limit

Rate limit headers are included in all responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642254600
X-RateLimit-Tier: free
```

## Webhooks (Future)

Webhook endpoints for external integrations will follow the pattern:
- `POST /api/v1/webhooks/project-completed`
- `POST /api/v1/webhooks/media-processed`
- `POST /api/v1/webhooks/ai-response-ready`

## SDK Examples

### JavaScript/TypeScript
```javascript
import { AIMovieAPI } from '@ai-movie/api-client';

const api = new AIMovieAPI({
  baseUrl: 'https://api.aimovie.com/v1',
  apiKey: 'your-api-key'
});

// Send chat message
const response = await api.chat.sendMessage({
  projectId: 'project-123',
  sessionId: 'session-456',
  message: 'Create an action sequence'
});

// Upload media
const upload = await api.media.upload({
  projectId: 'project-123', 
  file: fileBlob,
  mediaType: 'style_reference'
});
```

### Python
```python
from ai_movie_api import AIMovieClient

client = AIMovieClient(
    base_url="https://api.aimovie.com/v1",
    api_key="your-api-key"
)

# Create project
project = client.projects.create({
    "title": "My Movie",
    "genre": "Action", 
    "episode_count": 5
})

# Send message
response = client.chat.send_message(
    project_id="project-123",
    session_id="session-456", 
    message="Create action scenes"
)
```

---

This API reference covers all endpoints implemented in the AI Movie Platform, following constitutional compliance with `/api/v1/*` routing structure and PayloadCMS data layer supremacy.