# ✅ Windows 11 Local Development - Setup Complete!

## Your Windows Configuration

You're running a **hybrid development environment** optimized for Windows 11 with native services:

### 🪟 Windows Native Services
- ✅ **MongoDB** - Running as Windows service (port 27017)
- ✅ **Redis** - Running as Windows service (port 6379)
- ✅ **Auto-Movie App** - Local development server (port 3010)

### ☁️ Production Services
- ✅ **Brain Service** (brain.ft.tc) - AI/ML processing
- ✅ **Task Service** (tasks.ft.tc) - Task queue
- ✅ **Agents Service** (agents.ft.tc) - Agent orchestration
- ✅ **Cloudflare R2** - Media storage
- ✅ **AI Services** - OpenRouter, Fal.ai, ElevenLabs, Jina

## What Was Updated for Windows

### ✨ PowerShell Script Enhanced
`dev-local.ps1` now includes:
- ✅ Windows service detection for MongoDB
- ✅ Windows service detection for Redis
- ✅ Proper error messages for Windows
- ✅ Service start commands for Windows
- ✅ Uses `mongo` command (not `mongosh`) for compatibility

### 📖 Windows-Specific Documentation
- ✅ `START_WINDOWS.md` - Complete Windows guide
- ✅ Updated `START_LOCAL_DEV.md` with Windows sections
- ✅ Updated `READY_TO_START.md` with Windows instructions
- ✅ Updated `SETUP_SUMMARY.md` with Windows paths

## Quick Start (2 Steps)

### 1️⃣ Verify Services

```powershell
# Check if services are running
Get-Service MongoDB, Redis

# Should show:
# Status   Name               DisplayName
# ------   ----               -----------
# Running  MongoDB            MongoDB
# Running  Redis              Redis
```

**If not running:**
```powershell
Start-Service MongoDB, Redis
```

### 2️⃣ Start Development

```powershell
cd d:\Projects\movie-generation-platform\apps\auto-movie
.\dev-local.ps1
```

**What the script does:**
- ✅ Checks Node.js version
- ✅ Checks pnpm availability
- ✅ Validates `.env.local` configuration
- ✅ Verifies MongoDB Windows service is running
- ✅ Verifies Redis Windows service is running
- ✅ Checks production service connectivity
- ✅ Generates PayloadCMS types
- ✅ Starts development server

## Access Your App

Once started:
- **Main App**: http://localhost:3010
- **Admin Panel**: http://localhost:3010/admin
- **API**: http://localhost:3010/api/v1

## Managing Windows Services

### PowerShell Commands (Run as Admin)

```powershell
# Check status
Get-Service MongoDB, Redis

# Start services
Start-Service MongoDB, Redis

# Stop services
Stop-Service MongoDB, Redis

# Restart services
Restart-Service MongoDB, Redis

# Set to auto-start on boot
Set-Service MongoDB -StartupType Automatic
Set-Service Redis -StartupType Automatic
```

### Command Prompt (Run as Admin)

```cmd
# Start services
net start MongoDB
net start Redis

# Stop services
net stop MongoDB
net stop Redis
```

### Services GUI

1. Press `Win+R`
2. Type `services.msc` and press Enter
3. Find "MongoDB" and "Redis"
4. Right-click → Start/Stop/Restart
5. Right-click → Properties → Set Startup type

## Database Management

### MongoDB

**Connect with mongo shell:**
```powershell
mongo mongodb://localhost:27017/auto-movie
```

**Common commands:**
```javascript
show dbs
show collections
db.users.find()
db.projects.find().limit(5)
db.dropDatabase()  // Reset database
```

**MongoDB Compass (GUI):**
- Download: https://www.mongodb.com/products/compass
- Connect to: `mongodb://localhost:27017`

### Redis

**Connect with redis-cli:**
```powershell
redis-cli
```

**Common commands:**
```
KEYS *
GET key_name
SET key_name value
FLUSHDB  // Clear database
```

**RedisInsight (GUI):**
- Download: https://redis.com/redis-enterprise/redis-insight/
- Connect to: `localhost:6379`

## Development Workflow

### Daily Routine

**Morning:**
```powershell
# 1. Check services (usually already running)
Get-Service MongoDB, Redis

# 2. Start development
cd d:\Projects\movie-generation-platform\apps\auto-movie
.\dev-local.ps1
```

**During Development:**
- Edit files in `src\` directory
- Hot reload updates browser automatically
- Check PowerShell terminal for logs
- Use browser DevTools for debugging

**Evening:**
```powershell
# 1. Stop app (Ctrl+C)

# 2. Services keep running (recommended)
# Or stop them:
Stop-Service MongoDB, Redis

# 3. Commit changes
git add .
git commit -m "Your changes"
git push
```

## Troubleshooting

### MongoDB Service Won't Start

```powershell
# Check service status
Get-Service MongoDB | Select-Object Status, StartType

# Check if port is in use
Get-NetTCPConnection -LocalPort 27017

