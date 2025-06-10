# Kolmo.design Domain Setup Guide

This guide provides step-by-step instructions for deploying your construction client portal to your private kolmo.design domain.

## Prerequisites

From your screenshot, I can see you have DNS records configured for kolmo.design. This setup will work with your existing domain configuration.

## 1. Replit Deployment Configuration

### Step 1: Deploy to Replit
1. In your Replit project, click the "Deploy" button
2. Select "Autoscale Deployment" for production use
3. Choose your deployment region (preferably close to your clients)

### Step 2: Custom Domain Setup
1. In the Replit deployment dashboard, go to "Domains"
2. Click "Add Custom Domain"
3. Enter: `kolmo.design`
4. Follow the DNS verification steps (if not already configured)
5. Enable SSL certificate (automatic through Replit)

## 2. Required Environment Variables

Set these secrets in your Replit deployment:

```bash
# Domain Configuration
BASE_URL=https://kolmo.design

# Database
DATABASE_URL=postgresql://your-production-database-url

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_live_your-live-secret-key
VITE_STRIPE_PUBLIC_KEY=pk_live_your-live-public-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stream Chat (if using real-time chat)
STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-api-secret
```

## 3. Stripe Configuration for kolmo.design

### Authorized Domains
In your Stripe Dashboard → Settings → Authorized domains, add:
- `kolmo.design`
- `www.kolmo.design`

### Webhook Configuration
Create a webhook endpoint in Stripe Dashboard → Developers → Webhooks:
- **Endpoint URL**: `https://kolmo.design/api/webhooks/stripe`
- **Events to send**:
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `customer.created`
  - `invoice.payment_succeeded`

Copy the webhook signing secret and add it to your environment variables as `STRIPE_WEBHOOK_SECRET`.

## 4. Email Configuration

### SendGrid Setup
1. Create a SendGrid account if you don't have one
2. Verify your sending domain (recommend using `kolmo.design`)
3. Create an API key with "Mail Send" permissions
4. Add the API key to your environment variables

### Verified Sender Addresses
Configure these sender addresses in SendGrid:
- `projects@kolmo.design` (for project notifications)
- `billing@kolmo.design` (for payment confirmations)
- `noreply@kolmo.design` (for system emails)

## 5. DNS Configuration Verification

Based on your screenshot, ensure these DNS records are properly configured:

```
A Record: kolmo.design → [Replit deployment IP]
CNAME Record: www.kolmo.design → kolmo.design
```

## 6. Features Enabled with kolmo.design

Once deployed, your portal will have:

✅ **Professional Domain**: All client interactions happen on kolmo.design
✅ **Secure Authentication**: Magic link emails sent from your domain
✅ **Payment Processing**: Stripe payments with proper domain authorization
✅ **Email Notifications**: Branded emails from @kolmo.design addresses
✅ **Project Links**: All project URLs use kolmo.design
✅ **SSL Security**: Automatic HTTPS for all connections

## 7. Testing Your Deployment

After deployment, test these key features:

1. **Login Flow**: Request a magic link at `https://kolmo.design`
2. **Email Links**: Verify magic links point to kolmo.design
3. **Payment Flow**: Test a small payment ($0.50) in live mode
4. **Project Access**: Ensure project URLs work correctly
5. **Webhook Delivery**: Check Stripe webhook logs for successful delivery

## 8. Go-Live Checklist

- [ ] Domain pointing to Replit deployment
- [ ] SSL certificate active
- [ ] All environment variables configured
- [ ] Stripe live mode configured
- [ ] SendGrid domain verified
- [ ] Webhook endpoints working
- [ ] Test payment successful
- [ ] Magic link emails working

## 9. Post-Deployment Monitoring

Monitor these aspects after going live:
- Replit deployment logs for any errors
- Stripe webhook delivery success rates
- SendGrid email delivery rates
- Database connection stability

## Support

If you encounter issues during setup:
1. Check Replit deployment logs
2. Verify Stripe webhook delivery in dashboard
3. Test email configuration with SendGrid logs
4. Ensure all environment variables are correctly set

Your kolmo.design domain is now fully configured to provide a professional construction client portal experience.