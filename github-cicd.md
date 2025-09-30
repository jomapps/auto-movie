To achieve zero-downtime deployments with **PM2** and **Nginx** for your Node.js app (`jomapps/auto-movie`), you want a CI/CD pipeline that:

- **On push to `master`:**
  1. Pulls code.
  2. Installs dependencies & builds the app.
  3. If build succeeds, restarts (or reloads) the PM2 process to serve new code.
  4. If build fails, keeps the current live site running.

Here’s a practical approach:

---

## 1. Use GitHub Actions for CI/CD

**.github/workflows/deploy.yml** (example):

````yaml
name: Deploy to Production

on:
  push:
    branches: [master]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Copy files to server
        run: |
          rsync -avz --exclude=node_modules --exclude=.git ./ user@your_server:/path/to/app/

      - name: Run remote build and reload
        run: |
          ssh user@your_server << 'EOF'
            cd /path/to/app
            npm install
            if npm run build; then
              pm2 reload ecosystem.config.js --env production
            else
              echo "Build failed. Not restarting app."
              exit 1
            fi
          EOF
````

**Key points:**
- Replace `user@your_server` and `/path/to/app/` with your actual values.
- You can use `pm2 reload` for zero-downtime reloads.
- If build fails, it **does not reload** — the live app remains untouched.

---

## 2. PM2 & Nginx Setup

- **PM2** manages your Node.js process (`pm2 start ecosystem.config.js`).
- **Nginx** proxies traffic to your app (unchanged during deploy).

---

## 3. What you need to set up

- **SSH key**: Add your server’s SSH private key to GitHub Secrets as `SSH_PRIVATE_KEY`.
- **Ecosystem file**: PM2 config (`ecosystem.config.js`) in your repo.
- **Build script**: In `package.json`, a `build` script (e.g., `npm run build`).
- **Nginx** already points to your PM2 app port.

---

## 4. How it works

1. On push to `master`, GitHub Actions runs.
2. Copies code to server (via `rsync`).
3. Installs dependencies, builds.
4. If build passes, reloads PM2 (no downtime).
5. If build fails, **app stays live with previous version**.

---

**Optional:**  
- Add health checks or notifications if desired.
- Use `pm2 reload` for seamless reloads, not `restart` (to avoid downtime).

---

Let me know if you want a step-by-step guide, example `ecosystem.config.js`, or help with your `package.json` scripts!