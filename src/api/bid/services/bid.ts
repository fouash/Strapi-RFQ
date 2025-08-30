/**
 * bid service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::bid.bid', ({ strapi }) => ({
  async validateBid(data) {
    const errors = [];
    
    // Check if RFQ is still open
    const rfq = await strapi.entityService.findOne('api::rfq.rfq', data.rfq);
    if (!rfq) {
      errors.push('RFQ not found');
      return errors;
    }
    
    if (rfq.status !== 'published') {
      errors.push('RFQ is not open for bidding');
    }
    
    if (new Date() > new Date(rfq.deadline)) {
      errors.push('RFQ deadline has passed');
    }
    
    // Check if vendor has already submitted a bid
    const existingBid = await strapi.entityService.findMany('api::bid.bid', {
      filters: {
        rfq: data.rfq,
        vendor: data.vendor
      }
    });
    
    if (existingBid.length > 0) {
      errors.push('Vendor has already submitted a bid for this RFQ');
    }
    
    return errors;
  }
}));