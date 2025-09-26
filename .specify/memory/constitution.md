<!--
Sync Impact Report:
Version change: 1.2.0 → 1.3.0
Modified principles: III. Modern Stack Discipline enhanced with Tailwind CSS 4 and PostCSS patterns, VIII. Import & Configuration Patterns (new section)
Added sections: VIII. Import & Configuration Patterns - Critical patterns for Payload imports and Tailwind CSS 4 setup
Removed sections: None
Templates requiring updates: ✅ Updated references to v1.3.0, ✅ Added build error resolution patterns
Follow-up TODOs: Monitor for path alias issues (@/src/ vs @/), Ensure PostCSS config stays consistent
Critical Fixes Applied: 
- Fixed all Payload API imports to use `import { getPayload } from 'payload'` with `config from '@payload-config'`
- Configured Tailwind CSS 4 with proper PostCSS setup and ShadCN/UI integration
- Resolved all module resolution errors and build compilation issues
-->

# Auto-Movie AI Platform Constitution

## Core Principles

### I. PayloadCMS Data Layer Supremacy
All data access MUST go through PayloadCMS data layer and local API. Direct database access is STRICTLY FORBIDDEN. Use PayloadCMS collections, relationships, and hooks for all data operations. Collections MUST use TypeScript CollectionConfig interfaces with proper field definitions, access controls, and admin configurations. All collection slugs MUST follow kebab-case naming (e.g., 'chat-sessions', 'movie-projects'). Database collection names will automatically use underscore format (_slug_versions for versioned collections). This ensures data integrity, proper validation, and consistent access patterns across the entire application.

### II. Server-First Architecture  
Default to Next.js server-side components for all functionality. Client-side components are ONLY permitted when interactive features require browser APIs (WebSocket connections, real-time chat input, file uploads with drag-drop). This principle ensures optimal performance, SEO, and reduces JavaScript bundle size.

### III. Modern Stack Discipline
MUST use PayloadCMS version 3.56+ patterns and APIs exclusively. MUST use Payload's generated types from src/payload-types.ts for all data operations - NEVER define custom types that duplicate Payload schemas. MUST use Tailwind CSS version 4+ for styling. NO creation of new next.config files - modify existing configuration only. All API operations MUST use Payload's Local API (payload.create, payload.find, payload.update, payload.delete) with proper TypeScript inference. This ensures we leverage the latest features, security improvements, and maintain consistency with modern development practices.

### IV. Configuration Immutability
The existing next.config.mjs file is SACRED - modify only when absolutely necessary and document all changes. New configuration files are prohibited unless required by dependencies. This prevents configuration conflicts and maintains deployment predictability.

### V. Real-Time First Design
All user interactions in the chat interface MUST provide immediate feedback. Real-time communication is essential for the AI movie production workflow. Use WebSockets for live updates, progress tracking, and collaborative features to ensure users never feel disconnected from the AI processing pipeline.

### VI. Routing Structure Isolation
PayloadCMS reserves `/admin/*` and `/api/*` paths for its own use. Our application MUST use homepage `/` and `/dashboard/*` for all user-facing pages. ALL our API routes MUST use `/api/v1/*` prefix to avoid conflicts with PayloadCMS internal routes. NEVER use `/admin/*` paths in our application routing. This ensures clean separation between our application and PayloadCMS administrative interfaces.

### VII. Collection Architecture Discipline
All PayloadCMS collections MUST follow standardized patterns: (1) Use CollectionConfig TypeScript interface with proper field definitions, (2) Include access control functions that return boolean or query objects, (3) Enable API key authentication where third-party access is needed via `auth.useAPIKey: true`, (4) Configure proper admin components using file paths not direct React components, (5) Use hooks for data validation and transformation, (6) Enable versions with drafts for content that requires approval workflows, (7) Configure upload collections with proper storage adapters and image transformations. All collection modifications MUST be done through Payload's configuration system, never by direct database manipulation.

