# ============================================================================
# Local Development Startup Script for Auto-Movie App (PowerShell)
# ============================================================================
# This script helps you start local development with proper checks and setup
# ============================================================================

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-ColorOutput Blue "╔════════════════════════════════════════════════════════════╗"
Write-ColorOutput Blue "║     Auto-Movie Local Development Startup                  ║"
Write-ColorOutput Blue "╚════════════════════════════════════════════════════════════╝"
Write-Output ""

# ============================================================================
# Pre-flight Checks
# ============================================================================

Write-ColorOutput Yellow "Running pre-flight checks..."
Write-Output ""

# Check Node.js version
Write-Host "Checking Node.js version... " -NoNewline
try {
    $nodeVersion = node -v
    $nodeVersionNumber = $nodeVersion.TrimStart('v')
    $nodeMajor = [int]($nodeVersionNumber.Split('.')[0])
    
    if ($nodeMajor -lt 18) {
        Write-ColorOutput Red "✗"
        Write-ColorOutput Red "Error: Node.js version $nodeVersion is too old."
        Write-ColorOutput Red "Required: Node.js 18.20.2+ or 20.9.0+"
        exit 1
    }
    Write-ColorOutput Green "✓ ($nodeVersion)"
} catch {
    Write-ColorOutput Red "✗"
    Write-ColorOutput Red "Error: Node.js is not installed or not in PATH."
    exit 1
}

# Check pnpm
Write-Host "Checking pnpm... " -NoNewline
try {
    $pnpmVersion = pnpm -v
    Write-ColorOutput Green "✓ (v$pnpmVersion)"
} catch {
    Write-ColorOutput Red "✗"
    Write-ColorOutput Red "Error: pnpm is not installed."
    Write-ColorOutput Yellow "Install with: npm install -g pnpm"
    exit 1
}

# Check .env.local exists
Write-Host "Checking .env.local file... " -NoNewline
if (-not (Test-Path ".env.local")) {
    Write-ColorOutput Red "✗"
    Write-ColorOutput Red "Error: .env.local file not found."
    Write-ColorOutput Yellow "Please create .env.local from .env.example and configure it."
    Write-ColorOutput Yellow "See docs/local-development-setup.md for instructions."
    exit 1
}
Write-ColorOutput Green "✓"

# Check critical environment variables
Write-Host "Checking environment variables... " -NoNewline

# Load .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$missingVars = @()

$payloadSecret = [Environment]::GetEnvironmentVariable("PAYLOAD_SECRET", "Process")
if ([string]::IsNullOrEmpty($payloadSecret) -or $payloadSecret -eq "your-secret-key-here") {
    $missingVars += "PAYLOAD_SECRET"
}

$nextauthSecret = [Environment]::GetEnvironmentVariable("NEXTAUTH_SECRET", "Process")
if ([string]::IsNullOrEmpty($nextauthSecret) -or $nextauthSecret -eq "your-nextauth-secret") {
    $missingVars += "NEXTAUTH_SECRET"
}

if ($missingVars.Count -gt 0) {
    Write-ColorOutput Red "✗"
    Write-ColorOutput Red "Error: The following environment variables need to be configured:"
    foreach ($var in $missingVars) {
        Write-ColorOutput Red "  - $var"
    }
    Write-ColorOutput Yellow "Please edit .env.local and set these values."
    Write-ColorOutput Yellow "See docs/local-development-setup.md for instructions."
    exit 1
}
Write-ColorOutput Green "✓"

# Check if using local MongoDB
$databaseUri = [Environment]::GetEnvironmentVariable("DATABASE_URI", "Process")
if ($databaseUri -match "localhost|127\.0\.0\.1") {
    Write-Host "Checking local MongoDB... " -NoNewline
    try {
        # Check if MongoDB service is running (Windows)
        $mongoService = Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
        if ($mongoService -and $mongoService.Status -eq "Running") {
            Write-ColorOutput Green "✓ (running as Windows service)"
        } else {
            # Try connecting directly
            $mongoTest = mongo --eval "db.version()" --quiet 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput Green "✓ (running)"
            } else {
                throw "MongoDB not responding"
            }
        }
    } catch {
        Write-ColorOutput Red "✗"
        Write-ColorOutput Red "Error: MongoDB is not running locally."
        Write-ColorOutput Yellow "Start MongoDB service with: net start MongoDB"
        Write-ColorOutput Yellow "Or check Windows Services for MongoDB"
        exit 1
    }
}

