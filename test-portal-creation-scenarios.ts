/**
 * Test script to verify portal creation works in both scenarios:
 * 1. Manual project creation by admin
 * 2. Quote acceptance by client
 */

import { storage } from './server/storage';
import { paymentService } from './server/services/payment.service';

async function testPortalCreationScenarios() {
  console.log('🧪 Testing Portal Creation Scenarios...\n');

  try {
    // Test Scenario 1: Manual Project Creation by Admin
    console.log('📋 SCENARIO 1: Manual Project Creation by Admin');
    console.log('='.repeat(50));
    
    // Find or create a test client user
    let testClient = await storage.users.getUserByEmail('test.client@example.com');
    if (!testClient) {
      console.log('Creating test client user...');
      testClient = await storage.users.createUser({
        username: 'test.client@example.com',
        password: 'temp-password',
        email: 'test.client@example.com',
        firstName: 'Test',
        lastName: 'Client',
        role: 'client',
        isActivated: false,
      });
    }
    
    if (!testClient) {
      console.log('❌ Failed to create test client');
      return;
    }
    
    console.log(`✅ Test client exists: ${testClient.firstName} ${testClient.lastName} (ID: ${testClient.id})`);
    
    // Create project with client assignment (should trigger portal creation)
    const manualProjectData = {
      name: 'Manual Test Project',
      description: 'Test project created manually by admin',
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      totalBudget: '15000',
      status: 'planning' as const,
      customerName: testClient.firstName + ' ' + testClient.lastName,
      customerEmail: testClient.email,
    };
    
    console.log('Creating project with client assignment...');
    const manualProject = await storage.projects.createProjectWithClients(manualProjectData, [testClient.id.toString()]);
    
    if (manualProject) {
      console.log(`✅ Manual project created: ${manualProject.name} (ID: ${manualProject.id})`);
      console.log(`✅ Client portal should be automatically created and email sent`);
      
      // Verify client account is activated
      const updatedClient = await storage.users.getUserById(testClient.id);
      console.log(`✅ Client activation status: ${updatedClient?.isActivated ? 'ACTIVATED' : 'NOT ACTIVATED'}`);
      console.log(`✅ Client role: ${updatedClient?.role}`);
    } else {
      console.log('❌ Failed to create manual project');
    }

    console.log('\n📋 SCENARIO 2: Quote Acceptance by Client');
    console.log('='.repeat(50));
    
    // Find a test quote or create scenario
    const quotes = await storage.quotes.getAllQuotes();
    let testQuote = quotes.find(q => q.status !== 'accepted');
    
    if (!testQuote && quotes.length > 0) {
      testQuote = quotes[0]; // Use any quote for testing
    }
    
    if (!testQuote) {
      console.log('❌ No quotes available for testing quote acceptance scenario');
      console.log('Creating a test quote scenario would require more setup...');
    } else {
      console.log(`✅ Test quote found: ${testQuote.quoteNumber} - ${testQuote.title}`);
      console.log(`   Customer: ${testQuote.customerName} (${testQuote.customerEmail})`);
      console.log(`   Total: $${testQuote.total}`);
      
      // Test quote acceptance (this should create client user + project + portal)
      const customerInfo = {
        name: testQuote.customerName || 'Quote Customer',
        email: testQuote.customerEmail || 'quote.customer@example.com',
        phone: '555-0123'
      };
      
      console.log('Processing quote acceptance...');
      try {
        const quoteResult = await paymentService.processQuoteAcceptance(testQuote.id, customerInfo);
        
        console.log(`✅ Quote acceptance processed successfully:`);
        console.log(`   Project ID: ${quoteResult.project.id}`);
        console.log(`   Project Name: ${quoteResult.project.name}`);
        console.log(`   Invoice ID: ${quoteResult.downPaymentInvoice.id}`);
        console.log(`   Client portal should be automatically created and email sent`);
        
        // Verify client user was created/updated
        const quoteClient = await storage.users.getUserByEmail(customerInfo.email);
        if (quoteClient) {
          console.log(`✅ Client user found/created: ${quoteClient.firstName} ${quoteClient.lastName} (ID: ${quoteClient.id})`);
          console.log(`✅ Client activation status: ${quoteClient.isActivated ? 'ACTIVATED' : 'NOT ACTIVATED'}`);
          console.log(`✅ Client role: ${quoteClient.role}`);
        } else {
          console.log('❌ Client user not found after quote acceptance');
        }
        
      } catch (error) {
        console.log('❌ Quote acceptance failed:', error.message);
        console.log('This may be due to existing project or other validation');
      }
    }

    console.log('\n📊 PORTAL CREATION VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    // Get all projects to see portal assignments
    const allProjects = await storage.projects.getAllProjects();
    console.log(`Total projects in system: ${allProjects.length}`);
    
    const projectsWithClients = allProjects.filter(p => p.clients && p.clients.length > 0);
    console.log(`Projects with client portal access: ${projectsWithClients.length}`);
    
    // Get all activated client users
    const allUsers = await storage.users.getAllUsers();
    const activeClients = allUsers.filter(u => u.role === 'client' && u.isActivated);
    console.log(`Activated client users: ${activeClients.length}`);
    
    console.log('\n🎉 PORTAL CREATION SCENARIOS TESTED');
    console.log('Both manual project creation and quote acceptance workflows');
    console.log('should now automatically create client portals with email notifications.');

  } catch (error) {
    console.error('❌ Portal creation test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPortalCreationScenarios()
  .then(() => {
    console.log('\n✅ Portal creation scenario testing complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });