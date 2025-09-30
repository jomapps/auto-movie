# Verify Local Development Setup

This guide helps you verify that your local development environment is correctly configured and can connect to all production services.

## Pre-Start Verification

### 1. Check Environment File

```bash
cd apps/auto-movie

# Verify .env.local exists
ls -la .env.local

# Check it's not empty
wc -l .env.local
```

Should show the file exists and has content.

### 2. Verify Critical Environment Variables

```bash
# Source the environment file
source .env.local  # Linux/Mac
# or manually check in editor

# Verify these are NOT placeholder values:
echo $DATABASE_URI
echo $PAYLOAD_SECRET
echo $NEXTAUTH_SECRET
```

None should show placeholder values like "your-secret-key-here".

### 3. Test MongoDB Connection

**Using mongosh:**
```bash
mongosh "$DATABASE_URI"
```

Should connect successfully. Try a simple query:
```javascript
show dbs
use auto-movie
show collections
```

**Using Node.js:**
```bash
node -e "
const { MongoClient } = require('mongodb');
const uri = process.env.DATABASE_URI || 'YOUR_URI_HERE';
const client = new MongoClient(uri);
client.connect()
  .then(() => { console.log('✓ MongoDB connected'); client.close(); })
  .catch(err => { console.error('✗ MongoDB error:', err.message); });
"
```

### 4. Test Production Service Connectivity

```bash
# Test Brain Service
curl -i https://brain.ft.tc/health
# Expected: 200 OK

# Test Task Service  
curl -i https://tasks.ft.tc/health
# Expected: 200 OK

# Test Agents Service
curl -i https://agents.ft.tc/health
# Expected: 200 OK
```

### 5. Test API Keys

**Test OpenRouter:**
```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
# Expected: JSON list of models
```

**Test Fal.ai:**
```bash
curl https://fal.run/fal-ai/fast-sdxl/health \
  -H "Authorization: Key $FAL_KEY"
# Expected: 200 OK or model info
```

**Test ElevenLabs:**
```bash
curl https://api.elevenlabs.io/v1/user \
  -H "xi-api-key: $ELEVENLABS_API_KEY"
# Expected: User info JSON
```

### 6. Verify Cloudflare R2 Access

```bash
# Using AWS CLI (R2 is S3-compatible)
aws s3 ls s3://$R2_BUCKET_NAME \
  --endpoint-url=$R2_ENDPOINT \
  --access-key-id=$R2_ACCESS_KEY_ID \
  --secret-access-key=$R2_SECRET_ACCESS_KEY
# Expected: List of files or empty (no error)
```

## Start-Time Verification

### 1. Install Dependencies

```bash
pnpm install
```

**Verify:**
- No errors during installation
- `node_modules/` directory created
- `pnpm-lock.yaml` updated

### 2. Generate Types

```bash
pnpm generate:types
```

**Verify:**
- No TypeScript errors
- `payload-types.ts` file created/updated
- File contains type definitions for collections

### 3. Start Development Server

```bash
pnpm dev
```

**Watch for:**
- ✓ Server starts on port 3010
- ✓ No compilation errors
- ✓ "Ready" message appears
- ✓ No connection errors to MongoDB
- ✓ No errors about missing environment variables

**Expected output should include:**
```
▲ Next.js 15.4.4
- Local:        http://localhost:3010
- Environments: .env.local

✓ Ready in Xs
```

## Runtime Verification

### 1. Access Main Application

Open browser to: http://localhost:3010

**Verify:**
- [ ] Page loads without errors
- [ ] No console errors in browser DevTools
- [ ] UI renders correctly
- [ ] No network errors in Network tab

### 2. Access Admin Panel

Navigate to: http://localhost:3010/admin

**Verify:**
- [ ] Admin login page loads
- [ ] Can log in with credentials
- [ ] Dashboard displays
- [ ] Collections are visible (Users, Projects, Sessions, Media)

### 3. Test API Endpoints

**Health Check:**
```bash
curl http://localhost:3010/api/health
# Expected: {"status": "ok"} or similar
```

**API v1 (if authenticated):**
```bash
# Get auth token first from admin panel or login
TOKEN="your-jwt-token"

curl http://localhost:3010/api/v1/projects \
  -H "Authorization: Bearer $TOKEN"
# Expected: JSON array of projects
```

### 4. Test Hot Reload

1. Open `src/app/page.tsx` in editor
2. Make a small change (add a comment or space)
3. Save the file
4. Check browser - should auto-refresh

**Verify:**
- [ ] Browser refreshes automatically
- [ ] Changes appear immediately
- [ ] No errors in terminal or browser

### 5. Test Production Service Integration

**Test Brain Service from local app:**

Create a test file `test-brain-service.js`:
```javascript
const BRAIN_SERVICE_URL = process.env.NEXT_PUBLIC_BRAIN_SERVICE_URL || 'https://brain.ft.tc';
const API_KEY = process.env.BRAIN_SERVICE_API_KEY;

fetch(`${BRAIN_SERVICE_URL}/api/health`, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
})
  .then(res => res.json())
  .then(data => console.log('✓ Brain Service:', data))
  .catch(err => console.error('✗ Brain Service error:', err));
```

