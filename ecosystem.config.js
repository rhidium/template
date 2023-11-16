module.exports = {
  apps: [
    {
      name: 'rhidium-template',
      script: './dist/client/index.js',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
