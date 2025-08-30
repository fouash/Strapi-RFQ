// WebSocket service for real-time notifications
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

interface SocketUser {
  userId: number;
  username: string;
  socketId: string;
}

class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<number, SocketUser> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      path: '/socket.io'
    });

    this.initializeHandlers();
  }

  private initializeHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Authentication
      socket.on('authenticate', async (data) => {
        try {
          const { jwt } = data;
          
          // Verify JWT token with Strapi
          const user = await this.verifyToken(jwt);
          
          if (user) {
            this.connectedUsers.set(user.id, {
              userId: user.id,
              username: user.username,
              socketId: socket.id
            });
            
            socket.join(`user_${user.id}`);
            socket.emit('authenticated', { success: true, userId: user.id });
            
            console.log(`User ${user.username} authenticated with socket ${socket.id}`);
          } else {
            socket.emit('authentication_failed', { error: 'Invalid token' });
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('authentication_failed', { error: 'Authentication failed' });
        }
      });

      // Handle new message notifications
      socket.on('join_conversation', (data) => {
        const { conversationId } = data;
        socket.join(`conversation_${conversationId}`);
      });

      socket.on('leave_conversation', (data) => {
        const { conversationId } = data;
        socket.leave(`conversation_${conversationId}`);
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { conversationId, username } = data;
        socket.to(`conversation_${conversationId}`).emit('user_typing', { username });
      });

      socket.on('typing_stop', (data) => {
        const { conversationId, username } = data;
        socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', { username });
      });

      // Handle online status
      socket.on('user_online', (data) => {
        const { userId } = data;
        this.io.emit('user_status_changed', { userId, status: 'online' });
      });

      // Disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove user from connected users
        for (const [userId, userData] of this.connectedUsers.entries()) {
          if (userData.socketId === socket.id) {
            this.connectedUsers.delete(userId);
            this.io.emit('user_status_changed', { userId, status: 'offline' });
            break;
          }
        }
      });
    });

    // Set up Strapi event listeners
    this.setupStrapiEventListeners();
  }

  private async verifyToken(jwt: string) {
    try {
      // This would normally verify the JWT token with Strapi
      // For now, return a mock user for demonstration
      return { id: 1, username: 'demo_user' };
    } catch (error) {
      return null;
    }
  }

  private setupStrapiEventListeners() {
    // Since we can't use eventHub, we'll call notification methods directly
    // from controllers using (strapi as any).webSocketService
    console.log('WebSocket service event listeners setup completed');
  }

  // Notification methods
  public notifyNewMessage(data: any) {
    const { recipientId, senderId, subject, messageId } = data;
    
    this.io.to(`user_${recipientId}`).emit('new_message', {
      messageId,
      senderId,
      subject,
      timestamp: new Date().toISOString()
    });
  }

  public notifyNewDispute(data: any) {
    const { disputeId, submitterId, disputeType, priority } = data;
    
    // Notify all admins
    this.io.emit('new_dispute', {
      disputeId,
      submitterId,
      disputeType,
      priority,
      timestamp: new Date().toISOString()
    });
  }

  public notifyDisputeStatusChange(data: any) {
    const { disputeId, oldStatus, newStatus, updatedBy } = data;
    
    this.io.emit('dispute_status_changed', {
      disputeId,
      oldStatus,
      newStatus,
      updatedBy,
      timestamp: new Date().toISOString()
    });
  }

  public notifyDisputeEscalated(data: any) {
    const { disputeId, reason, submitterId } = data;
    
    // Notify all admins with high priority
    this.io.emit('dispute_escalated', {
      disputeId,
      reason,
      submitterId,
      priority: 'critical',
      timestamp: new Date().toISOString()
    });
  }

  public notifyNewBid(data: any) {
    const { rfqId, vendorId, buyerId, bidAmount } = data;
    
    this.io.to(`user_${buyerId}`).emit('new_bid', {
      rfqId,
      vendorId,
      bidAmount,
      timestamp: new Date().toISOString()
    });
  }

  public notifyRfqAwarded(data: any) {
    const { rfqId, winnerId, buyerId, bidId } = data;
    
    this.io.to(`user_${winnerId}`).emit('rfq_awarded', {
      rfqId,
      bidId,
      buyerId,
      timestamp: new Date().toISOString()
    });
  }

  // Utility methods
  public getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values());
  }

  public isUserOnline(userId: number): boolean {
    return this.connectedUsers.has(userId);
  }

  public sendNotificationToUser(userId: number, type: string, data: any) {
    this.io.to(`user_${userId}`).emit(type, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastNotification(type: string, data: any) {
    this.io.emit(type, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

export default WebSocketService;