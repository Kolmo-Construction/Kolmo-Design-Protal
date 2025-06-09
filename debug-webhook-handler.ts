// Debug script to test the webhook handler step by step
import { storage } from './server/storage';
import { stripeService } from './server/services/stripe.service';

async function debugWebhookHandler() {
  console.log('🔍 Debugging Webhook Handler...\n');

  try {
    // Use the payment intent from our previous test
    const paymentIntentId = 'pi_3RXxpfKDM6eOkJhH0Rvl3vAd';
    console.log(`Testing with Payment Intent ID: ${paymentIntentId}`);
    
    // 1. Try to retrieve the payment intent
    console.log('\n1. Retrieving payment intent from Stripe...');
    try {
      const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
      console.log(`✅ Payment Intent Status: ${paymentIntent.status}`);
      console.log(`   Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
      console.log(`   Metadata:`, paymentIntent.metadata);
      
      // 2. Check if we can find the invoice
      const invoiceId = paymentIntent.metadata.invoiceId ? parseInt(paymentIntent.metadata.invoiceId) : null;
      console.log(`\n2. Looking for invoice with ID: ${invoiceId}`);
      
      if (invoiceId) {
        const invoice = await storage.invoices.getInvoiceById(invoiceId);
        if (invoice) {
          console.log(`✅ Invoice found:`);
          console.log(`   Invoice Number: ${invoice.invoiceNumber}`);
          console.log(`   Current Status: ${invoice.status}`);
          console.log(`   Amount: $${invoice.amount}`);
          console.log(`   Stripe Payment Intent ID: ${invoice.stripePaymentIntentId}`);
          console.log(`   Project ID: ${invoice.projectId}`);
          
          // 3. Test the status check
          console.log(`\n3. Status checks:`);
          console.log(`   Payment Intent Status === 'succeeded': ${paymentIntent.status === 'succeeded'}`);
          console.log(`   Invoice Status !== 'paid': ${invoice.status !== 'paid'}`);
          console.log(`   Should process payment: ${paymentIntent.status === 'succeeded' && invoice.status !== 'paid'}`);
          
          // 4. Try to manually update the invoice
          console.log(`\n4. Testing invoice update...`);
          try {
            await storage.invoices.updateInvoice(invoiceId, { status: 'paid' as const });
            console.log(`✅ Invoice status updated successfully`);
            
            // Verify the update
            const updatedInvoice = await storage.invoices.getInvoiceById(invoiceId);
            console.log(`   New status: ${updatedInvoice?.status}`);
          } catch (updateError) {
            console.error(`❌ Failed to update invoice:`, updateError);
          }
          
        } else {
          console.log(`❌ Invoice not found with ID: ${invoiceId}`);
        }
      } else {
        console.log(`❌ No invoice ID in payment intent metadata`);
      }
      
    } catch (stripeError) {
      console.error(`❌ Failed to retrieve payment intent:`, stripeError);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugWebhookHandler().catch(console.error);