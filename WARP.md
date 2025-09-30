# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**AI Movie Platform** - A comprehensive AI-powered movie production platform built with Next.js 15.4+, PayloadCMS 3.56+, and TypeScript 5.7+. This platform enables creating, collaborating, and producing movies through intelligent AI assistance with real-time chat interfaces and advanced media processing.

**Key Stack:**
- **Frontend**: Next.js 15.4+ (App Router), React 19.1+, TypeScript 5.7+
- **Backend**: PayloadCMS 3.56+ with MongoDB adapter
- **Styling**: Tailwind CSS 4+ with shadcn/ui components
- **Real-time**: WebSocket for live collaboration
- **AI Services**: Multiple providers with fallback support
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Package Manager**: pnpm (required)
- **Node Version**: 18.20.2+ or 20.9.0+

## Common Development Commands

### Essential Startup
```bash
# Install dependencies
pnpm install

# Generate PayloadCMS types (REQUIRED after collection changes)
pnpm generate:types

# Start development server (runs on port 3010)
pnpm dev
```

### Building & Running
```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Clean restart (if .next cache issues)
pnpm devsafe
```

### Testing
```bash
# Run all tests
pnpm test

# Run only integration tests (Vitest)
pnpm test:int

# Run only E2E tests (Playwright, requires dev server)
pnpm test:e2e

# Run specific test file
pnpm exec vitest run tests/prompts/engine.test.ts

# Run tests in watch mode
pnpm exec vitest watch
```

### Code Quality
```bash
# Lint code
pnpm lint

# Type checking (use TypeScript compiler directly)
pnpm exec tsc --noEmit

# Format with Prettier (if configured)
pnpm exec prettier --write "src/**/*.{ts,tsx}"
```

### PayloadCMS Specific
```bash
# Generate TypeScript types from collections
pnpm generate:types

# Generate import map
pnpm generate:importmap

# Access Payload CLI
pnpm payload
```

## Architecture & Design Principles

### Constitutional Architecture
This platform follows strict **constitutional principles** for scalable development:

1. **PayloadCMS Data Layer Supremacy**: ALL data operations must go through PayloadCMS collections. Never use direct database access.

2. **Server-First Architecture**: Next.js components are server components by default. Only use `'use client'` when absolutely necessary (browser APIs, event handlers, React hooks like useState/useEffect).

3. **Modern Stack Discipline**: Use latest stable versions with TypeScript strict mode. No legacy patterns.

4. **Real-Time First Design**: WebSocket-powered collaboration using `src/services/websocket.ts` for multi-user features.

5. **Test-Driven Development**: Write tests before implementation. Comprehensive coverage at all levels.

### Key Architectural Patterns

#### PayloadCMS Integration (CRITICAL)

**Always use local API in server components:**
```typescript
// Correct pattern for server components
import { getPayload } from 'payload'
import config from '@payload-config' // Special alias pointing to payload.config.ts

const payload = await getPayload({ config })
const projects = await payload.find({
  collection: 'projects',
  where: { status: { equals: 'active' } }
})
```

**Never use REST API when local API is available** - The local API is faster and avoids network overhead.

**Critical Rule: After ANY collection schema changes:**
```bash
pnpm generate:types
```
**NEVER manually edit** `payload-types.ts` - it's auto-generated.

#### Server vs Client Components

**Default to Server Components:**
```typescript
// Server component (default, no 'use client')
export default async function ProjectPage({ params }) {
  const payload = await getPayload({ config })
  const project = await payload.findByID({
    collection: 'projects',
    id: params.id
  })
  return <ProjectDetails project={project} />
}
```

**Only use Client Components for:**
- Browser APIs (window, localStorage, etc.)
- Event handlers (onClick, onChange, etc.)
- React hooks (useState, useEffect, useContext, etc.)
- Third-party libraries requiring browser environment

