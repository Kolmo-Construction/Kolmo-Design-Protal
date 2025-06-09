// Test script to create a quote and test the professional email template
import { storage } from './server/storage';
import { paymentService } from './server/services/payment.service';

async function testEmailWithNewQuote() {
  console.log('🔍 Testing Professional Email Template...\n');

  try {
    // 1. Create a test quote
    console.log('1. Creating test quote...');
    const quoteData = {
      title: 'Kitchen Renovation Project',
      description: 'Complete kitchen renovation with custom cabinets and granite countertops',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '555-0123',
      projectType: 'residential',
      createdById: 1, // Admin user ID
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      items: [
        {
          description: 'Custom Kitchen Cabinets',
          quantity: 1,
          unitPrice: 5000,
          total: 5000
        },
        {
          description: 'Granite Countertops',
          quantity: 1,
          unitPrice: 3000,
          total: 3000
        }
      ],
      subtotal: '8000',
      taxRate: 8.5,
      taxAmount: '680',
      total: '8680',
      termsAndConditions: 'Standard construction terms apply.',
      notes: 'Project estimated to take 2-3 weeks'
    };

    const quote = await storage.quotes.createQuote(quoteData);
    console.log(`✅ Created quote: ${quote.quoteNumber} - ${quote.title}`);

    // 2. Process quote acceptance to trigger email
    console.log('\n2. Processing quote acceptance...');
    const customerInfo = {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '555-0123'
    };

    const result = await paymentService.processQuoteAcceptance(quote.id, customerInfo);
    console.log(`✅ Created project: ${result.project.name} (ID: ${result.project.id})`);
    console.log(`✅ Created invoice: ${result.downPaymentInvoice.invoiceNumber}`);

    // 3. Simulate payment success to trigger welcome email
    console.log('\n3. Simulating payment success...');
    
    // Update invoice to paid and trigger welcome email
    await storage.invoices.updateInvoice(result.downPaymentInvoice.id, { status: 'paid' as const });
    
    // Record payment
    const paymentData = {
      invoiceId: result.downPaymentInvoice.id,
      amount: result.paymentIntent.amount / 100,
      paymentDate: new Date(),
      paymentMethod: 'stripe',
      reference: result.paymentIntent.id,
      stripePaymentIntentId: result.paymentIntent.id,
      stripeChargeId: 'ch_test_professional_email',
      status: 'succeeded',
    };
    await storage.invoices.recordPayment(paymentData);
    
    // Send the professional welcome email with Kolmo branding
    await paymentService.sendProjectWelcomeEmail(result.project.id);
    
    console.log('✅ Professional welcome email sent with Kolmo branding!');
    console.log('\nEmail Features:');
    console.log('  • Kolmo logo and professional header');
    console.log('  • Color scheme: #3d4552, #4a6670, #db973c');
    console.log('  • Clean payment confirmation table');
    console.log('  • Professional project dashboard section');
    console.log('  • Branded footer with company details');
    
    console.log(`\nCustomer ${customerInfo.name} should receive a professional email at ${customerInfo.email}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEmailWithNewQuote().catch(console.error);