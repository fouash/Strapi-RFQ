/**
 * bid controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::bid.bid', ({ strapi }) => ({
  async create(ctx) {
    // Set the vendor from authenticated user
    if (ctx.state.user) {
      const vendor = await strapi.entityService.findMany('api::vendor.vendor', {
        filters: { user: ctx.state.user.id }
      });
      
      if (vendor.length > 0) {
        ctx.request.body.data.vendor = vendor[0].id;
      }
    }
    
    // Set submission timestamp
    ctx.request.body.data.submittedAt = new Date();
    
    const response = await super.create(ctx);
    return response;
  },
  
  async findByRfq(ctx) {
    const { rfqId } = ctx.params;
    
    const bids = await strapi.entityService.findMany('api::bid.bid', {
      filters: { rfq: rfqId },
      populate: ['vendor'],
      sort: { submittedAt: 'desc' }
    });
    
    return { data: bids };
  },
  
  async findByVendor(ctx) {
    const { vendorId } = ctx.params;
    
    const bids = await strapi.entityService.findMany('api::bid.bid', {
      filters: { vendor: vendorId },
      populate: ['rfq'],
      sort: { submittedAt: 'desc' }
    });
    
    return { data: bids };
  }
}));