```typescript
'use client'
import { useState } from 'react'

export function InteractiveComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

#### Data Model Collections

**Core Collections** (in `src/collections/`):
- **Users**: Authentication and authorization
- **Projects**: Movie project containers with metadata
- **Sessions**: Chat sessions with workflow state tracking
- **Media**: Files with AI analysis and embeddings (S3/R2 storage)
- **PromptTemplates**: Reusable prompt configurations with tags
- **PromptsExecuted**: History of executed prompts with results

**Access pattern:**
```typescript
import { getPayload } from 'payload'
import config from '@payload-config'

// In any server component or API route
const payload = await getPayload({ config })
```

### Directory Structure & Organization

```
apps/auto-movie/
├── app/                       # Next.js App Router
│   ├── (frontend)/           # Frontend pages (grouping route)
│   │   ├── dashboard/        # User dashboard & project management
│   │   ├── prompts/          # Prompt template management
│   │   └── test-brain/       # Brain service testing
│   ├── (payload)/            # PayloadCMS admin (grouping route)
│   └── api/                  # API routes
│       ├── v1/              # Versioned REST API
│       │   ├── chat/        # Chat & session endpoints
│       │   ├── media/       # Media upload & search
│       │   └── projects/    # Project CRUD operations
│       ├── prompts/         # Prompt execution API
│       └── prompt-templates/ # Template management API
├── src/
│   ├── collections/          # PayloadCMS collection definitions
│   ├── components/           # React components
│   │   ├── chat/            # Chat interface (InputArea, MessageList, etc.)
│   │   ├── ui/              # shadcn/ui components (Button, Card, Modal, etc.)
│   │   ├── forms/           # Form components (ProjectForm)
│   │   ├── projects/        # Project-related components
│   │   ├── prompts/         # Prompt UI components
│   │   └── knowledge-graph/ # Graph visualization
│   ├── hooks/               # React hooks
│   │   ├── useChat.ts       # Chat functionality
│   │   ├── useWebSocket.ts  # WebSocket connection
│   │   ├── useBrainService.ts # Brain service client
│   │   └── useCollaboration.ts # Real-time collaboration
│   ├── services/            # Service layer
│   │   ├── websocket.ts     # WebSocket client service
│   │   ├── aiErrorHandling.ts # AI service error handling
│   │   ├── taskService.ts   # Background task management
│   │   └── [ai-services]/   # AI provider integrations
│   ├── lib/                 # Utilities & libraries
│   │   ├── brain-client.ts  # Brain service WebSocket client
│   │   ├── prompts/         # Prompt engine & tag utilities
│   │   └── utils.ts         # General utilities
│   ├── middleware/          # API middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── rateLimiting.ts  # Rate limiting
│   │   ├── uploadSecurity.ts # File upload security
│   │   └── subscriptionLimits.ts # Usage limits
│   ├── actions/             # Server actions
│   │   ├── create-project.ts
│   │   ├── get-project.ts
│   │   ├── update-project.ts
│   │   └── list-projects.ts
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── validations/         # Zod schemas
├── tests/                   # Test suites
│   ├── unit/               # Unit tests (not in repo currently)
│   ├── integration/        # Integration tests (Vitest)
│   ├── e2e/                # End-to-end tests (Playwright)
│   ├── prompts/            # Prompt engine tests
│   └── setup/              # Test fixtures & configuration
├── docs/                    # Documentation
│   ├── api-reference.md     # Complete API documentation
│   ├── rule-docs/           # Development rules & patterns
│   └── quick-start-local-dev.md # Local dev setup guide
├── payload.config.ts        # PayloadCMS configuration (root level)
├── next.config.mjs          # Next.js configuration
├── vitest.config.mts        # Vitest test configuration
└── playwright.config.ts     # Playwright E2E configuration
```

**Key Notes:**
- `@/` alias maps to `src/` directory
- `@payload-config` alias maps to `payload.config.ts` (not in src/)
- Collections are at `src/collections/`, NOT `collections/`
- Server actions in `src/actions/` for form submissions

## Special Integrations

### WebSocket Real-Time Features

**Client-side WebSocket service** (`src/services/websocket.ts`):
```typescript
import { WebSocketService } from '@/services/websocket'

