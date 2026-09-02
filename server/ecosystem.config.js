module.exports = {
  apps: [
    {
      name: 'absensi-lt-api',
      script: './server/index.js',
      cwd: __dirname + '/..',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      time: true,
    },
  ],
};
