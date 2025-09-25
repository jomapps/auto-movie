
# Implementation Plan: AI Movie Platform Core with PayloadCMS and Chat Interface

**Branch**: `001-i-have-put` | **Date**: 2025-09-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `D:\Projects\auto-movie\specs\001-i-have-put\spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

**Primary Requirement**: AI-powered movie production platform with real-time chat interface, guiding users through structured workflow phases (story development, character creation, visual design, production) with file upload capabilities and collaborative features.

**Technical Approach**: Next.js 15.4+ App Router with PayloadCMS 3.56+ backend, ShadCN/UI + KokonutUI component system, WebSocket real-time communication, and Cloudflare R2 media storage. Server-first architecture with selective client components for interactivity, following constitutional requirements for PayloadCMS data layer supremacy and modern stack discipline.

## Technical Context
**Language/Version**: TypeScript 5.7+, Node.js 18.20.2+  
**Primary Dependencies**: PayloadCMS 3.56+, Next.js 15.4+, React 19.1+, MongoDB, Tailwind CSS 4+, ShadCN/UI, KokonutUI  
**Storage**: MongoDB (via PayloadCMS), Cloudflare R2 (media storage)  
**Testing**: Vitest (unit/integration), Playwright (E2E)  
**Target Platform**: Web application (Next.js)
**Project Type**: web - Next.js App Router with frontend+backend integration  
**Performance Goals**: Chat response <2s, file upload <10s for images, WebSocket real-time updates  
**Constraints**: Server-first architecture, PayloadCMS data layer only, constitutional compliance  
**Scale/Scope**: Multi-user AI movie production platform with chat interface, file uploads, and real-time collaboration
**UI Framework**: ShadCN/UI with KokonutUI components, Tailwind CSS 4+, Lucide icons
**User Context**: ShadCN/UI guidelines provided for component architecture and installation patterns

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**PayloadCMS Data Layer Compliance**:
- [x] No direct database access - all data operations through PayloadCMS Local API
- [x] Collection slugs follow kebab-case naming convention (users, projects, sessions, media)
- [x] Uses Payload generated types from src/payload-types.ts exclusively

**Routing Structure Compliance**:
- [x] Application routes use `/` and `/dashboard/*` only
- [x] API routes use `/api/v1/*` prefix exclusively
- [x] No usage of reserved `/admin/*` or `/api/*` paths

**Collection Architecture Compliance**:
- [x] Collections use CollectionConfig TypeScript interfaces (already implemented)
- [x] Proper access control functions implemented
- [x] Admin components configured via file paths not direct imports
- [x] Storage adapters properly configured for uploads (Cloudflare R2)

**Technology Stack Compliance**:
- [x] PayloadCMS 3.56+ patterns used exclusively
- [x] Next.js server components by default, client only when necessary (ShadCN/UI components)
- [x] Tailwind CSS 4+ for all styling with ShadCN/UI integration

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Next.js App Router structure - web application with integrated frontend/backend

```
# Next.js App Router Structure (SELECTED)
app/
├── page.tsx                 # Homepage
├── dashboard/              
│   ├── layout.tsx          # Dashboard layout
│   ├── projects/
│   │   ├── page.tsx       # Project list
│   │   └── [id]/
│   │       ├── page.tsx   # Project detail
│   │       └── chat/
│   │           └── page.tsx # Chat interface
│   └── api/v1/            # API routes
│       ├── chat/          # Chat endpoints
│       ├── projects/      # Project endpoints  
│       └── media/         # Media endpoints

src/
├── collections/           # PayloadCMS collections
├── components/           
│   ├── ui/               # ShadCN/UI base components
│   ├── kokonutui/        # KokonutUI components
│   └── chat/             # Chat-specific components
├── hooks/                # React hooks
├── services/             # API clients
├── utils/                # Utilities
└── payload-types.ts      # Generated types

components.json           # ShadCN/UI configuration
```

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach  
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P] (already some implemented)
- Each entity → PayloadCMS collection verification
- Each user story → integration test task  
- ShadCN/UI component installation and configuration tasks
- KokonutUI integration tasks for advanced components
- WebSocket implementation tasks for real-time features
- Dashboard page creation tasks following Next.js App Router patterns

**UI Component Strategy**:
- Setup ShadCN/UI base components (button, card, modal, input)
- Configure KokonutUI registry and install particle buttons for enhanced UX
- Create chat interface components using component library patterns
- Implement drag-and-drop file upload with visual feedback
- Build progress indicators and loading states

**Ordering Strategy**:
- TDD order: Tests before implementation
- Infrastructure: ShadCN/UI setup → Component creation → Page assembly
- Dependency order: Collections (done) → API routes → Components → Pages
- Mark [P] for parallel execution (independent files)
- WebSocket implementation before real-time components

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md including UI component setup

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - ShadCN/UI + KokonutUI integration documented
- [x] Phase 1: Design complete (/plan command) - Data model, contracts, quickstart ready
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS - ShadCN/UI integration aligns with Tailwind CSS 4+ requirement
- [x] All NEEDS CLARIFICATION resolved - UI framework decisions documented in research.md
- [x] Complexity deviations documented - No violations found

---
*Based on Constitution v1.2.0 - See `/memory/constitution.md`*
