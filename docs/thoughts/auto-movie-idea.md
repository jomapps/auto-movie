# AI Movie Platform Phase 2 - PayloadCMS Core & Chat Interface

## Overview
Build the central application foundation using PayloadCMS with extended collections, real-time chat interface, and Novel LLM integration. This creates the user-facing platform that orchestrates the entire movie production workflow.

## Project Structure

```
auto-movie/
├── payload.config.ts           # PayloadCMS configuration
├── src/
│   ├── collections/           # PayloadCMS collections
│   │   ├── Users.ts
│   │   ├── Projects.ts
│   │   ├── Sessions.ts
│   │   ├── Media.ts
│   │   └── index.ts
│   ├── components/           # React components
│   │   ├── chat/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── InputArea.tsx
│   │   │   ├── ChoiceSelector.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── ProgressIndicator.tsx
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loading.tsx
│   │   └── layout/
│   │       ├── AdminLayout.tsx
│   │       └── AppLayout.tsx
│   ├── services/            # External service clients
│   │   ├── novelLLM.ts      # Qwen3-VL client
│   │   ├── taskService.ts   # Celery task service client
│   │   └── websocket.ts     # Real-time communication
│   ├── types/               # TypeScript definitions
│   │   ├── collections.ts
│   │   ├── chat.ts
│   │   └── tasks.ts
│   ├── utils/
│   │   ├── prompts.ts       # LLM prompt templates
│   │   ├── validators.ts    # Input validation
│   │   └── formatters.ts    # Response formatting
│   └── hooks/               # React hooks
│       ├── useChat.ts
│       ├── useWebSocket.ts
│       └── useLLM.ts
├── pages/                   # Next.js pages
│   ├── api/
│   │   ├── chat/
│   │   │   ├── message.ts   # Chat message endpoints
│   │   │   └── upload.ts    # File upload handling
│   │   ├── llm/
│   │   │   └── process.ts   # Novel LLM processing
│   │   └── websocket.ts     # WebSocket server
│   ├── projects/
│   │   ├── [id]/
│   │   │   └── chat.tsx     # Project chat interface
│   │   └── index.tsx        # Projects list
│   ├── admin/               # PayloadCMS admin
│   └── index.tsx            # Landing page
├── public/
├── package.json
├── next.config.js
├── tailwind.config.js
└── .env.local
```

## PayloadCMS Collection Definitions

### Users Collection

```typescript
// src/collections/Users.ts
import { CollectionConfig } from 'payload/types'

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'User', value: 'user' },
        { label: 'Admin', value: 'admin' },
        { label: 'Producer', value: 'producer' },
      ],
    },
    {
      name: 'preferences',
      type: 'json',
      defaultValue: {},
      admin: {
        description: 'User preferences and settings',
      },
    },
    {
      name: 'activeProjects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      admin: {
        description: 'Projects user is currently working on',
      },
    },
    {
      name: 'subscription',
      type: 'group',
      fields: [
        {
          name: 'tier',
          type: 'select',
          defaultValue: 'free',
          options: [
            { label: 'Free', value: 'free' },
            { label: 'Pro', value: 'pro' },
            { label: 'Enterprise', value: 'enterprise' },
          ],
        },
        {
          name: 'maxProjects',
          type: 'number',
          defaultValue: 1,
        },
        {
          name: 'maxEpisodesPerProject',
          type: 'number',
          defaultValue: 3,
        },
      ],
    },
  ],
  timestamps: true,
}

export default Users
```

### Projects Collection

