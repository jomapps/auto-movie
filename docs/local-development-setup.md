# Local Development Setup Guide

## Overview

This guide explains how to set up the **auto-movie** app for local development while connecting to all live production services. This approach allows you to:

- Develop and test changes locally without affecting production
- Use live production data and services (brain, tasks, agents)
- Iterate quickly with hot-reload during development
- Debug issues in a production-like environment

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Auto-Movie App (localhost:3010)                   │     │
│  │  - Next.js Dev Server                              │     │
│  │  - Hot Reload Enabled                              │     │
│  │  - Local Code Changes                              │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Connects to ↓
                            │
┌─────────────────────────────────────────────────────────────┐
│                  LIVE PRODUCTION SERVICES                    │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Brain Service    │  │ Task Service     │                │
│  │ brain.ft.tc      │  │ tasks.ft.tc      │                │
│  │ (Port 8002)      │  │ (Port 8001)      │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Agents Service   │  │ MongoDB          │                │
│  │ agents.ft.tc     │  │ Production DB    │                │
│  │ (Port 8003)      │  │                  │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Cloudflare R2    │  │ Neo4j            │                │
│  │ Media Storage    │  │ Graph Database   │                │
│  │ media.ft.tc      │  │ neo4j.ft.tc      │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Software
- **Node.js**: 18.20.2+ or 20.9.0+
- **pnpm**: 9+ or 10+ (recommended package manager)
- **Git**: For version control

### Required Access
- Production MongoDB connection string
- Cloudflare R2 credentials
- API keys for AI services (OpenRouter, Fal.ai, ElevenLabs, Jina)
- Service API keys (Brain, Task, Agents services)
- Network access to production services

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd apps/auto-movie
pnpm install
```

### 2. Configure Environment Variables

The `.env.local` file has been created with placeholders. You need to fill in the actual values:

```bash
# Open the file in your editor
code .env.local  # or vim, nano, etc.
```

#### Required Configuration Items

**Database Connection:**
```bash
DATABASE_URI=mongodb+srv://username:password@cluster.mongodb.net/auto-movie
```
- Get this from your MongoDB Atlas dashboard or production server
- Ensure your IP is whitelisted in MongoDB Atlas

**PayloadCMS Secrets:**
```bash
PAYLOAD_SECRET=<generate-secure-random-string>
NEXTAUTH_SECRET=<generate-secure-random-string>
```
Generate secure secrets:
```bash
# Generate PAYLOAD_SECRET
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

**Cloudflare R2 Storage:**
```bash
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```
- Get these from Cloudflare Dashboard → R2 → Manage R2 API Tokens

**AI Service API Keys:**
```bash
OPENROUTER_API_KEY=sk-or-v1-...
FAL_KEY=...
ELEVENLABS_API_KEY=sk_...
JINA_API_KEY=jina_...
```
- OpenRouter: https://openrouter.ai/keys
- Fal.ai: https://fal.ai/dashboard/keys
- ElevenLabs: https://elevenlabs.io/app/settings/api-keys
- Jina: https://jina.ai/

**Service API Keys:**
```bash
CELERY_TASK_API_KEY=your-production-key
BRAIN_SERVICE_API_KEY=your-production-key
```
- Get these from your production service configurations

### 3. Verify Service Connectivity

Before starting development, verify you can reach all production services:

```bash
# Test Brain Service
curl https://brain.ft.tc/health

# Test Task Service
curl https://tasks.ft.tc/health

# Test Agents Service
curl https://agents.ft.tc/health
```

All should return healthy status responses.

### 4. Generate PayloadCMS Types

```bash
pnpm generate:types
```

This generates TypeScript types from your PayloadCMS collections.

### 5. Start Development Server

```bash
pnpm dev
```

The app will start on **http://localhost:3010**

### 6. Access the Application

- **Main App**: http://localhost:3010
- **Admin Panel**: http://localhost:3010/admin
- **API Docs**: http://localhost:3010/api/v1

## Development Workflow

### Hot Reload

The development server supports hot reload. Changes to your code will automatically refresh the browser.

### Making Changes

1. **Edit code** in `src/` directory
2. **Save file** - hot reload will update the browser
3. **Test changes** in the browser
4. **Check console** for any errors

