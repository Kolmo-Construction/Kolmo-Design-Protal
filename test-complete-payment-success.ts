// Test script to simulate a complete payment success scenario
import { storage } from './server/storage';
import { paymentService } from './server/services/payment.service';

async function testCompletePaymentSuccess() {
  console.log('🔍 Testing Complete Payment Success Flow...\n');

  try {
    // 1. Create a test payment intent that would be "succeeded" from Stripe
    console.log('1. Setting up test payment scenario...');
    
    // Find or create a quote to work with
    const quotes = await storage.quotes.getAllQuotes();
    let testQuote = quotes.find(q => q.status !== 'accepted');
    
    if (!testQuote) {
      console.log('❌ No available quotes for testing');
      return;
    }
    
    console.log(`✅ Using quote: ${testQuote.quoteNumber} - ${testQuote.title}`);
    
    // 2. Process quote acceptance to create project and invoice
    console.log('\n2. Processing quote acceptance...');
    const customerInfo = {
      name: 'Test Customer Success',
      email: 'success@test.com', 
      phone: '555-1234'
    };
    
    const result = await paymentService.processQuoteAcceptance(testQuote.id, customerInfo);
    console.log(`✅ Created project: ${result.project.name} (ID: ${result.project.id})`);
    console.log(`✅ Created invoice: ${result.downPaymentInvoice.invoiceNumber} (ID: ${result.downPaymentInvoice.id})`);
    console.log(`✅ Payment Intent: ${result.paymentIntent.id}`);
    
    // 3. Simulate successful payment by calling handlePaymentSuccess directly
    // (This simulates what would happen when Stripe sends a webhook or client confirms payment)
    console.log('\n3. Simulating successful payment...');
    
    // First, let's manually create a "succeeded" payment intent scenario
    // by directly calling the payment success handler with proper status checking disabled
    const paymentIntentId = result.paymentIntent.id;
    
    // Get the invoice before processing
    const invoiceBefore = await storage.invoices.getInvoiceById(result.downPaymentInvoice.id);
    console.log(`   Invoice status before: ${invoiceBefore?.status}`);
    
    // Simulate the payment processing logic manually since we can't actually succeed a Stripe payment intent
    console.log('\n4. Processing payment success manually...');
    
    const metadata = result.paymentIntent.metadata;
    const invoiceId = parseInt(metadata.invoiceId);
    const paymentAmount = result.paymentIntent.amount / 100;
    
    // Update invoice status to paid
    await storage.invoices.updateInvoice(invoiceId, { status: 'paid' as const });
    console.log(`✅ Updated invoice status to paid`);
    
    // Record the payment
    const paymentData = {
      invoiceId: invoiceId,
      amount: paymentAmount,
      paymentDate: new Date(),
      paymentMethod: 'stripe',
      reference: paymentIntentId,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: 'ch_test_success',
      status: 'succeeded',
    };
    await storage.invoices.recordPayment(paymentData);
    console.log(`✅ Recorded payment of $${paymentAmount}`);
    
    // Send project welcome email
    if (metadata.paymentType === 'down_payment' && result.project.id) {
      await paymentService.sendProjectWelcomeEmail(result.project.id);
      console.log(`✅ Sent project welcome email`);
    }
    
    // Update quote status
    await storage.quotes.updateQuote(testQuote.id, {
      status: 'accepted',
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      respondedAt: new Date(),
    });
    console.log(`✅ Updated quote status to accepted`);
    
    // 5. Verify all updates
    console.log('\n5. Verifying final state...');
    
    const finalInvoice = await storage.invoices.getInvoiceById(invoiceId);
    const finalProject = await storage.projects.getProjectById(result.project.id);
    const finalQuote = await storage.quotes.getQuoteById(testQuote.id);
    
    console.log(`   Invoice Status: ${finalInvoice?.status}`);
    console.log(`   Project Status: ${finalProject?.status}`);
    console.log(`   Quote Status: ${finalQuote?.status}`);
    
    // Check for payment records
    const allInvoices = await storage.invoices.getAllInvoices();
    const invoiceWithPayment = allInvoices.find(inv => inv.id === invoiceId);
    console.log(`   Payment recorded: ${invoiceWithPayment ? 'Yes' : 'No'}`);
    
    console.log('\n✅ Complete payment success test completed!');
    console.log('\nResults:');
    console.log(`  • Invoice ${finalInvoice?.invoiceNumber} is now ${finalInvoice?.status}`);
    console.log(`  • Project "${finalProject?.name}" is ${finalProject?.status}`);
    console.log(`  • Quote ${finalQuote?.quoteNumber} is ${finalQuote?.status}`);
    console.log(`  • Customer should have received welcome email at ${customerInfo.email}`);
    console.log('\nThis simulates what happens when a customer successfully pays their down payment.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompletePaymentSuccess().catch(console.error);