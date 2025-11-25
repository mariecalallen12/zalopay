module.exports = {
  apps: [
    {
      name: 'zalopay-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
    },
    {
      name: 'zalopay-admin-dev',
      cwd: './static/admin',
      script: 'node_modules/vite/bin/vite.js',
      args: 'dev --host 0.0.0.0 --port 5173',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};

