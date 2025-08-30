// Enhanced RFQ functionality with advanced search, favorites, communication, and disputes

let rfqData = [];
let filteredRfqs = [];
let currentFilters = {};
let favorites = JSON.parse(localStorage.getItem('rfq_favorites') || '{"rfqs": [], "vendors": [], "buyers": []}');

// Initialize enhanced RFQ functionality
document.addEventListener('DOMContentLoaded', function() {
    loadRfqs();
    initializeSearch();
    updateActiveFilters();
});

// Initialize search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(performSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load RFQs with enhanced data
async function loadRfqs() {
    try {
        const response = await fetch('/api/rfqs?populate=buyer,bids,attachments&pagination[pageSize]=50');
        const data = await response.json();
        
        if (data.data) {
            rfqData = data.data;
            filteredRfqs = [...rfqData];
            displayRfqs(filteredRfqs);
        }
    } catch (error) {
        console.error('Error loading RFQs:', error);
        showNotification('Error loading RFQs', 'error');
    }
}

// Display RFQs with enhanced UI
function displayRfqs(rfqs) {
    const rfqGrid = document.getElementById('rfqGrid');
    if (!rfqGrid) return;

    if (rfqs.length === 0) {
        rfqGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: var(--secondary-color); margin-bottom: 1rem;"></i>
                <h3>No RFQs found</h3>
                <p>Try adjusting your search criteria or filters</p>
            </div>
        `;
        return;
    }

    rfqGrid.innerHTML = rfqs.map(rfq => {
        const attrs = rfq.attributes;
        const isFavorited = favorites.rfqs.some(fav => fav.id === rfq.id);
        const daysLeft = attrs.deadline ? Math.ceil((new Date(attrs.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
        
        return `
            <div class="rfq-card" data-rfq-id="${rfq.id}">
                <div class="rfq-header">
                    <h3 class="rfq-title">${attrs.title}</h3>
                    <div class="rfq-actions">
                        <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
                                onclick="toggleFavorite('rfqs', ${rfq.id}, '${attrs.title}', '${attrs.category}')"
                                title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-heart"></i>
                        </button>
                        <span class="rfq-category ${attrs.category}">${attrs.category}</span>
                    </div>
                </div>
                <div class="rfq-meta">
                    ${attrs.budget ? `<span class="rfq-budget"><i class="fas fa-money-bill-wave"></i> ${attrs.currency || 'SAR'} ${Number(attrs.budget).toLocaleString()}</span>` : ''}
                    ${daysLeft > 0 ? `<span class="rfq-deadline"><i class="fas fa-clock"></i> ${daysLeft} days left</span>` : 
                      daysLeft === 0 ? `<span class="rfq-deadline urgent"><i class="fas fa-exclamation-triangle"></i> Deadline today</span>` :
                      `<span class="rfq-deadline expired"><i class="fas fa-times-circle"></i> Expired</span>`}
                    ${attrs.location ? `<span class="rfq-location"><i class="fas fa-map-marker-alt"></i> ${attrs.location}</span>` : ''}
                    ${attrs.isUrgent ? `<span class="rfq-urgent"><i class="fas fa-fire"></i> Urgent</span>` : ''}
                </div>
                <div class="rfq-description">
                    ${attrs.description ? attrs.description.substring(0, 150) + (attrs.description.length > 150 ? '...' : '') : 'No description available'}
                </div>
                <div class="rfq-footer">
                    <div class="rfq-stats">
                        <span><i class="fas fa-eye"></i> ${attrs.viewCount || 0} views</span>
                        <span><i class="fas fa-file-contract"></i> ${attrs.bids?.data?.length || 0} bids</span>
                        ${attrs.buyer?.data ? `<span><i class="fas fa-user"></i> ${attrs.buyer.data.attributes?.companyName || 'Unknown Buyer'}</span>` : ''}
                    </div>
                    <div class="rfq-actions-footer">
                        <button class="btn btn-sm btn-secondary" onclick="viewRfqDetails(${rfq.id})">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        ${attrs.status === 'published' ? `
                            <button class="btn btn-sm btn-primary" onclick="startCommunication('buyer', ${attrs.buyer?.data?.id}, '${attrs.buyer?.data?.attributes?.companyName || 'Buyer'}')">
                                <i class="fas fa-comments"></i> Contact
                            </button>
                        ` : ''}
                        ${attrs.status === 'awarded' ? `
                            <button class="btn btn-sm btn-warning" onclick="openDispute('rfq', ${rfq.id})">
                                <i class="fas fa-gavel"></i> Dispute
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="rfq-status-indicator">
                    <span class="status-badge status-${attrs.status}">${attrs.status}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Perform search
function performSearch() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    if (searchTerm === '') {
        filteredRfqs = [...rfqData];
    } else {
        filteredRfqs = rfqData.filter(rfq => {
            const attrs = rfq.attributes;
            return (
                attrs.title?.toLowerCase().includes(searchTerm) ||
                attrs.description?.toLowerCase().includes(searchTerm) ||
                attrs.category?.toLowerCase().includes(searchTerm) ||
                attrs.location?.toLowerCase().includes(searchTerm) ||
                attrs.buyer?.data?.attributes?.companyName?.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    applyCurrentFilters();
    displayRfqs(filteredRfqs);
    updateActiveFilters();
}

// Apply filters
function applyFilters() {
    const category = document.getElementById('categoryFilter')?.value;
    const status = document.getElementById('statusFilter')?.value;
    const budget = document.getElementById('budgetFilter')?.value;
    const sortBy = document.getElementById('sortBy')?.value;

    // Update current filters
    currentFilters = { category, status, budget, sortBy };
    
    // Start with search results or all data
    let filtered = [...filteredRfqs];
    
    // Apply category filter
    if (category) {
        filtered = filtered.filter(rfq => rfq.attributes.category === category);
    }
    
    // Apply status filter
    if (status) {
        filtered = filtered.filter(rfq => rfq.attributes.status === status);
    }
    
    // Apply budget filter
    if (budget) {
        const [min, max] = budget.split('-').map(val => val === '' ? null : parseInt(val));
        filtered = filtered.filter(rfq => {
            const rfqBudget = rfq.attributes.budget;
            if (!rfqBudget) return false;
            
            if (min !== null && rfqBudget < min) return false;
            if (max !== null && rfqBudget > max) return false;
            return true;
        });
    }
    
    // Apply sorting
    if (sortBy) {
        const [field, direction] = sortBy.split('_');
        filtered.sort((a, b) => {
            let aVal, bVal;
            
            switch (field) {
                case 'created':
                    aVal = new Date(a.attributes.createdAt);
                    bVal = new Date(b.attributes.createdAt);
                    break;
                case 'deadline':
                    aVal = new Date(a.attributes.deadline);
                    bVal = new Date(b.attributes.deadline);
                    break;
                case 'budget':
                    aVal = a.attributes.budget || 0;
                    bVal = b.attributes.budget || 0;
                    break;
                case 'title':
                    aVal = a.attributes.title?.toLowerCase() || '';
                    bVal = b.attributes.title?.toLowerCase() || '';
                    break;
                default:
                    return 0;
            }
            
            if (direction === 'desc') {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            } else {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            }
        });
    }
    
    displayRfqs(filtered);
    updateActiveFilters();
}

// Apply current filters to the filtered results
function applyCurrentFilters() {
    if (Object.keys(currentFilters).length > 0) {
        // Re-apply existing filters to the new search results
        const category = currentFilters.category;
        const status = currentFilters.status;
        const budget = currentFilters.budget;
        
        if (category) {
            filteredRfqs = filteredRfqs.filter(rfq => rfq.attributes.category === category);
        }
        
        if (status) {
            filteredRfqs = filteredRfqs.filter(rfq => rfq.attributes.status === status);
        }
        
        if (budget) {
            const [min, max] = budget.split('-').map(val => val === '' ? null : parseInt(val));
            filteredRfqs = filteredRfqs.filter(rfq => {
                const rfqBudget = rfq.attributes.budget;
                if (!rfqBudget) return false;
                
                if (min !== null && rfqBudget < min) return false;
                if (max !== null && rfqBudget > max) return false;
                return true;
            });
        }
    }
}

// Clear all filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('budgetFilter').value = '';
    document.getElementById('sortBy').value = 'created_desc';
    
    currentFilters = {};
    filteredRfqs = [...rfqData];
    displayRfqs(filteredRfqs);
    updateActiveFilters();
}

// Update active filters display
function updateActiveFilters() {
    const activeFiltersContainer = document.getElementById('activeFilters');
    const filterTags = document.getElementById('filterTags');
    
    if (!activeFiltersContainer || !filterTags) return;
    
    const activeTags = [];
    
    if (currentFilters.category) {
        activeTags.push(`Category: ${currentFilters.category}`);
    }
    
    if (currentFilters.status) {
        activeTags.push(`Status: ${currentFilters.status}`);
    }
    
    if (currentFilters.budget) {
        const [min, max] = currentFilters.budget.split('-');
        if (max === '') {
            activeTags.push(`Budget: Over SAR ${Number(min).toLocaleString()}`);
        } else {
            activeTags.push(`Budget: SAR ${Number(min).toLocaleString()} - ${Number(max).toLocaleString()}`);
        }
    }
    
    const searchTerm = document.getElementById('searchInput')?.value;
    if (searchTerm) {
        activeTags.push(`Search: "${searchTerm}"`);
    }
    
    if (activeTags.length > 0) {
        filterTags.innerHTML = activeTags.map(tag => 
            `<span class="filter-tag">${tag} <button onclick="removeFilter('${tag}')">&times;</button></span>`
        ).join('');
        activeFiltersContainer.style.display = 'block';
    } else {
        activeFiltersContainer.style.display = 'none';
    }
}

// Open advanced search modal
function openAdvancedSearch() {
    document.getElementById('advancedSearchModal').classList.add('active');
}

// Perform advanced search
function performAdvancedSearch(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('advSearchTitle').value,
        category: document.getElementById('advSearchCategory').value,
        budgetMin: document.getElementById('advSearchBudgetMin').value,
        budgetMax: document.getElementById('advSearchBudgetMax').value,
        location: document.getElementById('advSearchLocation').value,
        deadline: document.getElementById('advSearchDeadline').value,
        keywords: document.getElementById('advSearchKeywords').value,
        urgent: document.getElementById('advSearchUrgent').value
    };
    
    // Filter RFQs based on advanced criteria
    filteredRfqs = rfqData.filter(rfq => {
        const attrs = rfq.attributes;
        
        // Title search
        if (formData.title && !attrs.title?.toLowerCase().includes(formData.title.toLowerCase())) {
            return false;
        }
        
        // Category filter
        if (formData.category && attrs.category !== formData.category) {
            return false;
        }
        
        // Budget range
        if (formData.budgetMin && attrs.budget < parseFloat(formData.budgetMin)) {
            return false;
        }
        if (formData.budgetMax && attrs.budget > parseFloat(formData.budgetMax)) {
            return false;
        }
        
        // Location search
        if (formData.location && !attrs.location?.toLowerCase().includes(formData.location.toLowerCase())) {
            return false;
        }
        
        // Deadline filter
        if (formData.deadline) {
            const deadlineDate = new Date(attrs.deadline);
            const now = new Date();
            const daysUntilDeadline = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysUntilDeadline > parseInt(formData.deadline)) {
                return false;
            }
        }
        
        // Keywords search
        if (formData.keywords) {
            const keywords = formData.keywords.toLowerCase().split(',').map(k => k.trim());
            const searchText = `${attrs.title} ${attrs.description} ${JSON.stringify(attrs.keywords)}`.toLowerCase();
            
            if (!keywords.some(keyword => searchText.includes(keyword))) {
                return false;
            }
        }
        
        // Urgency filter
        if (formData.urgent !== '') {
            if (formData.urgent === 'true' && !attrs.isUrgent) {
                return false;
            }
            if (formData.urgent === 'false' && attrs.isUrgent) {
                return false;
            }
        }
        
        return true;
    });
    
    displayRfqs(filteredRfqs);
    closeModal('advancedSearchModal');
    updateActiveFilters();
    
    showNotification(`Found ${filteredRfqs.length} RFQs matching your criteria`, 'success');
}

// Reset advanced search form
function resetAdvancedSearch() {
    document.getElementById('advancedSearchForm').reset();
}

// Toggle favorite
function toggleFavorite(type, id, title, category) {
    const item = { id: id.toString(), title, category };
    const existingIndex = favorites[type].findIndex(fav => fav.id === id.toString());
    
    if (existingIndex >= 0) {
        favorites[type].splice(existingIndex, 1);
        showNotification('Removed from favorites', 'info');
    } else {
        favorites[type].push(item);
        showNotification('Added to favorites', 'success');
    }
    
    localStorage.setItem('rfq_favorites', JSON.stringify(favorites));
    
    // Update UI
    const favoriteBtn = document.querySelector(`[data-rfq-id="${id}"] .favorite-btn`);
    if (favoriteBtn) {
        favoriteBtn.classList.toggle('favorited');
        const icon = favoriteBtn.querySelector('i');
        favoriteBtn.title = favoriteBtn.classList.contains('favorited') ? 'Remove from favorites' : 'Add to favorites';
    }
}

// View RFQ details
async function viewRfqDetails(rfqId) {
    try {
        const response = await fetch(`/api/rfqs/${rfqId}?populate=buyer,bids.vendor,attachments`);
        const data = await response.json();
        
        if (data.data) {
            displayRfqDetailsModal(data.data);
        }
    } catch (error) {
        console.error('Error loading RFQ details:', error);
        showNotification('Error loading RFQ details', 'error');
    }
}

// Display RFQ details in modal
function displayRfqDetailsModal(rfq) {
    const attrs = rfq.attributes;
    const modal = document.getElementById('rfqDetailsModal');
    const title = document.getElementById('rfqDetailsTitle');
    const content = document.getElementById('rfqDetailsContent');
    
    title.textContent = attrs.title;
    
    content.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
            <div>
                <h3>Description</h3>
                <div style="margin-bottom: 1.5rem;">${attrs.description || 'No description available'}</div>
                
                ${attrs.requirements ? `
                    <h3>Requirements</h3>
                    <div style="margin-bottom: 1.5rem;">${attrs.requirements}</div>
                ` : ''}
                
                ${attrs.attachments?.data?.length > 0 ? `
                    <h3>Attachments</h3>
                    <div style="margin-bottom: 1.5rem;">
                        ${attrs.attachments.data.map(file => 
                            `<a href="${file.attributes.url}" target="_blank" class="btn btn-sm btn-secondary" style="margin-right: 0.5rem;">
                                <i class="fas fa-download"></i> ${file.attributes.name}
                            </a>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <h3>Bids (${attrs.bids?.data?.length || 0})</h3>
                <div>
                    ${attrs.bids?.data?.length > 0 ? attrs.bids.data.map(bid => `
                        <div style="border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div>
                                    <strong>${bid.attributes.vendor?.data?.attributes?.companyName || 'Unknown Vendor'}</strong>
                                    <p>Price: ${bid.attributes.currency} ${Number(bid.attributes.price).toLocaleString()}</p>
                                    <p>Delivery: ${bid.attributes.deliveryTime} days</p>
                                </div>
                                <span class="status-badge status-${bid.attributes.status}">${bid.attributes.status}</span>
                            </div>
                        </div>
                    `).join('') : '<p class="text-muted">No bids submitted yet</p>'}
                </div>
            </div>
            
            <div>
                <div style="background: var(--light-color); padding: 1.5rem; border-radius: 8px;">
                    <h3>RFQ Details</h3>
                    <div style="margin-bottom: 1rem;">
                        <strong>Category:</strong> ${attrs.category}
                    </div>
                    ${attrs.budget ? `
                        <div style="margin-bottom: 1rem;">
                            <strong>Budget:</strong> ${attrs.currency} ${Number(attrs.budget).toLocaleString()}
                        </div>
                    ` : ''}
                    <div style="margin-bottom: 1rem;">
                        <strong>Deadline:</strong> ${new Date(attrs.deadline).toLocaleDateString()}
                    </div>
                    ${attrs.location ? `
                        <div style="margin-bottom: 1rem;">
                            <strong>Location:</strong> ${attrs.location}
                        </div>
                    ` : ''}
                    <div style="margin-bottom: 1rem;">
                        <strong>Status:</strong> <span class="status-badge status-${attrs.status}">${attrs.status}</span>
                    </div>
                    ${attrs.buyer?.data ? `
                        <div style="margin-bottom: 1rem;">
                            <strong>Buyer:</strong> ${attrs.buyer.data.attributes?.companyName || 'Unknown'}
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 1rem;">
                    <button class="btn btn-primary" style="width: 100%; margin-bottom: 0.5rem;" 
                            onclick="startCommunication('buyer', ${attrs.buyer?.data?.id}, '${attrs.buyer?.data?.attributes?.companyName || 'Buyer'}')">
                        <i class="fas fa-comments"></i> Contact Buyer
                    </button>
                    <button class="btn btn-secondary" style="width: 100%;" 
                            onclick="toggleFavorite('rfqs', ${rfq.id}, '${attrs.title}', '${attrs.category}')">
                        <i class="fas fa-heart"></i> Add to Favorites
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Start communication
function startCommunication(recipientType, recipientId, recipientName) {
    document.getElementById('messageRecipient').value = recipientName;
    document.getElementById('messageRecipientId').value = recipientId;
    document.getElementById('messageSubject').value = '';
    document.getElementById('messageContent').value = '';
    
    closeModal('rfqDetailsModal');
    document.getElementById('communicationModal').classList.add('active');
}

// Send message
async function sendMessage(event) {
    event.preventDefault();
    
    const messageData = {
        recipient: document.getElementById('messageRecipientId').value,
        subject: document.getElementById('messageSubject').value,
        content: document.getElementById('messageContent').value
    };
    
    try {
        // In a real implementation, this would send to a messaging API
        // For now, just show success message
        showNotification('Message sent successfully!', 'success');
        closeModal('communicationModal');
        
        // Store message locally for demo purposes
        const messages = JSON.parse(localStorage.getItem('rfq_messages') || '[]');
        messages.push({
            ...messageData,
            timestamp: new Date().toISOString(),
            sender: currentUser?.username || 'Anonymous'
        });
        localStorage.setItem('rfq_messages', JSON.stringify(messages));
        
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Error sending message', 'error');
    }
}

// Open dispute modal
function openDispute(type, id) {
    document.getElementById('disputeModal').classList.add('active');
    // Store dispute context
    window.disputeContext = { type, id };
}

// Submit dispute
async function submitDispute(event) {
    event.preventDefault();
    
    const disputeData = {
        type: document.getElementById('disputeType').value,
        description: document.getElementById('disputeDescription').value,
        evidence: document.getElementById('disputeEvidence').files,
        context: window.disputeContext
    };
    
    try {
        // In a real implementation, this would submit to a disputes API
        showNotification('Dispute submitted successfully. You will be contacted within 24 hours.', 'success');
        closeModal('disputeModal');
        
        // Store dispute locally for demo purposes
        const disputes = JSON.parse(localStorage.getItem('rfq_disputes') || '[]');
        disputes.push({
            ...disputeData,
            evidence: Array.from(disputeData.evidence).map(f => f.name), // Store file names only
            timestamp: new Date().toISOString(),
            status: 'submitted',
            submitter: currentUser?.username || 'Anonymous'
        });
        localStorage.setItem('rfq_disputes', JSON.stringify(disputes));
        
    } catch (error) {
        console.error('Error submitting dispute:', error);
        showNotification('Error submitting dispute', 'error');
    }
}

// Export functions for global use
window.performSearch = performSearch;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.openAdvancedSearch = openAdvancedSearch;
window.performAdvancedSearch = performAdvancedSearch;
window.resetAdvancedSearch = resetAdvancedSearch;
window.toggleFavorite = toggleFavorite;
window.viewRfqDetails = viewRfqDetails;
window.startCommunication = startCommunication;
window.sendMessage = sendMessage;
window.openDispute = openDispute;
window.submitDispute = submitDispute;