/**
 * Debug script to test Expensify API authentication and identify the 401 error cause
 */
import { expensifyService } from './server/services/expensify.service';

async function debugExpensifyAuthentication() {
  console.log('=== Expensify Authentication Debug ===\n');
  
  // Test 1: Check if credentials are configured
  console.log('1. Checking credential configuration...');
  const isConfigured = expensifyService.isConfigured();
  console.log(`   Configuration status: ${isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  
  if (!isConfigured) {
    console.log('   ❌ Expensify credentials not found in environment variables');
    console.log('   Please ensure EXPENSIFY_PARTNER_USER_ID and EXPENSIFY_PARTNER_USER_SECRET are set');
    return;
  }
  
  // Test 2: Check credential format (without exposing actual values)
  console.log('\n2. Checking credential format...');
  const partnerUserID = process.env.EXPENSIFY_PARTNER_USER_ID || '';
  const partnerUserSecret = process.env.EXPENSIFY_PARTNER_USER_SECRET || '';
  
  console.log(`   Partner User ID length: ${partnerUserID.length} chars`);
  console.log(`   Partner User ID starts with: ${partnerUserID.substring(0, 5)}...`);
  console.log(`   Partner User Secret length: ${partnerUserSecret.length} chars`);
  console.log(`   Partner User Secret starts with: ${partnerUserSecret.substring(0, 5)}...`);
  
  // Test 3: Test API connection with detailed logging
  console.log('\n3. Testing API connection...');
  try {
    const connectionTest = await expensifyService.testConnection();
    console.log(`   Connection status: ${connectionTest.connected ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Message: ${connectionTest.message}`);
    
    if (!connectionTest.connected) {
      console.log('   ❌ Connection test failed - check logs above for details');
    } else {
      console.log('   ✅ Connection test passed');
    }
  } catch (error) {
    console.log('   ❌ Connection test threw error:', error);
  }
  
  // Test 4: Try fetching expenses with detailed error handling
  console.log('\n4. Testing expense fetching...');
  try {
    const expenses = await expensifyService.getAllExpenses();
    console.log(`   ✅ Successfully fetched ${expenses.length} expenses`);
    
    if (expenses.length > 0) {
      console.log('   Sample expense:');
      const sample = expenses[0];
      console.log(`     ID: ${sample.id}`);
      console.log(`     Amount: $${sample.amount}`);
      console.log(`     Date: ${sample.date}`);
      console.log(`     Tag: ${sample.tag || 'No tag'}`);
    }
  } catch (error) {
    console.log('   ❌ Expense fetching failed:', error instanceof Error ? error.message : error);
  }
  
  console.log('\n=== Debug Complete ===');
}

// Run the debug
debugExpensifyAuthentication().catch(console.error);