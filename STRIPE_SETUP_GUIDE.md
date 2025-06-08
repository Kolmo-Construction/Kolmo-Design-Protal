# Stripe Webhook Setup for kolmo.design

## Step 1: Create Webhook Endpoint

In your Stripe Dashboard (as shown in your screenshot):

1. Click **"+ Add destination"**
2. Set the endpoint URL to: `https://kolmo.design/api/webhooks/stripe`
3. Select these events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.created`
   - `invoice.payment_succeeded`

## Step 2: Get Your Signing Secret

After creating the webhook endpoint:
1. Click on the newly created endpoint
2. In the **"Signing secret"** section, click **"Reveal"**
3. Copy the secret that starts with `whsec_`
4. Add this as `STRIPE_WEBHOOK_SECRET` in your Replit secrets

## Step 3: Test the Webhook

Use Stripe's **"Test with a local listener"** feature to verify:
1. Your endpoint responds correctly
2. Events are processed without errors
3. Payment confirmations work end-to-end

## Production Checklist

✅ Webhook endpoint: `https://kolmo.design/api/webhooks/stripe`
✅ Required events selected
✅ Signing secret configured in environment
✅ Live API keys (not test keys) configured
✅ Domain authorized in Stripe settings

## Testing Payment Flow

Once configured, test with a small amount ($0.50):
1. Visit a quote payment page on kolmo.design
2. Complete payment with test card
3. Verify webhook receives payment_intent.succeeded event
4. Confirm project status updates in your admin panel
5. Check email confirmation is sent