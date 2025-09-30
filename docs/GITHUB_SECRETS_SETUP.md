# GitHub Secrets Setup Guide

## Step-by-Step Instructions

### 1. Generate SSH Deploy Key

On your **local machine** (not the server), run:

```bash
ssh-keygen -t ed25519 -C "github-actions-auto-movie" -f ~/.ssh/github_deploy_auto_movie

# This creates:
# - Private key: ~/.ssh/github_deploy_auto_movie
# - Public key: ~/.ssh/github_deploy_auto_movie.pub
```

When prompted for passphrase, press Enter (no passphrase for CI/CD).

### 2. Add Public Key to Server

**Important:** First, fix the host key issue:

```bash
# Remove old host key (if you see "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED")
ssh-keygen -R 85.208.51.186
ssh-keygen -R vmd177401

# Accept new host key
ssh-keyscan -H 85.208.51.186 >> ~/.ssh/known_hosts
```

Copy the public key to the server:

```bash
# Option 1: Using ssh-copy-id (easiest)
ssh-copy-id -i ~/.ssh/github_deploy_auto_movie.pub root@85.208.51.186

# Option 2: Manual copy (if ssh-copy-id doesn't work)
cat ~/.ssh/github_deploy_auto_movie.pub
# Copy the output and paste it to the server
ssh root@85.208.51.186
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
```

Test the connection:

```bash
# Test with new key
ssh -i ~/.ssh/github_deploy_auto_movie root@85.208.51.186
# Should connect without password
```

got result:
```
leoge@Rampyari MINGW64 /d/Projects/movie-generation-platform/apps/auto-movie (master)
$ ssh -i ~/.ssh/github_deploy_auto_movie root@85.208.51.186
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
It is also possible that a host key has just been changed.
The fingerprint for the ED25519 key sent by the remote host is
SHA256:/8HilUNLIZMpSzYpQaQ6OUFujZQ6JzJ+C2T3YwmfGso.
Please contact your system administrator.
Add correct host key in /c/Users/leoge/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /c/Users/leoge/.ssh/known_hosts:27
Host key for 85.208.51.186 has changed and you have requested strict checking.
Host key verification failed.
```

### 3. Add Secrets to GitHub Repository

1. **Go to your GitHub repository:**
   - Navigate to: `https://github.com/jomapps/auto-movie`

2. **Open Settings:**
   - Click `Settings` tab (top right)

3. **Navigate to Secrets:**
   - Left sidebar → `Secrets and variables` → `Actions`

4. **Add New Repository Secret:**
   - Click `New repository secret` button

### Required Secrets

#### Secret 1: `SSH_PRIVATE_KEY`

**Value:** Your SSH private key

```bash
# Display the private key
cat ~/.ssh/github_deploy_auto_movie

# Copy the ENTIRE output including header and footer:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...content...
# -----END OPENSSH PRIVATE KEY-----
```

**In GitHub:**
- Name: `SSH_PRIVATE_KEY`
- Secret: Paste the entire private key content
- Click `Add secret`

#### Secret 2: `SERVER_HOST`

**Value:** Server IP address (recommended for stability)

**In GitHub:**
- Name: `SERVER_HOST`
- Secret: `85.208.51.186`
- Click `Add secret`

**Note:** Using IP address is more reliable than hostname for CI/CD.

#### Secret 3: `SERVER_USER`

**Value:** SSH username on server

**In GitHub:**
- Name: `SERVER_USER`
- Secret: `root`
- Click `Add secret`

#### Secret 4: `DEPLOY_PATH`

**Value:** Absolute path to application directory

**In GitHub:**
- Name: `DEPLOY_PATH`
- Secret: `/var/www/movie-generation-platform/apps/auto-movie`
- Click `Add secret`

### 4. Verify Secrets

After adding all secrets:

1. Go to `Settings` → `Secrets and variables` → `Actions`
2. You should see 4 repository secrets:
   - `SSH_PRIVATE_KEY`
   - `SERVER_HOST`
   - `SERVER_USER`
   - `DEPLOY_PATH`

## Testing the Setup

### Test 1: Manual Workflow Trigger

1. Go to repository → `Actions` tab
2. Select `Deploy Auto-Movie to Production` workflow
3. Click `Run workflow` dropdown
4. Select `master` branch
5. Click `Run workflow` button
6. Watch the deployment progress

### Test 2: Git Push

```bash
# Make a small change
cd /path/to/local/auto-movie
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: trigger deployment"
git push origin master
```

Go to GitHub → Actions tab to watch deployment.

### Test 3: SSH Connection

Verify GitHub Actions can SSH to server:

```bash
# On your local machine
ssh -i ~/.ssh/github_deploy_auto_movie root@vmd177401 "echo 'SSH connection works'"
```

Should output: `SSH connection works`

## Troubleshooting

### Issue: "WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED"

**Cause:** Server's host key has changed (server reinstall, IP reassignment, etc.)

**Solution:**
```bash
# Remove old host key
ssh-keygen -R 85.208.51.186
ssh-keygen -R vmd177401

# Add new host key
ssh-keyscan -H 85.208.51.186 >> ~/.ssh/known_hosts

# Now try ssh-copy-id again
ssh-copy-id -i ~/.ssh/github_deploy_auto_movie.pub root@85.208.51.186
```

### Issue: "Permission denied (publickey)"

**Cause:** Public key not added to server or wrong key used.

**Solution:**
```bash
# Re-add public key to server
ssh-copy-id -i ~/.ssh/github_deploy_auto_movie.pub root@85.208.51.186

# Verify authorized_keys on server
ssh root@85.208.51.186
cat ~/.ssh/authorized_keys | grep github-actions-auto-movie
```

