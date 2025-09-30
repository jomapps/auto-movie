# Local MongoDB and Redis Setup

## Overview

This guide covers running MongoDB and Redis locally for the auto-movie app while still connecting to live production services for everything else.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Auto-Movie App (localhost:3010)                   │     │
│  │  - Next.js Dev Server                              │     │
│  │  - Hot Reload Enabled                              │     │
│  └────────────────────────────────────────────────────┘     │
│                            │                                 │
│  ┌────────────────────────┴────────────────────────┐        │
│  │                                                  │        │
│  ▼                                                  ▼        │
│  ┌──────────────────┐                ┌──────────────────┐   │
│  │ MongoDB          │                │ Redis            │   │
│  │ localhost:27017  │                │ localhost:6379   │   │
│  │ (Local)          │                │ (Local)          │   │
│  └──────────────────┘                └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Connects to ↓
                            │
┌─────────────────────────────────────────────────────────────┐
│                  LIVE PRODUCTION SERVICES                    │
│                                                              │
│  • Brain Service (brain.ft.tc:8002)                         │
│  • Task Service (tasks.ft.tc:8001)                          │
│  • Agents Service (agents.ft.tc:8003)                       │
│  • Cloudflare R2 (Media Storage)                            │
│  • Neo4j (Graph Database)                                   │
│  • AI Services (OpenRouter, Fal.ai, ElevenLabs, Jina)      │
└─────────────────────────────────────────────────────────────┘
```

## Benefits of Local MongoDB & Redis

✅ **Faster Development**
- No network latency
- Instant database operations
- Quick iterations

✅ **Offline Development**
- Work without internet connection
- No dependency on production database availability

✅ **Safe Testing**
- Test destructive operations safely
- No risk to production data
- Easy to reset and start fresh

✅ **Cost Savings**
- No cloud database costs during development
- No data transfer fees

✅ **Better Debugging**
- Direct access to database
- Easy to inspect data
- Can use local database tools

## MongoDB Setup

### Option 1: Docker (Recommended)

**Using Docker Compose:**

The app already has a `docker-compose.yml` file. Start MongoDB:

```bash
cd apps/auto-movie

# Start MongoDB only
docker-compose up -d mongo

# Verify it's running
docker-compose ps
```

**Standalone Docker:**

```bash
# Run MongoDB container
docker run -d \
  --name auto-movie-mongo \
  -p 27017:27017 \
  -v auto-movie-data:/data/db \
  mongo:latest

# Verify it's running
docker ps | grep auto-movie-mongo
```

### Option 2: Native Installation

**macOS (using Homebrew):**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
mongosh --eval "db.version()"
```

**Ubuntu/Debian:**
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh --eval "db.version()"
```

**Windows:**
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install as a Windows Service
5. Verify in Services that MongoDB is running

### Verify MongoDB Connection

```bash
# Connect with mongosh
mongosh mongodb://localhost:27017/auto-movie

# Test connection
db.version()
show dbs
```

## Redis Setup

### Option 1: Docker (Recommended)

**Standalone Docker:**
```bash
# Run Redis container
docker run -d \
  --name auto-movie-redis \
  -p 6379:6379 \
  redis:latest

# Verify it's running
docker ps | grep auto-movie-redis

# Test connection
docker exec -it auto-movie-redis redis-cli ping
# Should return: PONG
```

**With persistence:**
```bash
docker run -d \
  --name auto-movie-redis \
  -p 6379:6379 \
  -v auto-movie-redis-data:/data \
  redis:latest redis-server --appendonly yes
```

### Option 2: Native Installation

**macOS (using Homebrew):**
```bash
# Install Redis
brew install redis

# Start Redis service
brew services start redis

# Verify it's running
redis-cli ping
# Should return: PONG
```

**Ubuntu/Debian:**
```bash
# Install Redis
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify
redis-cli ping
# Should return: PONG
```

**Windows:**
1. Download Redis from https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`
3. Or use WSL2 and follow Linux instructions

### Verify Redis Connection

```bash
# Test with redis-cli
redis-cli

# Inside redis-cli:
127.0.0.1:6379> ping
PONG
127.0.0.1:6379> set test "hello"
OK
127.0.0.1:6379> get test
"hello"
127.0.0.1:6379> exit
```

## Environment Configuration

Your `.env.local` should have:

```bash
# Local MongoDB
DATABASE_URI=mongodb://localhost:27017/auto-movie

# Local Redis (if used by your app)
REDIS_URL=redis://localhost:6379/0
```

## Starting Everything Together

### Using Docker Compose (Easiest)

Create or use the existing `docker-compose.yml`:

```bash
cd apps/auto-movie

# Start MongoDB and Redis
docker-compose up -d mongo

# If you have Redis in docker-compose.yml:
# docker-compose up -d mongo redis

# Start your app
pnpm dev
```

### Using Startup Script

The startup scripts will automatically detect local MongoDB and Redis:

```bash
./dev-local.sh  # Linux/Mac
.\dev-local.ps1  # Windows
```

### Manual Start

```bash
# 1. Ensure MongoDB is running
mongosh --eval "db.version()"

# 2. Ensure Redis is running
redis-cli ping

# 3. Start the app
pnpm dev
```

