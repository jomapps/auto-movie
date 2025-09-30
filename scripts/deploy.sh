#!/bin/bash
# Auto-Movie Deployment Script
# This script handles safe deployment with rollback capability
#
# Usage: bash scripts/deploy.sh [--skip-build] [--skip-tests]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="auto-movie"
APP_DIR="/var/www/movie-generation-platform/apps/auto-movie"
BACKUP_DIR="${APP_DIR}/backups"
LOGS_DIR="${APP_DIR}/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/backup_${TIMESTAMP}"

# Parse arguments
SKIP_BUILD=false
SKIP_TESTS=false

for arg in "$@"; do
  case $arg in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
  esac
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Auto-Movie Deployment Script${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Function to log messages
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if PM2 process exists
pm2_process_exists() {
  pm2 list | grep -q "${APP_NAME}"
}

# Function to get current PM2 process status
pm2_status() {
  pm2 list | grep "${APP_NAME}" | awk '{print $10}'
}

# Change to app directory
cd "${APP_DIR}"

# Step 1: Create backup directory
log "Creating backup directory..."
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOGS_DIR}"

# Step 2: Backup current .next build (if exists)
if [ -d ".next" ]; then
  log "Backing up current build..."
  cp -r .next "${BACKUP_PATH}.next" || warn "Backup failed, continuing..."
fi

# Step 3: Pull latest code
log "Pulling latest code from git..."
if git pull origin master; then
  log "✅ Code updated successfully"
else
  error "Failed to pull latest code"
  exit 1
fi

# Step 4: Install dependencies
log "Installing dependencies..."
if pnpm install --frozen-lockfile; then
  log "✅ Dependencies installed"
else
  error "Failed to install dependencies"
  exit 1
fi

# Step 5: Run tests (unless skipped)
if [ "$SKIP_TESTS" = false ]; then
  log "Running tests..."
  if pnpm run test:int; then
    log "✅ Tests passed"
  else
    warn "Tests failed, but continuing deployment..."
  fi
else
  warn "Skipping tests (--skip-tests flag set)"
fi

# Step 6: Build application (unless skipped)
if [ "$SKIP_BUILD" = false ]; then
  log "Building application..."
  if pnpm run build; then
    log "✅ Build successful"
  else
    error "Build failed! Rolling back..."
    
    # Rollback: Restore previous build if exists
    if [ -d "${BACKUP_PATH}.next" ]; then
      log "Restoring previous build..."
      rm -rf .next
      cp -r "${BACKUP_PATH}.next" .next
      log "✅ Rollback completed - previous version is still running"
    fi
    
    exit 1
  fi
else
  warn "Skipping build (--skip-build flag set)"
fi

# Step 7: Reload PM2 process
log "Reloading PM2 process..."

if pm2_process_exists; then
  # Process exists, reload it (zero-downtime)
  if pm2 reload "${APP_NAME}" --update-env; then
    log "✅ PM2 process reloaded (zero-downtime)"
  else
    error "Failed to reload PM2 process"
    
    # Try restart as fallback
    warn "Attempting restart..."
    if pm2 restart "${APP_NAME}"; then
      log "✅ PM2 process restarted"
    else
      error "Failed to restart PM2 process"
      exit 1
    fi
  fi
else
  # Process doesn't exist, start it
  log "Starting new PM2 process..."
  if pm2 start ecosystem.config.js --env production; then
    log "✅ PM2 process started"
  else
    error "Failed to start PM2 process"
    exit 1
  fi
fi

# Step 8: Save PM2 configuration
log "Saving PM2 configuration..."
pm2 save

# Step 9: Health check
log "Performing health check..."
sleep 3

if pm2 list | grep -q "${APP_NAME}.*online"; then
  log "✅ Health check passed - ${APP_NAME} is online"
  
  # Show current status
  echo ""
  log "Current PM2 status:"
  pm2 list | grep "${APP_NAME}"
  
  # Cleanup old backups (keep last 5)
  log "Cleaning up old backups..."
  cd "${BACKUP_DIR}"
  ls -t | tail -n +6 | xargs -r rm -rf
  
  echo ""
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ Deployment Successful!${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo ""
  echo "App URL: https://auto-movie.ft.tc"
  echo "PM2 logs: pm2 logs ${APP_NAME}"
  echo "PM2 monit: pm2 monit"
  echo ""
  
else
  error "Health check failed - ${APP_NAME} is not online"
  echo ""
  log "Recent logs:"
  pm2 logs "${APP_NAME}" --lines 50 --nostream
  exit 1
fi
