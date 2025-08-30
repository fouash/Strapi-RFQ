// Client-side WebSocket service for real-time notifications
// This provides real-time communication with the server

class WebSocketClient {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentUser = null;
        this.notificationCallbacks = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    // Initialize WebSocket connection
    async connect() {
        // For now, simulate WebSocket connection since we're using basic implementation
        this.isConnected = true;
        this.currentUser = window.currentUser;
        
        // Simulate connection success
        console.log('WebSocket connected (simulated)');
        
        // Start polling for notifications as fallback
        this.startNotificationPolling();
        
        return Promise.resolve();
    }

    // Disconnect WebSocket
    disconnect() {
        this.isConnected = false;
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        console.log('WebSocket disconnected');
    }

    // Subscribe to notification types
    subscribe(eventType, callback) {
        if (!this.notificationCallbacks.has(eventType)) {
            this.notificationCallbacks.set(eventType, []);
        }
        this.notificationCallbacks.get(eventType).push(callback);
    }

    // Unsubscribe from notification types
    unsubscribe(eventType, callback) {
        if (this.notificationCallbacks.has(eventType)) {
            const callbacks = this.notificationCallbacks.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    // Emit events to server
    emit(eventType, data) {
        if (this.isConnected) {
            console.log(`Emitting ${eventType}:`, data);
            // In a real implementation, this would send to server
        }
    }

    // Handle incoming notifications
    handleNotification(type, data) {
        if (this.notificationCallbacks.has(type)) {
            const callbacks = this.notificationCallbacks.get(type);
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in notification callback:', error);
                }
            });
        }

        // Show browser notification if supported
        this.showBrowserNotification(type, data);
        
        // Update UI notification count
        this.updateNotificationCount();
    }

    // Start polling for notifications (fallback mechanism)
    startNotificationPolling() {
        this.pollingInterval = setInterval(() => {
            this.pollForNotifications();
        }, 10000); // Poll every 10 seconds
    }

    // Poll server for new notifications
    async pollForNotifications() {
        if (!this.currentUser) return;

        try {
            // Check for new messages
            const token = localStorage.getItem('jwt');
            if (token) {
                const response = await fetch('/api/messages?filters[recipient]=' + this.currentUser.id + '&filters[isRead]=false&pagination[pageSize]=5', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.data && data.data.length > 0) {
                        // Simulate new message notifications
                        data.data.forEach(message => {
                            this.handleNotification('new_message', {
                                messageId: message.id,
                                subject: message.attributes.subject,
                                sender: message.attributes.sender?.data?.username || 'Unknown',
                                timestamp: message.attributes.createdAt
                            });
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error polling for notifications:', error);
        }
    }

    // Show browser notification
    showBrowserNotification(type, data) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            let title = 'RFQ Platform';
            let body = '';
            let icon = '/favicon.png';

            switch (type) {
                case 'new_message':
                    title = 'New Message';
                    body = `From ${data.sender}: ${data.subject}`;
                    break;
                case 'new_bid':
                    title = 'New Bid Received';
                    body = `You received a new bid of ${data.bidAmount}`;
                    break;
                case 'rfq_awarded':
                    title = 'Congratulations!';
                    body = 'Your bid has been awarded!';
                    break;
                case 'dispute_created':
                    title = 'New Dispute';
                    body = `A new ${data.disputeType} dispute has been created`;
                    break;
                case 'dispute_status_changed':
                    title = 'Dispute Update';
                    body = `Dispute status changed to ${data.newStatus}`;
                    break;
                case 'compliance_alert':
                    title = 'Compliance Update';
                    body = `${data.message} - Status: ${data.status}`;
                    break;
                case 'document_pending':
                    title = 'Document Verification Pending';
                    body = `${data.documentType} from ${data.entityName} requires verification`;
                    break;
                case 'document_verified':
                    title = 'Document Verified';
                    body = `Your ${data.documentType} has been verified`;
                    break;
                case 'document_rejected':
                    title = 'Document Rejected';
                    body = `Your ${data.documentType} was rejected`;
                    break;
                case 'compliance_warning':
                    title = 'Compliance Warning';
                    body = `${data.message} - Please review your compliance status`;
                    break;
                default:
                    body = 'You have a new notification';
            }

            const notification = new Notification(title, {
                body,
                icon,
                tag: type + '_' + Date.now(),
                requireInteraction: false
            });

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Handle click to focus window
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }
    }

    // Request browser notification permission
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    // Update notification count in UI
    updateNotificationCount() {
        const countElement = document.getElementById('notificationCount');
        if (countElement) {
            const currentCount = parseInt(countElement.textContent) || 0;
            countElement.textContent = currentCount + 1;
            
            // Add visual indicator for new notifications
            countElement.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                countElement.style.animation = '';
            }, 500);
        }
    }

    // Mark notifications as read
    markNotificationsRead(type) {
        // In a real implementation, this would update the server
        console.log(`Marking ${type} notifications as read`);
    }

    // Simulate real-time events for demo purposes
    simulateEvents() {
        if (!this.isConnected) return;

        // Simulate occasional notifications
        setTimeout(() => {
            this.handleNotification('new_message', {
                messageId: Math.random().toString(36).substr(2, 9),
                subject: 'Welcome to the platform!',
                sender: 'System',
                timestamp: new Date().toISOString()
            });
        }, 5000);

        // Simulate bid notification for buyers
        if (this.currentUser && this.currentUser.role === 'buyer') {
            setTimeout(() => {
                this.handleNotification('new_bid', {
                    rfqId: 1,
                    bidAmount: 'SAR 25,000',
                    vendorName: 'TechSolutions Co.',
                    timestamp: new Date().toISOString()
                });
            }, 15000);
        }

        // Simulate award notification for vendors
        if (this.currentUser && this.currentUser.role === 'vendor') {
            setTimeout(() => {
                this.handleNotification('rfq_awarded', {
                    rfqId: 1,
                    bidId: 1,
                    projectName: 'Website Development Project',
                    timestamp: new Date().toISOString()
                });
            }, 20000);
        }

        // Simulate compliance notifications
        setTimeout(() => {
            this.handleNotification('compliance_alert', {
                type: 'document_verification',
                message: 'Document verification completed',
                status: 'verified',
                documentType: 'commercial_registration',
                timestamp: new Date().toISOString()
            });
        }, 10000);

        // Simulate admin notifications
        if (this.currentUser && this.currentUser.role === 'Admin') {
            setTimeout(() => {
                this.handleNotification('document_pending', {
                    documentId: Math.floor(Math.random() * 1000),
                    documentType: 'vat_certificate',
                    entityType: 'vendor',
                    entityName: 'Saudi Tech Solutions',
                    timestamp: new Date().toISOString()
                });
            }, 12000);
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            user: this.currentUser,
            reconnectAttempts: this.reconnectAttempts
        };
    }
}

// Create global WebSocket client instance
const wsClient = new WebSocketClient();

// Auto-connect when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for user authentication
    setTimeout(async () => {
        if (window.currentUser) {
            await wsClient.connect();
            
            // Request notification permission
            await wsClient.requestNotificationPermission();
            
            // Start demo events
            wsClient.simulateEvents();
        }
    }, 2000);
});

// Export for global use
window.wsClient = wsClient;