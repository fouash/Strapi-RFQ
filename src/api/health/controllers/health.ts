export default {
  async check(ctx) {
    try {
      // Basic health checks
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      };

      // Database connectivity check
      try {
        await strapi.db.connection.raw('SELECT 1');
        health.database = 'connected';
      } catch (error) {
        health.database = 'disconnected';
        health.status = 'degraded';
      }

      ctx.body = health;
      ctx.status = health.status === 'ok' ? 200 : 503;
    } catch (error) {
      ctx.body = {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
      ctx.status = 500;
    }
  },
};