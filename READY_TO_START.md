# ✅ Ready to Start Development!

> **Windows Users**: You have MongoDB and Redis as native Windows services - see [START_WINDOWS.md](START_WINDOWS.md) for Windows-specific instructions!

## Your Setup is Complete

Everything is configured and ready for local development with your hybrid setup:
- **Local**: Auto-Movie app, MongoDB (Windows service), Redis (Windows service)
- **Production**: Brain, Tasks, Agents, R2, AI Services

## Pre-Start Checklist

Before you start coding, verify these items:

### ✅ Configuration
- [x] `.env.local` file exists and is configured
- [x] Using local MongoDB (localhost:27017)
- [x] Using local Redis (localhost:6379)
- [x] Production service URLs configured
- [x] API keys for AI services set

### ✅ Local Services
- [ ] MongoDB is running
- [ ] Redis is running

### ✅ Dependencies
- [ ] Node.js 18.20.2+ or 20.9.0+ installed
- [ ] pnpm installed
- [ ] Dependencies installed (`pnpm install`)

## Start Development

### Windows (Native Services)

```powershell
# 1. Verify services are running
Get-Service MongoDB, Redis

# 2. Start them if needed
Start-Service MongoDB, Redis

# 3. Start development
cd apps\auto-movie
.\dev-local.ps1
```

### Linux/Mac

```bash
# 1. Start services
cd apps/auto-movie
docker-compose up -d mongo

# 2. Verify
mongosh --eval "db.version()"
redis-cli ping

# 3. Start development
./dev-local.sh
```

### Manual Start (Any Platform)

```bash
pnpm install
pnpm generate:types
pnpm dev
```

### 3. Open Your Browser

- **Main App**: http://localhost:3010
- **Admin Panel**: http://localhost:3010/admin
- **API**: http://localhost:3010/api/v1

## What to Expect

### ✅ Successful Startup

You should see:
```
✓ Node.js version check passed
✓ pnpm available
✓ .env.local file found
✓ Environment variables configured
✓ Local MongoDB running
✓ Local Redis running
✓ Port 3010 available
✓ Dependencies installed
✓ Types generated

╔════════════════════════════════════════════════════════════╗
║  All checks passed! Starting development server...        ║
╚════════════════════════════════════════════════════════════╝

Application will be available at:
  → Main App:    http://localhost:3010
  → Admin Panel: http://localhost:3010/admin
  → API:         http://localhost:3010/api/v1

▲ Next.js 15.4.4
- Local:        http://localhost:3010

✓ Ready in 3.2s
```

### ❌ Common Issues

**MongoDB not running (Windows):**
```
✗ Checking local MongoDB...
Error: MongoDB is not running locally.
```
**Fix:** `Start-Service MongoDB` or `net start MongoDB`

**MongoDB not running (Linux/Mac):**
```
✗ Checking local MongoDB...
Error: MongoDB is not running locally.
```
**Fix:** `docker-compose up -d mongo` or start native service

**Redis not running (Windows):**
```
⚠ Checking local Redis...
(not running - may be optional)
```
**Fix:** `Start-Service Redis` or `net start Redis`

**Redis not running (Linux/Mac):**
```
⚠ Checking local Redis...
(not running - may be optional)
```
**Fix:** `docker run -d -p 6379:6379 redis:latest` or start native service

**Port in use:**
```
✗ Checking port 3010 availability...
Error: Port 3010 is already in use.
```
**Fix:** `lsof -ti:3010 | xargs kill` (Mac/Linux)

## Your First Actions

### 1. Verify Everything Works

**Check the app loads:**
- Open http://localhost:3010
- Should see the homepage
- No errors in browser console

**Check admin panel:**
- Open http://localhost:3010/admin
- Should see login page
- Can log in with credentials

**Check hot reload:**
- Open `src/app/page.tsx`
- Make a small change
- Save file
- Browser should auto-refresh

### 2. Explore the Database

**MongoDB:**
```bash
mongosh mongodb://localhost:27017/auto-movie

# See what's there
show collections
db.users.find()
db.projects.find()
```

**Redis:**
```bash
redis-cli

# See what's there
KEYS *
```

