# ✅ Local Development Setup - Complete

## What's Been Configured

Your local development environment for the **auto-movie** app is now ready! Here's what has been set up:

### 📁 Files Created

1. **`.env.local`** - Environment configuration file
   - Pre-configured to connect to live production services
   - Contains placeholders for all required credentials
   - Already in `.gitignore` (safe from accidental commits)

2. **`dev-local.sh`** - Linux/Mac startup script
   - Automated pre-flight checks
   - Service connectivity verification
   - Type generation
   - Development server startup

3. **`dev-local.ps1`** - Windows PowerShell startup script
   - Same features as bash script
   - Windows-compatible commands
   - Colored output for better UX

4. **`docs/local-development-setup.md`** - Comprehensive guide
   - Detailed setup instructions
   - Architecture diagrams
   - Troubleshooting section
   - Security best practices

5. **`docs/quick-start-local-dev.md`** - Quick reference
   - 5-minute setup guide
   - Common commands
   - Quick troubleshooting

6. **Updated `README.md`**
   - Added local development section
   - Links to new documentation
   - Clear distinction between local and standalone development

## 🎯 Next Steps

### 1. Configure Your Environment

Open `.env.local` and fill in the required values:

```bash
cd apps/auto-movie
code .env.local  # or your preferred editor
```

**Critical values to set:**

- [ ] `DATABASE_URI` - Production MongoDB connection string
- [ ] `PAYLOAD_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- [ ] `R2_ACCOUNT_ID` - From Cloudflare R2 dashboard
- [ ] `R2_ACCESS_KEY_ID` - From Cloudflare R2 dashboard
- [ ] `R2_SECRET_ACCESS_KEY` - From Cloudflare R2 dashboard
- [ ] `R2_BUCKET_NAME` - Your R2 bucket name
- [ ] `R2_ENDPOINT` - Your R2 endpoint URL
- [ ] `OPENROUTER_API_KEY` - From https://openrouter.ai/
- [ ] `FAL_KEY` - From https://fal.ai/
- [ ] `ELEVENLABS_API_KEY` - From https://elevenlabs.io/
- [ ] `JINA_API_KEY` - From https://jina.ai/
- [ ] `CELERY_TASK_API_KEY` - From production task service config
- [ ] `BRAIN_SERVICE_API_KEY` - From production brain service config

### 2. Verify Service Access

Ensure you can reach production services:

```bash
# Test Brain Service
curl https://brain.ft.tc/health

# Test Task Service
curl https://tasks.ft.tc/health

# Test Agents Service
curl https://agents.ft.tc/health
```

### 3. Whitelist Your IP (if using MongoDB Atlas)

1. Go to MongoDB Atlas dashboard
2. Navigate to Network Access
3. Add your current IP address
4. Save changes

### 4. Start Development

**Option A: Use the startup script (recommended)**

Linux/Mac:
```bash
./dev-local.sh
```

Windows PowerShell:
```powershell
.\dev-local.ps1
```

**Option B: Manual start**

```bash
pnpm install
pnpm generate:types
pnpm dev
```

### 5. Access Your Local App

Once started, access:

- **Main App**: http://localhost:3010
- **Admin Panel**: http://localhost:3010/admin
- **API**: http://localhost:3010/api/v1

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL DEVELOPMENT                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Auto-Movie App (localhost:3010)                   │     │
│  │  - Next.js Dev Server with Hot Reload              │     │
│  │  - Your local code changes                         │     │
│  └────────────────────────────────────────────────────┘     │
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
│  • MongoDB (Production Database)                            │
│  • Cloudflare R2 (Media Storage)                            │
│  • Neo4j (Graph Database)                                   │
│  • AI Services (OpenRouter, Fal.ai, ElevenLabs, Jina)      │
└─────────────────────────────────────────────────────────────┘
```

## 📚 Documentation Reference

- **Quick Start**: `docs/quick-start-local-dev.md` - Get started in 5 minutes
- **Full Setup Guide**: `docs/local-development-setup.md` - Comprehensive instructions
- **API Reference**: `docs/api-reference.md` - API documentation
- **Main README**: `README.md` - Project overview

## 🔒 Security Reminders

⚠️ **Important Security Notes:**

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use different secrets** for local vs production
3. **Rotate API keys regularly**
4. **Be careful with production data** - Your local changes can affect live data
5. **Use VPN** if accessing from public networks
6. **Monitor access logs** for unusual activity

## 🐛 Common Issues

### Can't connect to MongoDB
- Verify IP is whitelisted in MongoDB Atlas
- Check connection string format
- Test with: `mongosh "your-connection-string"`

### Service API calls failing
- Verify API keys are correct and not expired
- Check service URLs are accessible
- Test with: `curl -H "Authorization: Bearer YOUR_KEY" https://brain.ft.tc/health`

### Port 3010 already in use
- Stop other processes: `lsof -ti:3010 | xargs kill` (Mac/Linux)
- Or change port in `package.json` dev script

### Type errors after changes
```bash
pnpm generate:types
```

### Hot reload not working
```bash
pnpm devsafe  # Clean restart
```

## 🚀 Development Workflow

1. **Start the dev server** with `./dev-local.sh`
2. **Make code changes** in `src/` directory
3. **See changes instantly** via hot reload
4. **Test with live data** from production services
5. **Debug locally** with full access to logs
6. **Run tests** with `pnpm test`
7. **Commit changes** when ready

## 📊 What's Different from Production?

| Aspect | Local Development | Production |
|--------|------------------|------------|
| Auto-Movie App | localhost:3010 | https://auto-movie.ft.tc |
| Hot Reload | ✅ Enabled | ❌ Disabled |
| Source Maps | ✅ Enabled | ❌ Disabled |
| Debug Logging | ✅ Available | ⚠️ Limited |
| Build Optimization | ❌ Development | ✅ Production |
| All Other Services | 🔴 Live Production | 🔴 Live Production |

## 🎓 Learning Resources

- **Next.js 15 Docs**: https://nextjs.org/docs
- **PayloadCMS 3 Docs**: https://payloadcms.com/docs
- **React 19 Docs**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

## 💡 Pro Tips

1. **Use React DevTools** for debugging components
2. **Enable VS Code debugging** for breakpoints
3. **Use `console.log`** liberally during development
4. **Check Network tab** in browser DevTools for API calls
5. **Monitor terminal output** for server-side logs
6. **Use `pnpm devsafe`** if you encounter weird issues
7. **Keep dependencies updated** with `pnpm update`

## 🤝 Getting Help

- **Documentation**: Check `docs/` directory
- **Team Chat**: Ask in your team communication channel
- **GitHub Issues**: Report bugs or request features
- **Stack Overflow**: Search for Next.js/PayloadCMS questions

## ✅ Verification Checklist

Before you start coding, verify:

- [ ] `.env.local` is configured with all required values
- [ ] Can connect to production MongoDB
- [ ] Can reach all production services (brain, tasks, agents)
- [ ] `pnpm install` completed successfully
- [ ] `pnpm generate:types` completed successfully
- [ ] `pnpm dev` starts without errors
- [ ] Can access http://localhost:3010
- [ ] Can log in to admin panel
- [ ] Hot reload works when editing files

## 🎉 You're Ready!

Everything is set up and ready for local development. Run the startup script and start building!

```bash
./dev-local.sh  # Linux/Mac
# or
.\dev-local.ps1  # Windows
```

**Happy coding! 🚀**

---

*Last updated: 2025-09-30*
*Setup completed by: Augment Agent*

