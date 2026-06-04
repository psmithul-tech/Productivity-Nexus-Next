module.exports = {
  apps: [
    {
      name: "nexus-next-app",
      script: "npm",
      args: "run start",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    },
    {
      name: "nexus-cron",
      script: "cron.js",
      cwd: "./",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "256M",
      env: {
        NODE_ENV: "production",
        CRON_BASE_URL: "http://localhost:3000",
        CRON_SECRET: "dev-cron-secret"
      }
    }
  ]
};