### VIII. Import & Configuration Patterns
CRITICAL: Payload imports MUST follow exact patterns: `import { getPayload } from 'payload'` and `config from '@payload-config'`, then `await getPayload({ config })`. NEVER import from custom utils or use `@/payload.config` - this causes build failures. Path aliases MUST use `@/` not `@/src/` - the alias already resolves to src/. Tailwind CSS 4 MUST use PostCSS configuration with `postcss.config.mjs` containing `"@tailwindcss/postcss": {}` plugin and CSS imports as `@import "tailwindcss"`. ShadCN/UI requires `components.json` config pointing to correct CSS file path. ESLint warnings about unused imports or `any` types are acceptable - build compilation success is the priority. These patterns are battle-tested and deviation causes module resolution failures.

## Technology Constraints

PayloadCMS version 3.56+ is the central data management system. All collections (Users, Projects, Sessions, Media) MUST be defined using PayloadCMS collection configurations with proper TypeScript interfaces. File uploads MUST use PayloadCMS upload functionality with proper media type classification, metadata tracking, and storage adapter configuration. Use Payload's generated types exclusively - the payload generate:types command creates src/payload-types.ts which MUST be the single source of truth for all data types.

Next.js App Router is the routing system. All pages MUST be server components unless client interactivity is required. Our API routes MUST use `/api/v1/*` prefix and handle chat processing, file uploads, and AI service integration using Payload's Local API. PayloadCMS automatically manages `/admin/*` and `/api/*` routes.

Tailwind CSS version 4+ provides all styling. NO custom CSS files except for component-specific styles that cannot be achieved with Tailwind utilities. Responsive design is mandatory for all chat interface components.

## Development Standards

Test-Driven Development is MANDATORY for all chat interface components, PayloadCMS collections, and API endpoints. Tests MUST cover user scenarios defined in specifications before implementation begins. Collection tests MUST validate PayloadCMS configuration, access controls, and data relationships using Payload's Local API.

TypeScript MUST be used for all code. Payload generates types automatically via `pnpm generate:types` - use these generated types consistently from src/payload-types.ts. Custom types MUST extend or compose PayloadCMS generated types, never duplicate schema definitions. All collection operations MUST use properly typed Local API calls with automatic type inference.

Error handling MUST be comprehensive, especially for AI service integration, file uploads, and real-time communication failures. Users MUST receive clear feedback when AI processing is unavailable or delayed. PayloadCMS access control violations MUST be handled gracefully with appropriate user messaging.

Security is NON-NEGOTIABLE. All API endpoints MUST validate user authentication and authorization through PayloadCMS access control functions. File uploads MUST be scanned and validated using PayloadCMS upload hooks. AI service communications MUST be secured with proper API key management. Third-party API access MUST use PayloadCMS API key authentication where appropriate.

Collection development MUST follow PayloadCMS patterns: configure collections in src/collections/, use proper field types with validation, implement access control functions that leverage request context, enable appropriate admin panel features, and use hooks for data transformation and validation.

## Governance

This constitution supersedes all other development practices and guidelines. Any deviation MUST be documented with explicit justification and approval process.

All code reviews MUST verify compliance with these principles. Pull requests that violate constitution principles will be rejected until corrected.

PayloadCMS data layer violations are AUTOMATIC rejections - no exceptions. Server-first architecture violations require specific justification for client-side necessity.

Routing structure violations using `/admin/*` or `/api/*` instead of `/api/v1/*` are AUTOMATIC rejections - no exceptions.

Collection Architecture violations including direct database access, schema duplication, or bypassing Payload's Local API are AUTOMATIC rejections - no exceptions.

Version updates to PayloadCMS or Tailwind CSS MUST be tested against existing chat interface functionality, collection configurations, and data layer operations. Generated types MUST be regenerated and validated after PayloadCMS version updates.

**Version**: 1.3.0 | **Ratified**: 2025-01-25 | **Last Amended**: 2025-09-25