```typescript
// src/collections/Projects.ts
import { CollectionConfig } from 'payload/types'

const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'genre', 'status', 'createdBy', 'updatedAt'],
  },
  access: {
    create: ({ req: { user } }) => !!user,
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        or: [
          { createdBy: { equals: user?.id } },
          { collaborators: { contains: user?.id } }
        ]
      }
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        or: [
          { createdBy: { equals: user?.id } },
          { collaborators: { contains: user?.id } }
        ]
      }
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Enter project title',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        placeholder: 'Brief description of your series',
      },
    },
    {
      name: 'genre',
      type: 'select',
      required: true,
      options: [
        { label: 'Action', value: 'action' },
        { label: 'Comedy', value: 'comedy' },
        { label: 'Drama', value: 'drama' },
        { label: 'Horror', value: 'horror' },
        { label: 'Sci-Fi', value: 'sci-fi' },
        { label: 'Thriller', value: 'thriller' },
        { label: 'Romance', value: 'romance' },
        { label: 'Documentary', value: 'documentary' },
      ],
    },
    {
      name: 'episodeCount',
      type: 'number',
      required: true,
      min: 1,
      max: 50,
      defaultValue: 10,
      admin: {
        description: 'Total number of episodes planned',
      },
    },
    {
      name: 'targetAudience',
      type: 'select',
      options: [
        { label: 'Children (G)', value: 'children' },
        { label: 'Family (PG)', value: 'family' },
        { label: 'Teen (PG-13)', value: 'teen' },
        { label: 'Adult (R)', value: 'adult' },
      ],
      defaultValue: 'family',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'concept',
      options: [
        { label: 'Concept', value: 'concept' },
        { label: 'Pre-Production', value: 'pre-production' },
        { label: 'Production', value: 'production' },
        { label: 'Post-Production', value: 'post-production' },
        { label: 'Completed', value: 'completed' },
        { label: 'On Hold', value: 'on-hold' },
      ],
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'collaborators',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Users who can edit this project',
      },
    },
    {
      name: 'styleReferences',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      filterOptions: {
        mediaType: { equals: 'style_reference' }
      },
      admin: {
        description: 'Reference images for visual style',
      },
    },
    {
      name: 'projectSettings',
      type: 'group',
      fields: [
        {
          name: 'aspectRatio',
          type: 'select',
          defaultValue: '16:9',
          options: [
            { label: '16:9 (Widescreen)', value: '16:9' },
            { label: '4:3 (Standard)', value: '4:3' },
            { label: '21:9 (Cinematic)', value: '21:9' },
          ],
        },
        {
          name: 'episodeDuration',
          type: 'number',
          defaultValue: 22,
          admin: {
            description: 'Target duration per episode in minutes',
          },
        },
        {
          name: 'qualityTier',
          type: 'select',
          defaultValue: 'standard',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Standard', value: 'standard' },
            { label: 'Premium', value: 'premium' },
          ],
        },
      ],
    },
    {
      name: 'progress',
      type: 'group',
      admin: {
        description: 'Automated progress tracking',
      },
      fields: [
        {
          name: 'currentPhase',
          type: 'select',
          defaultValue: 'story_development',
          options: [
            { label: 'Story Development', value: 'story_development' },
            { label: 'Character Creation', value: 'character_creation' },
            { label: 'Visual Design', value: 'visual_design' },
            { label: 'Audio Design', value: 'audio_design' },
            { label: 'Scene Production', value: 'scene_production' },
            { label: 'Post Production', value: 'post_production' },
            { label: 'Final Assembly', value: 'final_assembly' },
          ],
        },
        {
          name: 'completedSteps',
          type: 'json',
          defaultValue: [],
          admin: {
            description: 'Array of completed workflow steps',
          },
        },
        {
          name: 'overallProgress',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 0,
          admin: {
            description: 'Overall completion percentage',
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create') {
          data.progress = {
            currentPhase: 'story_development',
            completedSteps: [],
            overallProgress: 0,
          }
        }
        return data
      },
    ],
  },
  timestamps: true,
}

export default Projects
```

### Sessions Collection

```typescript
// src/collections/Sessions.ts
import { CollectionConfig } from 'payload/types'

const Sessions: CollectionConfig = {
  slug: 'sessions',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['project', 'user', 'currentStep', 'updatedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { user: { equals: user?.id } }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return { user: { equals: user?.id } }
    },
  },
  fields: [
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'currentStep',
      type: 'text',
      required: true,
      defaultValue: 'initial_concept',
      admin: {
        description: 'Current workflow step identifier',
      },
    },
    {
      name: 'conversationHistory',
      type: 'json',
      defaultValue: [],
      admin: {
        description: 'Array of chat messages and interactions',
      },
    },
    {
      name: 'contextData',
      type: 'json',
      defaultValue: {},
      admin: {
        description: 'Current context for LLM processing',
      },
    },
    {
      name: 'awaitingUserInput',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether system is waiting for user response',
      },
    },
    {
      name: 'lastChoices',
      type: 'json',
      admin: {
        description: 'Last set of choices presented to user',
      },
    },
    {
      name: 'sessionState',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Completed', value: 'completed' },
        { label: 'Error', value: 'error' },
      ],
    },
  ],
  timestamps: true,
}

export default Sessions
```

