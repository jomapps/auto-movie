# Chat API Contract

**Version**: 1.0  
**Base URL**: `/api/v1/chat`  
**Authentication**: Required for all endpoints

## Endpoints

### POST /api/v1/chat/message
Send a message in a project chat session.

**Request**:
```json
{
  "projectId": "string (required)",
  "sessionId": "string (optional, creates new if not provided)",
  "message": "string (required)",
  "files": ["file upload array (optional)"]
}
```

**Response Success (200)**:
```json
{
  "sessionId": "string",
  "response": "string",
  "choices": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "isRecommended": "boolean",
      "estimatedTime": "string",
      "icon": "string"
    }
  ],
  "currentStep": "string",
  "progress": "number (0-100)"
}
```

**Response Error (400/500)**:
```json
{
  "error": "string",
  "message": "string"
}
```

### POST /api/v1/chat/choice
Select a choice from presented options.

**Request**:
```json
{
  "sessionId": "string (required)",
  "choiceId": "string (required)",
  "customInput": "string (optional, for manual override)"
}
```

**Response**: Same as message endpoint

### POST /api/v1/chat/upload
Upload files for a project session.

**Request**: Multipart form data
- `projectId`: string (required)
- `sessionId`: string (optional)
- `files`: file array (required)

**Response Success (200)**:
```json
{
  "files": [
    {
      "id": "string",
      "url": "string",
      "filename": "string",
      "mediaType": "string"
    }
  ],
  "message": "string"
}
```

### GET /api/v1/chat/session/{sessionId}
Retrieve session information and conversation history.

**Response Success (200)**:
```json
{
  "id": "string",
  "project": "string",
  "currentStep": "string",
  "conversationHistory": [
    {
      "id": "string",
      "role": "user|assistant|system",
      "content": "string",
      "timestamp": "string (ISO 8601)",
      "attachments": ["string array"]
    }
  ],
  "awaitingUserInput": "boolean",
  "lastChoices": ["choice objects"],
  "sessionState": "string"
}
```

### GET /api/v1/chat/sessions
List user's active sessions.

**Query Parameters**:
- `projectId`: string (optional filter)
- `status`: string (optional filter)

**Response Success (200)**:
```json
{
  "sessions": [
    {
      "id": "string",
      "projectId": "string",
      "projectTitle": "string",
      "currentStep": "string",
      "lastActivity": "string (ISO 8601)",
      "sessionState": "string"
    }
  ]
}
```