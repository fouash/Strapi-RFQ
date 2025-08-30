# RFQ Platform - Request for Quotation System

A comprehensive Strapi-based platform for managing Request for Quotations (RFQs) between buyers and vendors, with Saudi Arabian compliance features.

## 🚀 Features

### Phase 1: Core Platform Foundation (Implemented)

#### Content Types
- **Users**: Extended Strapi user authentication system
- **Buyers**: Comprehensive buyer profiles with company information
- **Vendors**: Detailed vendor profiles with specialties and ratings  
- **RFQs**: Request for Quotation management with categories and keywords
- **Bids**: Vendor bid submissions with proposals and pricing

#### User Authentication & Roles
- **Buyer Role**: Can create RFQs, view bids, award contracts
- **Vendor Role**: Can submit bids, view RFQs, manage proposals
- **Admin Role**: Full CRUD access to all data
- **Email-based registration** with role assignment

#### Core RFQ Functionality
- ✅ RFQ creation and validation
- ✅ Bid submission and management  
- ✅ Award process implementation
- ✅ File upload support for documents
- ✅ Status tracking (draft, published, closed, awarded)

#### Navigation & URLs
- ✅ Universal RFQ URLs: `/rfq/{id}/{title}`
- ✅ User profile URLs: `/profile/{id}`
- ✅ Main navigation with categories dropdown
- ✅ User authentication modals
- ✅ Responsive design

#### Saudi Arabian Compliance
- ✅ VAT Number validation (15 digits starting with '3')
- ✅ Commercial Registration validation (10 digits)
- ✅ National Address validation (8 digits)
- ✅ Support for additional numbers (AVL, NWC, SE, MODON)

## 📁 Project Structure

```
src/
├── api/
│   ├── buyer/           # Buyer content type
│   ├── vendor/          # Vendor content type  
│   ├── rfq/            # RFQ content type
│   └── bid/            # Bid content type
├── policies/           # Custom access policies
│   ├── is-buyer.ts
│   ├── is-vendor.ts
│   └── is-owner-or-admin.ts
└── extensions/         # Strapi extensions

public/
├── index.html          # Main landing page
├── assets/
│   ├── css/main.css   # Platform styles
│   └── js/main.js     # JavaScript functionality
└── favicon.png

config/
├── plugins.ts          # Plugin configurations
├── middlewares.ts      # Middleware stack
└── database.ts         # Database configuration
```

## 🛠️ Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run develop
   ```

3. **Access the application**:
   - Admin Panel: `http://localhost:1337/admin`
   - Frontend: `http://localhost:1337`
   - API: `http://localhost:1337/api`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/local` - User login
- `GET /api/users/me` - Get current user

### Buyers
- `GET /api/buyers` - List buyers
- `POST /api/buyers` - Create buyer profile
- `GET /api/buyers/:id` - Get buyer details

### Vendors  
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor profile
- `GET /api/vendors/:id` - Get vendor details

### RFQs
- `GET /api/rfqs` - List RFQs
- `POST /api/rfqs` - Create RFQ (buyers only)
- `GET /api/rfqs/:id` - Get RFQ details
- `POST /api/rfqs/:id/award` - Award RFQ to vendor

### Bids
- `GET /api/bids` - List bids
- `POST /api/bids` - Submit bid (vendors only)
- `GET /api/bids/:id` - Get bid details

## 🔐 Security & Permissions

### Role-Based Access Control
- **Buyers**: Can create RFQs, cannot submit bids
- **Vendors**: Can submit bids, cannot create RFQs  
- **Admins**: Full access to all resources

### Validation Features
- Email verification for registration
- Saudi compliance number validation
- File upload restrictions and validation

## 🌟 Key Features Implemented

### 1. Content Management
- Comprehensive content types for all platform entities
- Relationships between buyers, vendors, RFQs, and bids
- Rich text support for descriptions and proposals
- File attachment capabilities

### 2. User Management
- Role-based authentication system
- Profile management for buyers and vendors
- Saudi Arabian business registration validation
- Email-based registration workflow

### 3. RFQ Workflow
- Complete RFQ lifecycle management
- Bid submission and evaluation process
- Award mechanism for selecting vendors
- Status tracking throughout the process

### 4. Frontend Interface
- Responsive web design
- Modern UI with navigation system
- Authentication modals
- Real-time statistics display

## 📈 Future Development (Phase 2 & 3)

### Phase 2: User Experience & Features
- Dashboard development
- Advanced search functionality
- Internal communication system
- Favorites and dispute systems

### Phase 3: Compliance & Optimization  
- Enhanced admin dashboard
- WebSocket notifications
- Performance optimization
- Security review

---

## 🚀 Getting started with Strapi

### `develop`

Start your Strapi application with autoReload enabled.

```
npm run develop
```

### `build`

Build your admin panel.

```
npm run build
```

### `start`

Start your Strapi application with autoReload disabled.

```
npm run start
```

---

**Built with Strapi v5.23.1** | **Saudi Arabian Business Compliance Ready**
