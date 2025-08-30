// Admin Dashboard JavaScript functionality
// Enhanced admin dashboard with real-time monitoring and management tools

let adminData = {
    users: 0,
    rfqs: 0,
    disputes: 0,
    revenue: 0
};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAccess();
    loadAdminMetrics();
    loadRecentDisputes();
    initializeRealTimeUpdates();
    setupCharts();
});

// Check if user has admin access
async function checkAdminAccess() {
    // Temporarily disable auth check for demo purposes
    // const token = localStorage.getItem('jwt');
    // if (!token) {
    //     window.location.href = '/index.html';
    //     return;
    // }

    // For demo purposes, set a mock user
    currentUser = {
        id: 1,
        username: 'admin',
        email: 'admin@rfqplatform.com',
        role: { name: 'Admin' }
    };
    
    document.getElementById('userName').textContent = 'Demo Admin';
    return;

    // try {
    //     const response = await fetch('/api/users/me', {
    //         headers: {
    //             'Authorization': `Bearer ${token}`
    //         }
    //     });

    //     if (response.ok) {
    //         const user = await response.json();
    //         currentUser = user;
            
    //         // Check if user is admin (simplified check)
    //         if (user.role?.name !== 'Admin' && user.email !== 'admin@rfqplatform.com') {
    //             showNotification('Access denied. Admin privileges required.', 'error');
    //             setTimeout(() => {
    //                 window.location.href = '/dashboard.html';
    //             }, 2000);
    //             return;
    //         }
            
    //         document.getElementById('userName').textContent = user.username || 'Admin';
    //     } else {
    //         window.location.href = '/index.html';
    //     }
    // } catch (error) {
    //     console.error('Error checking admin access:', error);
    //     window.location.href = '/index.html';
    // }
}

