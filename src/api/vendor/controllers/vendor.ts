/**
 * vendor controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::vendor.vendor', ({ strapi }) => ({
  async findOne(ctx) {
    const { id } = ctx.params;
    
    const entity = await strapi.entityService.findOne('api::vendor.vendor', id, {
      populate: ['user', 'bids']
    });
    
    if (!entity) {
      return ctx.notFound('Vendor not found');
    }
    
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
  
  async create(ctx) {
    if (ctx.state.user) {
      ctx.request.body.data.user = ctx.state.user.id;
    }
    
    const response = await super.create(ctx);
    return response;
  }
}));