### Extended Media Collection

```typescript
// src/collections/Media.ts
import { CollectionConfig } from 'payload/types'

const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    // Configure for Cloudflare R2
    adapter: {
      name: 'cloudflare-r2',
      options: {
        config: {
          accountId: process.env.R2_ACCOUNT_ID,
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
          bucketName: process.env.R2_BUCKET_NAME,
          region: 'auto',
        },
      },
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      return {
        or: [
          { project: { createdBy: { equals: user?.id } } },
          { project: { collaborators: { contains: user?.id } } }
        ]
      }
    },
  },
  fields: [
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'mediaType',
      type: 'select',
      required: true,
      options: [
        { label: 'Style Reference', value: 'style_reference' },
        { label: 'Character Design', value: 'character_design' },
        { label: 'Environment Design', value: 'environment_design' },
        { label: 'Concept Art', value: 'concept_art' },
        { label: 'Storyboard', value: 'storyboard' },
        { label: 'Video Segment', value: 'video_segment' },
        { label: 'Audio Clip', value: 'audio_clip' },
        { label: 'Voice Profile', value: 'voice_profile' },
        { label: 'Music Track', value: 'music_track' },
        { label: 'Sound Effect', value: 'sound_effect' },
        { label: 'Final Video', value: 'final_video' },
      ],
    },
    {
      name: 'agentGenerated',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this media was generated by an AI agent',
      },
    },
    {
      name: 'generationMetadata',
      type: 'group',
      admin: {
        condition: (data) => data.agentGenerated,
      },
      fields: [
        {
          name: 'agentId',
          type: 'text',
          admin: {
            description: 'ID of the agent that generated this media',
          },
        },
        {
          name: 'promptUsed',
          type: 'textarea',
          admin: {
            description: 'Prompt used for generation',
          },
        },
        {
          name: 'modelVersion',
          type: 'text',
          admin: {
            description: 'Version of the AI model used',
          },
        },
        {
          name: 'generationTime',
          type: 'date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'taskId',
          type: 'text',
          admin: {
            description: 'Celery task ID for tracking',
          },
        },
      ],
    },
    {
      name: 'embedding',
      type: 'json',
      admin: {
        description: 'Jina v4 multimodal embedding vector',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Human or AI-generated description of the media',
      },
    },
    {
      name: 'tags',
      type: 'json',
      defaultValue: [],
      admin: {
        description: 'Array of tags for categorization',
      },
    },
    {
      name: 'relatedElements',
      type: 'group',
      fields: [
        {
          name: 'characters',
          type: 'json',
          defaultValue: [],
          admin: {
            description: 'Character IDs featured in this media',
          },
        },
        {
          name: 'episode',
          type: 'number',
          admin: {
            description: 'Episode number if applicable',
          },
        },
        {
          name: 'scene',
          type: 'text',
          admin: {
            description: 'Scene identifier if applicable',
          },
        },
        {
          name: 'timestamp',
          type: 'number',
          admin: {
            description: 'Timestamp in seconds for video segments',
          },
        },
      ],
    },
    {
      name: 'technicalData',
      type: 'group',
      fields: [
        {
          name: 'duration',
          type: 'number',
          admin: {
            condition: (data) => ['video_segment', 'audio_clip', 'music_track'].includes(data.mediaType),
            description: 'Duration in seconds for audio/video',
          },
        },
        {
          name: 'resolution',
          type: 'text',
          admin: {
            condition: (data) => ['character_design', 'environment_design', 'video_segment'].includes(data.mediaType),
            description: 'Resolution (e.g., 1920x1080)',
          },
        },
        {
          name: 'fps',
          type: 'number',
          admin: {
            condition: (data) => data.mediaType === 'video_segment',
            description: 'Frames per second',
          },
        },
        {
          name: 'sampleRate',
          type: 'number',
          admin: {
            condition: (data) => ['audio_clip', 'voice_profile', 'music_track'].includes(data.mediaType),
            description: 'Audio sample rate in Hz',
          },
        },
      ],
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Version number for iterative improvements',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
        { label: 'Processing', value: 'processing' },
        { label: 'Failed', value: 'failed' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && req.file) {
          // Auto-generate embedding for new media
          // This will be called by the embedding service
          data.status = 'processing'
        }
        return data
      },
    ],
  },
  timestamps: true,
}

export default Media
```

