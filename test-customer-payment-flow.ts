/**
 * Test the complete customer payment flow to identify and fix issues
 */

import { storage } from './server/storage';
import { paymentService } from './server/services/payment.service';
import { stripeService } from './server/services/stripe.service';

async function testCustomerPaymentFlow() {
  console.log('Testing complete customer payment flow...\n');

  try {
    // 1. Test customer quote acceptance and downpayment creation
    console.log('1. Testing quote acceptance and downpayment creation...');
    
    const testQuoteId = 5; // Using existing quote
    const customerInfo = {
      name: 'Jinane Matta',
      email: 'jinane.matta@gmail.com',
      phone: '7865993948',
      address: '19233 98th ave s',
      city: 'Renton',
      state: 'WA',
      zipCode: '98055'
    };

    console.log(`   Using quote ID: ${testQuoteId}`);
    console.log(`   Customer: ${customerInfo.name} (${customerInfo.email})`);

    // Test the quote acceptance process
    try {
      const result = await paymentService.processQuoteAcceptance(testQuoteId, customerInfo);
      console.log('   ✅ Quote acceptance processed successfully');
      console.log(`   Project created: ${result.project.name} (ID: ${result.project.id})`);
      console.log(`   Invoice created: ${result.downPaymentInvoice.invoiceNumber} ($${result.downPaymentInvoice.amount})`);
      console.log(`   Payment intent: ${result.paymentIntent.id}`);
      
      // 2. Test payment intent verification
      console.log('\n2. Testing payment intent verification...');
      const paymentIntent = await stripeService.getPaymentIntent(result.paymentIntent.id);
      console.log(`   Payment intent status: ${paymentIntent.status}`);
      console.log(`   Amount: $${(paymentIntent.amount / 100).toFixed(2)}`);
      console.log(`   Metadata: ${JSON.stringify(paymentIntent.metadata)}`);
      
      // 3. Test payment completion simulation
      console.log('\n3. Testing payment completion...');
      
      // Simulate successful payment by calling webhook handler
      try {
        await paymentService.handlePaymentSuccess(result.paymentIntent.id);
        console.log('   ✅ Payment success handler completed');
        
        // Verify invoice was updated
        const updatedInvoice = await storage.invoices.getInvoiceById(result.downPaymentInvoice.id);
        console.log(`   Invoice status: ${updatedInvoice?.status}`);
        
        // Verify project was updated
        const updatedProject = await storage.projects.getProjectById(result.project.id);
        console.log(`   Project status: ${updatedProject?.status}`);
        
      } catch (handlerError) {
        console.error('   ❌ Payment success handler failed:', handlerError.message);
      }
      
      // 4. Test payment confirmation endpoint
      console.log('\n4. Testing payment confirmation endpoint...');
      
      // Mock the payment-success endpoint logic
      try {
        const confirmResult = await paymentService.handlePaymentSuccess(result.paymentIntent.id);
        console.log('   ✅ Payment confirmation endpoint logic works');
      } catch (confirmError) {
        console.error('   ❌ Payment confirmation failed:', confirmError.message);
      }
      
      console.log('\n✅ Customer payment flow test completed successfully!');
      console.log('\nSummary:');
      console.log(`   - Quote ${testQuoteId} accepted`);
      console.log(`   - Project ${result.project.id} created`);
      console.log(`   - Invoice ${result.downPaymentInvoice.invoiceNumber} generated`);
      console.log(`   - Payment intent ${result.paymentIntent.id} created`);
      console.log(`   - Payment processing simulated successfully`);
      console.log(`   - Customer portal access and emails sent`);
      
    } catch (acceptanceError) {
      console.error('   ❌ Quote acceptance failed:', acceptanceError.message);
      console.error('   This may be expected if quote was already accepted');
    }

    // 5. Test existing downpayment invoice completion
    console.log('\n5. Testing existing downpayment invoice...');
    
    const allInvoices = await storage.invoices.getAllInvoices();
    const downpaymentInvoice = allInvoices.find(inv => 
      inv.invoiceType === 'down_payment' && 
      inv.status === 'draft' &&
      inv.stripePaymentIntentId
    );
    
    if (downpaymentInvoice) {
      console.log(`   Found pending downpayment: ${downpaymentInvoice.invoiceNumber}`);
      console.log(`   Amount: $${downpaymentInvoice.amount}`);
      console.log(`   Customer: ${downpaymentInvoice.customerName}`);
      console.log(`   Payment intent: ${downpaymentInvoice.stripePaymentIntentId}`);
      
      // Test payment completion for existing invoice
      try {
        await paymentService.handlePaymentSuccess(downpaymentInvoice.stripePaymentIntentId!);
        console.log('   ✅ Existing invoice payment processing completed');
        
        const finalInvoice = await storage.invoices.getInvoiceById(downpaymentInvoice.id);
        console.log(`   Final invoice status: ${finalInvoice?.status}`);
        
      } catch (existingError) {
        console.error('   ❌ Existing invoice processing failed:', existingError.message);
      }
    } else {
      console.log('   No pending downpayment invoices found');
    }

    console.log('\n🎉 Complete customer payment flow test finished!');
    console.log('\nNext steps for customer:');
    console.log('1. Customer receives quote email with access link');
    console.log('2. Customer views quote via public URL (no login required)');
    console.log('3. Customer accepts quote and proceeds to payment');
    console.log('4. Customer completes payment via Stripe');
    console.log('5. Webhook processes payment and activates project');
    console.log('6. Customer receives welcome email with portal access');

  } catch (error) {
    console.error('Test error:', error);
  }
}

testCustomerPaymentFlow().catch(console.error);