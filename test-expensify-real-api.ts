/**
 * Test script to verify Expensify API integration with real data
 */
import { expensifyService } from './server/services/expensify.service';

async function testExpensifyRealAPI() {
  console.log('Testing Expensify API integration with real credentials...');
  
  // Test 1: Check if service is configured
  console.log('1. Checking configuration...');
  const isConfigured = expensifyService.isConfigured();
  console.log(`   Configuration status: ${isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  
  if (!isConfigured) {
    console.log('   ❌ Expensify credentials not configured properly');
    return;
  }
  
  // Test 2: Test API connection
  console.log('2. Testing API connection...');
  try {
    const connectionTest = await expensifyService.testConnection();
    console.log(`   Connection status: ${connectionTest.connected ? 'CONNECTED' : 'FAILED'}`);
    console.log(`   Message: ${connectionTest.message}`);
    
    if (!connectionTest.connected) {
      console.log('   ❌ Failed to connect to Expensify API');
      return;
    }
  } catch (error) {
    console.log('   ❌ Connection test failed:', error);
    return;
  }
  
  // Test 3: Fetch all expenses
  console.log('3. Fetching all expenses...');
  try {
    const allExpenses = await expensifyService.getAllExpenses();
    console.log(`   Retrieved ${allExpenses.length} expenses`);
    
    if (allExpenses.length > 0) {
      console.log('   Sample expense data:');
      const sample = allExpenses[0];
      console.log(`     ID: ${sample.id}`);
      console.log(`     Amount: $${sample.amount}`);
      console.log(`     Category: ${sample.category}`);
      console.log(`     Description: ${sample.description}`);
      console.log(`     Date: ${sample.date}`);
      console.log(`     Status: ${sample.status}`);
    }
  } catch (error) {
    console.log('   ❌ Failed to fetch expenses:', error);
  }
  
  // Test 4: Fetch project-specific expenses
  console.log('4. Testing project-specific expense retrieval...');
  try {
    const projectExpenses = await expensifyService.getProjectExpenses(62); // Using project ID from logs
    console.log(`   Retrieved ${projectExpenses.length} expenses for project 62`);
    
    if (projectExpenses.length > 0) {
      console.log('   Project expense sample:');
      const sample = projectExpenses[0];
      console.log(`     Project ID: ${sample.projectId}`);
      console.log(`     Amount: $${sample.amount}`);
      console.log(`     Description: ${sample.description}`);
    }
  } catch (error) {
    console.log('   ❌ Failed to fetch project expenses:', error);
  }
  
  console.log('\n✅ Expensify API integration test completed');
}

// Run the test
testExpensifyRealAPI().catch(console.error);