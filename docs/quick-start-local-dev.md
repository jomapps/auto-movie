# Quick Start: Local Development

## TL;DR - Get Started in 5 Minutes

### 1. Configure Environment

```bash
cd apps/auto-movie

# Edit .env.local with your production credentials
code .env.local  # or vim, nano, etc.
```

**Required values to set:**
- `DATABASE_URI` - Your production MongoDB connection string
- `PAYLOAD_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `R2_*` - Cloudflare R2 credentials from dashboard
- `*_API_KEY` - API keys for AI services

### 2. Run the Startup Script

**On Linux/Mac:**
```bash
./dev-local.sh
```

**On Windows (PowerShell):**
```powershell
.\dev-local.ps1
```

**Or manually:**
```bash
pnpm install
pnpm generate:types
pnpm dev
```

### 3. Access the App

- **Main App**: http://localhost:3010
- **Admin Panel**: http://localhost:3010/admin
- **API**: http://localhost:3010/api/v1

## What's Configured

Your local app connects to:

✅ **Live Production Services:**
- Brain Service (brain.ft.tc)
- Task Service (tasks.ft.tc)
- Agents Service (agents.ft.tc)
- Cloudflare R2 Storage
- AI Services (OpenRouter, Fal.ai, ElevenLabs, Jina)

🏠 **Running Locally:**
- Auto-Movie Next.js app (localhost:3010)
- MongoDB (localhost:27017)
- Redis (localhost:6379)
- Hot reload for instant updates
- Local debugging and development

> **Note**: You're using a hybrid approach - local databases for faster development and safety, while still connecting to live production services for AI and other features.

## Common Commands

```bash
# Start development
pnpm dev

# Clean restart (if issues)
pnpm devsafe

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Generate types after collection changes
pnpm generate:types
```

## Troubleshooting

### Can't connect to MongoDB
- Ensure MongoDB is running locally: `mongosh --eval "db.version()"`
- Check connection string: `mongodb://localhost:27017/auto-movie`
- Start MongoDB: `docker-compose up -d mongo` or native service

### Can't connect to Redis
- Ensure Redis is running: `redis-cli ping`
- Should return: `PONG`
- Start Redis: `docker run -d -p 6379:6379 redis:latest` or native service

### Service API calls failing
- Verify API keys are correct
- Check service URLs are accessible
- Test with: `curl https://brain.ft.tc/health`

### Port 3010 already in use
- Stop other processes using the port
- Or change port in `package.json` dev script

### Type errors
```bash
pnpm generate:types
```

## Need More Help?

📖 **Full Documentation**: [local-development-setup.md](./local-development-setup.md)

🗄️ **Local MongoDB & Redis**: [local-mongodb-redis-setup.md](./local-mongodb-redis-setup.md)

🔧 **API Reference**: [api-reference.md](./api-reference.md)

🏗️ **Architecture**: [system-apps/](./system-apps/)

## Security Reminders

⚠️ **Never commit `.env.local` to git**

⚠️ **Use different secrets for local vs production**

⚠️ **Be careful with production data**

---

**Ready to code? Run `./dev-local.sh` and start building! 🚀**

