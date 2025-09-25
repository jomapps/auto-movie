# Tasks: AI Movie Platform Core with PayloadCMS and Chat Interface

**Input**: Design documents from `/specs/001-i-have-put/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript 5.7+, PayloadCMS 3.56+, Next.js 15.4+, React 19.1+
   → Structure: Next.js App Router with `/api/v1/*` routing, `/dashboard/*` pages
2. Load design documents ✓
   → data-model.md: 4 entities (Users, Projects, Sessions, Media)
   → contracts/: 4 API contracts (chat, projects, media, websocket) with v1 routing
   → quickstart.md: 5 integration test scenarios with dashboard routing
3. Generate tasks by category ✓
   → Setup: PayloadCMS config, dependencies, environment
   → Tests: Contract tests, integration tests (TDD)
   → Core: Collections, API routes, components
   → Integration: WebSocket, file upload, AI services
   → Polish: E2E tests, performance validation
4. Apply task rules ✓
   → Different files = [P] for parallel execution
   → Constitutional compliance: `/api/v1/*` routing, `/dashboard/*` pages
   → Tests before implementation (TDD)
5. Tasks numbered T001-T067 ✓
6. Constitutional compliance verified ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **Next.js App Router**: `app/dashboard/*` for pages, `app/api/v1/*` for API routes
- **PayloadCMS**: Collections in `src/collections/`, config in `payload.config.ts`

## Phase 3.1: Setup & Configuration

- [x] T001 Initialize PayloadCMS 3.56+ with Next.js 15.4+ and TypeScript configuration
- [x] T002 Configure MongoDB adapter and environment variables in `.env.local`
- [x] T003 [P] Setup Tailwind CSS 4+ configuration and build system
- [x] T004 [P] Configure Vitest for unit/integration testing
- [x] T005 [P] Configure Playwright for E2E testing
- [x] T006 [P] Setup ESLint and Prettier with Next.js rules

## Phase 3.2: Contract Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests [P]
- [x] T007 [P] Contract test POST /api/v1/chat/message in `tests/contract/chat-message.test.ts`
- [x] T008 [P] Contract test POST /api/v1/chat/choice in `tests/contract/chat-choice.test.ts`
- [x] T009 [P] Contract test POST /api/v1/chat/upload in `tests/contract/chat-upload.test.ts`
- [x] T010 [P] Contract test GET /api/v1/chat/sessions in `tests/contract/chat-sessions.test.ts`
- [x] T011 [P] Contract test GET /api/v1/projects in `tests/contract/projects-list.test.ts`
- [x] T012 [P] Contract test POST /api/v1/projects in `tests/contract/projects-create.test.ts`
- [x] T013 [P] Contract test GET /api/v1/projects/{id} in `tests/contract/projects-get.test.ts`
- [x] T014 [P] Contract test POST /api/v1/media/upload in `tests/contract/media-upload.test.ts`
- [x] T015 [P] Contract test GET /api/v1/media in `tests/contract/media-list.test.ts`
- [x] T016 [P] Contract test WebSocket /api/v1/websocket events in `tests/contract/websocket-chat.test.ts`

### Integration Test Scenarios [P]
- [x] T017 [P] Integration test: New user project creation flow in `tests/integration/project-creation.test.ts`
- [x] T018 [P] Integration test: File upload with AI processing in `tests/integration/file-upload-ai.test.ts`
- [x] T019 [P] Integration test: Choice selection and workflow progression in `tests/integration/workflow-progression.test.ts`
- [x] T020 [P] Integration test: Manual override functionality in `tests/integration/manual-override.test.ts`
- [x] T021 [P] Integration test: Session persistence and restoration in `tests/integration/session-persistence.test.ts`

## Phase 3.3: PayloadCMS Collections (ONLY after tests are failing)

### Data Model Implementation [P]
- [x] T022 [P] Users collection configuration in `src/collections/Users.ts`
- [x] T023 [P] Projects collection configuration in `src/collections/Projects.ts`
- [x] T024 [P] Sessions collection configuration in `src/collections/Sessions.ts`
- [x] T025 [P] Media collection configuration in `src/collections/Media.ts`
- [x] T026 Collection index and PayloadCMS config in `src/collections/index.ts` and `payload.config.ts`

## Phase 3.4: API Routes Implementation

### Chat API Endpoints (v1 routing)
- [x] T027 POST /api/v1/chat/message endpoint in `app/api/v1/chat/message/route.ts`
- [x] T028 POST /api/v1/chat/choice endpoint in `app/api/v1/chat/choice/route.ts`
- [x] T029 POST /api/v1/chat/upload endpoint in `app/api/v1/chat/upload/route.ts`
- [x] T030 GET /api/v1/chat/session/[id] endpoint in `app/api/v1/chat/session/[id]/route.ts`
- [x] T031 GET /api/v1/chat/sessions endpoint in `app/api/v1/chat/sessions/route.ts`

### Projects API Endpoints (v1 routing)
- [x] T032 GET /api/v1/projects endpoint in `app/api/v1/projects/route.ts`
- [x] T033 POST /api/v1/projects endpoint in `app/api/v1/projects/route.ts`
- [x] T034 GET /api/v1/projects/[id] endpoint in `app/api/v1/projects/[id]/route.ts`
- [x] T035 PUT /api/v1/projects/[id] endpoint in `app/api/v1/projects/[id]/route.ts`
- [x] T036 POST /api/v1/projects/[id]/collaborators endpoint in `app/api/v1/projects/[id]/collaborators/route.ts`

### Media API Endpoints (v1 routing)
- [x] T037 POST /api/v1/media/upload endpoint in `app/api/v1/media/upload/route.ts`
- [x] T038 GET /api/v1/media endpoint in `app/api/v1/media/route.ts`
- [x] T039 GET /api/v1/media/[id] endpoint in `app/api/v1/media/[id]/route.ts`
- [x] T040 POST /api/v1/media/search endpoint in `app/api/v1/media/search/route.ts`

## Phase 3.5: Real-Time Communication

- [x] T041 WebSocket server implementation in `app/api/v1/websocket/route.ts`
- [x] T042 WebSocket client service in `src/services/websocket.ts`

## Phase 3.6: Dashboard Pages (Server Components)

### User-Facing Pages [P]
- [x] T043 [P] Homepage landing page in `app/page.tsx`
- [x] T044 [P] Dashboard layout in `app/dashboard/layout.tsx`
- [x] T045 [P] Project list page in `app/dashboard/projects/page.tsx`
- [x] T046 [P] Project detail page in `app/dashboard/projects/[id]/page.tsx`
- [x] T047 [P] Chat interface page in `app/dashboard/projects/[id]/chat/page.tsx`

## Phase 3.7: Chat Interface Components

### Client Components [P]
- [x] T048 [P] ChatInterface component in `src/components/chat/ChatInterface.tsx`
- [x] T049 [P] MessageList component in `src/components/chat/MessageList.tsx`
- [x] T050 [P] InputArea component in `src/components/chat/InputArea.tsx`
- [x] T051 [P] ChoiceSelector component in `src/components/chat/ChoiceSelector.tsx`
- [x] T052 [P] FileUpload component in `src/components/chat/FileUpload.tsx`
- [x] T053 [P] ProgressIndicator component in `src/components/chat/ProgressIndicator.tsx`

### UI Components [P]
- [ ] T054 [P] Button component in `src/components/ui/Button.tsx`
- [ ] T055 [P] Card component in `src/components/ui/Card.tsx`
- [ ] T056 [P] Modal component in `src/components/ui/Modal.tsx`
- [ ] T057 [P] Loading component in `src/components/ui/Loading.tsx`

## Phase 3.8: Services & Utilities

### Service Layer [P]
- [x] T058 [P] AI LLM service client in `src/services/novelLLM.ts`
- [x] T059 [P] Task service client in `src/services/taskService.ts`
- [x] T060 [P] Chat hook implementation in `src/hooks/useChat.ts`
- [x] T061 [P] WebSocket hook implementation in `src/hooks/useWebSocket.ts`

### Utility Functions [P]
- [x] T062 [P] LLM prompt templates in `src/utils/prompts.ts`
- [x] T063 [P] Input validators in `src/utils/validators.ts`
- [x] T064 [P] Response formatters in `src/utils/formatters.ts`
- [x] T065 [P] PayloadCMS utility functions in `src/utils/getPayload.ts`

## Phase 3.9: Integration & Security

- [x] T066 Authentication middleware for /api/v1/* routes
- [x] T067 File upload security and validation
- [x] T068 Rate limiting for chat endpoints
- [x] T069 Error handling and logging system
- [x] T070 PayloadCMS hooks for progress tracking
- [x] T071 AI service error handling and fallbacks
- [x] T072 Subscription limit validation middleware

## Phase 3.10: Polish & Validation

### E2E Testing [P]
- [ ] T073 [P] E2E test: Complete movie project workflow in `tests/e2e/movie-workflow.spec.ts`
- [ ] T074 [P] E2E test: Multi-user collaboration in `tests/e2e/collaboration.spec.ts`
- [ ] T075 [P] E2E test: File upload and processing in `tests/e2e/file-processing.spec.ts`
- [ ] T076 [P] E2E test: Dashboard navigation flow in `tests/e2e/dashboard-navigation.spec.ts`

### Performance & Validation
- [ ] T077 Performance test: Chat response times (<2s target)
- [ ] T078 Performance test: File upload handling (<10s for images)
- [ ] T079 Performance test: WebSocket connection load testing
- [ ] T080 [P] Unit tests for utility functions in `tests/unit/utils.test.ts`
- [ ] T081 [P] Unit tests for validation functions in `tests/unit/validators.test.ts`
- [ ] T082 Constitutional compliance verification checklist
- [ ] T083 Documentation updates and API reference

## Dependencies

### Critical Paths
- **Setup (T001-T006)** → **Tests (T007-T021)** → **Implementation (T022+)**
- **Collections (T022-T026)** → **API Routes (T027-T040)** → **Components (T048-T057)**
- **WebSocket (T041-T042)** → **Chat Components (T048-T053)**
- **Services (T058-T061)** → **Integration (T066-T072)**

### Specific Dependencies
- T026 blocks T027-T040 (collections before API routes)
- T041-T042 blocks T048-T053 (WebSocket before chat components)
- T022-T025 blocks T058-T061 (collections before services)
- T066-T072 blocks T073-T076 (integration before E2E tests)

## Parallel Execution Examples

### Phase 3.2: All Contract Tests Together
```bash
# Launch T007-T016 in parallel (different test files):
Task: "Contract test POST /api/v1/chat/message in tests/contract/chat-message.test.ts"
Task: "Contract test POST /api/v1/chat/choice in tests/contract/chat-choice.test.ts"
Task: "Contract test POST /api/v1/chat/upload in tests/contract/chat-upload.test.ts"
Task: "Contract test GET /api/v1/projects in tests/contract/projects-list.test.ts"
Task: "Contract test POST /api/v1/projects in tests/contract/projects-create.test.ts"
Task: "Contract test GET /api/v1/projects/{id} in tests/contract/projects-get.test.ts"
Task: "Contract test POST /api/v1/media/upload in tests/contract/media-upload.test.ts"
Task: "Contract test GET /api/v1/media in tests/contract/media-list.test.ts"
Task: "Contract test WebSocket /api/v1/websocket events in tests/contract/websocket-chat.test.ts"
```

### Phase 3.3: All Collections Together  
```bash
# Launch T022-T025 in parallel (independent collections):
Task: "Users collection configuration in src/collections/Users.ts"
Task: "Projects collection configuration in src/collections/Projects.ts"
Task: "Sessions collection configuration in src/collections/Sessions.ts"
Task: "Media collection configuration in src/collections/Media.ts"
```

### Phase 3.6: All Dashboard Pages Together
```bash
# Launch T043-T047 in parallel (independent pages):
Task: "Homepage landing page in app/page.tsx"
Task: "Dashboard layout in app/dashboard/layout.tsx"
Task: "Project list page in app/dashboard/projects/page.tsx"
Task: "Project detail page in app/dashboard/projects/[id]/page.tsx"
Task: "Chat interface page in app/dashboard/projects/[id]/chat/page.tsx"
```

### Phase 3.7: All Chat Components Together
```bash
# Launch T048-T053 in parallel (independent React components):
Task: "ChatInterface component in src/components/chat/ChatInterface.tsx"
Task: "MessageList component in src/components/chat/MessageList.tsx"
Task: "InputArea component in src/components/chat/InputArea.tsx"
Task: "ChoiceSelector component in src/components/chat/ChoiceSelector.tsx"
Task: "FileUpload component in src/components/chat/FileUpload.tsx"
Task: "ProgressIndicator component in src/components/chat/ProgressIndicator.tsx"
```

## Constitutional Compliance Verification

### Required Checks Per Task
- **PayloadCMS Data Layer**: All data access through collections (T022-T026, T027-T040)
- **Server-First Architecture**: Server components by default (T043-T047), client only when needed (T048-T053)
- **Modern Stack Discipline**: PayloadCMS 3.56+, Tailwind CSS 4+ (T001, T003)
- **Configuration Immutability**: No new config files, modify existing only (T001-T006)
- **Real-Time First Design**: WebSocket for all real-time features (T041-T042, T048-T053)
- **Routing Structure Isolation**: `/api/v1/*` for API routes (T027-T041), `/dashboard/*` for pages (T043-T047)

## Validation Checklist
*GATE: All must pass before task execution begins*

- [x] All contracts have corresponding tests (T007-T016)
- [x] All entities have collection tasks (T022-T025)
- [x] All tests come before implementation (Phase 3.2 → 3.3+)
- [x] Parallel tasks truly independent (different files/collections)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Constitutional principles enforced throughout
- [x] TDD approach maintained (tests first, implementation second)
- [x] Routing structure isolation compliance (/api/v1/*, /dashboard/*)

## Notes
- **[P] tasks** = Different files, no dependencies, can run in parallel
- **Verify tests FAIL** before implementing (T007-T021 must fail initially)
- **Constitutional compliance** required for every task
- **PayloadCMS patterns** must follow 3.56+ conventions
- **API routing** must use `/api/v1/*` prefix (Constitution v1.1.0)
- **Page routing** must use `/dashboard/*` for user pages
- **File paths** are absolute and specific to Next.js App Router structure
- **Commit after each task** for progress tracking