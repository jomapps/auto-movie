# Auto-Movie CI/CD Setup - Quick Start

## 🎯 What's Been Set Up

Your auto-movie application now has a complete CI/CD pipeline with:

✅ **GitHub Actions workflow** - Automatic deployment on push to master  
✅ **PM2 ecosystem config** - Optimized process management  
✅ **Deployment scripts** - Manual deploy and rollback capabilities  
✅ **Zero-downtime reloads** - No service interruption during deploys  
✅ **Automatic backups** - Rollback capability if deployment fails  
✅ **Health checks** - Validates deployment success  

## 🚀 Quick Start

### 1. Configure GitHub Secrets (One-Time Setup)

Follow the detailed guide: **[docs/GITHUB_SECRETS_SETUP.md](docs/GITHUB_SECRETS_SETUP.md)**

Required secrets (add to GitHub repository settings):
- `SSH_PRIVATE_KEY` - SSH private key for server access
- `SERVER_HOST` - `vmd177401` (or your server hostname)
- `SERVER_USER` - `root`
- `DEPLOY_PATH` - `/var/www/movie-generation-platform/apps/auto-movie`

### 2. Commit CI/CD Files

```bash
cd /var/www/movie-generation-platform/apps/auto-movie

git add .github/workflows/deploy.yml
git add ecosystem.config.js
git add scripts/
git add docs/
git commit -m "feat: add CI/CD pipeline with GitHub Actions

- Add GitHub Actions workflow for automatic deployment
- Add PM2 ecosystem configuration
- Add deployment and rollback scripts
- Add comprehensive deployment documentation

Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>"

git push origin master
```

### 3. Test Deployment

Once pushed, the deployment will automatically trigger:
1. Go to `https://github.com/jomapps/auto-movie/actions`
2. Watch the deployment progress
3. Check that app is still accessible at `https://auto-movie.ft.tc`

## 📋 How It Works

### Automatic Deployment Flow

```
Push to master → GitHub Actions Triggered
    ↓
Build Phase (on GitHub runners)
    ↓ (if build succeeds)
Deploy Phase (sync to server)
    ↓
Install Dependencies
    ↓
PM2 Zero-Downtime Reload
    ↓
Health Check
    ↓
✅ Deployment Complete!
```

### Zero-Downtime Process

1. Old process continues serving requests
2. New process starts in background
3. New process becomes ready
4. Traffic switches to new process
5. Old process gracefully shuts down
6. **No downtime!**

## 📁 Files Added

```
apps/auto-movie/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions workflow
├── scripts/
│   ├── deploy.sh                   # Manual deployment script
│   └── rollback.sh                 # Rollback to previous version
├── docs/
│   ├── DEPLOYMENT.md               # Comprehensive deployment guide
│   └── GITHUB_SECRETS_SETUP.md     # Setup instructions
├── ecosystem.config.js             # PM2 configuration
├── logs/                           # PM2 logs directory
└── backups/                        # Automatic backups
```

## 🎮 Common Commands

### Automatic Deployment (Recommended)

```bash
# Simply push to master
git push origin master
```

### Manual Deployment

```bash
# On server
cd /var/www/movie-generation-platform/apps/auto-movie
bash scripts/deploy.sh

# Skip tests (faster)
bash scripts/deploy.sh --skip-tests

# Skip build (use existing build)
bash scripts/deploy.sh --skip-build
```

### Rollback

```bash
# Rollback to latest backup
bash scripts/rollback.sh latest

# Rollback to specific backup
bash scripts/rollback.sh 20250930_123045

# List available backups
ls -lht backups/
```

### PM2 Management

```bash
# View status
pm2 list

# View logs
pm2 logs auto-movie

# Monitor resources
pm2 monit

# Reload (zero-downtime)
pm2 reload auto-movie

# Restart (with downtime)
pm2 restart auto-movie
```

## 🔍 Monitoring

### Check Deployment Status

**GitHub Actions:**
- `https://github.com/jomapps/auto-movie/actions`

**Netdata Monitoring:**
- `https://movie.ft.tc` → Applications → auto-movie

**PM2 Status:**
```bash
pm2 list | grep auto-movie
```

### View Logs

```bash
# Real-time logs
pm2 logs auto-movie

# Last 100 lines
pm2 logs auto-movie --lines 100

# Application logs
tail -f logs/combined.log
```

