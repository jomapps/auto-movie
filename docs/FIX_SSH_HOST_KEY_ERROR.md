# Fix: SSH Host Key Verification Error

## The Error You're Seeing

```
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
Someone could be eavesdropping on you right now (man-in-the-middle attack)!
...
Host key verification failed.
```

## What This Means

This happens when:
- The server was reinstalled
- The server's IP was reassigned
- The server's SSH keys were regenerated

**In your case:** This is expected and safe. The server's host key changed, and you just need to update your local `known_hosts` file.

## Quick Fix (3 Steps)

### Step 1: Remove Old Host Key

```bash
ssh-keygen -R 85.208.51.186
```

**Expected output:**
```
# Host 85.208.51.186 found: line 27
/c/Users/leoge/.ssh/known_hosts updated.
Original contents retained as /c/Users/leoge/.ssh/known_hosts.old
```

### Step 2: Add New Host Key

```bash
ssh-keyscan -H 85.208.51.186 >> ~/.ssh/known_hosts
```

**Expected output:**
```
# 85.208.51.186:22 SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.10
```

### Step 3: Copy Your Deploy Key to Server

```bash
ssh-copy-id -i ~/.ssh/github_deploy_auto_movie.pub root@85.208.51.186
```

**You'll be prompted for password** (since you haven't copied the key yet):
- Enter the server's root password
- This adds your public key to the server's `authorized_keys`

**Expected output:**
```
Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'root@85.208.51.186'"
and check to make sure that only the key(s) you wanted were added.
```

### Step 4: Test Connection

```bash
ssh -i ~/.ssh/github_deploy_auto_movie root@85.208.51.186
```

**Expected result:** You should connect **without password prompt**.

If successful, type `exit` to close the connection.

## All Commands in One Block

Copy and paste this entire block into your terminal:

```bash
# Remove old host key
ssh-keygen -R 85.208.51.186

# Add new host key
ssh-keyscan -H 85.208.51.186 >> ~/.ssh/known_hosts

# Copy your public key to server (will ask for password)
ssh-copy-id -i ~/.ssh/github_deploy_auto_movie.pub root@85.208.51.186

# Test connection (should work without password)
ssh -i ~/.ssh/github_deploy_auto_movie root@85.208.51.186 "echo 'SSH connection successful!'"
```

## Then Continue with GitHub Secrets Setup

After fixing the SSH connection, continue with:

1. **Copy Private Key to GitHub:**
   ```bash
   cat ~/.ssh/github_deploy_auto_movie
   ```
   Copy entire output to GitHub Secret `SSH_PRIVATE_KEY`

2. **Add Other Secrets:**
   - `SERVER_HOST` = `85.208.51.186`
   - `SERVER_USER` = `root`
   - `DEPLOY_PATH` = `/var/www/movie-generation-platform/apps/auto-movie`

3. **Enable the Workflow:**
   ```bash
   cd /d/Projects/movie-generation-platform/apps/auto-movie
   git pull origin master
   mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml
   git add .github/workflows/
   git commit -m "chore: enable CI/CD workflow"
   git push origin master
   ```

## Troubleshooting

### Still Getting "Permission Denied"

If after ssh-copy-id you still get "Permission denied", manually add the key:

```bash
# Display your public key
cat ~/.ssh/github_deploy_auto_movie.pub

# SSH into server with password
ssh root@85.208.51.186

# On server, add the key
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit

# Test again
ssh -i ~/.ssh/github_deploy_auto_movie root@85.208.51.186
```

### Using Wrong Key

Make sure you're using the correct key file:

```bash
# List your SSH keys
ls -la ~/.ssh/

# You should see:
# github_deploy_auto_movie (private key)
# github_deploy_auto_movie.pub (public key)
```

### Connection Timeout

If connection times out:
- Check server firewall allows SSH (port 22)
- Verify server is running: `ping 85.208.51.186`
- Try connecting with your normal SSH key first to verify server is accessible

## Summary

The error is **expected and harmless**. Just follow these steps:

1. ✅ Remove old host key: `ssh-keygen -R 85.208.51.186`
2. ✅ Add new host key: `ssh-keyscan -H 85.208.51.186 >> ~/.ssh/known_hosts`
3. ✅ Copy deploy key: `ssh-copy-id -i ~/.ssh/github_deploy_auto_movie.pub root@85.208.51.186`
4. ✅ Test: `ssh -i ~/.ssh/github_deploy_auto_movie root@85.208.51.186`

Then you're ready to configure GitHub Secrets and enable automated deployments!
