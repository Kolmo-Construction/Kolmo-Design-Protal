# Production Deployment Guide for kolmo.design

## Stripe Configuration for Production

### 1. Domain Authorization
Add these domains to your Stripe Dashboard → Settings → Authorized domains:
- `kolmo.design`
- `www.kolmo.design`

### 2. Webhook Endpoints
Configure these webhook endpoints in Stripe Dashboard → Developers → Webhooks:
- Endpoint URL: `https://kolmo.design/api/webhooks/stripe`
- Events to send:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.created`
  - `invoice.payment_succeeded`

### 3. Environment Variables
Ensure these are set in production:
```
STRIPE_SECRET_KEY=sk_live_... (live key, not test key)
VITE_STRIPE_PUBLIC_KEY=pk_live_... (live key, not test key)
STRIPE_WEBHOOK_SECRET=whsec_... (webhook signing secret from Stripe dashboard)
```

## Payment Flow Architecture

### Client-Side (kolmo.design)
1. User fills out payment form
2. Stripe Elements securely collects payment details
3. Payment confirmed with return URL: `https://kolmo.design/payment-success`

### Server-Side Processing
1. Creates payment intent with project metadata
2. Processes successful payments via webhook
3. Updates project status and sends confirmation emails
4. Handles failed payments with appropriate error messages

## Security Features
- Payment data never touches your servers (PCI compliance)
- Automatic HTTPS enforcement for payment pages
- Secure webhook signature verification
- Customer data encrypted in transit and at rest

## Replit Deployment Configuration

### Environment Setup for kolmo.design
When deploying to Replit with custom domain kolmo.design:

1. **Custom Domain Configuration**
   - Add kolmo.design in Replit deployment settings
   - Ensure SSL certificate is automatically provisioned
   - Update DNS records to point to Replit deployment

2. **Required Secrets in Replit**
   ```
   DATABASE_URL=postgresql://... (production database)
   STRIPE_SECRET_KEY=sk_live_...
   VITE_STRIPE_PUBLIC_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SENDGRID_API_KEY=SG... (for email notifications)
   BASE_URL=https://kolmo.design (for proper link generation in emails)
   ```

3. **Build Configuration**
   - Replit will automatically run `npm run build` for production
   - Static assets will be served from the built frontend
   - API routes remain accessible at kolmo.design/api/*

## Testing in Production
Use Stripe's live mode with small test amounts ($0.50) to verify:
- Payment form loads correctly on kolmo.design
- Webhook endpoints receive events at kolmo.design/api/webhooks/stripe
- Email confirmations are sent via SendGrid
- Project status updates properly in database

## Monitoring & Support
- Monitor webhook delivery in Stripe Dashboard
- Check Replit deployment logs for payment processing errors
- Use admin panel at kolmo.design/admin for project management
- Email notifications automatically sent for payment confirmations