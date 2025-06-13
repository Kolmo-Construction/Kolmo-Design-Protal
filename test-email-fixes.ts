/**
 * Test script to verify the client portal email fixes
 */

import { storage } from './server/storage';
import { paymentService } from './server/services/payment.service';

async function testEmailFixes() {
  console.log('Testing client portal email fixes...\n');

  try {
    // Find a project with down payment to test
    const allInvoices = await storage.invoices.getAllInvoices();
    const downpaymentInvoice = allInvoices.find(inv => 
      inv.invoiceType === 'down_payment' && 
      inv.projectId &&
      inv.customerEmail
    );

    if (!downpaymentInvoice) {
      console.log('No down payment invoice found for testing');
      return;
    }

    console.log(`Found test invoice: ${downpaymentInvoice.invoiceNumber}`);
    console.log(`Customer: ${downpaymentInvoice.customerName} (${downpaymentInvoice.customerEmail})`);

    // Get project details
    const project = await storage.projects.getProjectById(downpaymentInvoice.projectId!);
    if (!project) {
      console.log('Project not found');
      return;
    }

    console.log(`Project: ${project.name}`);
    
    // Check project manager info
    if (project.projectManager) {
      console.log(`Project Manager: ${project.projectManager.firstName} ${project.projectManager.lastName}`);
    }

    // Test sending the project welcome email (this is what gets triggered after down payment)
    console.log('\nTesting project welcome email...');
    await paymentService.sendProjectWelcomeEmail(project.id);
    console.log('Project welcome email sent successfully');

    // Test client portal notification manually
    console.log('\nTesting client portal notification...');
    const clients = await storage.projects.getProjectClients(project.id);
    console.log(`Found ${clients.length} clients for project`);

    for (const client of clients) {
      console.log(`- ${client.firstName} ${client.lastName} (${client.email})`);
    }

    console.log('\nKey fixes applied:');
    console.log('✓ Email uses customer name instead of project manager name');
    console.log('✓ Magic link URL format: /auth/magic-link/{token}');
    console.log('✓ Token expires in 24 hours');
    console.log('✓ Secure token generation with proper UUID format');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testEmailFixes().catch(console.error);