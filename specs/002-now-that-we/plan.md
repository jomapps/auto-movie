
# Implementation Plan: Projects Interface Management

**Branch**: `002-now-that-we` | **Date**: 2025-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-now-that-we/spec.md`

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
Implement complete Projects interface management system with CRUD operations and clarified requirements: comprehensive sorting/filtering by all project attributes, temporary open-access permission model for all logged-in users, inline form validation with blocked submission, minimal toast notifications for feedback, and manual retry for network failures. Uses Next.js App Router with project-centric URL structure for seamless navigation while maintaining PayloadCMS data layer integration.

## Technical Context
**Language/Version**: TypeScript 5.7+, Node.js 18.20.2+  
**Primary Dependencies**: Next.js 15.4+, React 19.1+, PayloadCMS 3.56+, Tailwind CSS 4+, React Hook Form, Zod  
**Storage**: MongoDB (via PayloadCMS), Cloudflare R2 (media storage)  
**Testing**: Jest/Vitest, React Testing Library, Playwright E2E  
**Target Platform**: Web application (responsive design)
**Project Type**: web - frontend integrated with backend via PayloadCMS  
**Performance Goals**: <200ms page loads, toast notifications for user feedback, responsive form interactions  
**Constraints**: PayloadCMS data layer only, server-first architecture, /dashboard/* routing structure, temporary open permissions  
**Scale/Scope**: Multi-user project management with full-attribute sorting/filtering, inline validation errors, manual error retry

**Clarified Requirements from Session 2025-09-26**:
- Sorting/filtering by date, title, status, progress percentage, and genre
- All logged-in users can edit any project (temporary permission model)
- Form validation blocks submission with all inline errors displayed
- Minimal visual feedback through toast notifications only
- Network failures require manual user retry

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**PayloadCMS Data Layer Compliance**:
- [x] No direct database access - all data operations through PayloadCMS Local API
- [x] Collection slugs follow kebab-case naming convention (existing 'projects' collection)
- [x] Uses Payload generated types from src/payload-types.ts exclusively

**Routing Structure Compliance**:
- [x] Application routes use `/` and `/dashboard/*` only (project routes: `/dashboard/projects/*`)
- [x] API routes use `/api/v1/*` prefix exclusively (not needed - using server actions)
- [x] No usage of reserved `/admin/*` or `/api/*` paths

**Collection Architecture Compliance**:
- [x] Collections use CollectionConfig TypeScript interfaces (Projects collection exists)
- [x] Proper access control functions implemented (temporary open access for logged-in users)
- [x] Admin components configured via file paths not direct imports
- [x] Storage adapters properly configured for uploads (media collection exists)

**Technology Stack Compliance**:
- [x] PayloadCMS 3.56+ patterns used exclusively
- [x] Next.js server components by default, client only when necessary (forms need client interaction)
- [x] Tailwind CSS 4+ for all styling

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

**Structure Decision**: Option 2 (Web application) - Next.js frontend with PayloadCMS backend integration

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

**Output**: research.md with all NEEDS CLARIFICATION resolved ✅ COMPLETED

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

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file ✅ COMPLETED

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

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
- [x] Phase 0: Research complete (/plan command) - Updated with clarifications
- [x] Phase 1: Design complete (/plan command) - All artifacts exist and updated
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - Requires regeneration with clarified requirements
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved - Clarification session completed
- [x] Complexity deviations documented - No violations found

---
*Based on Constitution v1.3.0 - See `/memory/constitution.md`*
