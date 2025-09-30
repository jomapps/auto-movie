module.exports = {
  apps: [{
    name: 'auto-movie',
    script: 'pnpm',
    args: 'start',
    cwd: '/var/www/movie-generation-platform/apps/auto-movie',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 3010,
      NODE_OPTIONS: '--no-deprecation --max-old-space-size=8000'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3010,
      NODE_OPTIONS: '--no-deprecation --max-old-space-size=8000'
    },
    error_file: '/var/www/movie-generation-platform/apps/auto-movie/logs/error.log',
    out_file: '/var/www/movie-generation-platform/apps/auto-movie/logs/out.log',
    log_file: '/var/www/movie-generation-platform/apps/auto-movie/logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
