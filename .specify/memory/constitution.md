<!--
Sync Impact Report:
Version change: 1.0.0 → 1.1.0
Modified principles: None renamed, Technology Constraints updated for API routing
Added sections: VI. Routing Structure Isolation principle
Removed sections: None
Templates requiring updates: ⚠ tasks.md, plan.md (API routes need /api/v1/* prefix)
Follow-up TODOs: Update existing task definitions to use /api/v1/* instead of /api/*
-->

# Auto-Movie AI Platform Constitution

## Core Principles

### I. PayloadCMS Data Layer Supremacy
All data access MUST go through PayloadCMS data layer and local API. Direct database access is STRICTLY FORBIDDEN. Use PayloadCMS collections, relationships, and hooks for all data operations. This ensures data integrity, proper validation, and consistent access patterns across the entire application.

### II. Server-First Architecture  
Default to Next.js server-side components for all functionality. Client-side components are ONLY permitted when interactive features require browser APIs (WebSocket connections, real-time chat input, file uploads with drag-drop). This principle ensures optimal performance, SEO, and reduces JavaScript bundle size.

### III. Modern Stack Discipline
MUST use PayloadCMS version 3.5+ patterns and APIs. MUST use Tailwind CSS version 4+ for styling. NO creation of new next.config files - modify existing configuration only. This ensures we leverage the latest features, security improvements, and maintain consistency with modern development practices.

### IV. Configuration Immutability
The existing next.config.mjs file is SACRED - modify only when absolutely necessary and document all changes. New configuration files are prohibited unless required by dependencies. This prevents configuration conflicts and maintains deployment predictability.

### V. Real-Time First Design
All user interactions in the chat interface MUST provide immediate feedback. Real-time communication is essential for the AI movie production workflow. Use WebSockets for live updates, progress tracking, and collaborative features to ensure users never feel disconnected from the AI processing pipeline.

### VI. Routing Structure Isolation
PayloadCMS reserves `/admin/*` and `/api/*` paths for its own use. Our application MUST use homepage `/` and `/dashboard/*` for all user-facing pages. ALL our API routes MUST use `/api/v1/*` prefix to avoid conflicts with PayloadCMS internal routes. NEVER use `/admin/*` paths in our application routing. This ensures clean separation between our application and PayloadCMS administrative interfaces.

## Technology Constraints

PayloadCMS version 3.5+ is the central data management system. All collections (Users, Projects, Sessions, Media) MUST be defined using PayloadCMS collection configurations. File uploads MUST use PayloadCMS upload functionality with proper media type classification and metadata tracking.

Next.js App Router is the routing system. All pages MUST be server components unless client interactivity is required. Our API routes MUST use `/api/v1/*` prefix and handle chat processing, file uploads, and AI service integration. PayloadCMS automatically manages `/admin/*` and `/api/*` routes.

Tailwind CSS version 4+ provides all styling. NO custom CSS files except for component-specific styles that cannot be achieved with Tailwind utilities. Responsive design is mandatory for all chat interface components.

## Development Standards

Test-Driven Development is MANDATORY for all chat interface components, PayloadCMS collections, and API endpoints. Tests MUST cover user scenarios defined in specifications before implementation begins.

TypeScript MUST be used for all code. Payload generates types automatically - use these generated types consistently. Custom types MUST extend or compose PayloadCMS generated types.

Error handling MUST be comprehensive, especially for AI service integration, file uploads, and real-time communication failures. Users MUST receive clear feedback when AI processing is unavailable or delayed.

Security is NON-NEGOTIABLE. All API endpoints MUST validate user authentication and authorization. File uploads MUST be scanned and validated. AI service communications MUST be secured with proper API key management.

## Governance

This constitution supersedes all other development practices and guidelines. Any deviation MUST be documented with explicit justification and approval process.

All code reviews MUST verify compliance with these principles. Pull requests that violate constitution principles will be rejected until corrected.

PayloadCMS data layer violations are AUTOMATIC rejections - no exceptions. Server-first architecture violations require specific justification for client-side necessity.

Routing structure violations using `/admin/*` or `/api/*` instead of `/api/v1/*` are AUTOMATIC rejections - no exceptions.

Version updates to PayloadCMS or Tailwind CSS MUST be tested against existing chat interface functionality and data layer operations.

**Version**: 1.1.0 | **Ratified**: 2025-01-25 | **Last Amended**: 2025-01-25