## 🛡️ Safety Features

### Automatic Backup
- Before each deployment, current build is backed up
- Rollback available if deployment fails
- Keeps last 5 backups (auto-cleanup)

### Build Validation
- Deployment stops if build fails
- Current version stays live if build/deployment fails
- Health check validates successful deployment

### Zero-Downtime
- PM2 reload instead of restart
- Old process stays live until new one is ready
- Graceful shutdown of old process

## 📊 What Happens on Push to Master

1. **GitHub Actions starts** (usually within seconds)
2. **Build phase** (2-5 minutes):
   - Checkout code
   - Install dependencies (with cache)
   - Run linter (non-blocking)
   - Run tests (non-blocking)
   - Build Next.js app
3. **Deploy phase** (1-2 minutes):
   - Sync files to server
   - Install production dependencies
   - Reload PM2 process
   - Health check
4. **Notification** - You'll see green ✅ or red ❌ in Actions tab

**Total time:** ~5-7 minutes from push to live

## 🔧 Configuration

### Environment Variables

Edit on server:
```bash
nano /var/www/movie-generation-platform/apps/auto-movie/.env
pm2 reload auto-movie --update-env
```

**Important:** `.env` is not synced from GitHub (excluded via rsync)

### PM2 Settings

Edit `ecosystem.config.js`:
```javascript
{
  name: 'auto-movie',
  instances: 1,           // Number of instances
  max_memory_restart: '2G', // Memory limit
  autorestart: true,      // Auto-restart on crash
  // ... more settings
}
```

After changes:
```bash
pm2 reload auto-movie --update-env
```

### GitHub Actions Workflow

Edit `.github/workflows/deploy.yml` to customize:
- Trigger conditions
- Build steps
- Test commands
- Deployment settings

## 🚨 Troubleshooting

### Deployment Failed

1. **Check GitHub Actions logs:**
   - Go to Actions tab → Click failed run → Expand failed step

2. **Check PM2 status:**
   ```bash
   ssh root@vmd177401
   pm2 list | grep auto-movie
   pm2 logs auto-movie --lines 50
   ```

3. **Rollback if needed:**
   ```bash
   bash scripts/rollback.sh latest
   ```

### App Not Responding After Deployment

```bash
# Check PM2 status
pm2 list

# Restart if needed
pm2 restart auto-movie

# Check logs
pm2 logs auto-movie --lines 100

# Check if port is listening
lsof -i :3010
```

### Build Fails in GitHub Actions

```bash
# Test build locally
cd /var/www/movie-generation-platform/apps/auto-movie
pnpm install
pnpm run build

# If build succeeds locally but fails in Actions:
# - Check Node version (workflow uses Node 20)
# - Check pnpm version (workflow uses pnpm 9)
# - Check for environment-specific issues
```

## 📖 Documentation

- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Comprehensive deployment guide
- **[GITHUB_SECRETS_SETUP.md](docs/GITHUB_SECRETS_SETUP.md)** - GitHub secrets setup
- **[github-cicd.md](github-cicd.md)** - Original CI/CD reference

## ✅ Next Steps

1. [ ] Configure GitHub Secrets (see `docs/GITHUB_SECRETS_SETUP.md`)
2. [ ] Commit CI/CD files to repository
3. [ ] Push to master to trigger first deployment
4. [ ] Verify deployment succeeds in Actions tab
5. [ ] Test application at `https://auto-movie.ft.tc`
6. [ ] Set up monitoring alerts (optional)
7. [ ] Create staging environment (optional)

## 🎉 Benefits

**Before CI/CD:**
- Manual deployment process
- SSH into server, pull code, build, restart
- Risk of downtime
- No automatic testing
- Manual rollback process

**After CI/CD:**
- Automatic deployment on push
- Build happens on GitHub (doesn't consume server resources)
- Zero-downtime deployments
- Automatic testing
- One-command rollback
- Automatic backups
- Health checks

## 🔗 Quick Links

- **App:** https://auto-movie.ft.tc
- **Repository:** https://github.com/jomapps/auto-movie
- **Actions:** https://github.com/jomapps/auto-movie/actions
- **Monitoring:** https://movie.ft.tc (Netdata)

---

Need help? Check the detailed documentation in `docs/` folder or review GitHub Actions logs.

Happy deploying! 🚀
