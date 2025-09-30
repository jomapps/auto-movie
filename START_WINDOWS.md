# 🚀 Start Local Development - Windows 11

## Your Windows Setup

You have MongoDB and Redis installed as native Windows services - no Docker needed!

```
LOCAL (Windows Services):       PRODUCTION:
✓ Auto-Movie App (3010)        ✓ Brain Service
✓ MongoDB (27017)              ✓ Task Service  
✓ Redis (6379)                 ✓ Agents Service
                               ✓ R2 Storage
                               ✓ AI Services
```

## Quick Start (2 Steps)

### 1️⃣ Verify Services are Running

**Check MongoDB:**
```powershell
# Check service status
Get-Service MongoDB

# Or test connection
mongo --eval "db.version()"
```

**Check Redis:**
```powershell
# Check service status
Get-Service Redis

# Or test connection
redis-cli ping
# Should return: PONG
```

**If services aren't running, start them:**
```powershell
# Start MongoDB
net start MongoDB

# Start Redis
net start Redis

# Or use Services GUI (Win+R → services.msc)
```

### 2️⃣ Start Development

```powershell
cd apps\auto-movie

# Run the startup script (recommended)
.\dev-local.ps1

# Or manually
pnpm install
pnpm generate:types
pnpm dev
```

## Access Your App

- **Main App**: http://localhost:3010
- **Admin Panel**: http://localhost:3010/admin
- **API**: http://localhost:3010/api/v1

## What the Startup Script Does

The `dev-local.ps1` script automatically checks:

✅ **System Requirements**
- Node.js version (18.20.2+ or 20.9.0+)
- pnpm availability
- Port 3010 availability

✅ **Configuration**
- `.env.local` file exists
- Critical environment variables are set

✅ **Windows Services**
- MongoDB service is running
- Redis service is running

✅ **Production Services**
- Brain Service is reachable
- Task Service is reachable
- Agents Service is reachable

✅ **Setup**
- Dependencies installed
- PayloadCMS types generated
- Development server started

## Managing Windows Services

### Using PowerShell (Admin)

```powershell
# Check status
Get-Service MongoDB, Redis

# Start services
Start-Service MongoDB
Start-Service Redis

# Stop services
Stop-Service MongoDB
Stop-Service Redis

# Restart services
Restart-Service MongoDB
Restart-Service Redis

# Set to start automatically
Set-Service MongoDB -StartupType Automatic
Set-Service Redis -StartupType Automatic
```

### Using Command Prompt (Admin)

```cmd
# Start services
net start MongoDB
net start Redis

# Stop services
net stop MongoDB
net stop Redis
```

### Using Services GUI

1. Press `Win+R`
2. Type `services.msc` and press Enter
3. Find "MongoDB" and "Redis" in the list
4. Right-click → Start/Stop/Restart
5. Right-click → Properties → Set Startup type to "Automatic"

## Database Management

### MongoDB

**Connect with mongo shell:**
```powershell
# Connect to database
mongo mongodb://localhost:27017/auto-movie

# Common commands
show dbs
show collections
db.users.find()
db.projects.find().limit(5)
```

**Using MongoDB Compass (GUI):**
1. Download from https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`
3. Browse collections visually

### Redis

**Connect with redis-cli:**
```powershell
# Connect
redis-cli

# Common commands
KEYS *
GET key_name
SET key_name value
FLUSHDB  # Clear database (careful!)
```

**Using RedisInsight (GUI):**
1. Download from https://redis.com/redis-enterprise/redis-insight/
2. Connect to: `localhost:6379`
3. Browse keys visually

## Common Tasks

### Check Service Status

```powershell
# Quick check
Get-Service MongoDB, Redis | Format-Table -AutoSize

# Detailed info
Get-Service MongoDB | Select-Object *
```

### View Service Logs

**MongoDB logs:**
```powershell
# Default location
Get-Content "C:\Program Files\MongoDB\Server\7.0\log\mongod.log" -Tail 50
```

**Redis logs:**
```powershell
# Check Redis installation directory
# Usually in C:\Program Files\Redis\
```

### Reset Local Database

```powershell
# Connect to MongoDB
mongo mongodb://localhost:27017/auto-movie

# Drop database
db.dropDatabase()
exit
```

### Backup Local Data

```powershell
# Backup MongoDB
mongodump --uri="mongodb://localhost:27017/auto-movie" --out=".\backup"

# Restore MongoDB
mongorestore --uri="mongodb://localhost:27017/auto-movie" ".\backup\auto-movie"
```

## Troubleshooting

### MongoDB Service Won't Start

**Check if port is in use:**
```powershell
Get-NetTCPConnection -LocalPort 27017
```

**Check service status:**
```powershell
Get-Service MongoDB | Select-Object Status, StartType
```

**View error logs:**
```powershell
Get-EventLog -LogName Application -Source MongoDB -Newest 10
```

**Restart service:**
```powershell
Restart-Service MongoDB -Force
```

### Redis Service Won't Start

**Check if port is in use:**
```powershell
Get-NetTCPConnection -LocalPort 6379
```

**Check service status:**
```powershell
Get-Service Redis | Select-Object Status, StartType
```

**Restart service:**
```powershell
Restart-Service Redis -Force
```

### Port 3010 Already in Use

**Find what's using the port:**
```powershell
Get-NetTCPConnection -LocalPort 3010 | Select-Object OwningProcess
Get-Process -Id <ProcessId>
```

**Kill the process:**
```powershell
Stop-Process -Id <ProcessId> -Force
```

### App Won't Start

**Clean restart:**
```powershell
# Remove build cache
Remove-Item -Recurse -Force .next

# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
pnpm install

# Start fresh
pnpm dev
```

**Regenerate types:**
```powershell
pnpm generate:types
```

## Development Workflow

### Daily Routine

**Morning:**
```powershell
# 1. Verify services are running
Get-Service MongoDB, Redis

# 2. Start them if needed
Start-Service MongoDB, Redis

# 3. Start development
cd apps\auto-movie
.\dev-local.ps1
```

**During Development:**
- Make changes in `src\` directory
- See changes instantly via hot reload
- Use browser DevTools for debugging
- Check PowerShell terminal for server logs

**Evening:**
```powershell
# 1. Stop app (Ctrl+C in terminal)

# 2. Services keep running (that's OK)
# Or stop them if you want:
Stop-Service MongoDB, Redis

# 3. Commit your changes
git add .
git commit -m "Your changes"
git push
```

## Useful PowerShell Commands

```powershell
# Development
pnpm dev              # Start dev server
pnpm devsafe          # Clean restart
pnpm build            # Build for production

# Testing
pnpm test             # All tests
pnpm test:int         # Integration tests
pnpm test:e2e         # E2E tests

# Code Quality
pnpm lint             # Lint code
pnpm typecheck        # Type check
pnpm generate:types   # Generate types

# Services
Get-Service MongoDB, Redis                    # Check status
Start-Service MongoDB, Redis                  # Start services
Stop-Service MongoDB, Redis                   # Stop services
Restart-Service MongoDB, Redis                # Restart services

# Database
mongo mongodb://localhost:27017/auto-movie    # MongoDB shell
redis-cli                                     # Redis CLI

# Ports
Get-NetTCPConnection -LocalPort 3010          # Check port 3010
Get-NetTCPConnection -LocalPort 27017         # Check MongoDB port
Get-NetTCPConnection -LocalPort 6379          # Check Redis port
```

## Windows-Specific Tips

### Set Services to Auto-Start

```powershell
# Run as Administrator
Set-Service MongoDB -StartupType Automatic
Set-Service Redis -StartupType Automatic
```

Now services will start automatically when Windows boots.

### Create Desktop Shortcuts

**Start Development:**
1. Right-click Desktop → New → Shortcut
2. Location: `powershell.exe -NoExit -Command "cd 'd:\Projects\movie-generation-platform\apps\auto-movie'; .\dev-local.ps1"`
3. Name: "Start Auto-Movie Dev"

**MongoDB Shell:**
1. Right-click Desktop → New → Shortcut
2. Location: `mongo mongodb://localhost:27017/auto-movie`
3. Name: "MongoDB Shell"

### Windows Terminal Integration

Add to Windows Terminal settings:
```json
{
  "name": "Auto-Movie Dev",
  "commandline": "powershell.exe -NoExit -Command \"cd 'd:\\Projects\\movie-generation-platform\\apps\\auto-movie'; .\\dev-local.ps1\"",
  "startingDirectory": "d:\\Projects\\movie-generation-platform\\apps\\auto-movie"
}
```

## Performance Tips

### Exclude from Windows Defender

Add these folders to Windows Defender exclusions for better performance:
- `d:\Projects\movie-generation-platform\apps\auto-movie\node_modules`
- `d:\Projects\movie-generation-platform\apps\auto-movie\.next`
- MongoDB data directory
- Redis data directory

**How to exclude:**
1. Windows Security → Virus & threat protection
2. Manage settings → Exclusions
3. Add folder exclusions

### Increase File Watcher Limit

If hot reload is slow, increase Node.js file watcher limit:
```powershell
# Add to your PowerShell profile
$env:NODE_OPTIONS="--max-old-space-size=8192"
```

## Quick Reference

### Service Status
```powershell
Get-Service MongoDB, Redis | Format-Table -AutoSize
```

### Start Everything
```powershell
Start-Service MongoDB, Redis
cd apps\auto-movie
.\dev-local.ps1
```

### Stop Everything
```powershell
# Ctrl+C to stop app
Stop-Service MongoDB, Redis
```

### Reset Database
```powershell
mongo mongodb://localhost:27017/auto-movie --eval "db.dropDatabase()"
```

## Documentation

- `START_LOCAL_DEV.md` - General quick reference
- `READY_TO_START.md` - Pre-start checklist
- `SETUP_SUMMARY.md` - Complete setup overview
- `docs\quick-start-local-dev.md` - 5-minute guide
- `docs\local-mongodb-redis-setup.md` - Database guide

## You're Ready! 🎉

Your Windows services are running, and you're ready to develop:

1. ✅ Verify services: `Get-Service MongoDB, Redis`
2. ✅ Start app: `.\dev-local.ps1`
3. ✅ Open browser: http://localhost:3010
4. ✅ Start coding!

**Happy coding on Windows! 🚀**

---

*Windows 11 specific guide for native MongoDB and Redis services*