const ws = new WebSocketService(sessionId, projectId, userId)
await ws.connect()

ws.on('onChatMessage', (data) => {
  // Handle incoming chat messages
})

ws.sendChatMessage('Hello', [])
```

**WebSocket runs on separate port** (default: 3001) - configured in `NEXT_PUBLIC_WS_PORT`.

### Brain Service Integration

**MCP-based brain service** for embeddings, document storage, and knowledge graphs:
```typescript
import { BrainClient } from '@/lib/brain-client'

const brain = new BrainClient(process.env.NEXT_PUBLIC_BRAIN_SERVICE_URL)
await brain.connect()

// Generate embeddings
const embedding = await brain.generateEmbedding({ text: 'content' })

// Semantic search
const results = await brain.searchDocuments({
  query: 'search query',
  limit: 10
})
```

**Brain service URL**: `wss://brain.ft.tc` or configure via `NEXT_PUBLIC_BRAIN_SERVICE_URL`.

### AI Service Providers

Multiple AI services integrated with fallback support:
- **novelLLM** (`src/services/novelLLM.ts`) - Primary LLM
- **falAI** (`src/services/falAI.ts`) - AI processing
- **elevenLabsVoice** (`src/services/elevenLabsVoice.ts`) - Voice synthesis
- **aiErrorHandling** (`src/services/aiErrorHandling.ts`) - Unified error handling

### Prompt Engine System

**Tag-based prompt templates** with dynamic form generation:
```typescript
import { processPromptTemplate } from '@/lib/prompts/engine'
import { parseTagsFromTemplate } from '@/lib/prompts/tag-utils'

// Parse tags from template
const tags = parseTagsFromTemplate(template)

// Execute prompt with variables
const result = await processPromptTemplate(templateId, {
  character_name: 'Hero',
  scene_type: 'action'
})
```

**Tag groups** enable sequential execution of related prompts (see `src/hooks/useTagGroupExecution.ts`).

## Important Development Rules

### File Organization
- **NEVER save working files, tests, or markdown to root folder**
- Organize files in appropriate subdirectories (`src/`, `tests/`, `docs/`, etc.)
- Use proper collections structure for PayloadCMS

### PayloadCMS Specific Rules
- **Version**: 3.56.0 (patterns for 3.4+ only)
- **Imports**: Use `import type { CollectionConfig } from 'payload'`
- **Config location**: `payload.config.ts` at project root (use `@payload-config` alias)
- **Collections**: Define in `src/collections/` directory
- **Types**: ALWAYS run `pnpm generate:types` after schema changes
- **Database**: MongoDB via `@payloadcms/db-mongodb` with `DATABASE_URI` env var

### Next.js 15.4+ Patterns
- **App Router**: Use `app/` directory structure
- **Server Components**: Default behavior, don't add `'use client'` unnecessarily
- **Client Components**: Only for browser APIs, events, or hooks
- **Data Fetching**: Use PayloadCMS local API in server components

### TypeScript
- **Strict mode**: Enabled in `tsconfig.json`
- **Path aliases**: `@/*` for `src/`, `@payload-config` for config
- **Generated types**: Never edit `payload-types.ts` manually

### Testing Strategy
- **Unit tests**: Vitest for isolated function testing
- **Integration tests**: Vitest for API and service integration
- **E2E tests**: Playwright for full user workflows
- **Performance targets**: <2s chat response, <10s file processing, <500ms WebSocket

### Environment Variables
Key environment variables (from `.env.local`):
```bash
DATABASE_URI=mongodb://...        # MongoDB connection
PAYLOAD_SECRET=...                # PayloadCMS secret key
PAYLOAD_PUBLIC_SERVER_URL=...     # Public URL for PayloadCMS
NEXT_PUBLIC_WS_HOST=...          # WebSocket host
NEXT_PUBLIC_WS_PORT=...          # WebSocket port (default: 3001)
NEXT_PUBLIC_BRAIN_SERVICE_URL=... # Brain service WebSocket URL
```

