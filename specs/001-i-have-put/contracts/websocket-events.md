# WebSocket Events Contract

**Version**: 1.0  
**Connection**: `/api/v1/websocket`  
**Authentication**: Required via query parameter or header

## Connection Setup

### Client Connection
```javascript
const socket = io('/api/v1/websocket', {
  query: { 
    projectId: 'string',
    sessionId: 'string'
  },
  auth: {
    token: 'jwt_token'
  }
});
```

### Server Response
```json
{
  "event": "connected",
  "data": {
    "sessionId": "string",
    "projectId": "string",
    "currentStep": "string"
  }
}
```

## Client → Server Events

### join-project
Join a project room for real-time updates.

**Payload**:
```json
{
  "projectId": "string"
}
```

### leave-project
Leave a project room.

**Payload**:
```json
{
  "projectId": "string"
}
```

### typing-start
Indicate user is typing in chat.

**Payload**:
```json
{
  "sessionId": "string"
}
```

### typing-stop
Indicate user stopped typing.

**Payload**:
```json
{
  "sessionId": "string"
}
```

### ping
Keep connection alive and check latency.

**Payload**: None

## Server → Client Events

### message-received
New chat message in session.

**Payload**:
```json
{
  "sessionId": "string",
  "message": {
    "id": "string",
    "role": "assistant|system",
    "content": "string",
    "timestamp": "string (ISO 8601)",
    "attachments": ["string array"]
  }
}
```

### choices-updated
New choice options available.

**Payload**:
```json
{
  "sessionId": "string",
  "choices": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "isRecommended": "boolean",
      "estimatedTime": "string",
      "icon": "string"
    }
  ]
}
```

### progress-updated
Project progress has changed.

**Payload**:
```json
{
  "projectId": "string",
  "progress": {
    "currentPhase": "string",
    "overallProgress": "number (0-100)",
    "completedSteps": ["string array"]
  }
}
```

### step-changed
Workflow step has advanced.

**Payload**:
```json
{
  "sessionId": "string",
  "previousStep": "string",
  "currentStep": "string",
  "stepProgress": "number (0-100)"
}
```

### ai-processing
AI service is processing user input.

**Payload**:
```json
{
  "sessionId": "string",
  "status": "started|progress|completed",
  "message": "string",
  "estimatedTime": "number (seconds)"
}
```

### media-uploaded
New media file uploaded to project.

**Payload**:
```json
{
  "projectId": "string",
  "media": {
    "id": "string",
    "url": "string",
    "filename": "string",
    "mediaType": "string",
    "uploadedBy": "string (user ID)"
  }
}
```

### media-processed
Media processing completed.

**Payload**:
```json
{
  "mediaId": "string",
  "status": "completed|failed",
  "result": {
    "url": "string",
    "embedding": "boolean",
    "metadata": "object"
  },
  "error": "string (if failed)"
}
```

### user-joined
Collaborator joined project.

**Payload**:
```json
{
  "projectId": "string",
  "user": {
    "id": "string",
    "name": "string"
  },
  "timestamp": "string (ISO 8601)"
}
```

### user-left
Collaborator left project.

**Payload**:
```json
{
  "projectId": "string",
  "userId": "string",
  "timestamp": "string (ISO 8601)"
}
```

### typing-indicator
Show/hide typing indicator for other users.

**Payload**:
```json
{
  "sessionId": "string",
  "userId": "string",
  "userName": "string",
  "isTyping": "boolean"
}
```

### error
WebSocket error occurred.

**Payload**:
```json
{
  "code": "string",
  "message": "string",
  "timestamp": "string (ISO 8601)"
}
```

### pong
Response to ping for latency measurement.

**Payload**:
```json
{
  "timestamp": "number (milliseconds)"
}
```

## Error Codes

### Connection Errors
- `AUTH_FAILED` - Authentication token invalid
- `PROJECT_ACCESS_DENIED` - User cannot access project
- `SESSION_NOT_FOUND` - Session ID invalid
- `RATE_LIMITED` - Too many connections from client

### Runtime Errors
- `INVALID_PAYLOAD` - Malformed event data
- `SERVICE_UNAVAILABLE` - Backend service temporarily down
- `PROCESSING_FAILED` - AI processing encountered error
- `UPLOAD_FAILED` - Media upload could not complete

## Rate Limiting

### Connection Limits
- Maximum 5 concurrent connections per user
- Maximum 1 connection per session
- Automatic reconnection with exponential backoff

### Event Limits
- Typing events: 10 per minute
- Message events: Rate limited by API endpoints
- Ping events: 1 per 30 seconds

## Room Management

### Project Rooms
- Users automatically join room for projects they can access
- Real-time updates broadcast to all room members
- Automatic cleanup when users disconnect

### Session Isolation
- Chat events scoped to specific sessions
- Progress updates shared across project collaborators
- Private session state maintained separately