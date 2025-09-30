# Auto-Movie Deployment Guide

## Overview

This repository is configured with automated CI/CD deployment to production using GitHub Actions and PM2.

## How It Works

### Automated Deployment (GitHub Actions)

On every push to `master` branch:

1. **Build Phase** (runs on GitHub)
   - Checkout code
   - Install dependencies
   - Run linter (non-blocking)
   - Run integration tests (non-blocking)
   - Build Next.js application
   - If build fails → deployment stops, current version stays live

2. **Deploy Phase** (runs on server)
   - Sync files to server (excluding node_modules, .env, tests)
   - Install production dependencies
   - Reload PM2 process with zero-downtime
   - Perform health check
   - If health check fails → rollback available

### Zero-Downtime Deployment

We use **PM2 reload** instead of restart:
- Old process continues serving requests
- New process starts in background
- Once new process is ready, traffic switches
- Old process gracefully shuts down
- **No downtime!**

## Prerequisites

### 1. GitHub Secrets

Configure these secrets in your GitHub repository:
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SSH_PRIVATE_KEY` | SSH private key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_HOST` | Server hostname or IP | `vmd177401` or `85.208.51.186` |
| `SERVER_USER` | SSH user on server | `root` |
| `DEPLOY_PATH` | Absolute path to app directory | `/var/www/movie-generation-platform/apps/auto-movie` |

### 2. SSH Key Setup

Generate SSH key pair (if not exists):

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key

# Copy public key to server
ssh-copy-id -i ~/.ssh/github_deploy_key.pub root@your-server
```

Add private key to GitHub Secrets:
```bash
cat ~/.ssh/github_deploy_key
# Copy entire output including BEGIN and END lines
```

### 3. Server Setup

Ensure the following are installed on the server:
- Node.js 20+
- pnpm 9+
- PM2
- Git

## Files Overview

### `.github/workflows/deploy.yml`
GitHub Actions workflow that triggers on push to master.

**Key features:**
- Runs build on GitHub runners (faster, doesn't consume server resources)
- Only deploys if build succeeds
- Uses rsync for efficient file transfer
- Performs health check after deployment

### `ecosystem.config.js`
PM2 configuration file.

**Settings:**
- App name: `auto-movie`
- Port: `3010`
- Memory limit: `2GB`
- Auto-restart on crash
- Environment variables
- Log file locations

### `scripts/deploy.sh`
Manual deployment script (alternative to GitHub Actions).

**Usage:**
```bash
# Full deployment with tests and build
bash scripts/deploy.sh

# Skip tests
bash scripts/deploy.sh --skip-tests

# Skip build (use existing .next folder)
bash scripts/deploy.sh --skip-build
```

**Features:**
- Automatic backup before deployment
- Git pull latest code
- Install dependencies
- Run tests
- Build application
- Zero-downtime reload
- Automatic rollback on build failure
- Health check validation

### `scripts/rollback.sh`
Quick rollback to previous version.

**Usage:**
```bash
# Rollback to latest backup
bash scripts/rollback.sh latest

# Rollback to specific backup
bash scripts/rollback.sh 20250930_123045

# List available backups first
ls -lht backups/
```

## Deployment Methods

### Method 1: Automatic (Recommended)

Simply push to master:

```bash
git add .
git commit -m "feat: add new feature"
git push origin master
```

GitHub Actions will automatically:
1. Build the app
2. Deploy to server
3. Reload PM2
4. Notify you of status

### Method 2: Manual (Server-side)

SSH into the server and run:

```bash
cd /var/www/movie-generation-platform/apps/auto-movie
bash scripts/deploy.sh
```

### Method 3: Manual Trigger (GitHub)

1. Go to GitHub repository
2. Click `Actions` tab
3. Select `Deploy Auto-Movie to Production`
4. Click `Run workflow`
5. Select branch and click `Run workflow`

## Monitoring

### Check PM2 Status

```bash
# List all processes
pm2 list

# View auto-movie details
pm2 show auto-movie

# View logs in real-time
pm2 logs auto-movie

# View last 100 lines
pm2 logs auto-movie --lines 100

# Monitor CPU/Memory
pm2 monit
```

### Check Deployment Logs

```bash
# View deployment logs
cat /var/www/movie-generation-platform/apps/auto-movie/logs/out.log

# View error logs
cat /var/www/movie-generation-platform/apps/auto-movie/logs/error.log

# Follow logs in real-time
tail -f /var/www/movie-generation-platform/apps/auto-movie/logs/combined.log
```

### Access Application

- **Production URL:** `https://auto-movie.ft.tc`
- **Admin Panel:** `https://auto-movie.ft.tc/admin`
- **API:** `https://auto-movie.ft.tc/api/v1/*`

## Troubleshooting

### Deployment Failed

1. **Check GitHub Actions logs:**
   - Go to repository → Actions tab
   - Click on failed workflow run
   - Expand failed step to see error

2. **Common issues:**

   **Build fails:**
   ```bash
   # Check if all dependencies are installed
   cd /var/www/movie-generation-platform/apps/auto-movie
   pnpm install
   pnpm run build
   ```

   **PM2 not reloading:**
   ```bash
   # Check PM2 status
   pm2 list
   
   # Try manual restart
   pm2 restart auto-movie
   
   # If process is stuck
   pm2 delete auto-movie
   pm2 start ecosystem.config.js --env production
   ```

   **Port already in use:**
   ```bash
   # Check what's using port 3010
   lsof -i :3010
   
   # Kill the process if needed
   kill -9 <PID>
   ```

### Rollback After Failed Deployment

```bash
cd /var/www/movie-generation-platform/apps/auto-movie

# Rollback to latest working version
bash scripts/rollback.sh latest

# Or rollback to specific backup
bash scripts/rollback.sh 20250930_123045
```

