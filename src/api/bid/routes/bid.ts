/**
 * bid router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::bid.bid', {
  config: {
    create: {
      policies: ['global::is-vendor']
    },
    update: {
      policies: ['global::is-owner-or-admin']
    },
    delete: {
      policies: ['global::is-owner-or-admin']
    }
  }
});