### Collection Index

```typescript
// src/collections/index.ts
import Users from './Users'
import Projects from './Projects'
import Sessions from './Sessions'
import Media from './Media'

export {
  Users,
  Projects,
  Sessions,
  Media,
}
```

## PayloadCMS Configuration

```typescript
// payload.config.ts
import { buildConfig } from 'payload/config'
import path from 'path'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { Users, Projects, Sessions, Media } from './src/collections'

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    webpack: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          '@': path.resolve(__dirname, './src'),
        },
      },
    }),
  },
  editor: slateEditor({}),
  collections: [
    Users,
    Projects,
    Sessions,
    Media,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  cors: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
  ].filter(Boolean),
  csrf: [
    'http://localhost:3000',
    'http://localhost:3001', 
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
  ].filter(Boolean),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
})
```

## Chat Interface Components

### Main Chat Interface

```typescript
// src/components/chat/ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { useWebSocket } from '../../hooks/useWebSocket'
import { useChat } from '../../hooks/useChat'
import MessageList from './MessageList'
import InputArea from './InputArea'
import ChoiceSelector from './ChoiceSelector'
import ProgressIndicator from './ProgressIndicator'
import { ChatMessage, ChatChoice } from '../../types/chat'

interface ChatInterfaceProps {
  projectId: string
  userId: string
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ projectId, userId }) => {
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    messages,
    isLoading,
    choices,
    currentStep,
    progress,
    sendMessage,
    uploadFile,
    selectChoice,
    error,
  } = useChat(projectId, userId)

  const { isConnected } = useWebSocket(projectId, userId, {
    onMessage: (message) => {
      // Handle real-time updates
    },
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Movie Production Chat
            </h1>
            <p className="text-sm text-gray-600">
              Current Step: {currentStep}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <ProgressIndicator progress={progress} />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          <MessageList 
            messages={messages} 
            isLoading={isLoading}
            error={error}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Choices Area */}
      {choices && choices.length > 0 && (
        <ChoiceSelector 
          choices={choices}
          onSelect={selectChoice}
          disabled={isLoading}
        />
      )}

      {/* Input Area */}
      <InputArea
        onSendMessage={sendMessage}
        onUploadFile={uploadFile}
        disabled={isLoading || (choices && choices.length > 0)}
        placeholder={
          choices && choices.length > 0 
            ? "Please select one of the choices above or click 'Manual Override'"
            : "Describe your movie idea, upload references, or ask questions..."
        }
      />
    </div>
  )
}

export default ChatInterface
```

### Message List Component

```typescript
// src/components/chat/MessageList.tsx
import React from 'react'
import { ChatMessage } from '../../types/chat'
import { formatDistanceToNow } from 'date-fns'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, error }) => {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
      {messages.map((message, index) => (
        <MessageBubble key={message.id || index} message={message} />
      ))}
      
      {isLoading && (
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>AI is thinking...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl ${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && !isSystem && (
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">AI</span>
            </div>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
          </div>
        )}
        
        <div className={`
          rounded-lg px-4 py-3
          ${isUser 
            ? 'bg-blue-600 text-white' 
            : isSystem
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              : 'bg-white border border-gray-200 text-gray-900'
          }
        `}>
          {message.content && (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((attachment, idx) => (
                <AttachmentPreview key={idx} attachment={attachment} />
              ))}
            </div>
          )}
        </div>
        
        {isUser && (
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageList
```

### Choice Selector Component