# Check if using local Redis
$redisUrl = [Environment]::GetEnvironmentVariable("REDIS_URL", "Process")
if ($redisUrl -match "localhost|127\.0\.0\.1") {
    Write-Host "Checking local Redis... " -NoNewline
    try {
        # Check if Redis service is running (Windows)
        $redisService = Get-Service -Name "Redis" -ErrorAction SilentlyContinue
        if ($redisService -and $redisService.Status -eq "Running") {
            Write-ColorOutput Green "✓ (running as Windows service)"
        } else {
            # Try connecting directly
            $redisPing = redis-cli ping 2>&1
            if ($redisPing -match "PONG") {
                Write-ColorOutput Green "✓ (running)"
            } else {
                throw "Redis not responding"
            }
        }
    } catch {
        Write-ColorOutput Yellow "⚠ (not running - may be optional)"
        Write-ColorOutput Yellow "Start Redis service with: net start Redis"
        Write-ColorOutput Yellow "Or check Windows Services for Redis"
    }
}

# Check port availability
Write-Host "Checking port 3010 availability... " -NoNewline
$portInUse = Get-NetTCPConnection -LocalPort 3010 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-ColorOutput Red "✗"
    Write-ColorOutput Red "Error: Port 3010 is already in use."
    Write-ColorOutput Yellow "Stop the process using port 3010 or change the port in package.json"
    exit 1
}
Write-ColorOutput Green "✓"

# Check node_modules
Write-Host "Checking dependencies... " -NoNewline
if (-not (Test-Path "node_modules")) {
    Write-ColorOutput Yellow "⚠"
    Write-ColorOutput Yellow "Dependencies not installed. Running pnpm install..."
    pnpm install
    Write-ColorOutput Green "✓ Dependencies installed"
} else {
    Write-ColorOutput Green "✓"
}

Write-Output ""

# ============================================================================
# Service Connectivity Checks
# ============================================================================

Write-ColorOutput Yellow "Checking connectivity to production services..."
Write-Output ""

function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$ServiceUrl
    )
    
    Write-Host "Checking $ServiceName... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "$ServiceUrl/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput Green "✓ (reachable)"
            return $true
        }
    } catch {
        # Try without /health endpoint
        try {
            $response = Invoke-WebRequest -Uri $ServiceUrl -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput Green "✓ (reachable)"
                return $true
            }
        } catch {
            Write-ColorOutput Yellow "⚠ (unreachable - may cause issues)"
            return $false
        }
    }
    
    Write-ColorOutput Yellow "⚠ (unreachable - may cause issues)"
    return $false
}

# Check services
$brainUrl = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_BRAIN_SERVICE_URL", "Process")
$taskUrl = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_TASK_SERVICE_URL", "Process")
$agentsUrl = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_AGENTS_SERVICE_URL", "Process")

if ($brainUrl) { Test-ServiceHealth "Brain Service" $brainUrl | Out-Null }
if ($taskUrl) { Test-ServiceHealth "Task Service" $taskUrl | Out-Null }
if ($agentsUrl) { Test-ServiceHealth "Agents Service" $agentsUrl | Out-Null }

Write-Output ""

# ============================================================================
# Generate Types
# ============================================================================

Write-ColorOutput Yellow "Generating PayloadCMS types..."
pnpm generate:types
Write-ColorOutput Green "✓ Types generated"
Write-Output ""

# ============================================================================
# Start Development Server
# ============================================================================

Write-ColorOutput Green "╔════════════════════════════════════════════════════════════╗"
Write-ColorOutput Green "║  All checks passed! Starting development server...        ║"
Write-ColorOutput Green "╚════════════════════════════════════════════════════════════╝"
Write-Output ""
Write-ColorOutput Blue "Application will be available at:"
Write-Host "  → Main App:    " -NoNewline
Write-ColorOutput Green "http://localhost:3010"
Write-Host "  → Admin Panel: " -NoNewline
Write-ColorOutput Green "http://localhost:3010/admin"
Write-Host "  → API:         " -NoNewline
Write-ColorOutput Green "http://localhost:3010/api/v1"
Write-Output ""
Write-ColorOutput Yellow "Press Ctrl+C to stop the server"
Write-Output ""
Write-ColorOutput Blue "════════════════════════════════════════════════════════════"
Write-Output ""

# Start the development server
pnpm dev

