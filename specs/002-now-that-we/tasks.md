# Tasks: Projects Interface Management

**Input**: Design documents from `/specs/002-now-that-we/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.7+, Next.js 15.4+, React 19.1+, PayloadCMS 3.56+, Tailwind CSS 4+, React Hook Form, Zod
   → Structure: Web application (frontend integrated with backend via PayloadCMS)
   → Clarified requirements: Full-attribute sorting, inline errors, toast notifications, manual retry
2. Load optional design documents:
   → data-model.md: Project entity → PayloadCMS Local API integration
   → contracts/: projects-api.yaml → PayloadCMS server actions (not REST endpoints)
   → research.md: Clarified UI patterns, validation, error handling
3. Generate tasks by category:
   → Setup: dependencies (React Hook Form, Zod), toast system, validation schemas
   → Tests: PayloadCMS Local API tests, integration tests for clarified user scenarios
   → Core: form components with inline errors, server actions, toast notifications
   → Integration: PayloadCMS data layer, full-attribute filtering, manual error retry
   → Polish: accessibility, responsive design, clarified user feedback patterns
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All clarified requirements have implementation tasks? ✓
   → PayloadCMS Local API integration covered? ✓
   → Toast notification system included? ✓
9. Return: SUCCESS (tasks ready for execution with clarified requirements)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: Next.js App Router structure with `src/app/` and `src/components/`
- PayloadCMS collections in `src/collections/` (Projects collection already exists)
- Server actions in `src/actions/` 
- Toast system in `src/components/ui/` and `src/lib/`
- Test files in `tests/` directory

## Phase 3.1: Setup & Dependencies
- [x] T001 Install form validation dependencies: `pnpm add react-hook-form @hookform/resolvers zod react-hot-toast`
- [x] T002 [P] Configure Zod validation schemas with clarified requirements in src/lib/validations/project-schema.ts
- [x] T003 [P] Setup toast notification system in src/lib/toast.ts
- [x] T004 [P] Setup error handling utilities with manual retry patterns in src/lib/utils/error-handling.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T005 [P] PayloadCMS Local API test for project creation in tests/integration/project-creation.test.ts
- [x] T006 [P] PayloadCMS Local API test for project listing with full-attribute filtering in tests/integration/project-listing.test.ts
- [x] T007 [P] PayloadCMS Local API test for project details retrieval in tests/integration/project-details.test.ts
- [x] T008 [P] PayloadCMS Local API test for project updates in tests/integration/project-updates.test.ts
- [x] T009 [P] Integration test for inline form validation (blocked submission) in tests/integration/form-validation.test.ts
- [x] T010 [P] Integration test for toast notification display in tests/integration/toast-notifications.test.ts
- [x] T011 [P] Integration test for manual error retry behavior in tests/integration/error-retry.test.ts
- [x] T012 [P] Integration test for full-attribute sorting/filtering in tests/integration/sorting-filtering.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Server Actions and Data Layer
- [x] T013 [P] Create project server action with PayloadCMS Local API in src/actions/create-project.ts
- [x] T014 [P] Update project server action with PayloadCMS Local API in src/actions/update-project.ts
- [x] T015 [P] Get project by ID server action with PayloadCMS Local API in src/actions/get-project.ts
- [x] T016 [P] List projects server action with full-attribute filtering/sorting in src/actions/list-projects.ts

### Form Components with Clarified Requirements
- [x] T017 [P] ProjectForm component with React Hook Form + Zod + inline error display in src/components/forms/ProjectForm.tsx
- [x] T018 [P] Form field components with inline error support in src/components/forms/form-fields/
- [x] T019 [P] Form validation integration with submission blocking in ProjectForm component
- [x] T020 [P] Toast notification integration for form success/error feedback in ProjectForm component

### UI Components with Clarified Feedback
- [x] T021 [P] ProjectCard component for grid display in src/components/projects/ProjectCard.tsx
- [x] T022 [P] ProjectFilters component with full-attribute filtering (date, title, status, progress, genre) in src/components/projects/ProjectFilters.tsx
- [x] T023 [P] ProjectDetails component for detailed view in src/components/projects/ProjectDetails.tsx
- [x] T024 [P] EmptyState component for no projects in src/components/ui/EmptyState.tsx
- [x] T025 [P] Toast notification components in src/components/ui/Toast.tsx

### Page Components and Routing
- [x] T026 Projects listing page with full-attribute sorting/filtering at src/app/(frontend)/dashboard/projects/page.tsx
- [x] T027 Project creation page with inline validation at src/app/(frontend)/dashboard/projects/new/page.tsx  
- [x] T028 Project details page with manual error retry at src/app/(frontend)/dashboard/projects/[id]/page.tsx
- [x] T029 Project editing page with inline validation at src/app/(frontend)/dashboard/projects/[id]/edit/page.tsx

## Phase 3.4: Integration & Clarified Features
- [x] T030 PayloadCMS Local API integration with `getPayload({ config })` pattern in server actions
- [x] T031 Full-attribute server-side filtering/sorting implementation (date, title, status, progress, genre)
- [x] T032 Inline form error display with submission blocking implementation
- [x] T033 Manual error retry implementation for network failures
- [x] T034 Toast notification system integration across all project operations
- [x] T035 Temporary open-access permission enforcement (all logged-in users can edit)

## Phase 3.5: Polish & Accessibility
- [x] T036 [P] Unit tests for ProjectForm with inline validation in tests/unit/ProjectForm.test.tsx
- [x] T037 [P] Unit tests for server actions with PayloadCMS Local API in tests/unit/actions/
- [x] T038 [P] E2E tests for clarified user workflows (inline errors, toast feedback, manual retry) in tests/e2e/projects-workflow.spec.ts
- [x] T039 [P] Accessibility improvements for inline errors and toast notifications
- [x] T040 [P] Keyboard navigation support for filtering and form interactions
- [x] T041 [P] Responsive design validation for full-attribute filtering interface
- [x] T042 [P] Error boundary components for graceful degradation
- [x] T043 Validate implementation against updated quickstart scenarios
- [x] T044 Code review and refactoring for clarified requirements compliance

## Dependencies
- Setup (T001-T004) before tests (T005-T012)
- Tests (T005-T012) before implementation (T013-T035)
- Server actions (T013-T016) before form components (T017-T020)
- UI components (T021-T025) before pages (T026-T029)
- Core implementation before integration (T030-T035)
- Implementation before polish (T036-T044)

## Parallel Example
```
# Launch T005-T012 together (different test files):
Task: "PayloadCMS Local API test for project creation in tests/integration/project-creation.test.ts"
Task: "PayloadCMS Local API test for project listing with full-attribute filtering in tests/integration/project-listing.test.ts"
Task: "PayloadCMS Local API test for project details retrieval in tests/integration/project-details.test.ts"
Task: "PayloadCMS Local API test for project updates in tests/integration/project-updates.test.ts"
Task: "Integration test for inline form validation (blocked submission) in tests/integration/form-validation.test.ts"
Task: "Integration test for toast notification display in tests/integration/toast-notifications.test.ts"
Task: "Integration test for manual error retry behavior in tests/integration/error-retry.test.ts"
Task: "Integration test for full-attribute sorting/filtering in tests/integration/sorting-filtering.test.ts"