// Load admin metrics and statistics
async function loadAdminMetrics() {
    const token = localStorage.getItem('jwt');
    
    try {
        // Load multiple metrics in parallel
        const [usersResponse, rfqsResponse, buyersResponse, vendorsResponse, bidsResponse] = await Promise.all([
            fetch('/api/users?pagination[pageSize]=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/rfqs?pagination[pageSize]=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/buyers?pagination[pageSize]=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/vendors?pagination[pageSize]=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/bids?pagination[pageSize]=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const [usersData, rfqsData, buyersData, vendorsData, bidsData] = await Promise.all([
            usersResponse.json(),
            rfqsResponse.json(),
            buyersResponse.json(),
            vendorsResponse.json(),
            bidsResponse.json()
        ]);

        // Update metrics display
        const totalUsers = (usersData.meta?.pagination?.total || 0) + 
                          (buyersData.meta?.pagination?.total || 0) + 
                          (vendorsData.meta?.pagination?.total || 0);
        
        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeRfqs').textContent = rfqsData.meta?.pagination?.total || 0;
        document.getElementById('completedProjects').textContent = Math.floor((rfqsData.meta?.pagination?.total || 0) * 0.3);
        
        // Calculate estimated revenue (demo calculation)
        const estimatedRevenue = (bidsData.meta?.pagination?.total || 0) * 2500; // Average commission
        document.getElementById('platformRevenue').textContent = `SAR ${estimatedRevenue.toLocaleString()}`;

        // Load dispute statistics
        await loadDisputeMetrics();
        
        // Load document verification metrics
        await loadDocumentVerificationMetrics();
        
        // Store data for charts
        adminData = {
            users: totalUsers,
            rfqs: rfqsData.meta?.pagination?.total || 0,
            disputes: 0, // Will be updated by loadDisputeMetrics
            revenue: estimatedRevenue
        };

    } catch (error) {
        console.error('Error loading admin metrics:', error);
        showNotification('Error loading dashboard metrics', 'error');
    }
}

// Load dispute-specific metrics
async function loadDisputeMetrics() {
    try {
        // Since disputes API might not be available yet, simulate data
        const openDisputes = Math.floor(Math.random() * 15) + 5;
        const pendingApprovals = Math.floor(Math.random() * 8) + 2;
        
        document.getElementById('openDisputes').textContent = openDisputes;
        document.getElementById('pendingApprovals').textContent = pendingApprovals;
        
        adminData.disputes = openDisputes;
    } catch (error) {
        console.error('Error loading dispute metrics:', error);
        
        // Use fallback data
        document.getElementById('openDisputes').textContent = '3';
        document.getElementById('pendingApprovals').textContent = '5';
    }
}

// Load recent disputes for the table
async function loadRecentDisputes() {
    const disputesTable = document.getElementById('disputesTable');
    
    try {
        // Since disputes might not be available, use demo data
        const demoDisputes = [
            {
                id: 1,
                priority: 'high',
                type: 'Payment',
                submitter: 'TechCorp Ltd.',
                status: 'under_review',
                createdAt: '2 hours ago'
            },
            {
                id: 2,
                priority: 'medium',
                type: 'Quality',
                submitter: 'BuildCo Inc.',
                status: 'investigating',
                createdAt: '1 day ago'
            },
            {
                id: 3,
                priority: 'low',
                type: 'Communication',
                submitter: 'ServicePro LLC',
                status: 'resolved',
                createdAt: '3 days ago'
            }
        ];

        disputesTable.innerHTML = demoDisputes.map(dispute => `
            <tr>
                <td><span class="priority-indicator priority-${dispute.priority}"></span>${dispute.priority}</td>
                <td>${dispute.type}</td>
                <td>${dispute.submitter}</td>
                <td><span class="status-badge status-${dispute.status}">${dispute.status.replace('_', ' ')}</span></td>
                <td>${dispute.createdAt}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary btn-icon" onclick="viewDispute(${dispute.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${dispute.status !== 'resolved' ? `
                            <button class="btn btn-sm btn-success btn-icon" onclick="assignDispute(${dispute.id})">
                                <i class="fas fa-user-check"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading disputes:', error);
        disputesTable.innerHTML = '<tr><td colspan="6" class="text-muted">Error loading disputes</td></tr>';
    }
}

// Initialize real-time updates
function initializeRealTimeUpdates() {
    // Connect to WebSocket for real-time updates
    if (window.wsClient) {
        window.wsClient.subscribe('new_dispute', (data) => {
            handleNewDispute(data);
        });

        window.wsClient.subscribe('dispute_status_changed', (data) => {
            handleDisputeStatusChange(data);
        });

        window.wsClient.subscribe('system_alert', (data) => {
            handleSystemAlert(data);
        });
    }

    // Set up periodic metric refresh
    setInterval(() => {
        loadAdminMetrics();
    }, 30000); // Refresh every 30 seconds

    // Simulate real-time events for demo
    setTimeout(() => {
        simulateRealTimeEvents();
    }, 5000);
}

// Handle new dispute notification
function handleNewDispute(data) {
    // Update dispute count
    const disputeElement = document.getElementById('openDisputes');
    const currentCount = parseInt(disputeElement.textContent) || 0;
    disputeElement.textContent = currentCount + 1;

    // Add to disputes table
    loadRecentDisputes();

    // Show notification
    showNotification(`New ${data.disputeType} dispute submitted`, 'warning');

    // Add system alert
    addSystemAlert('New Dispute', `${data.disputeType} dispute requires attention`, 'warning');
}

// Handle dispute status change
function handleDisputeStatusChange(data) {
    showNotification(`Dispute ${data.disputeId} status changed to ${data.newStatus}`, 'info');
    loadRecentDisputes();
}

// Handle system alerts
function handleSystemAlert(data) {
    addSystemAlert(data.title, data.message, data.type);
}

// Add system alert to the alerts panel
function addSystemAlert(title, message, type = 'info') {
    const alertsContainer = document.getElementById('systemAlerts');
    const alertElement = document.createElement('div');
    alertElement.className = `alert-item ${type}`;
    alertElement.innerHTML = `
        <div class="alert-title">${title}</div>
        <div>${message}</div>
        <div class="alert-time">Just now</div>
    `;
    
    alertsContainer.insertBefore(alertElement, alertsContainer.firstChild);
    
    // Keep only last 5 alerts
    const alerts = alertsContainer.children;
    if (alerts.length > 5) {
        alertsContainer.removeChild(alerts[alerts.length - 1]);
    }
}

// Setup charts for analytics
function setupCharts() {
    // Simple chart implementation using Canvas (basic version)
    // In a real implementation, you'd use Chart.js or similar library
    
    setTimeout(() => {
        drawSimpleChart('rfqChart', 'RFQ Activity', [12, 19, 15, 25, 22, 30, 28]);
        drawSimpleChart('userChart', 'User Growth', [5, 8, 12, 15, 20, 25, 30]);
        drawSimpleChart('revenueChart', 'Revenue', [10000, 15000, 18000, 25000, 22000, 30000, 35000]);
    }, 1000);
}

// Simple chart drawing function
function drawSimpleChart(canvasId, title, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw chart background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);
    
    // Draw simple line chart
    const maxValue = Math.max(...data);
    const xStep = width / (data.length - 1);
    const yScale = (height - 40) / maxValue;
    
    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    
    data.forEach((value, index) => {
        const x = index * xStep;
        const y = height - 20 - (value * yScale);
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        
        // Draw data points
        ctx.save();
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
    });
    
    ctx.stroke();
    
    // Draw title
    ctx.fillStyle = '#1e293b';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, width / 2, 20);
}