```typescript
// src/components/chat/ChoiceSelector.tsx
import React from 'react'
import { ChatChoice } from '../../types/chat'

interface ChoiceSelectorProps {
  choices: ChatChoice[]
  onSelect: (choice: ChatChoice) => void
  disabled: boolean
}

const ChoiceSelector: React.FC<ChoiceSelectorProps> = ({ choices, onSelect, disabled }) => {
  // Ensure max 4 choices plus manual override
  const displayChoices = choices.slice(0, 4)
  const hasManualOverride = choices.some(choice => choice.isManualOverride)

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-900">What would you like to do next?</h3>
        <p className="text-xs text-gray-500">Choose from the options below or manually override</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayChoices.map((choice, index) => (
          <button
            key={choice.id}
            onClick={() => onSelect(choice)}
            disabled={disabled}
            className={`
              text-left p-4 rounded-lg border-2 transition-all duration-200
              ${disabled 
                ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                : choice.isRecommended
                  ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100 hover:border-blue-300'
                  : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className={`
                    inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium
                    ${choice.isRecommended 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                    }
                  `}>
                    {index + 1}
                  </span>
                  <h4 className="font-medium">{choice.title}</h4>
                  {choice.isRecommended && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm opacity-75">{choice.description}</p>
                {choice.estimatedTime && (
                  <p className="mt-1 text-xs opacity-60">
                    Estimated time: {choice.estimatedTime}
                  </p>
                )}
              </div>
              {choice.icon && (
                <div className="ml-3 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    {choice.icon}
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Manual Override Button */}
      {!hasManualOverride && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button
            onClick={() => onSelect({ 
              id: 'manual_override',
              title: 'Manual Override',
              description: 'I want to specify exactly what to do next',
              isManualOverride: true 
            })}
            disabled={disabled}
            className={`
              w-full text-center p-3 rounded-lg border-2 border-dashed transition-all duration-200
              ${disabled
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
              }
            `}
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium">Manual Override</span>
            </div>
            <p className="text-sm mt-1 opacity-75">Take full control of the next step</p>
          </button>
        </div>
      )}
    </div>
  )
}

export default ChoiceSelector
```

### Input Area Component

```typescript
// src/components/chat/InputArea.tsx
import React, { useState, useRef } from 'react'
import { FileUpload } from './FileUpload'

interface InputAreaProps {
  onSendMessage: (message: string, files?: File[]) => void
  onUploadFile: (files: File[]) => void
  disabled: boolean
  placeholder: string
}

