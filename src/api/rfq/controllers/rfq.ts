/**
 * rfq controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::rfq.rfq', ({ strapi }) => ({
  async find(ctx) {
    // Add view count increment logic
    const { results, pagination } = await super.find(ctx);
    return { data: results, meta: { pagination } };
  },
  
  async findOne(ctx) {
    const { id } = ctx.params;
    
    // Increment view count
    const currentRfq = await strapi.entityService.findOne('api::rfq.rfq', id);
    if (currentRfq) {
      await strapi.entityService.update('api::rfq.rfq', id, {
        data: {
          viewCount: (currentRfq.viewCount || 0) + 1
        } as any
      });
    }
    
    const entity = await strapi.entityService.findOne('api::rfq.rfq', id, {
      populate: ['buyer', 'bids', 'awardedBid', 'attachments']
    });
    
    if (!entity) {
      return ctx.notFound('RFQ not found');
    }
    
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
  
  async create(ctx) {
    // Set the buyer from authenticated user
    if (ctx.state.user) {
      const buyer = await strapi.entityService.findMany('api::buyer.buyer', {
        filters: { user: ctx.state.user.id }
      });
      
      if (buyer.length > 0) {
        ctx.request.body.data.buyer = buyer[0].id;
      }
    }
    
    const response = await super.create(ctx);
    return response;
  },
  
  async awardBid(ctx) {
    const { id } = ctx.params;
    const { bidId } = ctx.request.body;
    
    try {
      // Update RFQ status and awarded bid
      const updatedRfq = await strapi.entityService.update('api::rfq.rfq', id, {
        data: {
          status: 'awarded',
          awardedBid: bidId
        } as any
      });
      
      // Update bid status
      await strapi.entityService.update('api::bid.bid', bidId, {
        data: {
          status: 'awarded',
          isWinning: true
        } as any
      });
      
      return { data: updatedRfq };
    } catch (error) {
      return ctx.badRequest('Failed to award bid');
    }
  }
}));