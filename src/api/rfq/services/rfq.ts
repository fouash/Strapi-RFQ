/**
 * rfq service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::rfq.rfq', ({ strapi }) => ({
  async findRelatedRfqs(rfqId: number, limit = 10) {
    const rfq = await strapi.entityService.findOne('api::rfq.rfq', rfqId) as any;
    
    if (!rfq || !rfq.keywords) return [];
    
    const relatedRfqs = await strapi.entityService.findMany('api::rfq.rfq', {
      filters: {
        id: { $ne: rfqId },
        $or: [
          { category: rfq.category },
          { keywords: { $containsi: rfq.keywords } }
        ]
      },
      populate: ['buyer'],
      limit
    });
    
    return relatedRfqs;
  },
  
  async getTrendingKeywords(limit = 10) {
    // This would require a more complex query in a real implementation
    // For now, return a simple mock
    return [
      'construction', 'technology', 'manufacturing', 'services', 'healthcare'
    ].slice(0, limit);
  }
}));