### CORS & CSRF Configuration
Pre-configured domains in `payload.config.ts`:
- `http://localhost:3010` (main app)
- `http://localhost:3001` (Grafana)
- `http://localhost:8001` (Celery tasks)
- `http://localhost:8002` (MCP brain service)
- `https://auto-movie.ngrok.pro` (dev domain)
- `https://auto-movie.ft.tc` (production)

## Performance Targets

**Established benchmarks** for quality assurance:
- Chat response time: **< 2 seconds**
- File upload processing: **< 10 seconds** (images)
- WebSocket connection: **< 500ms**
- Page load time: **< 1 second**
- Constitutional compliance: **100%** (automated verification)

## Common Development Workflows

### Creating a New PayloadCMS Collection
1. Create collection file in `src/collections/YourCollection.ts`
2. Define `CollectionConfig` with slug, fields, and access rules
3. Export from `src/collections/index.ts`
4. Add to `collections` array in `payload.config.ts`
5. Run `pnpm generate:types` to generate TypeScript types
6. Restart dev server

### Adding a New API Endpoint
1. Create route file in `app/api/v1/your-endpoint/route.ts`
2. Import PayloadCMS: `import { getPayload } from 'payload'`
3. Import config: `import config from '@payload-config'`
4. Use local API: `const payload = await getPayload({ config })`
5. Add authentication middleware if needed
6. Write tests in `tests/integration/` or `tests/e2e/`

### Adding a New React Component
1. Determine if server or client component needed
2. Create in appropriate `src/components/` subdirectory
3. Use TypeScript with proper types
4. Import from `@/components/...` using path alias
5. Use shadcn/ui components from `@/components/ui/` for consistency
6. Write component tests if it has complex logic

### Working with Real-Time Features
1. Use `useWebSocket` hook in client components
2. Connect with session/project IDs
3. Set up event handlers for messages
4. Send messages via WebSocket service methods
5. Handle disconnection and reconnection gracefully

### Testing Workflow
1. Write tests **before** implementation (TDD approach)
2. Run tests with `pnpm test` or `pnpm test:int`
3. Ensure all tests pass before committing
4. Verify performance targets are met
5. Check constitutional compliance if architectural changes

## Troubleshooting

### Common Issues

**PayloadCMS Types Out of Sync:**
```bash
pnpm generate:types
```
Restart your IDE/editor to pick up new types.

**WebSocket Connection Issues:**
- Verify `NEXTAUTH_URL` matches development URL
- Check WebSocket server is running on correct port
- Ensure CORS headers are configured properly

**File Upload Problems:**
- Check file permissions in upload directory
- Verify file size limits in middleware
- Ensure S3/R2 credentials are configured (if using cloud storage)

**Chat Response Slow:**
- Verify AI service API keys and endpoints
- Check database connection performance
- Monitor AI service response times

**Build Errors:**
- Clear `.next` cache: `rm -rf .next` (or `pnpm devsafe`)
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Verify Node version matches requirements (18.20.2+ or 20.9.0+)

### Development Setup Issues
If experiencing setup issues, refer to:
- `docs/local-development-setup.md` - Detailed local setup guide
- `docs/quick-start-local-dev.md` - Quick start for local dev
- `docs/verify-local-setup.md` - Setup verification steps

## Additional Resources

- **API Reference**: See `docs/api-reference.md` for complete API documentation
- **Data Model**: See `specs/001-i-have-put/data-model.md` for detailed data model
- **Constitutional Principles**: Documented in README.md architecture section
- **Test Reports**: See `docs/PROMPT_MANAGEMENT_TEST_REPORT.md` for test coverage details

---

**Remember**: This is a constitutional architecture - follow the established patterns and principles. All data through PayloadCMS, server-first components, comprehensive testing, and real-time collaboration are the foundation of this platform.