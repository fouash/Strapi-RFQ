/**
 * dispute controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::dispute.dispute', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    // Users can only see their own disputes or disputes they're involved in
    const existingFilters = ctx.query.filters || {};
    ctx.query.filters = Object.assign({}, existingFilters, {
      $or: [
        { submitter: user.id },
        { involvedParties: user.id }
      ]
    });

    const { results, pagination } = await super.find(ctx);
    return { data: results, meta: { pagination } };
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const entity = await strapi.entityService.findOne('api::dispute.dispute', ctx.params.id, {
      populate: ['submitter', 'assignedAdmin', 'rfq', 'bid', 'involvedParties', 'evidence', 'messages']
    }) as any;

    if (!entity) {
      return ctx.notFound('Dispute not found');
    }

    // Check if user has access to this dispute
    const hasAccess = entity.submitter?.id === user.id || 
                     entity.involvedParties?.some(party => party.id === user.id) ||
                     user.role?.name === 'Admin';

    if (!hasAccess) {
      return ctx.forbidden('Access denied');
    }

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    // Set submitter from authenticated user
    ctx.request.body.data.submitter = user.id;
    
    // Set initial status and auto-generate title if not provided
    if (!ctx.request.body.data.title) {
      ctx.request.body.data.title = `Dispute - ${ctx.request.body.data.disputeType} - ${new Date().toLocaleDateString()}`;
    }

    const response = await super.create(ctx);
    
    // Notify admins about new dispute
    if (response.data) {
      const dispute = response.data;
      strapi.log.info(`New dispute created by ${user.username}: ${dispute.attributes.title}`);
      
      // Emit WebSocket event for admin notifications
      const wsService = (strapi as any).webSocketService;
      if (wsService) {
        wsService.notifyNewDispute({
          disputeId: dispute.id,
          submitterId: user.id,
          disputeType: dispute.attributes.disputeType,
          priority: dispute.attributes.priority
        });
      }

      // Send notification to admins
      const admins = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { role: { name: 'Admin' } }
      }) as any[];

      for (const admin of admins) {
        await strapi.entityService.create('api::message.message', {
          data: {
            subject: `New Dispute: ${dispute.attributes.title}`,
            content: `A new dispute has been submitted by ${user.username}. Please review and assign.`,
            messageType: 'system',
            priority: dispute.attributes.priority === 'critical' ? 'urgent' : 'high',
            sender: null, // System message
            recipient: admin.id
          }
        });
      }
    }

    return response;
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const dispute = await strapi.entityService.findOne('api::dispute.dispute', ctx.params.id, {
      populate: ['submitter', 'assignedAdmin']
    }) as any;

    if (!dispute) {
      return ctx.notFound('Dispute not found');
    }

    // Only submitter, assigned admin, or system admin can update
    const canUpdate = dispute.submitter?.id === user.id || 
                     dispute.assignedAdmin?.id === user.id ||
                     user.role?.name === 'Admin';

    if (!canUpdate) {
      return ctx.forbidden('Access denied');
    }

    // Track status changes
    const oldStatus = dispute.status;
    const newStatus = ctx.request.body.data.status;

    const response = await super.update(ctx);

    // Notify relevant parties of status changes
    if (newStatus && newStatus !== oldStatus) {
      const wsService = (strapi as any).webSocketService;
      if (wsService) {
        wsService.notifyDisputeStatusChange({
          disputeId: ctx.params.id,
          oldStatus,
          newStatus,
          updatedBy: user.id
        });
      }

      // Send notification to submitter if status changed
      if (dispute.submitter?.id !== user.id) {
        await strapi.entityService.create('api::message.message', {
          data: {
            subject: `Dispute Status Updated: ${dispute.title}`,
            content: `Your dispute status has been updated from "${oldStatus}" to "${newStatus}".`,
            messageType: 'system',
            priority: 'normal',
            sender: null,
            recipient: dispute.submitter.id
          }
        });
      }
    }

    return response;
  },

  async assign(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.name !== 'Admin') {
      return ctx.forbidden('Admin access required');
    }

    const { adminId } = ctx.request.body;
    const disputeId = ctx.params.id;

    try {
      const updatedDispute = await strapi.entityService.update('api::dispute.dispute', disputeId, {
        data: {
          assignedAdmin: adminId,
          status: 'under_review'
        } as any
      });

      // Notify assigned admin
      await strapi.entityService.create('api::message.message', {
        data: {
          subject: `Dispute Assigned: ${updatedDispute.title}`,
          content: `You have been assigned to handle this dispute. Please review and take appropriate action.`,
          messageType: 'system',
          priority: 'high',
          sender: null,
          recipient: adminId
        }
      });

      return { data: updatedDispute };
    } catch (error) {
      return ctx.badRequest('Failed to assign dispute');
    }
  },

  async escalate(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const disputeId = ctx.params.id;
    const { reason } = ctx.request.body;

    try {
      const dispute = await strapi.entityService.findOne('api::dispute.dispute', disputeId, {
        populate: ['submitter']
      }) as any;

      if (!dispute) {
        return ctx.notFound('Dispute not found');
      }

      // Only submitter can escalate
      if (dispute.submitter?.id !== user.id) {
        return ctx.forbidden('Only dispute submitter can escalate');
      }

      const updatedDispute = await strapi.entityService.update('api::dispute.dispute', disputeId, {
        data: {
          status: 'escalated',
          priority: 'critical',
          adminNotes: `${dispute.adminNotes || ''}\n\nESCALATED by user: ${reason || 'No reason provided'}`
        } as any
      });

      // Notify all admins about escalation
      const admins = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { role: { name: 'Admin' } }
      }) as any[];

      for (const admin of admins) {
        await strapi.entityService.create('api::message.message', {
          data: {
            subject: `ESCALATED: ${dispute.title}`,
            content: `A dispute has been escalated by the submitter. Immediate attention required.\n\nReason: ${reason || 'No reason provided'}`,
            messageType: 'system',
            priority: 'urgent',
            sender: null,
            recipient: admin.id
          }
        });
      }

      const wsService = (strapi as any).webSocketService;
      if (wsService) {
        wsService.notifyDisputeEscalated({
          disputeId,
          reason,
          submitterId: user.id
        });
      }

      return { data: updatedDispute };
    } catch (error) {
      return ctx.badRequest('Failed to escalate dispute');
    }
  },

  async getStatistics(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.name !== 'Admin') {
      return ctx.forbidden('Admin access required');
    }

    try {
      const totalDisputes = await strapi.db.query('api::dispute.dispute').count();
      const openDisputes = await strapi.db.query('api::dispute.dispute').count({
        where: { status: { $in: ['submitted', 'under_review', 'investigating', 'awaiting_response'] } }
      });
      const criticalDisputes = await strapi.db.query('api::dispute.dispute').count({
        where: { priority: 'critical' }
      });
      const avgResolutionTime = await strapi.db.query('api::dispute.dispute').findMany({
        where: { status: 'resolved' },
        select: ['createdAt', 'resolutionDate']
      });

      // Calculate average resolution time in hours
      let avgHours = 0;
      if (avgResolutionTime.length > 0) {
        const totalHours = avgResolutionTime.reduce((sum, dispute) => {
          const created = new Date(dispute.createdAt);
          const resolved = new Date(dispute.resolutionDate);
          return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        }, 0);
        avgHours = Math.round(totalHours / avgResolutionTime.length);
      }

      return {
        data: {
          totalDisputes,
          openDisputes,
          criticalDisputes,
          resolvedDisputes: avgResolutionTime.length,
          averageResolutionTimeHours: avgHours
        }
      };
    } catch (error) {
      return ctx.badRequest('Error fetching dispute statistics');
    }
  }
}));