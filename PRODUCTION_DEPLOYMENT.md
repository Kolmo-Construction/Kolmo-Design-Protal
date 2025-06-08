# Production Deployment Guide for kolmo.design

## Pre-Deployment Checklist

### 1. Stripe Configuration
- [ ] Live API keys configured (not test keys)
- [ ] Webhook endpoint created: `https://kolmo.design/api/webhooks/stripe`
- [ ] Webhook signing secret added to environment variables
- [ ] Domain authorized in Stripe settings

### 2. Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Service
SENDGRID_API_KEY=SG...

# File Storage (Optional)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...
```

### 3. Stripe Webhook Events
Configure these events in Stripe Dashboard:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.created`
- `invoice.payment_succeeded`

## Deployment Steps

### 1. Replit Deployment Setup
1. Ensure all environment variables are configured in Replit Secrets
2. Set custom domain to `kolmo.design` in deployment settings
3. Verify SSL certificate is provisioned automatically

### 2. DNS Configuration
Point your domain to Replit:
- Add CNAME record: `kolmo.design` → `your-repl-name.replit.app`
- Or use A record pointing to Replit's IP addresses

### 3. Production Testing
Test critical payment flows:
1. Visit `https://kolmo.design/quotes/public/[quote-id]`
2. Complete payment form with live card
3. Verify webhook receives events at `/api/webhooks/stripe`
4. Confirm project creation and email notifications

## Application Architecture

### Frontend (Vite + React)
- Served from `https://kolmo.design/`
- Payment forms use Stripe Elements
- Responsive design for all devices
- Real-time project tracking

### Backend (Express.js)
- API routes at `https://kolmo.design/api/`
- Secure webhook handling
- Database operations with PostgreSQL
- File uploads to Cloudflare R2

### Payment Flow
1. Customer visits quote page
2. Fills payment form (Stripe Elements)
3. Payment processed securely by Stripe
4. Webhook confirms payment success
5. Project automatically created
6. Email confirmation sent

## Security Features
- All payment data handled by Stripe (PCI compliant)
- Webhook signature verification
- Secure session management
- Role-based access control
- HTTPS enforced for all connections

## Monitoring & Maintenance
- Monitor webhook delivery in Stripe Dashboard
- Check Replit deployment logs for errors
- Use admin panel for project management
- Email notifications for payment issues

## Support Contacts
- Payment disputes: Handle through Stripe Dashboard
- Technical issues: Check Replit deployment logs
- Customer support: Use built-in messaging system