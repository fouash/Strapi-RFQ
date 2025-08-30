/**
 * buyer controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::buyer.buyer', ({ strapi }) => ({
  // Custom controller methods can be added here
  
  async findOne(ctx) {
    const { id } = ctx.params;
    
    // Get buyer with user relation
    const entity = await strapi.entityService.findOne('api::buyer.buyer', id, {
      populate: ['user', 'rfqs']
    });
    
    if (!entity) {
      return ctx.notFound('Buyer not found');
    }
    
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
  
  async create(ctx) {
    // Ensure the buyer is linked to the authenticated user
    if (ctx.state.user) {
      ctx.request.body.data.user = ctx.state.user.id;
    }
    
    const response = await super.create(ctx);
    return response;
  }
}));