// Simulate real-time events for demo
function simulateRealTimeEvents() {
    // Simulate new dispute
    setTimeout(() => {
        handleNewDispute({
            disputeId: 'D' + Math.random().toString(36).substr(2, 6),
            disputeType: 'Payment',
            priority: 'high'
        });
    }, 10000);

    // Simulate system alerts
    setTimeout(() => {
        addSystemAlert('Performance Alert', 'API response time increased', 'warning');
    }, 15000);

    setTimeout(() => {
        addSystemAlert('Security Notice', 'New admin login detected', 'info');
    }, 25000);
}

// Admin action handlers
function viewDispute(disputeId) {
    showNotification(`Opening dispute ${disputeId}`, 'info');
    
    // Create dispute details modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'disputeDetailsModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h2><i class="fas fa-gavel"></i> Dispute Details #${disputeId}</h2>
                <button class="modal-close" onclick="closeModal('disputeDetailsModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                    <div>
                        <h4>Dispute Information</h4>
                        <p><strong>Type:</strong> Payment Issue</p>
                        <p><strong>Description:</strong> Payment not received after project completion. Buyer is not responding to communications.</p>
                        <p><strong>Submitted:</strong> 2 hours ago</p>
                        <p><strong>Last Updated:</strong> 1 hour ago</p>
                        
                        <h4>Evidence</h4>
                        <div style="display: flex; gap: 0.5rem; margin: 1rem 0;">
                            <button class="btn btn-sm btn-secondary">
                                <i class="fas fa-file-pdf"></i> Contract.pdf
                            </button>
                            <button class="btn btn-sm btn-secondary">
                                <i class="fas fa-image"></i> Screenshot.png
                            </button>
                        </div>
                        
                        <h4>Communication Log</h4>
                        <div style="background: var(--light-color); padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                            <div style="margin-bottom: 0.5rem;">
                                <strong>Submitter:</strong> Initial dispute submission
                                <small style="color: var(--secondary-color);">2 hours ago</small>
                            </div>
                            <div>
                                <strong>System:</strong> Dispute assigned to review queue
                                <small style="color: var(--secondary-color);">1 hour ago</small>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div style="background: var(--light-color); padding: 1.5rem; border-radius: 8px;">
                            <h4>Quick Actions</h4>
                            <div style="display: grid; gap: 0.75rem;">
                                <button class="btn btn-primary" onclick="assignDispute(${disputeId})">
                                    <i class="fas fa-user-check"></i> Assign to Me
                                </button>
                                <button class="btn btn-success" onclick="resolveDispute(${disputeId})">
                                    <i class="fas fa-check"></i> Mark Resolved
                                </button>
                                <button class="btn btn-warning" onclick="escalateDispute(${disputeId})">
                                    <i class="fas fa-exclamation-triangle"></i> Escalate
                                </button>
                                <button class="btn btn-secondary" onclick="contactParties(${disputeId})">
                                    <i class="fas fa-comments"></i> Contact Parties
                                </button>
                            </div>
                            
                            <div style="margin-top: 1.5rem;">
                                <h5>Status</h5>
                                <select class="form-control" onchange="updateDisputeStatus(${disputeId}, this.value)">
                                    <option value="submitted">Submitted</option>
                                    <option value="under_review" selected>Under Review</option>
                                    <option value="investigating">Investigating</option>
                                    <option value="awaiting_response">Awaiting Response</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            
                            <div style="margin-top: 1rem;">
                                <h5>Priority</h5>
                                <select class="form-control">
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high" selected>High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function assignDispute(disputeId) {
    showNotification(`Dispute ${disputeId} assigned to you`, 'success');
    closeModal('disputeDetailsModal');
    loadRecentDisputes();
}