### Health Check Failing

```bash
# Check if app is listening on port 3010
curl http://localhost:3010

# Check PM2 process
pm2 list | grep auto-movie

# View recent logs
pm2 logs auto-movie --lines 50

# Check Nginx proxy
curl https://auto-movie.ft.tc

# Test Nginx config
nginx -t
```

### Database Connection Issues

```bash
# Check MongoDB is running
systemctl status mongod

# Check MongoDB connection
mongo --eval "db.adminCommand('ping')"

# Verify DATABASE_URI in .env
cat /var/www/movie-generation-platform/apps/auto-movie/.env | grep DATABASE_URI
```

## Environment Variables

The application uses environment variables from `.env` file:

```bash
# Edit environment variables
nano /var/www/movie-generation-platform/apps/auto-movie/.env

# After editing, reload PM2
pm2 reload auto-movie --update-env
```

**Important:** Never commit `.env` file to git. It's excluded via `.gitignore`.

## Backup Management

### Automatic Backups

The deployment script automatically:
- Creates backup before each deployment
- Stores in `backups/` directory
- Keeps last 5 backups (auto-cleanup)
- Each backup is timestamped

### Manual Backup

```bash
cd /var/www/movie-generation-platform/apps/auto-movie

# Backup current build
cp -r .next backups/manual_backup_$(date +%Y%m%d_%H%M%S).next

# List backups
ls -lht backups/
```

### Restore Backup

```bash
# Using rollback script (recommended)
bash scripts/rollback.sh latest

# Manual restore
rm -rf .next
cp -r backups/backup_20250930_123045.next .next
pm2 reload auto-movie
```

## Performance Optimization

### Build Optimization

Already configured in `package.json`:
```json
"build": "cross-env NODE_OPTIONS=\"--no-deprecation --max-old-space-size=8000\" next build"
```

This allocates 8GB RAM for build process, preventing out-of-memory errors.

### PM2 Configuration

Optimal settings in `ecosystem.config.js`:
- Memory limit: 2GB (auto-restart if exceeded)
- Max restarts: 10 (prevents restart loop)
- Restart delay: 4s (gives time to stabilize)
- Wait ready: Waits for app to be ready before switching traffic

## Security Best Practices

1. **SSH Keys:**
   - Use dedicated SSH key for deployments
   - Restrict key permissions: `chmod 600 ~/.ssh/github_deploy_key`
   - Consider using deploy keys instead of personal SSH keys

2. **GitHub Secrets:**
   - Never commit secrets to repository
   - Rotate SSH keys periodically
   - Use environment-specific secrets

3. **Server Access:**
   - Keep server packages updated
   - Use firewall (ufw) to restrict access
   - Monitor access logs

4. **Application:**
   - Keep dependencies updated
   - Run `pnpm audit` regularly
   - Use environment variables for sensitive data

## Continuous Integration Checks

The workflow includes:

1. **Linting** - Code quality checks (ESLint)
2. **Integration Tests** - Vitest tests
3. **Build Validation** - Ensures app builds successfully

All checks are **non-blocking** (continue-on-error), meaning deployment proceeds even if they fail, but you'll be notified.

## Scaling & High Availability

### Multiple Instances

To run multiple PM2 instances for load balancing:

```javascript
// In ecosystem.config.js
instances: 2,  // or 'max' for CPU count
exec_mode: 'cluster'
```

**Note:** This requires session persistence to be handled externally (Redis/database).

### Load Balancer

Nginx is already configured as reverse proxy. For multiple app servers, configure Nginx upstream:

```nginx
upstream auto_movie_backend {
    server 127.0.0.1:3010;
    server 127.0.0.1:3011;  # Additional instance
}
```

## Maintenance Mode

To enable maintenance mode:

```bash
# Stop accepting new traffic
pm2 stop auto-movie

# Or show maintenance page in Nginx
# Edit /etc/nginx/sites-available/auto-movie.ft.tc.conf
# Add: return 503;
nginx -s reload
```

## Contact & Support

- **Repository:** `git@github.com:jomapps/auto-movie.git`
- **Server:** `vmd177401` (85.208.51.186)
- **App URL:** `https://auto-movie.ft.tc`

For issues:
1. Check PM2 logs: `pm2 logs auto-movie`
2. Check GitHub Actions: Repository → Actions tab
3. Check Netdata monitoring: `https://movie.ft.tc` → auto-movie service

## Quick Reference Commands

```bash
# Deployment
git push origin master              # Auto-deploy via GitHub Actions
bash scripts/deploy.sh              # Manual deploy
bash scripts/rollback.sh latest     # Rollback

# PM2 Management
pm2 list                           # List processes
pm2 show auto-movie                # Process details
pm2 logs auto-movie                # View logs
pm2 monit                          # Monitor resources
pm2 reload auto-movie              # Zero-downtime reload
pm2 restart auto-movie             # Restart (with downtime)
pm2 stop auto-movie                # Stop process
pm2 start ecosystem.config.js      # Start process

# Health Checks
curl http://localhost:3010         # Check app locally
curl https://auto-movie.ft.tc      # Check via Nginx
pm2 list | grep auto-movie         # Check PM2 status

# Logs
pm2 logs auto-movie --lines 100    # Last 100 lines
tail -f logs/combined.log          # Follow logs
cat logs/error.log                 # Error log

# Git Operations
git status                         # Check status
git pull origin master             # Pull latest
git log --oneline -10              # Recent commits
```

## Next Steps

1. ✅ Configure GitHub Secrets
2. ✅ Test deployment workflow
3. ✅ Set up monitoring alerts
4. ✅ Configure backup strategy
5. ✅ Document environment variables
6. ✅ Set up staging environment (optional)

Happy deploying! 🚀
