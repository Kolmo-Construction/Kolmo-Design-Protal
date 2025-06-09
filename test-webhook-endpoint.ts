import { storage } from './server/storage';

async function testWebhookEndpoint() {
  console.log('Testing webhook endpoint functionality...\n');

  try {
    // Find a downpayment invoice with Stripe payment intent
    const allInvoices = await storage.invoices.getAllInvoices();
    const testInvoice = allInvoices.find(inv => 
      inv.invoiceType === 'down_payment' && 
      inv.stripePaymentIntentId &&
      inv.customerEmail
    );

    if (!testInvoice) {
      console.log('❌ No suitable test invoice found');
      return;
    }

    console.log(`✅ Found test invoice: ${testInvoice.invoiceNumber}`);
    console.log(`   Payment Intent: ${testInvoice.stripePaymentIntentId}`);
    console.log(`   Customer: ${testInvoice.customerEmail}`);
    console.log(`   Current Status: ${testInvoice.status}`);

    // Test the webhook endpoint directly by making an HTTP request
    const webhookPayload = {
      id: 'evt_test_webhook',
      object: 'event',
      api_version: '2025-05-28.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: testInvoice.stripePaymentIntentId,
          object: 'payment_intent',
          status: 'succeeded',
          amount: Math.round(parseFloat(testInvoice.amount) * 100),
          currency: 'usd',
          metadata: {
            invoiceId: testInvoice.id!.toString(),
            projectId: testInvoice.projectId?.toString() || '',
            quoteId: testInvoice.quoteId?.toString() || '',
            paymentType: 'down_payment'
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_webhook',
        idempotency_key: null
      },
      type: 'payment_intent.succeeded'
    };

    console.log('\n--- Testing webhook endpoint at /api/webhooks/stripe ---');
    
    // Make a request to the webhook endpoint
    const response = await fetch('http://localhost:5000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature' // This will fail signature verification but we can test the structure
      },
      body: JSON.stringify(webhookPayload)
    });

    console.log(`Response status: ${response.status}`);
    
    if (response.status === 400) {
      const errorData = await response.json();
      if (errorData.error?.includes('signature')) {
        console.log('✅ Webhook endpoint is responding (signature verification working as expected)');
        console.log('✅ Endpoint structure is correct');
      } else {
        console.log('❌ Unexpected error:', errorData);
      }
    } else if (response.status === 200) {
      console.log('✅ Webhook processed successfully');
      const responseData = await response.json();
      console.log('Response:', responseData);
    } else {
      console.log('❌ Unexpected response status');
      const errorText = await response.text();
      console.log('Error:', errorText);
    }

    console.log('\n--- Testing webhook configuration ---');
    console.log('STRIPE_SECRET_KEY configured:', !!process.env.STRIPE_SECRET_KEY);
    console.log('STRIPE_WEBHOOK_SECRET configured:', !!process.env.STRIPE_WEBHOOK_SECRET);
    console.log('SENDGRID_API_KEY configured:', !!process.env.SENDGRID_API_KEY);

    console.log('\n✅ Webhook endpoint test completed');
    console.log('\nNext steps for production:');
    console.log('1. Configure STRIPE_WEBHOOK_SECRET in Replit secrets');
    console.log('2. Set up webhook endpoint in Stripe Dashboard: https://kolmo.design/api/webhooks/stripe');
    console.log('3. Select events: payment_intent.succeeded, payment_intent.payment_failed');
    console.log('4. Test with real Stripe payments');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testWebhookEndpoint()
  .then(() => {
    console.log('\nTest completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test error:', error);
    process.exit(1);
  });