Run:
```bash
node test-brain-service.js
```

### 6. Test File Upload (if R2 configured)

1. Go to admin panel: http://localhost:3010/admin
2. Navigate to Media collection
3. Try uploading a test image
4. Verify:
   - [ ] Upload succeeds
   - [ ] File appears in Media collection
   - [ ] File is accessible via R2 public URL
   - [ ] Thumbnail generates (if applicable)

### 7. Test WebSocket Connection

Open browser console on http://localhost:3010 and run:

```javascript
const ws = new WebSocket('ws://localhost:3010');
ws.onopen = () => console.log('✓ WebSocket connected');
ws.onerror = (err) => console.error('✗ WebSocket error:', err);
ws.onclose = () => console.log('WebSocket closed');
```

**Verify:**
- [ ] Connection opens successfully
- [ ] No errors in console

## Troubleshooting Failed Verifications

### MongoDB Connection Fails

**Check:**
1. Connection string format is correct
2. IP is whitelisted in MongoDB Atlas
3. Username/password are correct
4. Network connectivity to MongoDB host

**Fix:**
```bash
# Test with mongosh
mongosh "your-connection-string"

# Check IP whitelist in MongoDB Atlas:
# Network Access → IP Access List → Add Current IP
```

### Service Health Checks Fail

**Check:**
1. Service URLs are correct
2. Services are actually running
3. Firewall allows outbound connections
4. DNS resolves correctly

**Fix:**
```bash
# Test DNS resolution
nslookup brain.ft.tc
nslookup tasks.ft.tc

# Test with verbose curl
curl -v https://brain.ft.tc/health

# Check if firewall is blocking
telnet brain.ft.tc 443
```

### API Key Errors

**Check:**
1. Keys are not expired
2. Keys have correct permissions
3. No extra spaces in .env.local
4. Keys are for correct environment

**Fix:**
- Regenerate keys from respective dashboards
- Verify key format matches documentation
- Check for invisible characters

### R2 Upload Fails

**Check:**
1. R2 credentials are correct
2. Bucket exists and is accessible
3. CORS is configured on bucket
4. Endpoint URL is correct

**Fix:**
```bash
# Test with AWS CLI
aws s3 ls s3://your-bucket \
  --endpoint-url=https://your-account.r2.cloudflarestorage.com \
  --access-key-id=YOUR_KEY \
  --secret-access-key=YOUR_SECRET
```

### Hot Reload Not Working

**Check:**
1. File watcher limits (Linux)
2. Antivirus not blocking file changes
3. Files are in correct directory

**Fix:**
```bash
# Increase file watcher limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Clean restart
pnpm devsafe
```

### Port 3010 Already in Use

**Check:**
```bash
# Find process using port
lsof -i :3010  # Mac/Linux
netstat -ano | findstr :3010  # Windows
```

**Fix:**
```bash
# Kill process (Mac/Linux)
lsof -ti:3010 | xargs kill

# Or change port in package.json
"dev": "next dev -p 3011"
```

## Verification Checklist

Use this checklist to ensure everything is working:

### Pre-Start
- [ ] `.env.local` exists and is configured
- [ ] MongoDB connection successful
- [ ] All production services reachable
- [ ] API keys valid
- [ ] R2 credentials working

### Installation
- [ ] `pnpm install` successful
- [ ] `pnpm generate:types` successful
- [ ] No dependency errors

### Runtime
- [ ] Dev server starts on port 3010
- [ ] Main app loads (http://localhost:3010)
- [ ] Admin panel accessible
- [ ] No console errors
- [ ] Hot reload works
- [ ] Can upload files
- [ ] WebSocket connects
- [ ] API endpoints respond

### Integration
- [ ] Can connect to Brain Service
- [ ] Can connect to Task Service
- [ ] Can connect to Agents Service
- [ ] Can read/write to MongoDB
- [ ] Can upload to R2
- [ ] AI services respond

## Success Criteria

Your local development environment is ready when:

✅ All pre-start checks pass  
✅ Server starts without errors  
✅ Application loads in browser  
✅ Admin panel is accessible  
✅ Hot reload works  
✅ Can connect to all production services  
✅ No errors in console or terminal  

## Next Steps

Once verification is complete:

1. **Start developing**: Make changes to the codebase
2. **Run tests**: `pnpm test` to ensure nothing breaks
3. **Check documentation**: Review `docs/` for API reference
4. **Build features**: Start implementing your changes

## Getting Help

If verification fails:

1. **Check logs**: Terminal output and browser console
2. **Review documentation**: `docs/local-development-setup.md`
3. **Test individually**: Isolate which component is failing
4. **Ask for help**: Team chat or GitHub issues

---

**Verification complete? Start coding! 🚀**

