# Quickstart Guide: AI Movie Platform

**Target**: Developers setting up the AI Movie Platform for development  
**Time**: 15-20 minutes  
**Prerequisites**: Node.js 18.20.2+, MongoDB, Git

## Quick Setup

### 1. Environment Setup (3 minutes)

```bash
# Clone and setup
cd auto-movie
cp .env.example .env.local

# Install dependencies
pnpm install
```

**Configure .env.local**:
```bash
# Database
DATABASE_URI=mongodb://localhost:27017/auto-movie
PAYLOAD_SECRET=your-secret-key-here

# PayloadCMS
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3010

# AI Services (optional for basic testing)
QWEN3VL_API_KEY=your-api-key
QWEN3VL_BASE_URL=https://api.qwen3vl.com/v1

# WebSocket
NEXTAUTH_URL=http://localhost:3010
NEXTAUTH_SECRET=your-nextauth-secret
```

### 2. UI Components Setup (3 minutes)

```bash
# Initialize ShadCN/UI configuration
npx shadcn@latest init

# Create components.json with KokonutUI registry
echo '{
  "registries": {
    "@kokonutui": "https://kokonutui.com/r/{name}.json"
  }
}' >> components.json

# Install base UI components
npx shadcn@latest add button card modal input
```

### 3. Database & Types (2 minutes)

```bash
# Generate PayloadCMS types
pnpm generate:types

# Start development server
pnpm dev
```

### 4. Initial Setup (5 minutes)

**Access admin interface**: http://localhost:3010/admin

1. Create your first admin user
2. Navigate to Collections to verify:
   - Users ✓
   - Projects ✓ 
   - Sessions ✓
   - Media ✓

### 5. Test Core Functionality (10 minutes)

#### Create Test Project
1. Go to Projects collection
2. Click "Create New"
3. Fill required fields:
   - Title: "Test Movie Project"
   - Genre: "Action"
   - Episode Count: 5

#### Test Chat Interface
```bash
# Visit project chat interface
http://localhost:3010/dashboard/projects/[project-id]/chat
```

**Verify Features**:
- [ ] Chat interface loads
- [ ] Message input accepts text
- [ ] File upload area visible
- [ ] Progress indicator shows
- [ ] WebSocket connection status

#### Test File Upload
1. Drag an image to upload area
2. Verify file appears in Media collection
3. Check file is linked to project

#### Test API Endpoints
```bash
# Test project listing
curl http://localhost:3010/api/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test session creation
curl -X POST http://localhost:3010/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"projectId":"PROJECT_ID","message":"Hello"}'
```

## Validation Tests

### Core User Scenarios

#### Scenario 1: New User Project Creation
```javascript
// Integration test template
describe('Project Creation Flow', () => {
  it('should create project and start chat session', async () => {
    // 1. User creates account
    // 2. User creates first project  
    // 3. User accesses chat interface
    // 4. System presents initial choices
    // Expected: Project created, session active, choices presented
  });
});
```

#### Scenario 2: File Upload with AI Processing
```javascript
describe('File Upload Flow', () => {
  it('should upload file and incorporate into AI suggestions', async () => {
    // 1. User uploads reference image
    // 2. System processes and stores file
    // 3. User sends chat message
    // 4. AI incorporates uploaded reference
    // Expected: File stored, AI mentions reference in response
  });
});
```

#### Scenario 3: Choice Selection and Progress
```javascript
describe('Workflow Progression', () => {
  it('should advance workflow step when choice selected', async () => {
    // 1. AI presents multiple choices
    // 2. User selects recommended option
    // 3. System advances to next step
    // 4. Progress percentage updates
    // Expected: Step advanced, progress increased, new choices presented
  });
});
```

#### Scenario 4: Manual Override
```javascript
describe('Manual Override Flow', () => {
  it('should allow custom instructions via manual override', async () => {
    // 1. AI presents choices
    // 2. User selects manual override
    // 3. User provides custom instructions
    // 4. System incorporates custom input
    // Expected: Custom instructions processed, workflow continues
  });
});
```

#### Scenario 5: Session Persistence
```javascript
describe('Session Continuity', () => {
  it('should resume from last step when user returns', async () => {
    // 1. User starts chat session
    // 2. User progresses through several steps
    // 3. User closes browser/disconnects
    // 4. User returns to project
    // Expected: Session restored, conversation history preserved, correct step
  });
});
```

## Performance Validation

### Response Time Targets
- Chat message response: < 2 seconds
- File upload processing: < 10 seconds for images
- Page load time: < 1 second
- WebSocket connection: < 500ms

### Load Testing
```bash
# Test chat endpoint load
npx autocannon http://localhost:3010/api/chat/message \
  -c 10 -d 30 -H "Authorization: Bearer TOKEN"

# Test WebSocket connections
# (Use custom WebSocket load testing tool)
```

## Common Issues & Solutions

### PayloadCMS Admin Not Loading
**Problem**: Admin interface shows error  
**Solution**: Check DATABASE_URI and ensure MongoDB is running

### Chat Interface Not Connecting
**Problem**: WebSocket connection fails  
**Solution**: Verify NEXTAUTH_URL matches your development URL

### File Uploads Failing
**Problem**: Media uploads return 500 error  
**Solution**: Check file permissions and R2 configuration

### Type Errors in IDE
**Problem**: TypeScript errors for PayloadCMS types  
**Solution**: Run `pnpm generate:types` after collection changes

### AI Processing Timeout
**Problem**: Chat messages never receive AI responses  
**Solution**: Verify AI service API keys and endpoint URLs

## Constitutional Compliance Checklist

- [ ] All data access through PayloadCMS collections
- [ ] Server-side components used by default
- [ ] Client components only for interactive features
- [ ] PayloadCMS 3.5+ patterns implemented
- [ ] Tailwind CSS 4+ used for styling
- [ ] No new configuration files created
- [ ] WebSocket used for real-time features
- [ ] Comprehensive error handling implemented
- [ ] TypeScript used throughout
- [ ] Tests written before implementation

## Next Steps

### Development Workflow
1. Run tests before making changes: `pnpm test`
2. Follow TDD approach for new features
3. Use PayloadCMS data layer for all operations
4. Maintain constitutional compliance
5. Test WebSocket functionality regularly

### Feature Development
1. Define new requirements in specification
2. Update data model if needed
3. Create API contracts for new endpoints
4. Implement tests first
5. Build features following constitution
6. Validate with integration tests

### Deployment Preparation
1. Set up production MongoDB instance
2. Configure Cloudflare R2 for media storage
3. Set up AI service API keys
4. Configure environment variables
5. Run full test suite
6. Performance test with realistic data

This quickstart gets you running with the core AI Movie Platform functionality while ensuring constitutional compliance and proper testing validation.