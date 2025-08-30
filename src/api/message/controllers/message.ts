/**
 * message controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::message.message', ({ strapi }) => ({
  async find(ctx) {
    // Only return messages where user is sender or recipient
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const existingFilters = ctx.query.filters || {};
    ctx.query.filters = Object.assign({}, existingFilters, {
      $or: [
        { sender: user.id },
        { recipient: user.id }
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

    const entity = await strapi.entityService.findOne('api::message.message', ctx.params.id, {
      populate: ['sender', 'recipient', 'rfq', 'bid', 'attachments']
    }) as any;

    if (!entity) {
      return ctx.notFound('Message not found');
    }

    // Check if user is sender or recipient
    if (entity.sender?.id !== user.id && entity.recipient?.id !== user.id) {
      return ctx.forbidden('Access denied');
    }

    // Mark as read if user is recipient
    if (entity.recipient?.id === user.id && !entity.isRead) {
      await strapi.entityService.update('api::message.message', ctx.params.id, {
        data: {
          isRead: true,
          readAt: new Date()
        } as any
      });
      entity.isRead = true;
      entity.readAt = new Date();
    }

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    // Set sender from authenticated user
    ctx.request.body.data.sender = user.id;

    const response = await super.create(ctx);
    
    // Send real-time notification to recipient
    if (response.data) {
      const message = response.data;
      strapi.log.info(`New message sent from ${user.username} to ${message.attributes.recipient?.data?.id}`);
      
      // Emit WebSocket event for real-time notifications
      const wsService = (strapi as any).webSocketService;
      if (wsService) {
        wsService.notifyNewMessage({
          messageId: message.id,
          senderId: user.id,
          recipientId: message.attributes.recipient?.data?.id,
          subject: message.attributes.subject
        });
      }
    }

    return response;
  },

  async getConversations(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    try {
      // Get all conversations for the user
      const messages = await strapi.entityService.findMany('api::message.message', {
        filters: {
          $or: [
            { sender: user.id },
            { recipient: user.id }
          ]
        },
        populate: ['sender', 'recipient'],
        sort: 'createdAt:desc'
      }) as any[];

      // Group by conversation partner
      const conversations = new Map();
      
      messages.forEach((message: any) => {
        const partnerId = message.sender?.id === user.id ? message.recipient?.id : message.sender?.id;
        const partnerName = message.sender?.id === user.id ? 
          message.recipient?.username : message.sender?.username;
        
        if (!conversations.has(partnerId)) {
          conversations.set(partnerId, {
            partnerId,
            partnerName,
            lastMessage: message,
            unreadCount: 0
          });
        }

        // Count unread messages from partner
        if (message.recipient?.id === user.id && !message.isRead) {
          const conv = conversations.get(partnerId);
          conv.unreadCount++;
        }
      });

      return { data: Array.from(conversations.values()) };
    } catch (error) {
      return ctx.badRequest('Error fetching conversations');
    }
  },

  async markAllRead(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const { partnerId } = ctx.request.body;

    try {
      await strapi.db.query('api::message.message').updateMany({
        where: {
          recipient: user.id,
          sender: partnerId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return { message: 'Messages marked as read' };
    } catch (error) {
      return ctx.badRequest('Error marking messages as read');
    }
  }
}));