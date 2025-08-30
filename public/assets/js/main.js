// RFQ Platform JavaScript

// Global variables
let currentUser = null;
let apiBaseUrl = '/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadStats();
    initializeEventListeners();
});

// Authentication functions
function checkAuthStatus() {
    const token = localStorage.getItem('jwt');
    if (token) {
        fetch(`${apiBaseUrl}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => response.json())
        .then(user => {
            if (user && !user.error) {
                currentUser = user;
                updateUserInterface();
            } else {
                localStorage.removeItem('jwt');
            }
        })
        .catch(error => {
            console.error('Auth check failed:', error);
            localStorage.removeItem('jwt');
        });
    }
}

function updateUserInterface() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.username || 'User';
        document.getElementById('guestMenu').classList.add('hidden');
        document.getElementById('userMenu').classList.remove('hidden');
        
        // Update profile link
        const profileLink = document.getElementById('profileLink');
        if (profileLink) {
            profileLink.href = `/profile/${currentUser.id}`;
        }
    } else {
        document.getElementById('userName').textContent = 'Guest';
        document.getElementById('guestMenu').classList.remove('hidden');
        document.getElementById('userMenu').classList.add('hidden');
    }
}

// Modal functions
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
}

function showSignupModal() {
    document.getElementById('signupModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Authentication handlers
function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Signup form
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const loginData = {
        identifier: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        const response = await fetch(`${apiBaseUrl}/auth/local`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (result.jwt) {
            localStorage.setItem('jwt', result.jwt);
            currentUser = result.user;
            updateUserInterface();
            closeModal('loginModal');
            showNotification('Login successful!', 'success');
        } else {
            showNotification(result.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const signupData = {
        username: formData.get('email'),
        email: formData.get('email'),
        password: formData.get('password'),
        companyName: formData.get('companyName'),
        contactPerson: formData.get('contactPerson'),
        phone: formData.get('phone'),
        userType: formData.get('userType')
    };
    
    try {
        const response = await fetch(`${apiBaseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(signupData)
        });
        
        const result = await response.json();
        
        if (result.jwt) {
            localStorage.setItem('jwt', result.jwt);
            currentUser = result.user;
            
            // Create buyer or vendor profile
            await createUserProfile(signupData.userType, signupData);
            
            updateUserInterface();
            closeModal('signupModal');
            showNotification('Registration successful!', 'success');
        } else {
            showNotification(result.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

async function createUserProfile(userType, userData) {
    const token = localStorage.getItem('jwt');
    const profileData = {
        companyName: userData.companyName,
        contactPerson: userData.contactPerson,
        email: userData.email,
        phone: userData.phone,
        user: currentUser.id
    };
    
    const endpoint = userType === 'buyer' ? '/buyers' : '/vendors';
    
    try {
        await fetch(`${apiBaseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data: profileData })
        });
    } catch (error) {
        console.error('Profile creation error:', error);
    }
}

function logout() {
    localStorage.removeItem('jwt');
    currentUser = null;
    updateUserInterface();
    showNotification('Logged out successfully', 'info');
}

// Load platform statistics
async function loadStats() {
    try {
        const [rfqsResponse, buyersResponse, vendorsResponse] = await Promise.all([
            fetch(`${apiBaseUrl}/rfqs?pagination[pageSize]=1`),
            fetch(`${apiBaseUrl}/buyers?pagination[pageSize]=1`),
            fetch(`${apiBaseUrl}/vendors?pagination[pageSize]=1`)
        ]);
        
        const [rfqsData, buyersData, vendorsData] = await Promise.all([
            rfqsResponse.json(),
            buyersResponse.json(),
            vendorsResponse.json()
        ]);
        
        // Update stats display
        document.getElementById('totalRfqs').textContent = rfqsData.meta?.pagination?.total || 0;
        document.getElementById('totalBuyers').textContent = buyersData.meta?.pagination?.total || 0;
        document.getElementById('totalVendors').textContent = vendorsData.meta?.pagination?.total || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// User type field toggle
function toggleUserTypeFields() {
    const userType = document.getElementById('userType').value;
    // Additional fields could be shown/hidden based on user type
    // This is a placeholder for future functionality
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// URL routing helper
function navigateToRfq(id, title) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    window.location.href = `/rfq/${id}/${slug}`;
}

function navigateToProfile(id) {
    window.location.href = `/profile/${id}`;
}

// Export functions for global use
window.showLoginModal = showLoginModal;
window.showSignupModal = showSignupModal;
window.closeModal = closeModal;
window.logout = logout;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleUserTypeFields = toggleUserTypeFields;
window.navigateToRfq = navigateToRfq;
window.navigateToProfile = navigateToProfile;