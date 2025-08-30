export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  settings: {
    cors: {
      enabled: true,
      headers: '*',
      origin: env.array('CORS_ORIGINS', ['http://localhost:3000', 'https://your-domain.com']),
    },
    logger: {
      level: env('LOG_LEVEL', 'info'),
    },
  },
});
