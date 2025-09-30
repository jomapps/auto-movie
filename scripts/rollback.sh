#!/bin/bash
# Auto-Movie Rollback Script
# Rollback to a previous backup
#
# Usage: bash scripts/rollback.sh [backup_timestamp]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

APP_NAME="auto-movie"
APP_DIR="/var/www/movie-generation-platform/apps/auto-movie"
BACKUP_DIR="${APP_DIR}/backups"

log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

cd "${APP_DIR}"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Auto-Movie Rollback Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# List available backups
log "Available backups:"
ls -lht "${BACKUP_DIR}" | grep "backup_" | head -10

echo ""

# Get backup to restore
if [ -z "$1" ]; then
  read -p "Enter backup timestamp (e.g., 20250930_123045) or 'latest': " BACKUP_TIMESTAMP
else
  BACKUP_TIMESTAMP="$1"
fi

if [ "${BACKUP_TIMESTAMP}" = "latest" ]; then
  BACKUP_PATH=$(ls -t "${BACKUP_DIR}"/backup_*.next 2>/dev/null | head -1)
  if [ -z "${BACKUP_PATH}" ]; then
    error "No backups found"
    exit 1
  fi
else
  BACKUP_PATH="${BACKUP_DIR}/backup_${BACKUP_TIMESTAMP}.next"
fi

if [ ! -d "${BACKUP_PATH}" ]; then
  error "Backup not found: ${BACKUP_PATH}"
  exit 1
fi

log "Restoring backup: ${BACKUP_PATH}"

# Backup current state before rollback
log "Backing up current state..."
CURRENT_BACKUP="${BACKUP_DIR}/pre_rollback_$(date +%Y%m%d_%H%M%S).next"
if [ -d ".next" ]; then
  cp -r .next "${CURRENT_BACKUP}"
fi

# Restore backup
log "Restoring backup..."
rm -rf .next
cp -r "${BACKUP_PATH}" .next

# Reload PM2
log "Reloading PM2..."
pm2 reload "${APP_NAME}" || pm2 restart "${APP_NAME}"

# Health check
sleep 3
if pm2 list | grep -q "${APP_NAME}.*online"; then
  echo ""
  echo -e "${GREEN}✅ Rollback successful!${NC}"
  echo ""
  pm2 list | grep "${APP_NAME}"
else
  error "Rollback failed - app is not online"
  pm2 logs "${APP_NAME}" --lines 30 --nostream
  exit 1
fi
