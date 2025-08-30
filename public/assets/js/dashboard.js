// Dashboard JavaScript functionality
let currentUserType = null;
let favorites = JSON.parse(localStorage.getItem('rfq_favorites') || '{"rfqs": [], "vendors": [], "buyers": []}');

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadDashboardData();
    initializeWebSocket();
});

// Check authentication status and load user-specific dashboard
async function checkAuthStatus() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch('/api/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            
            // Determine user type by checking if they have a buyer or vendor profile
            await determineUserType();
            setupDashboardForUserType();
        } else {
            localStorage.removeItem('jwt');
            window.location.href = '/index.html';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = '/index.html';
    }
}

// Determine if user is buyer or vendor
async function determineUserType() {
    const token = localStorage.getItem('jwt');
    
    try {
        // Check for buyer profile
        const buyerResponse = await fetch(`/api/buyers?filters[user]=${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (buyerResponse.ok) {
            const buyerData = await buyerResponse.json();
            if (buyerData.data && buyerData.data.length > 0) {
                currentUserType = 'buyer';
                return;
            }
        }

        // Check for vendor profile
        const vendorResponse = await fetch(`/api/vendors?filters[user]=${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (vendorResponse.ok) {
            const vendorData = await vendorResponse.json();
            if (vendorData.data && vendorData.data.length > 0) {
                currentUserType = 'vendor';
                return;
            }
        }

        // Default to buyer if no profile found
        currentUserType = 'buyer';
    } catch (error) {
        console.error('Error determining user type:', error);
        currentUserType = 'buyer';
    }
}

// Setup dashboard based on user type
function setupDashboardForUserType() {
    const titleElement = document.getElementById('dashboardTitle');
    const subtitleElement = document.getElementById('dashboardSubtitle');
    
    if (currentUserType === 'buyer') {
        titleElement.textContent = `Welcome, ${currentUser.username}`;
        subtitleElement.textContent = 'Manage your RFQs and find the best vendors';
        setupBuyerDashboard();
    } else {
        titleElement.textContent = `Welcome, ${currentUser.username}`;
        subtitleElement.textContent = 'Discover opportunities and manage your bids';
        setupVendorDashboard();
    }
}

// Setup buyer-specific dashboard
function setupBuyerDashboard() {
    // Quick actions for buyers
    const quickActions = document.getElementById('quickActions');
    quickActions.innerHTML = `
        <a href="/rfq.html#create" class="action-btn">
            <i class="fas fa-plus"></i> Create New RFQ
        </a>
        <a href="/rfq.html" class="action-btn secondary">
            <i class="fas fa-search"></i> Browse RFQs
        </a>
        <a href="#" onclick="openMessagingCenter()" class="action-btn secondary">
            <i class="fas fa-comments"></i> Messages
        </a>
        <a href="/profile.html" class="action-btn secondary">
            <i class="fas fa-user"></i> My Profile
        </a>
    `;

    loadBuyerStats();
    loadBuyerRecentActivity();
}

// Setup vendor-specific dashboard
function setupVendorDashboard() {
    // Quick actions for vendors
    const quickActions = document.getElementById('quickActions');
    quickActions.innerHTML = `
        <a href="/rfq.html" class="action-btn">
            <i class="fas fa-search"></i> Find RFQs
        </a>
        <a href="#" onclick="showMyBids()" class="action-btn secondary">
            <i class="fas fa-file-contract"></i> My Bids
        </a>
        <a href="#" onclick="openMessagingCenter()" class="action-btn secondary">
            <i class="fas fa-comments"></i> Messages
        </a>
        <a href="/profile.html" class="action-btn secondary">
            <i class="fas fa-user"></i> My Profile
        </a>
    `;

    loadVendorStats();
    loadVendorRecentActivity();
}

// Load buyer statistics
async function loadBuyerStats() {
    const token = localStorage.getItem('jwt');
    const statsGrid = document.getElementById('statsGrid');
    
    try {
        const [rfqsResponse, bidsResponse] = await Promise.all([
            fetch(`/api/rfqs?filters[buyer][user]=${currentUser.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/bids', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const rfqsData = await rfqsResponse.json();
        const bidsData = await bidsResponse.json();

        // Filter bids for user's RFQs
        const userBids = bidsData.data ? bidsData.data.filter(bid => 
            rfqsData.data && rfqsData.data.some(rfq => rfq.id === bid.attributes.rfq?.data?.id)
        ) : [];

        const totalRfqs = rfqsData.meta?.pagination?.total || 0;
        const activeBids = userBids.filter(bid => bid.attributes.status === 'submitted').length;
        const awardedProjects = rfqsData.data ? rfqsData.data.filter(rfq => rfq.attributes.status === 'awarded').length : 0;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${totalRfqs}</div>
                <div class="stat-label">Total RFQs</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${activeBids}</div>
                <div class="stat-label">Active Bids</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${awardedProjects}</div>
                <div class="stat-label">Awarded Projects</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${favorites.rfqs.length}</div>
                <div class="stat-label">Saved Items</div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading buyer stats:', error);
        statsGrid.innerHTML = '<div class="text-muted">Error loading statistics</div>';
    }
}

// Load vendor statistics
async function loadVendorStats() {
    const token = localStorage.getItem('jwt');
    const statsGrid = document.getElementById('statsGrid');
    
    try {
        const bidsResponse = await fetch(`/api/bids?filters[vendor][user]=${currentUser.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const bidsData = await bidsResponse.json();
        const totalBids = bidsData.meta?.pagination?.total || 0;
        const activeBids = bidsData.data ? bidsData.data.filter(bid => bid.attributes.status === 'submitted').length : 0;
        const wonBids = bidsData.data ? bidsData.data.filter(bid => bid.attributes.status === 'awarded').length : 0;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${totalBids}</div>
                <div class="stat-label">Total Bids</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${activeBids}</div>
                <div class="stat-label">Active Bids</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${wonBids}</div>
                <div class="stat-label">Won Projects</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${favorites.rfqs.length}</div>
                <div class="stat-label">Saved RFQs</div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading vendor stats:', error);
        statsGrid.innerHTML = '<div class="text-muted">Error loading statistics</div>';
    }
}

// Load buyer recent activity
async function loadBuyerRecentActivity() {
    const token = localStorage.getItem('jwt');
    const recentList = document.getElementById('recentList');
    
    try {
        const response = await fetch(`/api/rfqs?filters[buyer][user]=${currentUser.id}&sort=createdAt:desc&pagination[pageSize]=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            recentList.innerHTML = data.data.map(rfq => `
                <li class="recent-item">
                    <div>
                        <div class="recent-title">${rfq.attributes.title}</div>
                        <div class="recent-meta">
                            Created ${new Date(rfq.attributes.createdAt).toLocaleDateString()}
                            <span class="status-badge status-${rfq.attributes.status}">${rfq.attributes.status}</span>
                        </div>
                    </div>
                </li>
            `).join('');
        } else {
            recentList.innerHTML = '<li class="recent-item"><div class="text-muted">No RFQs yet</div></li>';
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        recentList.innerHTML = '<li class="recent-item"><div class="text-muted">Error loading activity</div></li>';
    }
}

// Load vendor recent activity
async function loadVendorRecentActivity() {
    const token = localStorage.getItem('jwt');
    const recentList = document.getElementById('recentList');
    
    try {
        const response = await fetch(`/api/bids?filters[vendor][user]=${currentUser.id}&sort=createdAt:desc&pagination[pageSize]=5&populate=rfq`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            recentList.innerHTML = data.data.map(bid => `
                <li class="recent-item">
                    <div>
                        <div class="recent-title">Bid on: ${bid.attributes.rfq?.data?.attributes?.title || 'Unknown RFQ'}</div>
                        <div class="recent-meta">
                            Submitted ${new Date(bid.attributes.submittedAt).toLocaleDateString()}
                            <span class="status-badge status-${bid.attributes.status}">${bid.attributes.status}</span>
                        </div>
                    </div>
                </li>
            `).join('');
        } else {
            recentList.innerHTML = '<li class="recent-item"><div class="text-muted">No bids yet</div></li>';
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        recentList.innerHTML = '<li class="recent-item"><div class="text-muted">Error loading activity</div></li>';
    }
}

// Load dashboard data
function loadDashboardData() {
    // This will be called after user type is determined
}

// Favorites functionality
function showFavoritesTab(type) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show favorites for the selected type
    const content = document.getElementById('favoritesContent');
    const items = favorites[type];
    
    if (items.length === 0) {
        content.innerHTML = `<div class="text-muted">No ${type} favorited yet</div>`;
    } else {
        content.innerHTML = items.map(item => `
            <div class="recent-item">
                <div>
                    <div class="recent-title">${item.title || item.name}</div>
                    <div class="recent-meta">${item.category || item.specialty || ''}</div>
                </div>
                <button onclick="removeFavorite('${type}', '${item.id}')" class="btn btn-sm">
                    <i class="fas fa-heart" style="color: var(--danger-color);"></i>
                </button>
            </div>
        `).join('');
    }
}

// Add to favorites
function addToFavorites(type, item) {
    if (!favorites[type].find(fav => fav.id === item.id)) {
        favorites[type].push(item);
        localStorage.setItem('rfq_favorites', JSON.stringify(favorites));
        showNotification(`Added to favorites!`, 'success');
    }
}

// Remove from favorites
function removeFavorite(type, id) {
    favorites[type] = favorites[type].filter(item => item.id !== id);
    localStorage.setItem('rfq_favorites', JSON.stringify(favorites));
    showFavoritesTab(type);
    showNotification('Removed from favorites', 'info');
}

// Messaging functionality
function openMessagingCenter() {
    // Create messaging modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'messagingModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2><i class="fas fa-comments"></i> Message Center</h2>
                <button class="modal-close" onclick="closeModal('messagingModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; height: 400px;">
                    <div style="border-right: 1px solid var(--border-color); padding-right: 1rem;">
                        <h4>Conversations</h4>
                        <div id="conversationsList">
                            <div class="text-muted">No conversations yet</div>
                        </div>
                    </div>
                    <div>
                        <div id="messageArea">
                            <div class="text-muted">Select a conversation to view messages</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    loadConversations();
}

// Load conversations
async function loadConversations() {
    // This would integrate with a messaging system
    // For now, show placeholder
    const conversationsList = document.getElementById('conversationsList');
    conversationsList.innerHTML = `
        <div style="padding: 0.5rem; background: var(--light-color); border-radius: 4px; margin-bottom: 0.5rem;">
            <div style="font-weight: 500;">System Messages</div>
            <div style="font-size: 0.85rem; color: var(--secondary-color);">Welcome to the platform!</div>
        </div>
    `;
}

// WebSocket for real-time notifications
function initializeWebSocket() {
    // Placeholder for WebSocket implementation
    // In a real implementation, this would connect to a WebSocket server
    console.log('WebSocket connection initialized');
    
    // Simulate receiving notifications
    setTimeout(() => {
        addNotification('Welcome to your dashboard!', 'info');
    }, 2000);
}

// Add notification to dashboard
function addNotification(message, type = 'info') {
    const container = document.getElementById('dashboardNotifications');
    const notification = document.createElement('div');
    notification.className = 'notification-item';
    notification.innerHTML = `
        <div class="notification-title">${message}</div>
        <div class="notification-time">${new Date().toLocaleString()}</div>
    `;
    
    container.insertBefore(notification, container.firstChild);
    
    // Keep only last 5 notifications
    const notifications = container.querySelectorAll('.notification-item');
    if (notifications.length > 5) {
        container.removeChild(notifications[notifications.length - 1]);
    }

    // Update notification count in navbar
    const countElement = document.getElementById('notificationCount');
    if (countElement) {
        const currentCount = parseInt(countElement.textContent) || 0;
        countElement.textContent = currentCount + 1;
    }
}

// Show user bids (for vendors)
async function showMyBids() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'bidsModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2><i class="fas fa-file-contract"></i> My Bids</h2>
                <button class="modal-close" onclick="closeModal('bidsModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div id="bidsList">Loading bids...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    await loadUserBids();
}

// Load user's bids
async function loadUserBids() {
    const token = localStorage.getItem('jwt');
    const bidsList = document.getElementById('bidsList');
    
    try {
        const response = await fetch(`/api/bids?filters[vendor][user]=${currentUser.id}&populate=rfq`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            bidsList.innerHTML = data.data.map(bid => `
                <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: between; align-items: start;">
                        <div>
                            <h4>${bid.attributes.rfq?.data?.attributes?.title || 'Unknown RFQ'}</h4>
                            <p>Price: ${bid.attributes.currency} ${bid.attributes.price}</p>
                            <p>Delivery: ${bid.attributes.deliveryTime} days</p>
                            <p>Submitted: ${new Date(bid.attributes.submittedAt).toLocaleDateString()}</p>
                        </div>
                        <span class="status-badge status-${bid.attributes.status}">${bid.attributes.status}</span>
                    </div>
                </div>
            `).join('');
        } else {
            bidsList.innerHTML = '<div class="text-muted">No bids submitted yet</div>';
        }
    } catch (error) {
        console.error('Error loading bids:', error);
        bidsList.innerHTML = '<div class="text-muted">Error loading bids</div>';
    }
}

// Export functions for global use
window.addToFavorites = addToFavorites;
window.removeFavorite = removeFavorite;
window.showFavoritesTab = showFavoritesTab;
window.openMessagingCenter = openMessagingCenter;
window.showMyBids = showMyBids;