### Testing with Live Data

Since you're connected to production services:
- You'll see real production data
- Changes to data will affect production
- **Be careful** when testing data modifications
- Consider using a staging database if available

### Debugging

Enable debug mode in `.env.local`:
```bash
DEBUG=true
LOG_LEVEL=debug
```

View logs in the terminal where `pnpm dev` is running.

## Common Issues & Solutions

### Issue: Cannot connect to MongoDB

**Solution:**
1. Verify your IP is whitelisted in MongoDB Atlas
2. Check the connection string format
3. Ensure network connectivity to the database

```bash
# Test MongoDB connection
mongosh "your-connection-string"
```

### Issue: Service API calls failing

**Solution:**
1. Verify API keys are correct
2. Check service URLs are accessible
3. Ensure CORS is configured on production services

```bash
# Test service connectivity
curl -H "Authorization: Bearer YOUR_API_KEY" https://brain.ft.tc/api/status
```

### Issue: File uploads not working

**Solution:**
1. Verify R2 credentials are correct
2. Check bucket permissions
3. Ensure CORS is configured on R2 bucket

### Issue: WebSocket connection fails

**Solution:**
1. Ensure `NEXTAUTH_URL` matches your local URL
2. Check firewall settings
3. Verify WebSocket support in your browser

### Issue: Type errors after collection changes

**Solution:**
```bash
pnpm generate:types
```

## Running Specific Services Locally

If you need to run a specific service locally instead of using the live version:

### Run Task Service Locally

1. Uncomment in `.env.local`:
```bash
NEXT_PUBLIC_TASK_SERVICE_URL=http://localhost:8001
```

2. Start the task service:
```bash
cd services/celery-redis
# Follow service-specific setup instructions
```

### Run Brain Service Locally

1. Uncomment in `.env.local`:
```bash
NEXT_PUBLIC_BRAIN_SERVICE_URL=http://localhost:8002
```

2. Start the brain service:
```bash
cd services/mcp-brain-service
# Follow service-specific setup instructions
```

## Security Considerations

### Protecting Credentials

1. **Never commit** `.env.local` to version control
2. **Use different secrets** for local vs production
3. **Rotate API keys** regularly
4. **Limit IP access** to production services

### Network Security

1. **Use VPN** if accessing production from public networks
2. **Enable firewall** rules on production services
3. **Monitor access logs** for unusual activity

## Performance Tips

### Optimize Development Experience

1. **Use local cache** for frequently accessed data
2. **Mock external APIs** during UI development
3. **Use production data snapshots** for testing
4. **Enable source maps** for easier debugging

### Reduce API Calls

```typescript
// Use React Query or SWR for caching
import { useQuery } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

## Next Steps

1. **Read the API Reference**: `docs/api-reference.md`
2. **Review the Architecture**: `docs/system-apps/`
3. **Run Tests**: `pnpm test`
4. **Start Building**: Create your first feature!

## Getting Help

- **Documentation**: Check other files in `docs/` directory
- **Issues**: Report bugs on GitHub Issues
- **Team Chat**: Ask questions in your team communication channel

## Useful Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm build              # Build for production
pnpm start              # Start production server

# Code Quality
pnpm lint               # Run ESLint
pnpm typecheck          # TypeScript checking

# Testing
pnpm test               # Run all tests
pnpm test:int           # Integration tests
pnpm test:e2e           # End-to-end tests

# PayloadCMS
pnpm generate:types     # Generate types
pnpm generate:importmap # Generate import map
pnpm payload            # PayloadCMS CLI

# Utilities
pnpm devsafe            # Clean restart (removes .next)
```

## Troubleshooting Checklist

- [ ] Node.js version is 18.20.2+ or 20.9.0+
- [ ] pnpm is installed and version 9+
- [ ] `.env.local` file exists and is configured
- [ ] All API keys are valid and not expired
- [ ] IP is whitelisted in MongoDB Atlas
- [ ] Can reach all production service URLs
- [ ] PayloadCMS types are generated
- [ ] Dependencies are installed (`pnpm install`)
- [ ] No port conflicts (3010 is available)
- [ ] Firewall allows outbound connections

---

**Happy Coding! 🚀**

