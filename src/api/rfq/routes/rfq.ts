/**
 * rfq router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::rfq.rfq', {
  config: {
    find: {
      middlewares: []
    },
    findOne: {
      middlewares: []
    },
    create: {
      policies: ['global::is-buyer']
    },
    update: {
      policies: ['global::is-owner-or-admin']
    },
    delete: {
      policies: ['global::is-owner-or-admin']
    }
  }
});