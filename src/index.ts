import type { Core } from '@strapi/strapi';
import WebSocketService from './extensions/websocket/websocket-service';

let webSocketService: WebSocketService;

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Initialize WebSocket service
    const server = strapi.server.httpServer;
    webSocketService = new WebSocketService(server);
    
    // Make WebSocket service available globally
    (strapi as any).webSocketService = webSocketService;
    
    // Add emit functionality to strapi for our custom events
    (strapi as any).emit = (event: string, data: any) => {
      strapi.log.info(`Event emitted: ${event}`, data);
      
      // Route events to WebSocket service
      switch (event) {
        case 'message:created':
          webSocketService.notifyNewMessage(data);
          break;
        case 'dispute:created':
          webSocketService.notifyNewDispute(data);
          break;
        case 'dispute:status_changed':
          webSocketService.notifyDisputeStatusChange(data);
          break;
        case 'dispute:escalated':
          webSocketService.notifyDisputeEscalated(data);
          break;
        case 'rfq:new_bid':
          webSocketService.notifyNewBid(data);
          break;
        case 'rfq:awarded':
          webSocketService.notifyRfqAwarded(data);
          break;
      }
    };

    strapi.log.info('🔌 WebSocket service initialized successfully');
    strapi.log.info('📱 Real-time notifications enabled');
  },
};
