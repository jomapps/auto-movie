# AI Movie Platform 🎬

A comprehensive AI-powered movie production platform built with Next.js 15.4+, PayloadCMS 3.56+, and TypeScript 5.7+. Create, collaborate, and produce movies through intelligent AI assistance with real-time chat interfaces and advanced media processing.

## 🏛️ Constitutional Architecture

This platform follows strict constitutional principles for scalable, maintainable development:

- **PayloadCMS Data Layer Supremacy**: All data operations through PayloadCMS collections
- **Server-First Architecture**: Server components by default, client only when needed
- **Modern Stack Discipline**: Latest stable versions with TypeScript strictness
- **Real-Time First Design**: WebSocket-powered collaboration and communication
- **Test-Driven Development**: Comprehensive testing at all levels
- **Constitutional Compliance**: Verified through automated compliance testing

## ✨ Features

### 🎯 Core Features
- **AI-Powered Chat Interface**: Interactive movie development through conversation
- **Real-Time Collaboration**: Multi-user WebSocket-based collaboration
- **Advanced Media Processing**: AI analysis and semantic search of uploads
- **Workflow Management**: Automated progress tracking and step advancement
- **Choice-Driven Development**: AI-presented options with custom override capability

### 🛠️ Technical Features  
- **PayloadCMS 3.56+**: Headless CMS with automatic admin interface
- **Next.js 15.4+ App Router**: Modern React architecture with server components
- **TypeScript 5.7+**: Full type safety with strict mode enabled
- **Tailwind CSS 4+**: Utility-first styling with modern CSS features
- **Real-time WebSocket**: Live collaboration and instant updates
- **AI Service Integration**: Multiple AI providers with fallback support
- **Advanced Security**: JWT authentication, file validation, rate limiting
- **Performance Optimized**: <2s chat responses, <10s file processing

### 🎨 User Experience
- **Intuitive Dashboard**: Project management with visual progress tracking
- **Drag-and-Drop Uploads**: Seamless media integration with AI analysis
- **Responsive Design**: Mobile-optimized interface for all screen sizes
- **Accessibility First**: WCAG compliant with keyboard navigation support

## 🚀 Quick Start

### Local Development (Recommended)

**Develop locally while connecting to live production services:**

```bash
cd apps/auto-movie

# 1. Configure environment (edit .env.local with production credentials)
code .env.local

# 2. Run the startup script
./dev-local.sh          # Linux/Mac
.\dev-local.ps1         # Windows PowerShell

# Or manually:
pnpm install
pnpm generate:types
pnpm dev
```

📖 **Full Guide**: [docs/quick-start-local-dev.md](docs/quick-start-local-dev.md)
📖 **Detailed Setup**: [docs/local-development-setup.md](docs/local-development-setup.md)

### Standalone Development (All Services Local)

**Run everything locally (requires all services):**

### Prerequisites
- Node.js 18.20.2+
- MongoDB (local or cloud)
- pnpm (recommended) or npm

### Installation

1. **Clone and setup**:
```bash
git clone <repository-url>
cd auto-movie
cp .env.example .env.local
pnpm install
```

2. **Configure environment** (`.env.local`):
```bash
# Database
DATABASE_URI=mongodb://localhost:27017/auto-movie
PAYLOAD_SECRET=your-secret-key-here

# PayloadCMS
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3010

# AI Services (optional for development)
QWEN3VL_API_KEY=your-api-key
QWEN3VL_BASE_URL=https://api.qwen3vl.com/v1

# Authentication
NEXTAUTH_URL=http://localhost:3010
NEXTAUTH_SECRET=your-nextauth-secret
```

3. **Initialize UI components**:
```bash
npx shadcn@latest init
npx shadcn@latest add button card modal input
```

4. **Generate types and start**:
```bash
pnpm generate:types
pnpm dev
```

5. **Access the platform**:
- **Main App**: http://localhost:3010
- **Admin Panel**: http://localhost:3010/admin
- **API**: http://localhost:3010/api/v1

## 📚 Documentation

### API Reference
Complete API documentation available at [`docs/api-reference.md`](docs/api-reference.md)

**Base URL**: `/api/v1`
**Authentication**: Bearer JWT tokens

#### Quick API Examples:

**Send Chat Message**:
```bash
curl -X POST http://localhost:3010/api/v1/chat/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"projectId":"PROJECT_ID","sessionId":"SESSION_ID","message":"Create an action scene"}'
```

**Upload Media**:
```bash
curl -X POST http://localhost:3010/api/v1/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "projectId=PROJECT_ID" \
  -F "file=@image.jpg" \
  -F "mediaType=style_reference"
```

### User Guide

#### Creating Your First Project
1. Navigate to the dashboard
2. Click "Create New Project"
3. Fill in project details (title, genre, episode count)
4. Click "Start Chat" to begin AI-assisted development

#### Using the Chat Interface
- Type messages to interact with the AI assistant
- Select from AI-presented choices or use manual override
- Upload reference images, videos, or documents
- Track progress through the visual progress indicator

#### Collaboration
- Invite collaborators via email from project settings
- Real-time chat synchronization across all users
- See live typing indicators and user presence
- Collaborative choice selection with conflict resolution

## 🧪 Testing

### Test Structure
```
tests/
├── unit/                 # Unit tests for utilities and functions
├── contract/            # API contract testing  
├── integration/         # Integration test scenarios
├── e2e/                # End-to-end user workflows
├── performance/        # Performance and load testing
└── compliance/         # Constitutional compliance verification
```