# Launch T013-T016 together (different server action files):
Task: "Create project server action with PayloadCMS Local API in src/actions/create-project.ts"
Task: "Update project server action with PayloadCMS Local API in src/actions/update-project.ts"
Task: "Get project by ID server action with PayloadCMS Local API in src/actions/get-project.ts"
Task: "List projects server action with full-attribute filtering/sorting in src/actions/list-projects.ts"

# Launch T017-T025 together (different component files):
Task: "ProjectForm component with React Hook Form + Zod + inline error display in src/components/forms/ProjectForm.tsx"
Task: "Form field components with inline error support in src/components/forms/form-fields/"
Task: "ProjectCard component for grid display in src/components/projects/ProjectCard.tsx"
Task: "ProjectFilters component with full-attribute filtering (date, title, status, progress, genre) in src/components/projects/ProjectFilters.tsx"
Task: "ProjectDetails component for detailed view in src/components/projects/ProjectDetails.tsx"
Task: "EmptyState component for no projects in src/components/ui/EmptyState.tsx"
Task: "Toast notification components in src/components/ui/Toast.tsx"
```

## Key Implementation Notes (Updated with Clarifications)
- **Full-Attribute Sorting**: Implement sorting by date (creation/update), title, status, progress percentage, and genre
- **Inline Form Validation**: Block form submission and display all validation errors inline simultaneously  
- **Toast Notifications**: Minimal visual feedback through success/error toast notifications only
- **Manual Error Retry**: Network failures require manual user retry (no auto-retry mechanisms)
- **Open Permissions**: All logged-in users can edit any project (temporary - note for future enhancement)
- **PayloadCMS Integration**: All data operations through `getPayload({ config })` Local API
- **Server-first**: Default to server components, client components only for forms and interactive filtering
- **Type safety**: Use PayloadCMS generated types from src/payload-types.ts

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All clarified requirements have corresponding implementation tasks
- [x] PayloadCMS Local API patterns used (no REST endpoints)
- [x] Full-attribute sorting/filtering tasks included
- [x] Inline form validation with blocked submission covered
- [x] Toast notification system implementation included
- [x] Manual error retry behavior implemented
- [x] Temporary open-access permissions noted
- [x] All tests come before implementation (TDD approach)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task

## Success Criteria (Updated)
✅ Complete CRUD operations for projects with PayloadCMS Local API
✅ Full-attribute sorting/filtering (date, title, status, progress percentage, genre)
✅ Inline form validation with blocked submission for invalid data
✅ Toast notification system for minimal user feedback
✅ Manual error retry mechanisms for network failures
✅ Temporary open-access permission model for all logged-in users
✅ Responsive, accessible user interface with clarified feedback patterns
✅ Project-centric URL structure with deep linking support
✅ Server-first architecture with selective client interactivity