### 3. Test Production Services

**Check connectivity:**
```bash
curl https://brain.ft.tc/health
curl https://tasks.ft.tc/health
curl https://agents.ft.tc/health
```

All should return healthy responses.

## Development Workflow

### Daily Routine

**Morning:**
```bash
# 1. Start services
cd apps/auto-movie
docker-compose up -d mongo

# 2. Start app
./dev-local.sh

# 3. Start coding!
```

**During Development:**
- Make changes in `src/`
- See changes instantly via hot reload
- Test with local data
- Use browser DevTools for debugging
- Check terminal for server logs

**Evening:**
```bash
# 1. Stop app (Ctrl+C)

# 2. Stop services (optional)
docker-compose down

# 3. Commit your changes
git add .
git commit -m "Your changes"
git push
```

### Testing Your Changes

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm test:int          # Integration tests
pnpm test:e2e          # End-to-end tests

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Database Operations

**Reset local database:**
```bash
mongosh mongodb://localhost:27017/auto-movie --eval "db.dropDatabase()"
```

**Seed test data:**
```bash
# Create your own seed script or use admin panel to add data
```

**Backup local data:**
```bash
mongodump --uri="mongodb://localhost:27017/auto-movie" --out=./backup
```

## Quick Reference

### Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm devsafe          # Clean restart
pnpm build            # Build for production

# Database
mongosh               # MongoDB shell
redis-cli             # Redis CLI

# Testing
pnpm test             # All tests
pnpm test:int         # Integration tests
pnpm test:e2e         # E2E tests

# Code Quality
pnpm lint             # Lint code
pnpm typecheck        # Type check
pnpm generate:types   # Generate types
```

### Service URLs

**Local:**
- App: http://localhost:3010
- MongoDB: mongodb://localhost:27017
- Redis: redis://localhost:6379

**Production:**
- Brain: https://brain.ft.tc
- Tasks: https://tasks.ft.tc
- Agents: https://agents.ft.tc
- Media: https://media.ft.tc

### Documentation

- `START_LOCAL_DEV.md` - Quick reference
- `SETUP_SUMMARY.md` - Complete setup summary
- `docs/quick-start-local-dev.md` - 5-minute guide
- `docs/local-mongodb-redis-setup.md` - Database guide
- `docs/local-development-setup.md` - Full guide
- `docs/verify-local-setup.md` - Verification
- `docs/api-reference.md` - API docs

## Tips for Success

### 🎯 Best Practices

1. **Commit often** - Small, focused commits
2. **Test locally** - Before pushing to production
3. **Use hot reload** - Instant feedback on changes
4. **Check logs** - Terminal and browser console
5. **Reset database** - When testing destructive operations
6. **Run tests** - Before committing changes

### 🚀 Productivity Tips

1. **Use VS Code debugging** - Set breakpoints
2. **Install React DevTools** - Inspect components
3. **Use MongoDB Compass** - Visual database browser
4. **Keep terminal visible** - Watch for errors
5. **Use `pnpm devsafe`** - When things get weird

### ⚠️ Things to Remember

1. **Local data only** - Your MongoDB is local, not production
2. **AI calls cost money** - Be mindful of API usage
3. **Production services** - Your calls reach live services
4. **No authentication** - Local MongoDB has no auth (that's OK)
5. **Git ignore** - `.env.local` is already ignored

## Getting Help

### Documentation
- Check `docs/` folder for detailed guides
- Review `README.md` for project overview
- See `SETUP_SUMMARY.md` for configuration details

### Troubleshooting
- Check terminal output for errors
- Review browser console for client errors
- Verify services are running
- Check environment variables

### Support
- Team communication channel
- GitHub issues
- Stack Overflow for Next.js/PayloadCMS questions

## You're Ready! 🎉

Everything is set up and ready to go. Here's what to do:

1. ✅ Start MongoDB: `docker-compose up -d mongo`
2. ✅ Start app: `./dev-local.sh`
3. ✅ Open browser: http://localhost:3010
4. ✅ Start coding!

**Happy coding! 🚀**

---

*Need help? Check `START_LOCAL_DEV.md` for quick reference*

