#!/bin/bash

# ============================================================================
# Local Development Startup Script for Auto-Movie App
# ============================================================================
# This script helps you start local development with proper checks and setup
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Auto-Movie Local Development Startup                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# Pre-flight Checks
# ============================================================================

echo -e "${YELLOW}Running pre-flight checks...${NC}"
echo ""

# Check Node.js version
echo -n "Checking Node.js version... "
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_NODE_MAJOR=18
CURRENT_NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$CURRENT_NODE_MAJOR" -lt "$REQUIRED_NODE_MAJOR" ]; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: Node.js version $NODE_VERSION is too old.${NC}"
    echo -e "${RED}Required: Node.js 18.20.2+ or 20.9.0+${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} (v$NODE_VERSION)"

# Check pnpm
echo -n "Checking pnpm... "
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: pnpm is not installed.${NC}"
    echo -e "${YELLOW}Install with: npm install -g pnpm${NC}"
    exit 1
fi
PNPM_VERSION=$(pnpm -v)
echo -e "${GREEN}✓${NC} (v$PNPM_VERSION)"

# Check .env.local exists
echo -n "Checking .env.local file... "
if [ ! -f ".env.local" ]; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: .env.local file not found.${NC}"
    echo -e "${YELLOW}Please create .env.local from .env.example and configure it.${NC}"
    echo -e "${YELLOW}See docs/local-development-setup.md for instructions.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Check critical environment variables
echo -n "Checking environment variables... "
source .env.local

MISSING_VARS=()

if [ -z "$PAYLOAD_SECRET" ] || [ "$PAYLOAD_SECRET" = "your-secret-key-here" ]; then
    MISSING_VARS+=("PAYLOAD_SECRET")
fi

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "your-nextauth-secret" ]; then
    MISSING_VARS+=("NEXTAUTH_SECRET")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: The following environment variables need to be configured:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}  - $var${NC}"
    done
    echo -e "${YELLOW}Please edit .env.local and set these values.${NC}"
    echo -e "${YELLOW}See docs/local-development-setup.md for instructions.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Check if using local MongoDB
if [[ "$DATABASE_URI" == *"localhost"* ]] || [[ "$DATABASE_URI" == *"127.0.0.1"* ]]; then
    echo -n "Checking local MongoDB... "
    if mongosh --eval "db.version()" --quiet > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} (running)"
    else
        echo -e "${RED}✗${NC}"
        echo -e "${RED}Error: MongoDB is not running locally.${NC}"
        echo -e "${YELLOW}Start MongoDB with: docker-compose up -d mongo${NC}"
        echo -e "${YELLOW}Or see: docs/local-mongodb-redis-setup.md${NC}"
        exit 1
    fi
fi

# Check if using local Redis
if [[ "$REDIS_URL" == *"localhost"* ]] || [[ "$REDIS_URL" == *"127.0.0.1"* ]]; then
    echo -n "Checking local Redis... "
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} (running)"
    else
        echo -e "${YELLOW}⚠${NC} (not running - may be optional)"
        echo -e "${YELLOW}Start Redis with: docker run -d -p 6379:6379 redis:latest${NC}"
    fi
fi

# Check port availability
echo -n "Checking port 3010 availability... "
if lsof -Pi :3010 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${RED}✗${NC}"
    echo -e "${RED}Error: Port 3010 is already in use.${NC}"
    echo -e "${YELLOW}Stop the process using port 3010 or change the port in package.json${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Check node_modules
echo -n "Checking dependencies... "
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}"
    echo -e "${YELLOW}Dependencies not installed. Running pnpm install...${NC}"
    pnpm install
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC}"
fi

echo ""

# ============================================================================
# Service Connectivity Checks
# ============================================================================

echo -e "${YELLOW}Checking connectivity to production services...${NC}"
echo ""

# Function to check service health
check_service() {
    local service_name=$1
    local service_url=$2
    
    echo -n "Checking $service_name... "
    
    if curl -s -f -m 5 "$service_url/health" > /dev/null 2>&1 || \
       curl -s -f -m 5 "$service_url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} (reachable)"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} (unreachable - may cause issues)"
        return 1
    fi
}

# Check services
check_service "Brain Service" "$NEXT_PUBLIC_BRAIN_SERVICE_URL" || true
check_service "Task Service" "$NEXT_PUBLIC_TASK_SERVICE_URL" || true
check_service "Agents Service" "$NEXT_PUBLIC_AGENTS_SERVICE_URL" || true

echo ""

# ============================================================================
# Generate Types
# ============================================================================

echo -e "${YELLOW}Generating PayloadCMS types...${NC}"
pnpm generate:types
echo -e "${GREEN}✓${NC} Types generated"
echo ""

# ============================================================================
# Start Development Server
# ============================================================================

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  All checks passed! Starting development server...        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Application will be available at:${NC}"
echo -e "${BLUE}  → Main App:    ${GREEN}http://localhost:3010${NC}"
echo -e "${BLUE}  → Admin Panel: ${GREEN}http://localhost:3010/admin${NC}"
echo -e "${BLUE}  → API:         ${GREEN}http://localhost:3010/api/v1${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Start the development server
pnpm dev