const InputArea: React.FC<InputAreaProps> = ({ 
  onSendMessage, 
  onUploadFile, 
  disabled, 
  placeholder 
}) => {
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [inputMode, setInputMode] = useState<'text' | 'markdown'>('text')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() && files.length === 0) return
    
    onSendMessage(message, files)
    setMessage('')
    setFiles([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileSelect = (selectedFiles: File[]) => {
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="bg-white border-t border-gray-200">
      {/* File Previews */}
      {files.length > 0 && (
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-6 py-4">
        <div className="flex items-end space-x-4">
          {/* Text Input Area */}
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className={`
                  w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12
                  focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                  ${disabled ? 'bg-gray-50 text-gray-400' : 'bg-white text-gray-900'}
                  ${inputMode === 'markdown' ? 'font-mono text-sm' : ''}
                `}
                style={{ 
                  minHeight: '52px',
                  maxHeight: '200px',
                }}
              />
              
              {/* Input Mode Toggle */}
              <div className="absolute right-3 top-3">
                <button
                  type="button"
                  onClick={() => setInputMode(inputMode === 'text' ? 'markdown' : 'text')}
                  disabled={disabled}
                  className={`
                    text-xs px-2 py-1 rounded
                    ${inputMode === 'markdown' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600'
                    }
                    hover:bg-opacity-80 transition-colors
                  `}
                >
                  {inputMode === 'markdown' ? 'MD' : 'TXT'}
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <FileUpload
            onFileSelect={handleFileSelect}
            disabled={disabled}
            accept="image/*,.md,.txt,.pdf"
            multiple
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || (!message.trim() && files.length === 0)}
            className={`
              flex items-center justify-center w-12 h-12 rounded-lg transition-colors
              ${disabled || (!message.trim() && files.length === 0)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Helper Text */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {inputMode === 'markdown' && (
              <span>Markdown formatting enabled</span>
            )}
          </div>
          <div>
            {message.length}/2000
          </div>
        </div>
      </form>
    </div>
  )
}

export default InputArea
```

## Novel LLM Integration

### LLM Service Client

```typescript
// src/services/novelLLM.ts
import { ChatMessage, ChatChoice } from '../types/chat'
import { PromptTemplate } from '../utils/prompts'

interface NovelLLMConfig {
  apiKey: string
  baseURL: string
  model: string
}

interface ProcessingContext {
  projectId: string
  currentStep: string
  conversationHistory: ChatMessage[]
  projectData?: any
  userPreferences?: any
}

class NovelLLMService {
  private config: NovelLLMConfig
  private client: any // Qwen3-VL client

  constructor(config: NovelLLMConfig) {
    this.config = config
    // Initialize Qwen3-VL client
    this.client = new Qwen3VLClient({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      model: config.model,
    })
  }

  async processMessage(
    message: string,
    files: File[] = [],
    context: ProcessingContext
  ): Promise<{
    response: string
    choices?: ChatChoice[]
    nextStep?: string
    actionRequired?: string
  }> {
    try {
      // Prepare multimodal input
      const multimodalInput = await this.prepareMultimodalInput(message, files, context)
      
      // Generate response using Qwen3-VL
      const llmResponse = await this.client.generate({
        messages: multimodalInput.messages,
        images: multimodalInput.images,
        systemPrompt: this.buildSystemPrompt(context),
        maxTokens: 2048,
        temperature: 0.7,
      })

      // Parse LLM response
      const parsedResponse = this.parseResponse(llmResponse)
      
      // Generate contextual choices
      const choices = await this.generateChoices(context, parsedResponse)

      return {
        response: parsedResponse.content,
        choices: choices,
        nextStep: parsedResponse.nextStep,
        actionRequired: parsedResponse.actionRequired,
      }

    } catch (error) {
      console.error('Novel LLM processing error:', error)
      throw new Error(`LLM processing failed: ${error.message}`)
    }
  }

  private async prepareMultimodalInput(
    message: string, 
    files: File[], 
    context: ProcessingContext
  ) {
    const messages = [
      {
        role: 'system',
        content: this.buildSystemPrompt(context)
      },
      // Include relevant conversation history
      ...context.conversationHistory.slice(-10).map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ]

    // Process uploaded images
    const images = []
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const imageData = await this.fileToBase64(file)
        images.push({
          data: imageData,
          type: file.type,
          description: `User uploaded image: ${file.name}`
        })
      }
    }

    return { messages, images }
  }

  private buildSystemPrompt(context: ProcessingContext): string {
    const template = PromptTemplate.getSystemPrompt(context.currentStep)
    
    return template
      .replace('{projectId}', context.projectId)
      .replace('{currentStep}', context.currentStep)
      .replace('{projectData}', JSON.stringify(context.projectData || {}))
      .replace('{userPreferences}', JSON.stringify(context.userPreferences || {}))
  }

  private parseResponse(llmResponse: any) {
    try {
      // Extract structured response if available
      const jsonMatch = llmResponse.match(/```json\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        const structured = JSON.parse(jsonMatch[1])
        return {
          content: structured.response || llmResponse,
          nextStep: structured.nextStep,
          actionRequired: structured.actionRequired,
        }
      }

      return {
        content: llmResponse,
        nextStep: null,
        actionRequired: null,
      }
    } catch (error) {
      return {
        content: llmResponse,
        nextStep: null,
        actionRequired: null,
      }
    }
  }

  private async generateChoices(
    context: ProcessingContext, 
    response: any
  ): Promise<ChatChoice[]> {
    const choices: ChatChoice[] = []

    // Generate step-specific choices based on current workflow step
    switch (context.currentStep) {
      case 'initial_concept':
        choices.push(
          {
            id: 'develop_story',
            title: 'Develop Story Structure',
            description: 'Create detailed narrative arc and episode breakdown',
            isRecommended: true,
            estimatedTime: '10-15 minutes',
            icon: '📚'
          },
          {
            id: 'create_characters',
            title: 'Design Main Characters',
            description: 'Develop protagonist, antagonist, and key supporting characters',
            estimatedTime: '15-20 minutes',
            icon: '👥'
          },
          {
            id: 'define_style',
            title: 'Define Visual Style',
            description: 'Establish visual aesthetic, color palette, and artistic direction',
            estimatedTime: '10-15 minutes',
            icon: '🎨'
          }
        )
        break

      case 'story_development':
        choices.push(
          {
            id: 'episode_breakdown',
            title: 'Create Episode Breakdown',
            description: 'Structure your story into detailed episode outlines',
            isRecommended: true,
            estimatedTime: '20-30 minutes',
            icon: '📝'
          },
          {
            id: 'character_arcs',
            title: 'Develop Character Arcs',
            description: 'Plan character development across episodes',
            estimatedTime: '15-25 minutes',
            icon: '📈'
          },
          {
            id: 'world_building',
            title: 'Expand World Building',
            description: 'Develop locations, rules, and background lore',
            estimatedTime: '10-20 minutes',
            icon: '🌍'
          }
        )
        break

      case 'character_creation':
        choices.push(
          {
            id: 'design_visuals',
            title: 'Design Character Visuals',
            description: 'Create visual designs for your characters',
            isRecommended: true,
            estimatedTime: '15-25 minutes',
            icon: '🎭'
          },
          {
            id: 'create_voices',
            title: 'Create Character Voices',
            description: 'Develop unique voice profiles for dialogue',
            estimatedTime: '10-20 minutes',
            icon: '🎤'
          },
          {
            id: 'add_more_characters',
            title: 'Add More Characters',
            description: 'Create additional supporting or background characters',
            estimatedTime: '10-15 minutes',
            icon: '👤'
          }
        )
        break

      default:
        // Generate generic continuation choices
        choices.push(
          {
            id: 'continue_current',
            title: 'Continue Current Step',
            description: 'Keep working on the current aspect',
            isRecommended: true,
            estimatedTime: '5-10 minutes',
            icon: '▶️'
          },
          {
            id: 'review_progress',
            title: 'Review Progress',
            description: 'See what has been completed and what needs work',
            estimatedTime: '3-5 minutes',
            icon: '📊'
          }
        )
    }

    // Always add manual override as the last option
    choices.push({
      id: 'manual_override',
      title: 'Manual Override',
      description: 'I want to specify exactly what to do next',
      isManualOverride: true,
      icon: '✏️'
    })

    return choices.slice(0, 4) // Limit to maximum 4 choices
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  async generateEmbedding(text: string, imageUrl?: string): Promise<number[]> {
    // This would integrate with Jina v4 for embedding generation
    // For now, return placeholder
    return []
  }
}

export default NovelLLMService
```

## API Endpoints

### Chat Message Processing

```typescript
// pages/api/chat/message.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getPayloadClient } from '../../../src/utils/getPayload'
import NovelLLMService from '../../../src/services/novelLLM'
import { TaskServiceClient } from '../../../src/services/taskService'

const novelLLM = new NovelLLMService({
  apiKey: process.env.QWEN3VL_API_KEY!,
  baseURL: process.env.QWEN3VL_BASE_URL!,
  model: 'qwen3-vl-72b',
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { projectId, userId, message, sessionId } = req.body
    
    if (!projectId || !userId || !message) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const payload = await getPayloadClient()
    
    // Get or create session
    let session = await payload.findByID({
      collection: 'sessions',
      id: sessionId,
    })

    if (!session) {
      session = await payload.create({
        collection: 'sessions',
        data: {
          project: projectId,
          user: userId,
          currentStep: 'initial_concept',
          conversationHistory: [],
          contextData: {},
          awaitingUserInput: true,
        },
      })
    }

    // Get project data for context
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    // Process message with Novel LLM
    const response = await novelLLM.processMessage(
      message,
      [], // Handle file uploads separately
      {
        projectId,
        currentStep: session.currentStep,
        conversationHistory: session.conversationHistory || [],
        projectData: project,
      }
    )

    // Update conversation history
    const updatedHistory = [
      ...(session.conversationHistory || []),
      {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      },
      {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      },
    ]

    // Update session
    await payload.update({
      collection: 'sessions',
      id: session.id,
      data: {
        conversationHistory: updatedHistory,
        currentStep: response.nextStep || session.currentStep,
        lastChoices: response.choices || null,
        awaitingUserInput: true,
        contextData: {
          ...(session.contextData || {}),
          lastResponse: response,
        },
      },
    })

    // If action required, submit task to Celery service
    if (response.actionRequired) {
      const taskService = new TaskServiceClient()
      const task = await taskService.submitTask({
        projectId,
        taskType: response.actionRequired,
        taskData: response.taskData || {},
        metadata: {
          userId,
          sessionId: session.id,
        },
      })
    }

    res.status(200).json({
      response: response.response,
      choices: response.choices,
      sessionId: session.id,
      currentStep: response.nextStep || session.currentStep,
    })

  } catch (error) {
    console.error('Chat message processing error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    })
  }
}
```

### File Upload Handler

```typescript
// pages/api/chat/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import { getPayloadClient } from '../../../src/utils/getPayload'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
    })

    const [fields, files] = await form.parse(req)
    const projectId = Array.isArray(fields.projectId) ? fields.projectId[0] : fields.projectId

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required' })
    }

    const payload = await getPayloadClient()
    const uploadedFiles = []

    // Process each uploaded file
    for (const [fieldName, fileArray] of Object.entries(files)) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray
      
      if (!file) continue

      // Determine media type based on file type
      let mediaType = 'style_reference'
      if (file.mimetype?.startsWith('image/')) {
        mediaType = 'style_reference'
      } else if (file.originalFilename?.endsWith('.md')) {
        mediaType = 'script_document'
      } else if (file.mimetype?.startsWith('video/')) {
        mediaType = 'reference_video'
      }

      // Upload to PayloadCMS
      const mediaRecord = await payload.create({
        collection: 'media',
        data: {
          project: projectId,
          mediaType,
          agentGenerated: false,
          description: `User uploaded: ${file.originalFilename}`,
        },
        file: {
          data: require('fs').readFileSync(file.filepath),
          mimetype: file.mimetype || 'application/octet-stream',
          name: file.originalFilename || 'upload',
          size: file.size,
        },
      })

      uploadedFiles.push({
        id: mediaRecord.id,
        url: mediaRecord.url,
        filename: mediaRecord.filename,
        mediaType: mediaRecord.mediaType,
      })
    }

    res.status(200).json({
      files: uploadedFiles,
      message: `Uploaded ${uploadedFiles.length} file(s)`,
    })

  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({ 
      error: 'Upload failed',
      message: error.message,
    })
  }
}
```

## Environment Configuration

```bash
# .env.local

