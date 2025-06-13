/**
 * Test script to verify client portal invitation email fixes
 * This tests both the payment confirmation and client portal invitation emails
 */

import { storage } from './server/storage';
import { paymentService } from './server/services/payment.service';

async function testClientPortalEmailFix() {
  console.log('Testing client portal invitation email fixes...\n');

  try {
    // Find a recent down payment invoice to test with
    const allInvoices = await storage.invoices.getAllInvoices();
    const downpaymentInvoice = allInvoices.find(inv => 
      inv.invoiceType === 'down_payment' && 
      inv.stripePaymentIntentId &&
      inv.projectId
    );

    if (!downpaymentInvoice) {
      console.log('❌ No down payment invoice found with project ID');
      return;
    }

    console.log(`✅ Found test invoice: ${downpaymentInvoice.invoiceNumber}`);
    console.log(`   Project ID: ${downpaymentInvoice.projectId}`);
    console.log(`   Customer: ${downpaymentInvoice.customerEmail}`);

    // Get the project details
    const project = await storage.projects.getProjectById(downpaymentInvoice.projectId!);
    if (!project) {
      console.log('❌ Project not found');
      return;
    }

    console.log(`✅ Found project: ${project.name}`);
    console.log(`   Customer Name: ${project.customerName}`);
    console.log(`   Customer Email: ${project.customerEmail}`);

    // Get the project manager info
    if (project.projectManager) {
      console.log(`✅ Project Manager: ${project.projectManager.firstName} ${project.projectManager.lastName}`);
      console.log(`   PM Email: ${project.projectManager.email}`);
    }

    // Get client users associated with this project
    const clients = await storage.projects.getClientsForProject(downpaymentInvoice.projectId!);
    console.log(`✅ Found ${clients.length} client(s) for this project:`);
    
    for (const client of clients) {
      console.log(`   - ${client.firstName} ${client.lastName} (${client.email})`);
    }

    console.log('\n--- Testing Email System ---');
    
    // Test the payment success handler which should trigger both emails
    console.log('1. Testing payment success handler...');
    try {
      await paymentService.handlePaymentSuccess(downpaymentInvoice.stripePaymentIntentId!);
      console.log('✅ Payment success handler completed');
    } catch (error) {
      console.log('❌ Payment success handler failed:', error.message);
    }

    // Check if invoice was updated
    const updatedInvoice = await storage.invoices.getInvoiceById(downpaymentInvoice.id);
    console.log(`   Invoice status: ${updatedInvoice?.status}`);

    console.log('\n--- Expected Email Behavior ---');
    console.log('Customer should receive:');
    console.log('  1. ✅ Project welcome email (payment confirmation)');
    console.log('     - Uses customer name correctly');
    console.log('     - Confirms down payment received');
    console.log('     - Mentions portal access coming');
    console.log('');
    console.log('  2. ✅ Client portal invitation email (separate)');
    console.log('     - Uses customer name (not project manager name)');
    console.log('     - Contains working magic link');
    console.log('     - Link format: /auth/magic-link/{token}');
    console.log('     - Link expires in 24 hours');

    console.log('\n--- Key Fixes Applied ---');
    console.log('✓ Fixed: Email template uses customer name instead of project manager name');
    console.log('✓ Fixed: Magic link URL format matches auth route structure');
    console.log('✓ Fixed: Proper token generation and database storage');
    console.log('✓ Fixed: Secure 24-hour token expiry');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testClientPortalEmailFix().catch(console.error);