### Issue: "Host key verification failed"

**Cause:** Server not in known_hosts.

**Solution:**
```bash
# Add server to known_hosts
ssh-keyscan -H 85.208.51.186 >> ~/.ssh/known_hosts
```

**Note:** The GitHub Actions workflow includes `ssh-keyscan` step, so this is handled automatically during deployment.

### Issue: Workflow shows "Secret not found"

**Cause:** Secret name mismatch or not set.

**Solution:**
1. Check secret names are exactly: `SSH_PRIVATE_KEY`, `SERVER_HOST`, `SERVER_USER`, `DEPLOY_PATH`
2. Secrets are case-sensitive
3. Make sure they're added to the correct repository

### Issue: "pnpm: command not found"

**Cause:** pnpm not installed on server.

**Solution:**
```bash
ssh root@vmd177401
npm install -g pnpm@9
```

### Issue: "pm2: command not found"

**Cause:** PM2 not installed on server.

**Solution:**
```bash
ssh root@vmd177401
npm install -g pm2
pm2 startup systemd -u root --hp /root
```

## Security Best Practices

### 1. Dedicated Deploy Key

✅ **DO:** Use a dedicated SSH key for deployments
- Created specifically for GitHub Actions
- Different from your personal SSH key
- No passphrase (required for automation)

❌ **DON'T:** Use your personal SSH key
- Risk of exposure
- Harder to rotate
- Shared across multiple purposes

### 2. Least Privilege

Consider creating a dedicated deploy user:

```bash
# On server
useradd -m -s /bin/bash deploy
usermod -aG www-data deploy

# Grant ownership of app directory
chown -R deploy:www-data /var/www/movie-generation-platform/apps/auto-movie

# Update GitHub secrets
SERVER_USER=deploy
```

### 3. Key Rotation

Rotate deploy keys periodically:

```bash
# Generate new key
ssh-keygen -t ed25519 -C "github-actions-auto-movie-2025" -f ~/.ssh/github_deploy_auto_movie_new

# Add to server
ssh-copy-id -i ~/.ssh/github_deploy_auto_movie_new.pub root@vmd177401

# Update GitHub secret SSH_PRIVATE_KEY with new key
# Remove old key from server after testing
```

### 4. Audit Access

Monitor deployment activity:

```bash
# Check recent SSH logins on server
last -a | grep root

# View auth logs
tail -f /var/log/auth.log

# Check GitHub Actions runs
# Repository → Actions tab
```

## Advanced Configuration

### Multiple Environments

To support staging and production:

1. **Create environment-specific secrets:**
   - Go to `Settings` → `Environments`
   - Create `production` environment
   - Add environment-specific secrets

2. **Update workflow:**
   ```yaml
   jobs:
     deploy:
       environment: production  # or staging
       env:
         SERVER_HOST: ${{ secrets.SERVER_HOST }}
   ```

### Slack/Discord Notifications

Add notification step to workflow:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Custom Build Cache

For faster builds, add GitHub cache:

```yaml
- name: Cache .next folder
  uses: actions/cache@v4
  with:
    path: .next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/pnpm-lock.yaml') }}
```

## Summary Checklist

Before first deployment:

- [ ] SSH key pair generated
- [ ] Public key added to server (`~/.ssh/authorized_keys`)
- [ ] SSH connection tested locally
- [ ] All 4 GitHub secrets added:
  - [ ] `SSH_PRIVATE_KEY`
  - [ ] `SERVER_HOST`
  - [ ] `SERVER_USER`
  - [ ] `DEPLOY_PATH`
- [ ] pnpm installed on server
- [ ] PM2 installed on server
- [ ] Workflow file committed to repository (`.github/workflows/deploy.yml`)
- [ ] Manual workflow trigger tested
- [ ] Git push deployment tested
- [ ] PM2 process running after deployment
- [ ] Application accessible via HTTPS

## Quick Reference

**Server Details:**
- IP Address: `85.208.51.186` (use this for GitHub Secrets)
- Hostname: `vmd177401` (alternative)
- User: `root`
- App Path: `/var/www/movie-generation-platform/apps/auto-movie`
- Port: `3010`
- URL: `https://auto-movie.ft.tc`

**GitHub Repository:**
- URL: `https://github.com/jomapps/auto-movie`
- Default Branch: `master`

**Key Commands:**
```bash
# Test SSH connection
ssh -i ~/.ssh/github_deploy_auto_movie root@85.208.51.186

# View GitHub secrets (can't view values, only names)
# Go to: Settings → Secrets and variables → Actions

# Manual deploy from server
ssh root@85.208.51.186
cd /var/www/movie-generation-platform/apps/auto-movie
bash scripts/deploy.sh

# Check PM2 status
ssh root@85.208.51.186 "pm2 list | grep auto-movie"
```

## Need Help?

If deployment fails:

1. **Check GitHub Actions logs:**
   - Repository → Actions → Click failed workflow → Expand failed step

2. **Check server logs:**
   ```bash
   ssh root@vmd177401
   pm2 logs auto-movie --lines 100
   ```

3. **Check SSH connectivity:**
   ```bash
   ssh -i ~/.ssh/github_deploy_auto_movie root@85.208.51.186 "echo 'Connection OK'"
   ```

4. **Verify secrets:**
   - Go to repository Settings → Secrets
   - Ensure all 4 secrets exist (can't view values)
   - Re-add if unsure

Good luck with your deployments! 🚀
