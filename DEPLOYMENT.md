# Deployment Guide - RFQ Platform

## Pre-deployment Checklist

### 1. Environment Setup
- [ ] Generate secure APP_KEYS (use `openssl rand -base64 32`)
- [ ] Set up production database (PostgreSQL recommended)
- [ ] Configure file upload provider (AWS S3 recommended)
- [ ] Set up email provider (SendGrid recommended)
- [ ] Obtain SSL certificates

### 2. Security Configuration
```bash
# Generate secure keys
openssl rand -base64 32  # For APP_KEYS
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For API_TOKEN_SALT
```

### 3. Database Migration
```bash
# Run migrations in production
npm run strapi db:migrate
```

## Deployment Options

### Option 1: Docker Deployment

1. **Build and deploy with Docker Compose:**
```bash
# Copy environment file
cp .env.production .env

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

2. **Monitor deployment:**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Check health
curl http://localhost/_health
```

### Option 2: Traditional Server Deployment

1. **Install dependencies:**
```bash
npm ci --only=production
```

2. **Build application:**
```bash
npm run build
```

3. **Start with PM2:**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Option 3: Cloud Platform Deployment

#### Heroku
```bash
# Install Heroku CLI and login
heroku create your-rfq-platform
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
git push heroku main
```

#### Railway
```bash
# Connect to Railway
railway login
railway init
railway add postgresql
railway deploy
```

#### DigitalOcean App Platform
- Connect GitHub repository
- Set environment variables
- Deploy automatically

## Post-deployment Steps

### 1. Admin Setup
- Access `/admin` to create admin user
- Configure user roles (Buyer, Vendor)
- Set up initial categories and settings

### 2. SSL Configuration
```bash
# Using Let's Encrypt with Certbot
certbot --nginx -d your-domain.com
```

### 3. Monitoring Setup
- Set up application monitoring (New Relic, DataDog)
- Configure log aggregation
- Set up uptime monitoring

### 4. Performance Optimization
- Enable Redis for caching
- Configure CDN for static assets
- Set up database connection pooling

## Environment Variables Reference

### Required
- `APP_KEYS`: Comma-separated secure keys
- `DATABASE_URL`: Production database connection string
- `JWT_SECRET`: JWT signing secret
- `ADMIN_JWT_SECRET`: Admin JWT secret

### Optional
- `UPLOAD_PROVIDER`: File upload provider (local, aws-s3, cloudinary)
- `EMAIL_PROVIDER`: Email service provider
- `REDIS_URL`: Redis connection for caching
- `SENTRY_DSN`: Error tracking

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check firewall settings
   - Ensure SSL configuration

2. **File Upload Issues**
   - Verify upload provider configuration
   - Check file permissions
   - Validate AWS S3 credentials

3. **Performance Issues**
   - Enable database query logging
   - Monitor memory usage
   - Check for N+1 queries

### Health Check Endpoint
```bash
curl http://your-domain.com/_health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "database": "connected"
}
```

## Backup Strategy

### Database Backup
```bash
# PostgreSQL backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### File Backup
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Configure session store (Redis)
- Separate database server

### Vertical Scaling
- Monitor CPU and memory usage
- Optimize database queries
- Enable caching layers

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Secure headers configured (HSTS, CSP)
- [ ] Rate limiting implemented
- [ ] Input validation enabled
- [ ] File upload restrictions configured
- [ ] Database credentials secured
- [ ] Regular security updates applied