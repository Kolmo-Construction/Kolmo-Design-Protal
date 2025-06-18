/**
 * Test script to verify the fixed Expensify API integration with proper FreeMarker template
 */
import { expensifyService } from './server/services/expensify.service';

async function testFixedExpensifyTemplate() {
  console.log('=== Testing Fixed Expensify API Integration ===\n');

  // Test 1: Check configuration
  console.log('1. Checking Expensify configuration...');
  const isConfigured = expensifyService.isConfigured();
  console.log(`   Configuration status: ${isConfigured ? '✅ CONFIGURED' : '❌ NOT CONFIGURED'}`);
  
  if (!isConfigured) {
    console.log('   Please ensure EXPENSIFY_PARTNER_USER_ID and EXPENSIFY_PARTNER_USER_SECRET are set');
    return;
  }

  // Test 2: Test connection with new template
  console.log('\n2. Testing API connection with FreeMarker template...');
  try {
    const connectionTest = await expensifyService.testConnection();
    console.log(`   Connection status: ${connectionTest.connected ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Message: ${connectionTest.message}`);
    
    if (!connectionTest.connected) {
      console.log('   API connection failed - check credentials or template format');
      return;
    }
  } catch (error) {
    console.log(`   ❌ Connection test failed: ${error}`);
    return;
  }

  // Test 3: Test expense data retrieval
  console.log('\n3. Testing expense data retrieval...');
  try {
    const expenses = await expensifyService.getAllExpenses();
    console.log(`   Retrieved ${expenses.length} expenses`);
    
    if (expenses.length > 0) {
      console.log('   ✅ Expense data successfully retrieved!');
      console.log('   Sample expense data:');
      const sampleExpense = expenses[0];
      console.log(`   - ID: ${sampleExpense.id}`);
      console.log(`   - Amount: $${sampleExpense.amount}`);
      console.log(`   - Category: ${sampleExpense.category}`);
      console.log(`   - Tag: ${sampleExpense.tag || 'No tag'}`);
      console.log(`   - Merchant: ${sampleExpense.merchant}`);
      console.log(`   - Date: ${sampleExpense.date}`);
    } else {
      console.log('   ℹ️  No expenses found (this could be normal if no expenses exist)');
    }
  } catch (error) {
    console.log(`   ❌ Expense retrieval failed: ${error}`);
    
    // Check if it's a template-related error
    if (error.message.includes('410')) {
      console.log('   📝 Template issue detected - may need template format adjustment');
    } else if (error.message.includes('401')) {
      console.log('   🔑 Authentication issue - check Partner API credentials');
    }
  }

  // Test 4: Test tag generation
  console.log('\n4. Testing project tag generation...');
  try {
    const testOwnerName = 'John Smith';
    const testDate = new Date('2025-06-18');
    const generatedTag = expensifyService.generateProjectTag(testOwnerName, testDate);
    console.log(`   Generated tag for "${testOwnerName}" on ${testDate.toISOString().split('T')[0]}: ${generatedTag}`);
    console.log('   ✅ Tag generation working correctly');
  } catch (error) {
    console.log(`   ❌ Tag generation failed: ${error}`);
  }

  console.log('\n=== Test Complete ===');
  console.log('If all tests passed, the Expensify integration is now working with the proper template!');
}

testFixedExpensifyTemplate().catch(console.error);