### Running Tests
```bash
# All tests
pnpm test

# Specific test suites
pnpm test:unit           # Unit tests
pnpm test:contract      # API contract tests  
pnpm test:integration   # Integration tests
pnpm test:e2e           # End-to-end tests (requires running server)
pnpm test:performance   # Performance testing
pnpm test:compliance    # Constitutional compliance

# With coverage
pnpm test:coverage

# Watch mode for development
pnpm test:watch
```

### Performance Targets
- **Chat Response Time**: < 2 seconds
- **File Upload Processing**: < 10 seconds for images
- **WebSocket Connection**: < 500ms
- **Page Load Time**: < 1 second
- **Constitutional Compliance**: 100%

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Next.js 15.4+ with App Router, React 19.1+, TypeScript 5.7+
- **Backend**: PayloadCMS 3.56+ with MongoDB
- **Styling**: Tailwind CSS 4+ with ShadCN/UI components
- **Real-time**: WebSocket with Socket.io
- **Testing**: Vitest (unit), Playwright (E2E)
- **AI Services**: Modular provider system with fallbacks

### Project Structure
```
auto-movie/
├── app/                    # Next.js App Router
│   ├── api/v1/            # API routes (/api/v1/*)
│   ├── dashboard/         # Dashboard pages (/dashboard/*)
│   └── page.tsx           # Homepage
├── src/
│   ├── collections/       # PayloadCMS collections
│   ├── components/        # React components
│   │   ├── chat/         # Chat interface components
│   │   ├── ui/           # Reusable UI components
│   │   └── ...
│   ├── hooks/            # React hooks
│   ├── services/         # Service layer (AI, WebSocket)
│   ├── utils/            # Utility functions
│   └── middleware/       # API middleware
├── tests/                # Test suites
├── docs/                 # Documentation
└── payload.config.ts     # PayloadCMS configuration
```

### Data Model
- **Users**: Authentication and authorization
- **Projects**: Movie project containers  
- **Sessions**: Chat sessions with workflow state
- **Media**: Files with AI analysis and embeddings

Full data model documentation in [`specs/001-i-have-put/data-model.md`](specs/001-i-have-put/data-model.md)

## 🔧 Development

### Available Scripts
```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm typecheck        # TypeScript type checking
pnpm generate:types   # Generate PayloadCMS types
pnpm test             # Run all tests
```

### Development Workflow
1. **Feature Development**: Follow TDD approach with tests first
2. **PayloadCMS Integration**: Use data layer for all operations
3. **Component Development**: Server-first, client only when needed
4. **Testing**: Ensure all test suites pass before commits
5. **Constitutional Compliance**: Verify with compliance tests

### Code Style
- **TypeScript**: Strict mode enabled with comprehensive typing
- **ESLint**: Next.js recommended rules with custom additions
- **Prettier**: Consistent code formatting
- **Import Organization**: Automatic import sorting and grouping

## 🚀 Deployment

### Environment Setup
1. **Production Database**: Set up MongoDB cluster
2. **Media Storage**: Configure Cloudflare R2 for file storage  
3. **AI Services**: Set up API keys for AI providers
4. **Environment Variables**: Configure all required variables
5. **SSL/TLS**: Ensure HTTPS for WebSocket connections

### Build Process
```bash
# Install dependencies
pnpm install --prod

# Build application
pnpm build

# Start production server  
pnpm start
```

### Performance Monitoring
- Response time monitoring for chat endpoints
- File upload performance tracking
- WebSocket connection stability
- Error rate and availability metrics

## 🤝 Contributing

### Development Guidelines
1. **Constitutional Compliance**: All code must follow constitutional principles
2. **Test-Driven Development**: Write tests before implementation
3. **PayloadCMS Patterns**: Use collections for all data operations
4. **Type Safety**: Comprehensive TypeScript usage
5. **Performance First**: Meet established performance targets

### Pull Request Process
1. Fork the repository and create feature branch
2. Implement changes following TDD approach
3. Ensure all tests pass including compliance verification
4. Submit PR with detailed description
5. Address review feedback and merge

### Issue Reporting
- Use GitHub Issues for bug reports and feature requests
- Include reproduction steps and environment details
- Label appropriately (bug, feature, enhancement, etc.)

## 📈 Roadmap

### Phase 1: Foundation (Completed ✅)
- PayloadCMS integration with collections
- Next.js App Router implementation
- Real-time chat interface
- File upload and AI processing
- Authentication and authorization

### Phase 2: Enhancement (Current)
- Advanced AI model integration
- Enhanced collaboration features
- Performance optimizations  
- Mobile app development
- Third-party integrations

### Phase 3: Scale (Future)
- Enterprise features
- Advanced analytics
- Multi-tenant architecture
- International expansion
- Plugin ecosystem

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **PayloadCMS Team**: For the excellent headless CMS platform
- **Next.js Team**: For the modern React framework
- **Vercel**: For deployment and hosting solutions
- **OpenAI/Anthropic**: For AI service integrations
- **Contributors**: All contributors to this project

## 📞 Support

### Getting Help
- **Documentation**: Check docs/ directory for detailed guides
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Community discussions and questions
- **Wiki**: Additional documentation and examples

### Performance Issues
If experiencing performance issues:
1. Check system requirements (Node.js 18.20.2+, adequate RAM)
2. Verify database connection performance
3. Monitor AI service response times
4. Review network connectivity for WebSocket features

### Common Issues
- **PayloadCMS Types**: Run `pnpm generate:types` after collection changes
- **WebSocket Connection**: Verify NEXTAUTH_URL matches development URL  
- **File Uploads**: Check file permissions and size limits
- **Chat Responses**: Verify AI service API keys and endpoints

---

**Built with ❤️ using modern web technologies and constitutional architecture principles.**
