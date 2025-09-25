# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test POST /api/v1/users in tests/contract/test_users_post.py
- [ ] T005 [P] Contract test GET /api/v1/users/{id} in tests/contract/test_users_get.py
- [ ] T006 [P] PayloadCMS collection configuration test in tests/contract/test_collections.py
- [ ] T007 [P] Integration test user registration via Payload Local API in tests/integration/test_registration.py
- [ ] T008 [P] Integration test auth flow with PayloadCMS in tests/integration/test_auth.py
- [ ] T009 [P] Generated types validation test in tests/contract/test_payload_types.py

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T010 [P] PayloadCMS collection configuration in src/collections/Users.ts
- [ ] T011 [P] PayloadCMS collection configuration in src/collections/[Entity].ts
- [ ] T012 [P] Generate Payload types via pnpm generate:types
- [ ] T013 POST /api/v1/users endpoint using Payload Local API
- [ ] T014 GET /api/v1/users/{id} endpoint using Payload Local API
- [ ] T015 Input validation using PayloadCMS field validation
- [ ] T016 Error handling with PayloadCMS access control

## Phase 3.4: Integration
- [ ] T017 Configure PayloadCMS database adapter (MongoDB)
- [ ] T018 Setup PayloadCMS authentication middleware
- [ ] T019 Request/response logging for Payload Local API calls
- [ ] T020 CORS and security headers via Next.js configuration

## Phase 3.5: Polish
- [ ] T021 [P] Unit tests for PayloadCMS collection validation in tests/unit/test_collections.py
- [ ] T022 Performance tests for Payload Local API calls (<200ms)
- [ ] T023 [P] Update docs/api.md with PayloadCMS endpoints
- [ ] T024 [P] Verify generated types are current via pnpm generate:types
- [ ] T025 Remove duplication and validate PayloadCMS patterns
- [ ] T026 Run manual-testing.md with Payload admin panel verification

## Dependencies
- Tests (T004-T009) before implementation (T010-T016)
- T010-T011 (collections) block T012 (generate types)
- T012 (generate types) blocks T013-T016 (API endpoints)
- T017-T018 (PayloadCMS setup) blocks T019-T020 (integration)
- Implementation before polish (T021-T026)

## Parallel Example
```
# Launch T004-T009 together:
Task: "Contract test POST /api/v1/users in tests/contract/test_users_post.py"
Task: "Contract test GET /api/v1/users/{id} in tests/contract/test_users_get.py"
Task: "PayloadCMS collection configuration test in tests/contract/test_collections.py"
Task: "Integration test registration via Payload Local API in tests/integration/test_registration.py"
Task: "Integration test auth with PayloadCMS in tests/integration/test_auth.py"
Task: "Generated types validation test in tests/contract/test_payload_types.py"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → PayloadCMS Local API implementation task
   
2. **From Data Model**:
   - Each entity → PayloadCMS collection configuration task [P]
   - Generate types task after all collections defined
   - Relationships → collection relationship configuration
   
3. **From User Stories**:
   - Each story → integration test using PayloadCMS Local API [P]
   - Quickstart scenarios → Payload admin panel validation tasks

4. **PayloadCMS-Specific Rules**:
   - Collection configurations before type generation
   - Type generation before API endpoint implementation
   - Access control tests for each collection
   - Upload configurations for media entities

5. **Ordering**:
   - Setup → Tests → Collections → Generate Types → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [ ] All contracts have corresponding PayloadCMS Local API tests
- [ ] All entities have PayloadCMS collection configuration tasks
- [ ] Type generation task included after collection tasks
- [ ] All API endpoints use /api/v1/* prefix
- [ ] All tests come before implementation
- [ ] Access control tests for each collection
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task