# Database
DATABASE_URI=mongodb://localhost:27017/auto-movie
PAYLOAD_SECRET=your-secret-key-here

# PayloadCMS
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Cloudflare R2
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=ai-movie-assets

# Novel LLM (Qwen3-VL)
QWEN3VL_API_KEY=your-qwen3vl-api-key
QWEN3VL_BASE_URL=https://api.qwen3vl.com/v1

# Celery Task Service
CELERY_TASK_API_URL=http://localhost:8001
CELERY_TASK_API_KEY=your-celery-api-key

# WebSocket
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Development
NODE_ENV=development
PORT=3000
```

## Package Dependencies

```json
{
  "name": "auto-movie",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "generate:types": "payload generate:types",
    "payload": "payload"
  },
  "dependencies": {
    "@payloadcms/bundler-webpack": "^1.0.0",
    "@payloadcms/db-mongodb": "^1.0.0",
    "@payloadcms/richtext-slate": "^1.0.0",
    "payload": "^2.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "formidable": "^3.5.0",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "date-fns": "^2.30.0",
    "react-markdown": "^9.0.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "@types/formidable": "^3.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

## Development Setup Instructions

### 1. Install Dependencies
```bash
cd auto-movie
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 3. Database Setup
```bash
# Start MongoDB (if running locally)
mongod --dbpath /data/db

# Or use MongoDB Atlas cloud connection
```

### 4. Generate Types
```bash
npm run generate:types
```

### 5. Start Development Server
```bash
npm run dev
```

### 6. Access Application
- Main App: http://localhost:3000
- PayloadCMS Admin: http://localhost:3000/admin
- Chat Interface: http://localhost:3000/projects/[project-id]/chat

## Next Steps

1. **Test PayloadCMS Admin**: Create test users, projects, and sessions
2. **Implement WebSocket**: Real-time communication for chat interface  
3. **Test LLM Integration**: Connect Novel LLM service and test responses
4. **Integrate Task Service**: Connect to Celery service for GPU tasks
5. **UI Polish**: Refine chat interface styling and user experience

This Phase 2 implementation provides a complete foundation with PayloadCMS collections, chat interface, and Novel LLM integration, ready for connecting to the Celery task service and expanding with additional agents.