## Database Management

### MongoDB Management Tools

**MongoDB Compass (GUI):**
- Download: https://www.mongodb.com/products/compass
- Connect to: `mongodb://localhost:27017`
- Browse collections, run queries, view indexes

**mongosh (CLI):**
```bash
# Connect to database
mongosh mongodb://localhost:27017/auto-movie

# Common commands
show collections
db.users.find()
db.projects.countDocuments()
db.sessions.find().limit(5)
```

### Redis Management Tools

**RedisInsight (GUI):**
- Download: https://redis.com/redis-enterprise/redis-insight/
- Connect to: `localhost:6379`
- Browse keys, monitor performance

**redis-cli (CLI):**
```bash
# Connect to Redis
redis-cli

# Common commands
KEYS *
GET key_name
SET key_name value
DEL key_name
FLUSHDB  # Clear current database (careful!)
```

## Data Management

### Seeding Local Database

Create a seed script `scripts/seed-local-db.js`:

```javascript
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017/auto-movie';
const client = new MongoClient(uri);

async function seed() {
  try {
    await client.connect();
    const db = client.db('auto-movie');
    
    // Create test user
    await db.collection('users').insertOne({
      email: 'dev@example.com',
      name: 'Dev User',
      createdAt: new Date(),
    });
    
    console.log('✓ Database seeded');
  } finally {
    await client.close();
  }
}

seed();
```

Run:
```bash
node scripts/seed-local-db.js
```

### Backup Local Data

**MongoDB:**
```bash
# Backup
mongodump --uri="mongodb://localhost:27017/auto-movie" --out=./backup

# Restore
mongorestore --uri="mongodb://localhost:27017/auto-movie" ./backup/auto-movie
```

**Redis:**
```bash
# Backup (creates dump.rdb)
redis-cli SAVE

# Copy the dump file
cp /var/lib/redis/dump.rdb ./backup/

# Restore (stop Redis, replace dump.rdb, start Redis)
```

### Reset Local Database

**MongoDB:**
```bash
# Drop entire database
mongosh mongodb://localhost:27017/auto-movie --eval "db.dropDatabase()"

# Or drop specific collections
mongosh mongodb://localhost:27017/auto-movie --eval "db.users.drop()"
```

**Redis:**
```bash
# Clear all data
redis-cli FLUSHALL

# Clear current database only
redis-cli FLUSHDB
```

## Troubleshooting

### MongoDB Won't Start

**Check if port is in use:**
```bash
lsof -i :27017  # Mac/Linux
netstat -ano | findstr :27017  # Windows
```

**Check MongoDB logs:**
```bash
# Docker
docker logs auto-movie-mongo

# Native (macOS)
tail -f /usr/local/var/log/mongodb/mongo.log

# Native (Linux)
sudo tail -f /var/log/mongodb/mongod.log
```

### Redis Won't Start

**Check if port is in use:**
```bash
lsof -i :6379  # Mac/Linux
netstat -ano | findstr :6379  # Windows
```

**Check Redis logs:**
```bash
# Docker
docker logs auto-movie-redis

# Native
redis-cli INFO server
```

### Connection Refused

**MongoDB:**
```bash
# Check if MongoDB is running
ps aux | grep mongod  # Mac/Linux
docker ps | grep mongo  # Docker

# Try connecting with verbose output
mongosh mongodb://localhost:27017/auto-movie --verbose
```

**Redis:**
```bash
# Check if Redis is running
ps aux | grep redis  # Mac/Linux
docker ps | grep redis  # Docker

# Try connecting
redis-cli -h localhost -p 6379 ping
```

### Performance Issues

**MongoDB:**
- Create indexes for frequently queried fields
- Monitor slow queries with profiling
- Increase cache size if needed

**Redis:**
- Monitor memory usage: `redis-cli INFO memory`
- Set maxmemory policy if needed
- Use Redis persistence appropriately

## Best Practices

### Development Workflow

1. **Start services first**
   ```bash
   docker-compose up -d mongo
   # or start native services
   ```

2. **Verify connectivity**
   ```bash
   mongosh --eval "db.version()"
   redis-cli ping
   ```

3. **Start app**
   ```bash
   pnpm dev
   ```

4. **Stop services when done**
   ```bash
   docker-compose down
   # or stop native services
   ```

### Data Isolation

- Use separate databases for different features
- Prefix Redis keys by feature: `session:123`, `cache:user:456`
- Regular backups before major changes

### Security

- Local services don't need authentication for development
- Don't expose ports publicly
- Use firewall rules if needed

## Switching Between Local and Production

To switch back to production databases, update `.env.local`:

```bash
# Production MongoDB
DATABASE_URI=mongodb+srv://user:pass@cluster.mongodb.net/auto-movie

# Production Redis (if applicable)
REDIS_URL=redis://production-redis:6379/0
```

Then restart the app:
```bash
pnpm dev
```

## Next Steps

Now that you have local MongoDB and Redis running:

1. ✅ Start the development server: `./dev-local.sh`
2. ✅ Create test data in your local database
3. ✅ Develop features without affecting production
4. ✅ Test database operations safely
5. ✅ Use database tools to inspect data

---

**Happy local development! 🚀**