# View error logs
Get-EventLog -LogName Application -Source MongoDB -Newest 10

# Force restart
Restart-Service MongoDB -Force
```

### Redis Service Won't Start

```powershell
# Check service status
Get-Service Redis | Select-Object Status, StartType

# Check if port is in use
Get-NetTCPConnection -LocalPort 6379

# Force restart
Restart-Service Redis -Force
```

### Port 3010 Already in Use

```powershell
# Find what's using the port
Get-NetTCPConnection -LocalPort 3010 | Select-Object OwningProcess

# Get process details
Get-Process -Id <ProcessId>

# Kill the process
Stop-Process -Id <ProcessId> -Force
```

### App Won't Start

```powershell
# Clean restart
Remove-Item -Recurse -Force .next
pnpm devsafe

# Regenerate types
pnpm generate:types

# Check for errors
pnpm dev
```

## Windows-Specific Tips

### 1. Set Services to Auto-Start

```powershell
# Run as Administrator
Set-Service MongoDB -StartupType Automatic
Set-Service Redis -StartupType Automatic
```

Now services start automatically when Windows boots!

### 2. Exclude from Windows Defender

For better performance, exclude these folders:
- `d:\Projects\movie-generation-platform\apps\auto-movie\node_modules`
- `d:\Projects\movie-generation-platform\apps\auto-movie\.next`
- MongoDB data directory
- Redis data directory

**How:**
1. Windows Security → Virus & threat protection
2. Manage settings → Exclusions
3. Add folder exclusions

### 3. Create Desktop Shortcut

**Start Development:**
1. Right-click Desktop → New → Shortcut
2. Location: `powershell.exe -NoExit -Command "cd 'd:\Projects\movie-generation-platform\apps\auto-movie'; .\dev-local.ps1"`
3. Name: "Start Auto-Movie Dev"

### 4. Windows Terminal Profile

Add to Windows Terminal settings:
```json
{
  "name": "Auto-Movie Dev",
  "commandline": "powershell.exe -NoExit -Command \"cd 'd:\\Projects\\movie-generation-platform\\apps\\auto-movie'; .\\dev-local.ps1\"",
  "startingDirectory": "d:\\Projects\\movie-generation-platform\\apps\\auto-movie"
}
```

## Useful PowerShell Commands

```powershell
# Development
pnpm dev              # Start dev server
pnpm devsafe          # Clean restart
pnpm build            # Build for production
pnpm test             # Run tests

# Services
Get-Service MongoDB, Redis                    # Check status
Start-Service MongoDB, Redis                  # Start
Stop-Service MongoDB, Redis                   # Stop
Restart-Service MongoDB, Redis                # Restart

# Database
mongo mongodb://localhost:27017/auto-movie    # MongoDB shell
redis-cli                                     # Redis CLI

# Ports
Get-NetTCPConnection -LocalPort 3010          # Check app port
Get-NetTCPConnection -LocalPort 27017         # Check MongoDB
Get-NetTCPConnection -LocalPort 6379          # Check Redis

# Processes
Get-Process node                              # Find Node processes
Stop-Process -Name node -Force                # Kill all Node processes
```

## Documentation Index

📖 **Windows-Specific:**
- `START_WINDOWS.md` - Complete Windows guide (read this!)

📖 **General Guides:**
- `START_LOCAL_DEV.md` - Quick reference (updated for Windows)
- `READY_TO_START.md` - Pre-start checklist (updated for Windows)
- `SETUP_SUMMARY.md` - Complete setup overview

📖 **Detailed Docs:**
- `docs\quick-start-local-dev.md` - 5-minute guide
- `docs\local-mongodb-redis-setup.md` - Database guide
- `docs\local-development-setup.md` - Full setup guide
- `docs\verify-local-setup.md` - Verification checklist

## Benefits of Your Setup

✅ **Native Performance**
- Windows services run natively (no Docker overhead)
- Direct access to MongoDB and Redis
- Faster database operations

✅ **Always Available**
- Services start with Windows
- No need to manually start containers
- Instant development readiness

✅ **Easy Management**
- Windows Services GUI
- PowerShell commands
- Familiar Windows tools

✅ **Production-Like**
- Real AI services
- Live production integrations
- Actual media storage

✅ **Safe Testing**
- Local database for experiments
- No risk to production data
- Easy to reset

## You're Ready! 🎉

Your Windows 11 development environment is fully configured and ready:

1. ✅ MongoDB running as Windows service
2. ✅ Redis running as Windows service
3. ✅ PowerShell script configured for Windows
4. ✅ Documentation updated for Windows
5. ✅ `.env.local` configured with local services

**Start coding:**
```powershell
cd d:\Projects\movie-generation-platform\apps\auto-movie
.\dev-local.ps1
```

**Then open:** http://localhost:3010

**Happy coding on Windows 11! 🚀**

---

*Windows 11 specific setup with native MongoDB and Redis services*  
*Setup completed: 2025-09-30*  
*Status: Ready for Development ✅*