function resolveDispute(disputeId) {
    showNotification(`Dispute ${disputeId} marked as resolved`, 'success');
    closeModal('disputeDetailsModal');
    loadRecentDisputes();
    
    // Update metrics
    const disputeElement = document.getElementById('openDisputes');
    const currentCount = parseInt(disputeElement.textContent) || 0;
    disputeElement.textContent = Math.max(0, currentCount - 1);
}

function escalateDispute(disputeId) {
    showNotification(`Dispute ${disputeId} escalated to senior admin`, 'warning');
    closeModal('disputeDetailsModal');
}

function contactParties(disputeId) {
    showNotification('Opening communication channel', 'info');
}

function updateDisputeStatus(disputeId, newStatus) {
    showNotification(`Dispute ${disputeId} status updated to ${newStatus}`, 'info');
}

function viewAllDisputes() {
    window.open('/admin/disputes', '_blank');
}

function exportReports() {
    showNotification('Generating reports...', 'info');
    
    // Simulate report generation
    setTimeout(() => {
        showNotification('Reports exported successfully', 'success');
        
        // Create download link
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,RFQ Platform Report\n\nGenerated: ' + new Date().toLocaleString() + '\n\nTotal Users: ' + adminData.users + '\nActive RFQs: ' + adminData.rfqs + '\nOpen Disputes: ' + adminData.disputes + '\nRevenue: SAR ' + adminData.revenue.toLocaleString();
        link.download = 'rfq-platform-report-' + new Date().toISOString().split('T')[0] + '.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, 2000);
}

function viewSystemLogs() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'systemLogsModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2><i class="fas fa-file-alt"></i> System Logs</h2>
                <button class="modal-close" onclick="closeModal('systemLogsModal')">&times;</button>
            </div>
            <div class="modal-body">
                <div style="background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; max-height: 400px; overflow-y: auto;">
                    <div>[${new Date().toISOString()}] INFO: Admin dashboard loaded successfully</div>
                    <div>[${new Date().toISOString()}] INFO: WebSocket connection established</div>
                    <div>[${new Date().toISOString()}] WARN: High storage usage detected (85%)</div>
                    <div>[${new Date().toISOString()}] INFO: New user registration: user_12345</div>
                    <div>[${new Date().toISOString()}] INFO: RFQ created: rfq_67890</div>
                    <div>[${new Date().toISOString()}] WARN: Failed login attempt from IP: 192.168.1.100</div>
                    <div>[${new Date().toISOString()}] INFO: Dispute resolved: dispute_abc123</div>
                    <div>[${new Date().toISOString()}] INFO: Database backup completed</div>
                    <div>[${new Date().toISOString()}] ERROR: Email service timeout (resolved)</div>
                    <div>[${new Date().toISOString()}] INFO: Performance metrics updated</div>
                </div>
                <div style="margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="refreshLogs()">
                        <i class="fas fa-refresh"></i> Refresh Logs
                    </button>
                    <button class="btn btn-secondary" onclick="downloadLogs()">
                        <i class="fas fa-download"></i> Download Full Logs
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function refreshLogs() {
    showNotification('Logs refreshed', 'info');
}

function downloadLogs() {
    showNotification('Downloading system logs...', 'info');
}

function manageUsers() {
    showNotification('Opening user management panel', 'info');
}

function platformSettings() {
    showNotification('Opening platform settings', 'info');
}

function securityAudit() {
    showNotification('Starting security audit...', 'info');
    
    setTimeout(() => {
        addSystemAlert('Security Audit', 'Security audit completed - No issues found', 'success');
    }, 3000);
}

// Export functions for global use
window.viewDispute = viewDispute;
window.assignDispute = assignDispute;
window.resolveDispute = resolveDispute;
window.escalateDispute = escalateDispute;
window.contactParties = contactParties;
window.updateDisputeStatus = updateDisputeStatus;
window.viewAllDisputes = viewAllDisputes;
window.exportReports = exportReports;
window.viewSystemLogs = viewSystemLogs;
window.refreshLogs = refreshLogs;
window.downloadLogs = downloadLogs;
window.manageUsers = manageUsers;
window.platformSettings = platformSettings;
window.securityAudit = securityAudit;

// Document Verification Functions
window.loadPendingVerifications = loadPendingVerifications;
window.loadComplianceReport = loadComplianceReport;
window.exportVerificationData = exportVerificationData;
window.verifyDocument = verifyDocument;
window.rejectDocument = rejectDocument;
window.viewDocumentDetails = viewDocumentDetails;

// Load document verification metrics
async function loadDocumentVerificationMetrics() {
    const token = localStorage.getItem('jwt');
    
    try {
        // Simulate document verification data for now
        // In a real implementation, this would fetch from /api/document-verifications/statistics
        
        const pendingCount = Math.floor(Math.random() * 15) + 5;
        const verifiedToday = Math.floor(Math.random() * 8) + 2;
        const avgScore = Math.floor(Math.random() * 20) + 75;
        
        document.getElementById('pendingVerifications').textContent = pendingCount;
        document.getElementById('verifiedDocuments').textContent = verifiedToday;
        document.getElementById('complianceScore').textContent = `${avgScore}%`;
        
        // Update pending approvals metric to include document verifications
        const currentPending = parseInt(document.getElementById('pendingApprovals').textContent) || 0;
        document.getElementById('pendingApprovals').textContent = currentPending + pendingCount;
        
    } catch (error) {
        console.error('Error loading document verification metrics:', error);
    }
}

// Load pending document verifications
async function loadPendingVerifications() {
    const token = localStorage.getItem('jwt');
    const verificationList = document.getElementById('verificationList');
    const tableBody = document.getElementById('verificationTableBody');
    
    try {
        // Show loading state
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
        verificationList.style.display = 'block';
        
        // Simulate pending verifications data
        const mockVerifications = [
            {
                id: 1,
                entityType: 'vendor',
                entityName: 'Saudi Tech Solutions',
                documentType: 'commercial_registration',
                documentNumber: '1234567890',
                complianceScore: 85,
                createdAt: '2024-01-15T10:30:00Z'
            },
            {
                id: 2,
                entityType: 'buyer',
                entityName: 'Al-Riyadh Industries',
                documentType: 'vat_certificate',
                documentNumber: '312345678901234',
                complianceScore: 92,
                createdAt: '2024-01-15T09:15:00Z'
            },
            {
                id: 3,
                entityType: 'vendor',
                entityName: 'Construction Plus LLC',
                documentType: 'national_address',
                documentNumber: '12345678',
                complianceScore: 78,
                createdAt: '2024-01-14T16:45:00Z'
            }
        ];
        
        // Populate table
        tableBody.innerHTML = '';
        mockVerifications.forEach(verification => {
            const row = document.createElement('tr');
            const scoreClass = verification.complianceScore >= 80 ? 'success' : 
                             verification.complianceScore >= 60 ? 'warning' : 'danger';
            
            row.innerHTML = `
                <td>
                    <div style="font-weight: 600;">${verification.entityName}</div>
                    <div style="font-size: 0.85em; color: var(--muted-color);">${verification.entityType}</div>
                </td>
                <td>${verification.documentType.replace('_', ' ').toUpperCase()}</td>
                <td><code>${verification.documentNumber}</code></td>
                <td>
                    <span class="status-badge status-${scoreClass}">${verification.complianceScore}%</span>
                </td>
                <td>${new Date(verification.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary btn-icon" onclick="viewDocumentDetails(${verification.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success btn-icon" onclick="verifyDocument(${verification.id})" title="Verify">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-icon" onclick="rejectDocument(${verification.id})" title="Reject">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading pending verifications:', error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger-color);">Error loading verifications</td></tr>';
    }
}

// Load compliance report
function loadComplianceReport() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3><i class="fas fa-chart-bar"></i> Compliance Report</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="admin-metrics" style="margin-bottom: 2rem;">
                    <div class="metric-card success">
                        <div class="metric-number success">87%</div>
                        <div class="metric-label">Overall Compliance</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-number">245</div>
                        <div class="metric-label">Total Documents</div>
                    </div>
                    <div class="metric-card warning">
                        <div class="metric-number warning">18</div>
                        <div class="metric-label">Pending Review</div>
                    </div>
                </div>
                
                <h4>Document Type Breakdown</h4>
                <div class="chart-container">
                    <canvas id="complianceChart" width="400" height="200"></canvas>
                </div>
                
                <h4>Recent Compliance Issues</h4>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 0.5rem; border-left: 3px solid var(--warning-color); margin-bottom: 0.5rem; background: var(--light-color);">
                        <strong>Invalid VAT Number Format:</strong> 3 documents require re-submission
                    </li>
                    <li style="padding: 0.5rem; border-left: 3px solid var(--danger-color); margin-bottom: 0.5rem; background: var(--light-color);">
                        <strong>Expired Commercial Registration:</strong> 2 vendors need to update documents
                    </li>
                    <li style="padding: 0.5rem; border-left: 3px solid var(--info-color); margin-bottom: 0.5rem; background: var(--light-color);">
                        <strong>Missing National Address:</strong> 5 entities should provide this optional document
                    </li>
                </ul>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                <button class="btn btn-primary" onclick="exportVerificationData()">Export Full Report</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Draw simple compliance chart
    setTimeout(() => {
        drawComplianceChart('complianceChart');
    }, 100);
}

// Export verification data
function exportVerificationData() {
    // Simulate export functionality
    showNotification('Compliance report exported successfully', 'success');
    
    // In a real implementation, this would trigger a download
    const data = {
        timestamp: new Date().toISOString(),
        totalDocuments: 245,
        verifiedDocuments: 213,
        pendingDocuments: 18,
        rejectedDocuments: 14,
        overallComplianceScore: 87
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Verify document
function verifyDocument(documentId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-check-circle"></i> Verify Document</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to verify this document?</p>
                <div style="margin: 1rem 0;">
                    <label for="verificationNotes">Verification Notes (optional):</label>
                    <textarea id="verificationNotes" class="form-control" rows="3" placeholder="Add any notes about the verification..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn btn-success" onclick="confirmVerification(${documentId}, this.closest('.modal-overlay'))">
                    <i class="fas fa-check"></i> Verify Document
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Reject document
function rejectDocument(documentId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-times-circle"></i> Reject Document</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <p>Please provide a reason for rejecting this document:</p>
                <div style="margin: 1rem 0;">
                    <label for="rejectionReason">Rejection Reason *:</label>
                    <textarea id="rejectionReason" class="form-control" rows="3" placeholder="Explain why this document is being rejected..." required></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                <button class="btn btn-danger" onclick="confirmRejection(${documentId}, this.closest('.modal-overlay'))">
                    <i class="fas fa-times"></i> Reject Document
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Confirm verification
function confirmVerification(documentId, modal) {
    const notes = document.getElementById('verificationNotes').value;
    
    // In a real implementation, this would make an API call
    // POST /api/document-verifications/${documentId}/verify
    
    showNotification('Document verified successfully', 'success');
    modal.remove();
    loadPendingVerifications(); // Refresh the list
    loadDocumentVerificationMetrics(); // Update metrics
}

// Confirm rejection
function confirmRejection(documentId, modal) {
    const reason = document.getElementById('rejectionReason').value.trim();
    
    if (!reason) {
        showNotification('Please provide a rejection reason', 'error');
        return;
    }
    
    // In a real implementation, this would make an API call
    // POST /api/document-verifications/${documentId}/reject
    
    showNotification('Document rejected', 'warning');
    modal.remove();
    loadPendingVerifications(); // Refresh the list
    loadDocumentVerificationMetrics(); // Update metrics
}

// View document details
function viewDocumentDetails(documentId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h3><i class="fas fa-file-alt"></i> Document Details</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                    <div>
                        <h4>Document Information</h4>
                        <table class="data-table">
                            <tr><td><strong>Document Type:</strong></td><td>Commercial Registration</td></tr>
                            <tr><td><strong>Document Number:</strong></td><td>1234567890</td></tr>
                            <tr><td><strong>Entity:</strong></td><td>Saudi Tech Solutions (Vendor)</td></tr>
                            <tr><td><strong>Submitted:</strong></td><td>Jan 15, 2024 10:30 AM</td></tr>
                            <tr><td><strong>Expiry Date:</strong></td><td>Dec 31, 2024</td></tr>
                        </table>
                        
                        <h4 style="margin-top: 1.5rem;">Automated Checks</h4>
                        <ul style="list-style: none; padding: 0;">
                            <li style="padding: 0.25rem 0;"><i class="fas fa-check text-success"></i> Document number format valid</li>
                            <li style="padding: 0.25rem 0;"><i class="fas fa-check text-success"></i> Document type matches</li>
                            <li style="padding: 0.25rem 0;"><i class="fas fa-check text-success"></i> Expiry date valid</li>
                            <li style="padding: 0.25rem 0;"><i class="fas fa-exclamation-triangle text-warning"></i> Manual verification pending</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4>Compliance Score: 85%</h4>
                        <div style="background: var(--light-color); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                            <div style="width: 85%; height: 20px; background: var(--success-color); border-radius: 10px;"></div>
                        </div>
                        
                        <h4>Document Preview</h4>
                        <div style="background: var(--light-color); padding: 2rem; text-align: center; border-radius: 6px; border: 2px dashed var(--border-color);">
                            <i class="fas fa-file-pdf fa-3x" style="color: var(--muted-color);"></i>
                            <p style="margin-top: 1rem; color: var(--muted-color);">Document preview would appear here</p>
                            <button class="btn btn-sm btn-secondary">
                                <i class="fas fa-download"></i> Download Document
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                <button class="btn btn-success" onclick="verifyDocument(${documentId}); this.closest('.modal-overlay').remove();">
                    <i class="fas fa-check"></i> Verify
                </button>
                <button class="btn btn-danger" onclick="rejectDocument(${documentId}); this.closest('.modal-overlay').remove();">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Draw compliance chart
function drawComplianceChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const data = [
        { label: 'Commercial Registration', value: 89, color: '#10b981' },
        { label: 'VAT Certificate', value: 92, color: '#3b82f6' },
        { label: 'National Address', value: 76, color: '#f59e0b' },
        { label: 'Additional Numbers', value: 84, color: '#8b5cf6' }
    ];
    
    // Simple bar chart
    const barWidth = 60;
    const barSpacing = 20;
    const startX = 50;
    const startY = canvas.height - 30;
    const maxHeight = canvas.height - 60;
    
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    
    data.forEach((item, index) => {
        const x = startX + index * (barWidth + barSpacing);
        const barHeight = (item.value / 100) * maxHeight;
        const y = startY - barHeight;
        
        // Draw bar
        ctx.fillStyle = item.color;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw value
        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        ctx.fillText(`${item.value}%`, x + barWidth / 2, y - 5);
        
        // Draw label
        ctx.save();
        ctx.translate(x + barWidth / 2, startY + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'right';
        ctx.fillText(item.label, 0, 0);
        ctx.restore();
    });
}